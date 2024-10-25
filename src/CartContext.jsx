import React, { createContext, useContext, useState, useEffect } from "react";
import { db } from "./fireconfig";
import { updateDoc, doc, getDoc, onSnapshot } from "firebase/firestore";
import io from 'socket.io-client';

const CART_STORAGE_KEY = "cart";
const WEBSOCKET_URL = 'https://tuckshop-vite.vercel.app'; // Using HTTPS

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    return storedCart ? JSON.parse(storedCart) : [];
  });
  const [stockUpdates, setStockUpdates] = useState({});
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io(WEBSOCKET_URL, { secure: true });
    setSocket(newSocket);

    newSocket.on('stockUpdate', (data) => {
      setStockUpdates(prev => ({ ...prev, [data.itemId]: data.newStock }));
    });

    // Set up real-time listeners for all items in the cart
    const unsubscribes = cart.map(item => 
      onSnapshot(doc(db, "items", item.id), (doc) => {
        if (doc.exists()) {
          setStockUpdates(prev => ({ ...prev, [item.id]: doc.data().stock }));
        }
      })
    );

    return () => {
      newSocket.close();
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [cart]);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const updateItemStock = async (itemId, quantityChange) => {
    try {
      const itemRef = doc(db, "items", itemId);
      const itemDoc = await getDoc(itemRef);
      
      if (!itemDoc.exists()) {
        throw "Item does not exist!";
      }

      const currentStock = itemDoc.data().stock;
      const newStock = currentStock - quantityChange;
      
      if (newStock < 0) {
        throw "Not enough stock!";
      }

      await updateDoc(itemRef, { stock: newStock });

      // Emit stock update through WebSocket
      socket.emit('stockUpdate', { itemId, newStock });

      return true;
    } catch (error) {
      console.error("Failed to update stock:", error);
      return false;
    }
  };

  const addToCart = async (item) => {
    const currentCartItem = cart.find(cartItem => cartItem.id === item.id);
    const currentQuantity = currentCartItem ? currentCartItem.quantity : 0;
    const quantityToAdd = item.quantity - currentQuantity;

    if (quantityToAdd > 0) {
      const success = await updateItemStock(item.id, quantityToAdd);
      if (success) {
        setCart((prevCart) => {
          const existingItemIndex = prevCart.findIndex((cartItem) => cartItem.id === item.id);
          if (existingItemIndex !== -1) {
            const updatedCart = [...prevCart];
            updatedCart[existingItemIndex] = { ...updatedCart[existingItemIndex], quantity: item.quantity };
            return updatedCart;
          } else {
            return [...prevCart, { ...item }];
          }
        });
      } else {
        console.error("Failed to update stock");
      }
    }
  };

  const updateCartItemQuantity = async (itemId, newQuantity) => {
    const cartItem = cart.find(item => item.id === itemId);
    if (cartItem) {
      const quantityChange = newQuantity - cartItem.quantity;
      if (quantityChange !== 0) {
        const success = await updateItemStock(itemId, quantityChange);
        if (success) {
          setCart((prevCart) =>
            prevCart.map((item) =>
              item.id === itemId ? { ...item, quantity: newQuantity } : item
            ).filter(item => item.quantity > 0)
          );
        } else {
          console.error("Failed to update stock");
        }
      }
    }
  };

  const removeFromCart = async (itemId) => {
    const cartItem = cart.find(item => item.id === itemId);
    if (cartItem) {
      const success = await updateItemStock(itemId, -cartItem.quantity);
      if (success) {
        setCart((prevCart) => prevCart.filter((item) => item.id !== itemId));
      } else {
        console.error("Failed to update stock");
      }
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <CartContext.Provider
      value={{ cart, addToCart, updateCartItemQuantity, removeFromCart, clearCart, stockUpdates }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartProvider;

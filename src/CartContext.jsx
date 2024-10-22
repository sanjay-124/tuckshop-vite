import React, { createContext, useContext, useState, useEffect } from "react";
import { db } from "./fireconfig";
import { updateDoc, doc } from "firebase/firestore/lite";

const CART_STORAGE_KEY = "cart";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    return storedCart ? JSON.parse(storedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const addToCart = async (item) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: Math.min(cartItem.quantity + item.quantity, item.stock), stock: item.stock }
            : cartItem
        ).filter(cartItem => cartItem.quantity > 0);
      } else {
        return item.quantity > 0 ? [...prevCart, { ...item, quantity: Math.min(item.quantity, item.stock) }] : prevCart;
      }
    });
  };

  const updateCartItemQuantity = async (itemId, quantity, newStock) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === itemId ? { ...item, quantity: Math.min(quantity, newStock), stock: newStock } : item
      ).filter(item => item.quantity > 0)
    );
  };

  const removeFromCart = async (itemId) => {
    const itemToRemove = cart.find(item => item.id === itemId);
    if (itemToRemove) {
      const itemRef = doc(db, "items", itemId);
      await updateDoc(itemRef, { stock: itemToRemove.stock + itemToRemove.quantity });
    }
    setCart((prevCart) => prevCart.filter((item) => item.id !== itemId));
  };

  const clearCart = async () => {
    for (const item of cart) {
      const itemRef = doc(db, "items", item.id);
      await updateDoc(itemRef, { stock: item.stock + item.quantity });
    }
    setCart([]);
  };

  return (
    <CartContext.Provider
      value={{ cart, addToCart, updateCartItemQuantity, removeFromCart, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
};

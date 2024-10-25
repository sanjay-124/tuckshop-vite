import React, { useState, useEffect } from "react";
import { db } from "../fireconfig";
import { collection, getDocs } from "firebase/firestore";
import { useUser } from "../UserContext";
import Header from "../components/Header.jsx";
import { useCart } from "../CartContext";
import { useNavigate, Navigate } from "react-router-dom";
import { toast } from "react-toastify";

const Tuckshop = () => {
  const { user, loading } = useUser();
  const { cart, addToCart, updateCartItemQuantity, stockUpdates } = useCart();
  const [items, setItems] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [addedItems, setAddedItems] = useState({});
  const [sortedItems, setSortedItems] = useState([]);
  const [category, setCategory] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchItems = async () => {
      const itemsCollection = collection(db, "items");
      const snapshot = await getDocs(itemsCollection);
      const itemsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(itemsList);
      setSortedItems(itemsList);
    };

    fetchItems();
  }, []);

  useEffect(() => {
    setItems(prevItems => 
      prevItems.map(item => ({
        ...item,
        stock: stockUpdates[item.id] !== undefined ? stockUpdates[item.id] : item.stock
      }))
    );
    setSortedItems(prevItems => 
      prevItems.map(item => ({
        ...item,
        stock: stockUpdates[item.id] !== undefined ? stockUpdates[item.id] : item.stock
      }))
    );
  }, [stockUpdates]);

  useEffect(() => {
    const cartQuantities = cart.reduce((acc, item) => {
      acc[item.id] = item.quantity;
      return acc;
    }, {});
    setQuantities(cartQuantities);
    setAddedItems(cartQuantities);
  }, [cart]);

  const handleAddToCart = async (item) => {
    const quantity = quantities[item.id] || 1;
    if (quantity > item.stock) {
      toast.error(`Only ${item.stock} items available in stock.`);
      return;
    }
    
    await addToCart({ ...item, quantity });
    setQuantities((prev) => ({ ...prev, [item.id]: quantity }));
    setAddedItems((prev) => ({ ...prev, [item.id]: true }));
  };

  const handleIncreaseQuantity = async (item) => {
    const newQuantity = (quantities[item.id] || 1) + 1;
    if (newQuantity > item.stock) {
      toast.error(`Only ${item.stock} items available in stock.`);
      return;
    }

    await updateCartItemQuantity(item.id, newQuantity);
    setQuantities((prev) => ({ ...prev, [item.id]: newQuantity }));
  };

  const handleDecreaseQuantity = async (item) => {
    const currentQuantity = quantities[item.id] || 1;
    const newQuantity = currentQuantity - 1;

    if (newQuantity > 0) {
      await updateCartItemQuantity(item.id, newQuantity);
      setQuantities((prev) => ({ ...prev, [item.id]: newQuantity }));
    } else {
      await updateCartItemQuantity(item.id, 0);
      setQuantities((prev) => {
        const { [item.id]: _, ...rest } = prev;
        return rest;
      });
      setAddedItems((prev) => {
        const { [item.id]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleSort = (category) => {
    setCategory(category);
    if (category === "all") {
      setSortedItems(items);
    } else {
      setSortedItems(items.filter((item) => item.category === category));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-900">
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  return (
    <div className="p-1">
      <Header currentPage="tuckshop"/>
      <div className="mb-4 flex justify-between items-center">
        {user ? (
          <>
            <h1 className="text-xl pt-2 font-light">
              Welcome {user.displayName}
            </h1>
          </>
        ) : (
          <p>Please log in to see your details.</p>
        )}
      </div>
      <div className="flex">
        <div className="w-1/4 mr-1 text-sm border-r border-gray-300 pr-1 flex flex-col items-center space-y-2 overflow-y-auto h-[calc(100vh-200px)]">
          <button
            onClick={() => handleSort("all")}
            className="w-20 h-20 flex items-center justify-center bg-gradient-to-r from-blue-100 to-purple-200 rounded-md"
          >
            All
          </button>
          <button
            onClick={() => handleSort("beverages")}
            className="w-20 h-20 flex flex-col items-center justify-center bg-gradient-to-r from-blue-100 to-purple-200 rounded-md"
          >
            <img
              src="/images/beverages.avif"
              alt="Beverages"
              className="w-12 h-12 mb-1"
            />
            Beverages
          </button>
          <button
            onClick={() => handleSort("icecream")}
            className="w-20 h-20 flex flex-col items-center justify-center bg-gradient-to-r from-blue-100 to-purple-200 rounded-md"
          >
            <img
              src="/images/icecreams.avif"
              alt="Ice Cream"
              className="w-12 h-12 mb-1"
            />
            Ice Cream
          </button>
          <button
            onClick={() => handleSort("chocolate")}
            className="w-20 h-20 flex flex-col items-center justify-center bg-gradient-to-r from-blue-100 to-purple-200 rounded-md"
          >
            <img
              src="/images/chocolates.avif"
              alt="Chocolates"
              className="w-12 h-12 mb-1"
            />
            Chocolates
          </button>
          <button
            onClick={() => handleSort("snacks")}
            className="w-20 h-20 flex flex-col items-center justify-center bg-gradient-to-r from-blue-100 to-purple-200 rounded-md"
          >
            <img
              src="/images/snacks.avif"
              alt="Snacks"
              className="w-12 h-12 mb-1"
            />
            Snacks
          </button>
          <button
            onClick={() => handleSort("others")}
            className="w-20 h-20 flex items-center justify-center bg-gradient-to-r from-blue-100 to-purple-200 rounded-md"
          >
            Others
          </button>
        </div>
        <div className="w-3/4 flex flex-col overflow-y-auto h-[calc(100vh-200px)]">
          {items.length === 0 ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1 flex-grow mb-16">
              {sortedItems.map((item) => (
              <div
                key={item.id}
                className={`border rounded p-2 flex flex-col justify-between items-start ${item.stock === 0 ? 'opacity-50' : ''}`}
              >
                <div className="w-full">
                  <img
                    src={`${item.image}`}
                    alt={item.name}
                    className="w-full h-32 object-cover mb-2"
                  />
                </div>
                <h3 className="text-md font-medium">{item.name}</h3>
                <p className="text-[12px]">Stock: {item.stock}</p>
                <div className="flex items-center justify-between w-full mt-2">
                  <span className="text-lg font-bold text-gray-700">
                    ₹{item.price}
                  </span>
                  {item.stock > 0 ? (
                    addedItems[item.id] ? (
                      <div className="flex border rounded-md items-center space-x-2">
                        <button
                          className="font-extrabold text-black rounded-full px-2 py-1"
                          onClick={() => handleDecreaseQuantity(item)}
                        >
                          -
                        </button>
                        <span className="text-lg font-bold">
                          {quantities[item.id]}
                        </span>
                        <button
                          className="font-extrabold text-black rounded-full px-2 py-1"
                          onClick={() => handleIncreaseQuantity(item)}
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        className="bg-gradient-to-r from-blue-100 to-purple-200 text-black rounded-md px-2 py-1"
                        onClick={() => handleAddToCart(item)}
                      >
                        Add
                      </button>
                    )
                  ) : (
                    <span
                      className="bg-gray-200 text-black rounded-md px-2 py-1"
                    >
                      Sold Out
                    </span>
                  )}
                </div>
              </div>
            ))}
            </div>
          )}
        </div>
      </div>
      <div className="fixed bottom-0 left-0 w-full bg-white p-2 border-t border-gray-300 flex justify-center">
        <button
          className="bg-gradient-to-r from-blue-400 via-purple-300 to-pink-400 font-semibold text-black rounded-md py-2 px-6 hover:bg-green-600 focus:outline-none transition-all duration-300"
          onClick={() => navigate("/checkout")}
        >
          {cart.reduce((total, item) => total + item.quantity, 0)} Items | ₹{cart.reduce((total, item) => total + item.price * item.quantity, 0)}
          <span className="ml-10">
            GO TO CART
          </span>
        </button>
      </div>
    </div>
  );
};

export default Tuckshop;
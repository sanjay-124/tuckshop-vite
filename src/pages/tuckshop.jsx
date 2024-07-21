import React, { useState, useEffect } from "react";
import { db } from "../fireconfig";
import { collection, getDocs } from "firebase/firestore/lite";
import { useUser } from "../UserContext";
import Header from "../components/Header.jsx";
import { useCart } from "../CartContext";
import { useNavigate } from "react-router-dom";

const Tuckshop = () => {
  const { user } = useUser();
  const { cart, addToCart, updateCartItemQuantity } = useCart();
  const [items, setItems] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [addedItems, setAddedItems] = useState({});
  const [sortedItems, setSortedItems] = useState([]);
  const [category, setCategory] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchItems = async () => {
      const itemsCollection = collection(db, "items");
      const itemsSnapshot = await getDocs(itemsCollection);
      const itemsData = itemsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setItems(itemsData);
      setSortedItems(itemsData);
    };
    fetchItems();
  }, []);

  useEffect(() => {
    const cartQuantities = cart.reduce((acc, item) => {
      acc[item.id] = item.quantity;
      return acc;
    }, {});
    setQuantities(cartQuantities);
    setAddedItems(cartQuantities);
  }, [cart]);

  const handleAddToCart = (item) => {
    const quantity = quantities[item.id] || 1;
    addToCart({ ...item, quantity });
    setQuantities((prev) => ({ ...prev, [item.id]: quantity }));
    setAddedItems((prev) => ({ ...prev, [item.id]: true }));
  };

  const handleIncreaseQuantity = (item) => {
    const newQuantity = (quantities[item.id] || 1) + 1;
    setQuantities((prev) => ({ ...prev, [item.id]: newQuantity }));
    updateCartItemQuantity(item.id, newQuantity);
  };

  const handleDecreaseQuantity = (item) => {
    const currentQuantity = quantities[item.id] || 1;
    const newQuantity = currentQuantity - 1;

    if (newQuantity > 0) {
      // Update quantity if greater than 0
      setQuantities((prev) => ({ ...prev, [item.id]: newQuantity }));
      updateCartItemQuantity(item.id, newQuantity);
    } else {
      // Remove item from cart if quantity is 0
      setQuantities((prev) => {
        const { [item.id]: _, ...rest } = prev;
        return rest;
      });
      setAddedItems((prev) => {
        const { [item.id]: _, ...rest } = prev;
        return rest;
      });
      updateCartItemQuantity(item.id, 0); // Update quantity to 0 in cart
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

  return (
    <div className="p-4">
      <Header />
      <div className="mb-4">
        {user ? (
          <h1 className="text-xl pt-2 font-light">
            Welcome {user.displayName}
          </h1>
        ) : (
          <p>Please log in to see your details.</p>
        )}
      </div>
      <div className="flex">
        <div className="w-1/3 mr-2 text-sm border-r border-gray-300 pr-4 flex flex-col items-center space-y-2">
          <button
            onClick={() => handleSort("all")}
            className="w-24 h-24 flex items-center justify-center bg-gray-200 rounded-md"
          >
            All
          </button>
          <button
            onClick={() => handleSort("beverages")}
            className="w-24 h-24 flex flex-col items-center justify-center bg-gray-200 rounded-md"
          >
            <img
              src="/images/beverages.avif"
              alt="Beverages"
              className="w-12 h-12 mb-1"
            />
            Beverages
          </button>
          <button
            onClick={() => handleSort("ice cream")}
            className="w-24 h-24 flex flex-col items-center justify-center bg-gray-200 rounded-md"
          >
            <img
              src="/images/icecreams.avif"
              alt="Ice Cream"
              className="w-12 h-12 mb-1"
            />
            Ice Cream
          </button>
          <button
            onClick={() => handleSort("chocolates")}
            className="w-24 h-24 flex flex-col items-center justify-center bg-gray-200 rounded-md"
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
            className="w-24 h-24 flex flex-col items-center justify-center bg-gray-200 rounded-md"
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
            className="w-24 h-24 flex items-center justify-center bg-gray-200 rounded-md"
          >
            Others
          </button>
        </div>
        <div className="w-2/3 flex flex-col">
          <div className="grid grid-cols-2 gap-1 flex-grow">
            {sortedItems.map((item) => (
              <div
                key={item.id}
                className="border rounded p-2 flex flex-col items-start"
              >
                <div>
                  <img
                    src={`images/${item.image}`}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-md font-medium">{item.name}</h3>
                <p>Stock: {item.stock}</p>
                <div className="flex items-center justify-between w-full mt-2">
                  <span className="text-lg font-bold text-gray-700">
                    {item.price}
                  </span>
                  {addedItems[item.id] ? (
                    <div className="flex border rounded-sm items-center space-x-2">
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
                      className="bg-gray-200 text-black rounded-md px-2 py-1"
                      onClick={() => handleAddToCart(item)}
                    >
                      Add
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex">
            <button
              className="bg-green-500 font-semibold text-white rounded-md py-2 px-6 hover:bg-green-600 focus:outline-none transition-all duration-300"
              onClick={() => navigate("/checkout")}
            >
              Go to Cart (
              {cart.reduce((total, item) => total + item.quantity, 0)})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tuckshop;

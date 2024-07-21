import React, { useState, useEffect } from "react";
import { db } from "../fireconfig";
import { collection, getDocs } from "firebase/firestore/lite";
import { useUser } from "../UserContext";
import Header from "../components/Header.jsx";
import { useCart } from "../CartContext";
import { useNavigate } from "react-router-dom";

const Tuckshop = () => {
  const { user } = useUser();
  const { cart, addToCart } = useCart();
  const [items, setItems] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [addedItems, setAddedItems] = useState({});
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
    };
    fetchItems();
  }, []);

  const handleAddToCart = (item) => {
    const quantity = quantities[item.id] || 1;
    addToCart({ ...item, quantity });
    setQuantities((prev) => ({ ...prev, [item.id]: 1 }));
    
    setAddedItems((prev) => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setAddedItems((prev) => ({ ...prev, [item.id]: false }));
    }, 2000);
  };

  const handleQuantityChange = (itemId, quantity) => {
    setQuantities((prev) => ({ ...prev, [itemId]: Number(quantity) }));
  };

  return (

    <div className="p-4">
          <Header/>
      <div className="mb-4">
        {user ? (
         <h1 className="text-2xl pt-2 font-bold">Welcome {user.displayName}</h1>
        ) : (
          <p>Please log in to see your details.</p>
        )}
      </div>
      <h2 className="text-xl font-semibold mb-4">Items Available:</h2>
      <ul className="list-none p-0">
        {items.map((item) => (
          <li key={item.id} className="border rounded p-4 mb-4 flex flex-col items-start">
            <h3 className="text-lg font-medium">{item.name}</h3>
            <p>Stock: {item.stock}</p>
            <p>Price: ${item.price}</p>
            <input
              type="number"
              min="1"
              value={quantities[item.id] || 1}
              onChange={(e) => handleQuantityChange(item.id, e.target.value)}
              className="mt-2 p-2 border rounded w-full"
            />
            <button
              className={`mt-2 px-4 py-2 rounded-full text-white font-semibold transition-all duration-300 ${
                addedItems[item.id]
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
              onClick={() => handleAddToCart(item)}
            >
              {addedItems[item.id] ? "Added to Cart!" : "Add to Cart"}
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex space-x-4">
        <button
          className="bg-green-500 text-white rounded-full py-2 px-6 hover:bg-green-600 focus:outline-none transition-all duration-300"
          onClick={() => navigate("/checkout")}
        >
          Go to Cart ({cart.reduce((total, item) => total + item.quantity, 0)})
        </button>
      </div>
    </div>
  );
};

export default Tuckshop;
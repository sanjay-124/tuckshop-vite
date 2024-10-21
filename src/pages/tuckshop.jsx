import React, { useState, useEffect } from "react";
import { db } from "../fireconfig";
import { collection, getDocs, query, where, updateDoc, doc, onSnapshot, runTransaction, addDoc, serverTimestamp } from "firebase/firestore";
import { useUser } from "../UserContext";
import Header from "../components/Header.jsx";
import { useCart } from "../CartContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const POLL_INTERVAL = 3000;

const Tuckshop = () => {
  const { user, updateBalance } = useUser();
  const { cart, addToCart, updateCartItemQuantity } = useCart();
  const [items, setItems] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [addedItems, setAddedItems] = useState({});
  const [sortedItems, setSortedItems] = useState([]);
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [itemsRef, setItemsRef] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  useEffect(() => {
    const itemsCollection = collection(db, "items");
    setItemsRef(itemsCollection);

    const unsubscribe = onSnapshot(itemsCollection, (snapshot) => {
      const itemsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setItems(itemsData);
      setSortedItems(itemsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const checkCompletedOrders = async () => {
      if (user) {
        const ordersRef = collection(db, "orders");
        const q = query(ordersRef, where("userEmail", "==", user.email), where("status", "==", "completed"), where("processed", "==", false));
        const querySnapshot = await getDocs(q);
        
        for (const docSnapshot of querySnapshot.docs) {
          const orderData = docSnapshot.data();
          const userRef = doc(db, "users", user.email);
          
          try {
            await runTransaction(db, async (transaction) => {
              const userDoc = await transaction.get(userRef);
              if (!userDoc.exists()) {
                throw new Error("User document does not exist!");
              }
              
              const userData = userDoc.data();
              if (userData.balance >= orderData.transactionAmount) {
                const newBalance = userData.balance - orderData.transactionAmount;
                transaction.update(userRef, {
                  balance: newBalance,
                  transactions: [...userData.transactions, {
                    type: "debit",
                    amount: orderData.transactionAmount,
                    date: serverTimestamp(),
                    orderId: docSnapshot.id
                  }]
                });
                
                transaction.update(docSnapshot.ref, { processed: true });
                updateBalance(newBalance);
              } else {
                throw new Error("Insufficient balance");
              }
            });
          } catch (error) {
            console.error("Failed to process order:", error);
            toast.error(`Failed to process order: ${error.message}`);
          }
        }
      }
    };

    const intervalId = setInterval(checkCompletedOrders, 30000); // Check every 30 seconds

    return () => clearInterval(intervalId);
  }, [user, updateBalance]);

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

    try {
      await runTransaction(db, async (transaction) => {
        const itemRef = doc(itemsRef, item.id);
        const itemDoc = await transaction.get(itemRef);
        
        if (!itemDoc.exists()) {
          throw new Error("Item does not exist!");
        }

        const currentStock = itemDoc.data().stock;
        if (currentStock < quantity) {
          throw new Error(`Only ${currentStock} items available in stock.`);
        }

        transaction.update(itemRef, { stock: currentStock - quantity });
      });

      addToCart({ ...item, quantity });
      setQuantities((prev) => ({ ...prev, [item.id]: quantity }));
      setAddedItems((prev) => ({ ...prev, [item.id]: true }));
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleIncreaseQuantity = async (item) => {
    const newQuantity = (quantities[item.id] || 1) + 1;

    try {
      await runTransaction(db, async (transaction) => {
        const itemRef = doc(itemsRef, item.id);
        const itemDoc = await transaction.get(itemRef);
        
        if (!itemDoc.exists()) {
          throw new Error("Item does not exist!");
        }

        const currentStock = itemDoc.data().stock;
        if (currentStock < newQuantity) {
          throw new Error(`Only ${currentStock} items available in stock.`);
        }

        transaction.update(itemRef, { stock: currentStock - 1 });
      });

      setQuantities((prev) => ({ ...prev, [item.id]: newQuantity }));
      updateCartItemQuantity(item.id, newQuantity);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDecreaseQuantity = async (item) => {
    const currentQuantity = quantities[item.id] || 1;
    const newQuantity = currentQuantity - 1;

    try {
      await runTransaction(db, async (transaction) => {
        const itemRef = doc(itemsRef, item.id);
        const itemDoc = await transaction.get(itemRef);
        
        if (!itemDoc.exists()) {
          throw new Error("Item does not exist!");
        }

        const currentStock = itemDoc.data().stock;
        transaction.update(itemRef, { stock: currentStock + 1 });
      });

      if (newQuantity > 0) {
        setQuantities((prev) => ({ ...prev, [item.id]: newQuantity }));
        updateCartItemQuantity(item.id, newQuantity);
      } else {
        setQuantities((prev) => {
          const { [item.id]: _, ...rest } = prev;
          return rest;
        });
        setAddedItems((prev) => {
          const { [item.id]: _, ...rest } = prev;
          return rest;
        });
        updateCartItemQuantity(item.id, 0);
      }
    } catch (error) {
      toast.error(error.message);
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
            className="w-20 h-20 flex items-center justify-center bg-gray-200 rounded-md"
          >
            All
          </button>
          <button
            onClick={() => handleSort("beverages")}
            className="w-20 h-20 flex flex-col items-center justify-center bg-gray-200 rounded-md"
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
            className="w-20 h-20 flex flex-col items-center justify-center bg-gray-200 rounded-md"
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
            className="w-20 h-20 flex flex-col items-center justify-center bg-gray-200 rounded-md"
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
            className="w-20 h-20 flex flex-col items-center justify-center bg-gray-200 rounded-md"
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
            className="w-20 h-20 flex items-center justify-center bg-gray-200 rounded-md"
          >
            Others
          </button>
        </div>
        <div className="w-3/4 flex flex-col overflow-y-auto h-[calc(100vh-200px)]">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="loader"></div>
              <p className="ml-4 text-xl">Loading items...</p>
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
                <p>Stock: {item.stock}</p>
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
                        className="bg-gray-200 text-black rounded-md px-2 py-1"
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
          className="bg-emerald-600 font-semibold text-white rounded-md py-2 px-6 hover:bg-green-600 focus:outline-none transition-all duration-300"
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

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../fireconfig";
import { doc, updateDoc, arrayUnion, collection, addDoc, getDoc, increment, runTransaction, serverTimestamp } from "firebase/firestore/lite";
import { useUser } from "../UserContext";
import { useCart } from "../CartContext";
import { ToastContainer, toast } from "react-toastify";
import { FaArrowLeft } from "react-icons/fa";

const Checkout = () => {
  const { user, updateUserData } = useUser();
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error("Please log in to place an order.");
      return;
    }

    const filteredCart = cart.filter(item => item.quantity > 0);

    if (filteredCart.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }

    const transactionAmount = filteredCart.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    setLoading(true);

    try {
      await runTransaction(db, async (transaction) => {
        // Perform all reads first
        const userRef = doc(db, "users", user.email);
        const userSnapshot = await transaction.get(userRef);

        if (!userSnapshot.exists()) {
          throw new Error("User data not found.");
        }

        const userData = userSnapshot.data();
        const currentBalance = userData.balance || 0;

        if (currentBalance < transactionAmount) {
          throw new Error("Insufficient balance.");
        }

        // Check stock and get item data for each item
        const itemSnapshots = await Promise.all(
          filteredCart.map(item => transaction.get(doc(db, "items", item.id)))
        );

        const itemsData = itemSnapshots.map((snapshot, index) => {
          if (!snapshot.exists()) {
            throw new Error(`Item ${filteredCart[index].name} not found.`);
          }
          const itemData = snapshot.data();
          if (itemData.stock < filteredCart[index].quantity) {
            throw new Error(`Not enough stock for ${filteredCart[index].name}. Available: ${itemData.stock}`);
          }
          return { ...itemData, id: snapshot.id };
        });

        // Get stock documents
        const stockSnapshots = await Promise.all(
          filteredCart.map(item => transaction.get(doc(db, "stocks", item.id)))
        );

        let missingCostPriceItems = [];

        // Now perform all writes
        // Create the order
        const orderData = {
          timestamp: new Date().toISOString(),
          cart: filteredCart.map((item) => ({
            itemid: item.id,
            item: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
          transactionAmount,
          status: false,
          userEmail: user.email,
        };

        const ordersRef = collection(db, "orders");
        const newOrderRef = doc(ordersRef);
        transaction.set(newOrderRef, orderData);

        // Update stocks collection and item stock
        filteredCart.forEach((cartItem, index) => {
          const stockRef = doc(db, "stocks", cartItem.id);
          const stockSnapshot = stockSnapshots[index];
          const itemData = itemsData[index];
          const itemRef = doc(db, "items", cartItem.id);

          const currentStockSold = stockSnapshot.exists() ? stockSnapshot.data().stockSold || 0 : 0;
          const newStockSold = currentStockSold + cartItem.quantity;
          const profitPerItem = itemData.price - itemData.costPrice;
          const newProfit = profitPerItem * newStockSold;

          const stockData = {
            itemId: doc(db, "items", cartItem.id),
            itemName: itemData.name,
            stockSold: newStockSold,
            lastUpdated: serverTimestamp(),
            profit: newProfit
          };

          if (stockSnapshot.exists()) {
            transaction.update(stockRef, stockData);
          } else {
            transaction.set(stockRef, stockData);
          }

          // Update item stock
          transaction.update(itemRef, {
            stock: increment(-cartItem.quantity)
          });

          console.log(`Item: ${itemData.name}`);
          console.log(`Selling Price: ${itemData.price}`);
          console.log(`Cost Price: ${itemData.costPrice}`);
        });

        if (missingCostPriceItems.length > 0) {
          console.warn(`Warning: Cost price is missing for the following items: ${missingCostPriceItems.join(', ')}`);
          // You might want to send this information to an admin or log it for later review
        }

        // Update user data
        transaction.update(userRef, {
          orders: arrayUnion(newOrderRef.id),
          balance: increment(-transactionAmount),
          transactionAmount: increment(transactionAmount)
        });
      });

      await updateUserData(user.email);
      clearCart();
      toast.success("Order placed successfully!");
      setLoading(false);

      setTimeout(() => {
        navigate("/tuckshop");
      }, 2000);
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error(error.message || "Error placing order. Please try again.");
      setLoading(false);
    }
  };

  const getStockWithPrices = async (stockId) => {
    const stockDoc = await getDoc(doc(db, "stocks", stockId));
    if (stockDoc.exists()) {
      const stockData = stockDoc.data();
      const itemDoc = await getDoc(stockData.itemId);
      if (itemDoc.exists()) {
        const itemData = itemDoc.data();
        return {
          ...stockData,
          price: itemData.price,
          costPrice: itemData.costPrice,
        };
      }
    }
    return null;
  };

  return (
    <div className="p-4">
      <ToastContainer
        position="top-center"
        autoClose={1000}
        hideProgressBar={false}
        newestOnTop={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <button
        className="text-xl mb-4 flex items-center"
        onClick={() => navigate("/tuckshop")}
      >
        <FaArrowLeft className="mr-2" />
      </button>
      <h1 className="text-2xl font-bold mb-4">Checkout</h1>
      {user ? (
        <div>
          <h2 className="text-xl font-semibold mb-4">Cart Items:</h2>
          {cart.length > 0 ? (
            <ul className="list-none p-0">
              {cart.map((item) => (
                <li key={item.id} className="border-b p-4 mb-2 flex justify-between items-center">
                  <span>{item.name}</span>
                  <span>{item.quantity} x {item.price} = {item.quantity * item.price}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xl italic">YOUR CART IS EMPTY</p>
          )}
          {cart.length > 0 && (
            <>
              <p className="text-lg font-medium mt-4">
                Total Amount: ₹{cart.reduce((total, item) => total + item.price * item.quantity, 0)}
              </p>
              <button
                className="bg-green-500 text-white rounded-md py-2 px-6 mt-4 hover:bg-green-600 focus:outline-none transition-all duration-300"
                onClick={handlePlaceOrder}
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      ></path>
                    </svg>
                    Processing...
                  </div>
                ) : (
                  "Place Order"
                )}
              </button>
            </>
          )}
        </div>
      ) : (
        <p>Please log in to place an order.</p>
      )}
    </div>
  );
};

export default Checkout;

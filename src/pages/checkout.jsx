import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../fireconfig";
import { doc, updateDoc, arrayUnion, collection, addDoc, getDoc, increment, runTransaction } from "firebase/firestore/lite";
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
        // Fetch the latest user balance from Firestore
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

        // Check and update stock for each item
        for (const item of filteredCart) {
          const itemRef = doc(db, "items", item.id);
          const itemSnapshot = await transaction.get(itemRef);

          if (!itemSnapshot.exists()) {
            throw new Error(`Item ${item.name} not found.`);
          }

          const itemData = itemSnapshot.data();
          if (itemData.stock < item.quantity) {
            throw new Error(`Not enough stock for ${item.name}. Available: ${itemData.stock}`);
          }

          // Update stock
          transaction.update(itemRef, {
            stock: increment(-item.quantity)
          });
        }

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
          processed: false, // Add this field to track if the order has been processed
        };

        const ordersRef = collection(db, "orders");
        const newOrderRef = doc(ordersRef);
        transaction.set(newOrderRef, orderData);

        // Update user data (only add the order ID, don't deduct balance)
        transaction.update(userRef, {
          orders: arrayUnion(newOrderRef.id),
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

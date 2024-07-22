import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../fireconfig";
import { doc, updateDoc, arrayUnion, collection, addDoc } from "firebase/firestore/lite";
import { useUser } from "../UserContext";
import { useCart } from "../CartContext";
import { ToastContainer, toast } from "react-toastify";
import { FaArrowLeft } from "react-icons/fa"; // Importing the backward arrow icon from react-icons

const Checkout = () => {
  const { user, setUser } = useUser();
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser && !user) {
      setUser(JSON.parse(storedUser));
    }
  }, [user, setUser]);

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

    const transaction = {
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

    setLoading(true);

    try {
      const ordersRef = collection(db, "orders");
      const newOrderRef = await addDoc(ordersRef, transaction);

      const userRef = doc(db, "users", user.email);
      await updateDoc(userRef, {
        orders: arrayUnion(newOrderRef.id),
      });

      clearCart();
      toast.success("Order placed successfully!");
      setLoading(false);

      // Introduce a delay to allow the toast message to be displayed
      setTimeout(() => {
        navigate("/tuckshop");
      }, 3000); // Delay of 1.5 seconds
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Error placing order. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <ToastContainer
        position="top-center"
        autoClose={2000}
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

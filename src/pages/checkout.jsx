import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../fireconfig";
import { doc, updateDoc, arrayUnion, collection, addDoc } from "firebase/firestore/lite";
import { useUser } from "../UserContext";
import { useCart } from "../CartContext";
import { toast } from "react-toastify";
import { FaArrowLeft } from "react-icons/fa";  // Importing the backward arrow icon from react-icons

const Checkout = () => {
  const { user, setUser } = useUser();
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();

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

    try {
      const ordersRef = collection(db, "orders");
      const newOrderRef = await addDoc(ordersRef, transaction);

      const userRef = doc(db, "users", user.email);
      await updateDoc(userRef, {
        orders: arrayUnion(newOrderRef.id),
      });

      clearCart();
      toast.success("Order placed successfully!");
      navigate("/tuckshop");
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Error placing order. Please try again.");
    }
  };

  return (
    <div className="p-4">
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
            <p className="text-xl font-mono italic">YOUR CART IS EMPTY</p>
          )}
          {cart.length > 0 && (
            <>
              <p className="text-lg font-medium mt-4">
                Total Amount:  
                 {cart.reduce((total, item) => total + item.price * item.quantity, 0)}
              </p>
              <button
                className="bg-green-500 text-white rounded-md py-2 px-6 mt-4 hover:bg-green-600 focus:outline-none transition-all duration-300"
                onClick={handlePlaceOrder}
              >
                Place Order
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

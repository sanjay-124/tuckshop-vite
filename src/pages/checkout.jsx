import React from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../fireconfig";
import { doc, updateDoc, arrayUnion, collection, addDoc } from "firebase/firestore/lite";
import { useUser } from "../UserContext";
import { useCart } from "../CartContext";
import { toast } from "react-toastify";

const Checkout = () => {
  const { user } = useUser();
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();

  const handlePlaceOrder = async () => {
    const transactionAmount = cart.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    const transaction = {
      timestamp: new Date().toISOString(),
      cart: cart.map((item) => ({
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
    const newOrderRef = await addDoc(ordersRef, transaction);

    const userRef = doc(db, "users", user.email);
    await updateDoc(userRef, {
      orders: arrayUnion(newOrderRef.id),
    });

    clearCart();
    alert("Order placed successfully!");
    toast.success("Order placed successfully!");
    navigate("/tuckshop");
  };

  return (
    <div className="p-4">
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
            <p>Your cart is empty.</p>
          )}
          {cart.length > 0 && (
            <>
              <p className="text-lg font-medium mt-4">
                Total Amount:
                {cart.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2)}
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

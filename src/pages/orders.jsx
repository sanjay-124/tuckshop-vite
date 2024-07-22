import React, { useState, useEffect } from "react";
import { db } from "../fireconfig";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore/lite";
import { useUser } from "../UserContext";
import Header from "../components/Header.jsx";


const Orders = () => {
  const { user } = useUser();
  const [orders, setOrders] = useState([]);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const fetchOrdersAndBalance = async () => {
      if (user) {
        const ordersRef = collection(db, "orders");
        const q = query(ordersRef, where("userEmail", "==", user.email));
        const querySnapshot = await getDocs(q);
        const ordersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setOrders(ordersData);

        const userRef = doc(db, "users", user.email);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          setBalance(userDoc.data().balance || 0);
        }
      }
    };

    fetchOrdersAndBalance();
  }, [user]);

  return (
    <div className="p-4">
        <Header currentPage="orders"/>
      <h1 className="text-xl font-semibold mb-4">Your Orders</h1>
      <p className="text-lg font-semibold mb-4">Current Balance: {balance.toFixed(2)}</p>
      {orders.length > 0 ? (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order.id} className="border rounded-lg p-4 flex flex-col">
              <div className="flex items-center mb-2">
                <p className="mr-2">Date: {new Date(order.timestamp).toLocaleString()}</p>
                <p className={`font-semibold ${order.status ? "text-green-600" : "text-red-600"}`}>
                  {order.status ? "Delivered" : "Pending"}
                </p>
              </div>
              <p className="font-semibold">Total Amount: {order.transactionAmount.toFixed(2)}</p>
              <h3 className="font-semibold mt-2">Items:</h3>
              <ul className="list-disc pl-5">
                {order.cart.map((item, index) => (
                  <li key={index}>
                    {item.item} x {item.quantity} = {item.quantity * item.price}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      ) : (
        <p>You have no orders yet.</p>
      )}
    </div>
  );
};

export default Orders;

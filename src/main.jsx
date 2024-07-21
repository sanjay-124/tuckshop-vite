import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import './index.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Tuckshop from "./pages/tuckshop.jsx";
import Checkout from "./pages/checkout.jsx";
import { UserProvider } from "./UserContext";
import { CartProvider } from "./CartContext";
import Orders from "./pages/orders.jsx";

ReactDOM.render(
  <Router>
    <UserProvider>
      <CartProvider>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/tuckshop" element={<Tuckshop />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />
        </Routes>
      </CartProvider>
    </UserProvider>
  </Router>,
  document.getElementById("root")
);

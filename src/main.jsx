import React from "react";
import { createRoot } from 'react-dom/client';
import App from "./App";
import './index.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Tuckshop from "./pages/tuckshop.jsx";
import Checkout from "./pages/checkout.jsx";
import { UserProvider } from "./UserContext";
import { CartProvider } from "./CartContext";
import Orders from "./pages/orders.jsx";

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
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
    </Router>
  </React.StrictMode>
);

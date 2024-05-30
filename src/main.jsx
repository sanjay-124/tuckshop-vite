import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import "./index.css";
import App from "./App.jsx";
import Tuckshop from "./pages/tuckshop.jsx";

function Apps() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="tuckshop" element={<Tuckshop />} />
      </Routes>
    </BrowserRouter>
  );
}

const rootElement = document.getElementById("root");

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<Apps />);
} else {
  console.error("Root element with id 'root' not found.");
}

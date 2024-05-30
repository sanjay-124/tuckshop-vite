//import app.css
import "../App.css";
import React, { useState } from "react";
import { db } from "../fireconfig";
import { addDoc, collection } from "firebase/firestore/lite";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Admin () {
  const [itemName, setItemName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const docRef = await addDoc(collection(db, "inventoryItems"), {
        itemName,
        price: parseFloat(price),
        stock: parseInt(stock),
      });
      console.log("Document written with ID: ", docRef.id);
      // Reset form fields
      setItemName("");
      setPrice("");
      setStock("");
      // Show success toast
      toast.success("Inventory item added successfully!");
    } catch (error) {
      console.error("Error adding document: ", error);
      // Show error toast
      toast.error("An error occurred while adding the inventory item.");
    }
  };

  return (
    <div>
      <ToastContainer />
      <h2>Add Inventory Item</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="itemName">Item Name:</label>
          <input
            type="text"
            id="itemName"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="price">Price:</label>
          <input
            type="number"
            id="price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="stock">Stock:</label>
          <input
            type="number"
            id="stock"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            required
          />
        </div>
        <button type="submit">Add Item</button>
      </form>
    </div>
  );
};

export default Admin;
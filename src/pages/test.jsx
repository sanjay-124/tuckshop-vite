import "./App.css";
import React, { useEffect, useState } from "react";
import { db } from "./fireconfig";
import {
  doc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore/lite";

//

function App() {
 
  return (

  );
}

export default App;

import React, { useEffect } from 'react';
import { db } from '../fireconfig';  // Adjust the path according to your project structure
import { collection, setDoc, doc } from 'firebase/firestore/lite';

const items = [
  { id: 1, item: "Appy", price: 15, stock: 30 },
  { id: 2, item: "Lays", price: 25, stock: 30 },
  // Add more items here if needed
];

const addItemToFirestore = async (item) => {
  try {
    await setDoc(doc(db, 'items', item.id.toString()), item);
    console.log(`Item ${item.item} added successfully`);
  } catch (error) {
    console.error("Error adding item: ", error);
  }
};

const AddItemsComponent = () => {
  useEffect(() => {
    items.forEach(item => addItemToFirestore(item));
  }, []);

  return (
    <div>
      <h1>Items are being added to Firestore...</h1>
    </div>
  );
};

export default AddItemsComponent;

import React, { useEffect } from 'react';
import { db } from '../fireconfig';  // Adjust the path according to your project structure
import { collection, setDoc, doc } from 'firebase/firestore/lite';

const items = [
  { id: 1, item: "Appy", price: 15, stock: 30, image: "", category: "beverages" },
  { id: 2, item: "Lays", price: 25, stock: 30, image: "", category: "snacks"},
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

// This is a hypothetical component for adding items
const AddItemForm = () => {
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newItem = {
      name: itemName,
      price: parseFloat(price),
      costPrice: parseFloat(costPrice), // Make sure to include this
      stock: parseInt(stock),
      category: category,
      image: imageUrl,
      // ... other fields
    };

    try {
      await addDoc(collection(db, "items"), newItem);
      // ... handle success
    } catch (error) {
      // ... handle error
    }
  };

  // ... rest of the component
};

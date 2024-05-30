import React, { useState } from 'react';
import './App.css';
import { auth } from './fireconfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const boarderEmails = [
  'president@gmail.com',
  'mrsanjay2709@gmail.com'
];

function App() {
  const [isFormVisible, setFormVisible] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');

  const handleCreateAccountClick = () => {
    setFormVisible(!isFormVisible);
  };

  const handleShopNowClick = () => {
    setModalVisible(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!boarderEmails.includes(email)) {
      toast.error("You are not a boarder.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Account created successfully:', userCredential.user);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setName('');
      setFormVisible(false);
      toast.success("Account created successfully!");
    } catch (error) {
      console.error('Error creating account:', error);
      toast.error("Error creating account. Please try again.");
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Logged in successfully:', userCredential.user);
      window.location.href = '/tuckshop';
    } catch (error) {
      console.error('Error logging in:', error);
      toast.error("Error logging in. Please try again.");
    }
  };

  return (
    <div className="relative bg-cover bg-center bg-no-repeat w-full min-h-screen" style={{ backgroundImage: "url('./bg.jpg')" }}>
      <ToastContainer />
      <div className="absolute top-10 w-full bg-[#7E7F80] h-[60px] flex items-center justify-center">
        <p className="italic text-white text-2xl text-center">Managed by Boarding, Canadian International School</p>
      </div>
      <div className="relative mx-auto flex flex-col items-center py-10 px-6 text-center sm:py-20">
        <h1 className="text-4xl font-bold text-[#11b682] mb-4">TUCKSHOP IS HERE</h1>
        <p className="text-lg font-extrabold text-black mb-4">The new arrivals have, well, newly arrived. Check out the latest options from our tuckshop while they're still in stock.</p>
        <div className="flex flex-col sm:flex-row">
          <button className="bg-[#11b682] text-white py-2 px-4 rounded-lg mb-4 sm:mb-0 sm:mr-4" onClick={handleShopNowClick}>Shop Now</button>
          <button className="bg-[#11b682] text-white py-2 px-4 rounded-lg" onClick={handleCreateAccountClick}>Create an Account</button>
        </div>
      </div>
      {isFormVisible && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-lg w-80 relative">
            <button className="absolute top-2 right-2 text-gray-900" onClick={() => setFormVisible(false)}>&times;</button>
            <form onSubmit={handleFormSubmit}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-gray-700">Name:</label>
                <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="border border-gray-300 p-2 rounded w-full" required />
              </div>
              <div className="mb-4">
                <label htmlFor="email" className="block text-gray-700">Email:</label>
                <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="border border-gray-300 p-2 rounded w-full" required />
              </div>
              <div className="mb-4">
                <label htmlFor="password" className="block text-gray-700">Password:</label>
                <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="border border-gray-300 p-2 rounded w-full" required />
              </div>
              <div className="mb-4">
                <label htmlFor="confirmPassword" className="block text-gray-700">Confirm Password:</label>
                <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="border border-gray-300 p-2 rounded w-full" required />
              </div>
              <button type="submit" className="bg-[#11b682] text-white py-2 px-4 rounded-lg w-full">Sign Up</button>
            </form>
          </div>
        </div>
      )}
      {isModalVisible && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-lg w-80 relative">
            <button className="absolute top-2 right-2 text-gray-900" onClick={() => setModalVisible(false)}>&times;</button>
            <form onSubmit={handleModalSubmit}>
              <div className="mb-4">
                <label htmlFor="email" className="block text-gray-700">Email:</label>
                <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="border border-gray-300 p-2 rounded w-full" required />
              </div>
              <div className="mb-4">
                <label htmlFor="password" className="block text-gray-700">Password:</label>
                <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="border border-gray-300 p-2 rounded w-full" required />
              </div>
              <button type="submit" className="bg-[#11b682] text-white py-2 px-4 rounded-lg w-full">Log In</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, Navigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useUser } from "./UserContext";
import { auth, db } from "./fireconfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getFirestore } from "firebase/firestore";

const boarderEmails = ["akshashidhar@cisb.org.in", "mrsanjay2709@gmail.com", "saketgupta.rkl@gmail.com", "sanjay@cisb.org.in"];

function App() {
  const { user, loading } = useUser();
  const [isFormVisible, setFormVisible] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [loadingMessage, setLoadingMessage] = useState("");
  const navigate = useNavigate();

  const handleCreateAccountClick = () => setFormVisible(!isFormVisible);
  const handleShopNowClick = () => setModalVisible(true);

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
    setLoadingMessage("Creating account...");
    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update the user's profile with the display name
      await updateProfile(user, { displayName: name });

      // Create user data document in Firestore using email as the document ID
      const userData = {
        name: name,
        email: email,
        balance: 1000,
        transactionAmount: 0,
        orders: []
      };
      const firestore = getFirestore();
      await setDoc(doc(firestore, "users", email), userData);

      // Reset form fields and close the form
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setName("");
      setFormVisible(false);
      toast.success("Account created successfully!");
    } catch (error) {
      console.error("Error creating account:", error);
      toast.error("Error creating account. Please try again.");
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setLoadingMessage("Letting you in...");
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      localStorage.setItem('user', JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      }));
      navigate("/tuckshop");
    } catch (error) {
      console.error("Error logging in:", error);
      toast.error("Error logging in. Please try again.");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (user) return <Navigate to="/tuckshop" />;

  return (
    <div className="relative w-full min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <ToastContainer />
      
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="absolute top-0 w-full bg-white/80 backdrop-blur-md shadow-lg h-16 flex items-center justify-between px-6"
      >
        <motion.h1 
          className="text-2xl font-bold bg-gradient-to-r from-blue-300 to-purple-400 bg-clip-text text-transparent"
          initial={{ opacity: 0.4 }}
          animate={{ opacity: 1 }}
        >
          CIS
        </motion.h1>
        <motion.div 
          className="flex gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      </motion.header>

      <main className="relative pt-32 px-6 pb-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Your One-Stop TuckShop
            </h2>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Discover delicious treats and satisfy your cravings with our carefully curated selection
            </p>
          </motion.div>

          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-[130px] sm:w-auto px-2 py-2 bg-gradient-to-r from-blue-100 to-purple-200 text-black rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
              onClick={handleShopNowClick}
            >
              Log In
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-[150px] sm:w-auto px-2 py-2 bg-gradient-to-r from-blue-100 to-purple-200 text-gray-800 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all border border-gray-200"
              onClick={handleCreateAccountClick}
            >
              Sign Up
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-12"
          >
            <div className="grid grid-cols-2 gap-2 max-w-3xl mx-auto">
              <div className="flex flex-col items-center">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Snacks</h3>
                <img src={`/images/snacks.jpg`} className="w-[80%] h-[65%] object-cover rounded-lg mb-4" alt="Snacks" />
              </div>

              <div className="flex flex-col items-center">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Drinks</h3>
                <img src={`/images/drinks.jpg`} className="w-[80%] h-[65%] object-cover rounded-lg mb-4" alt="Drinks" />
              </div>

              <div className="flex flex-col items-center">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Chocolates</h3>
                <img src={`/images/chocolates.webp`} className="w-[80%] h-[50%] object-cover rounded-lg mb-4" alt="Chocolates" />
              </div>

              <div className="flex flex-col items-center">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Ice Creams</h3>
                <img src={`/images/icecreams.jpg`} className="w-[80%] h-[50%] object-cover rounded-lg mb-4" alt="Ice Creams" />
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {isFormVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full relative"
          >
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={() => setFormVisible(false)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create an Account</h2>
            <form onSubmit={handleFormSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full mt-6 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Sign Up
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}

      {isModalVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full relative"
          >
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={() => setModalVisible(false)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Log In</h2>
            <form onSubmit={handleModalSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full mt-6 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Log In
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

export default App;

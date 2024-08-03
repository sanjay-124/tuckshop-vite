import React, { useState } from "react";
import "./App.css";
import { auth, db } from "./fireconfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { ToastContainer, toast } from "react-toastify";
import { doc, setDoc } from "firebase/firestore/lite";
import { useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";

const boarderEmails = ["akshashidhar@cisb.org.in", "mrsanjay2709@gmail.com"];

function App() {
  const [isFormVisible, setFormVisible] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  const navigate = useNavigate();

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
    setLoading(true);
    setLoadingMessage("Creating account...");
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });

      const userData = {
        name: name,
        balance: 800,
        transactionAmount: 0,
        orders: []
      };
      await setDoc(doc(db, "users", email), userData);

      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setName("");
      setFormVisible(false);
      toast.success("Account created successfully!");
    } catch (error) {
      console.error("Error creating account:", error);
      toast.error("Error creating account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoadingMessage("Letting you in...");
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative bg-cover bg-center bg-no-repeat w-full h-screen"
      style={{ backgroundImage: "url('./bg.jpg')", zIndex: 1 }}
    >
      <ToastContainer />
      <div
        className="absolute top-10 w-full bg-[#7E7F80] h-[60px] flex items-center justify-center"
        style={{ zIndex: 2 }}
      >
        <p className="italic text-white text-2xl text-center">
          Managed by Boarding, Canadian International School
        </p>
      </div>
      <div
        className="relative mx-auto flex max-w-3xl flex-col items-center py-32 px-6 text-center sm:py-64 lg:px-0"
        style={{ zIndex: 2 }}
      >
        <h1 className="text-6xl font-bold text-[#11b682]">TUCKSHOP IS HERE</h1>
        <p className="mt-4 text-2xl font-bold text-black">
          The new arrivals have, well, newly arrived. Check out the latest
          options from our tuckshop while they're still in stock.
        </p>
        <button
          className="bg-[#11b682] text-white mt-6 py-2 px-4 rounded-lg"
          onClick={handleShopNowClick}
        >
          Shop Now
        </button>
        <button
          className="bg-[#11b682] text-white mt-6 py-2 px-4 rounded-lg"
          onClick={handleCreateAccountClick}
          style={{ zIndex: 2 }}
        >
          Create an Account
        </button>
      </div>
      {isFormVisible && (
        <div
          className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center"
          style={{ zIndex: 3 }}
        >
          <button
            className="absolute top-2 right-2 text-gray-900 text-4xl"
            onClick={() => setFormVisible(false)}
            style={{ padding: "0.5rem" }}
          >
            &times;
          </button>
          <form onSubmit={handleFormSubmit}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-gray-700">
                Name:
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border border-gray-300 p-2 rounded w-full"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-700">
                Email:
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border border-gray-300 p-2 rounded w-full"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="password" className="block text-gray-700">
                Password:
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border border-gray-300 p-2 rounded w-full"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="confirmPassword" className="block text-gray-700">
                Confirm Password:
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="border border-gray-300 p-2 rounded w-full"
                required
              />
            </div>
            <button
              type="submit"
              className="bg-[#11b682] text-white py-2 px-4 rounded-lg w-full"
            >
              Sign Up
            </button>
          </form>
          {loading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex flex-col items-center justify-center">
              <div className="loader"></div>
              <p className="mt-4 text-gray-700">{loadingMessage}</p>
            </div>
          )}
        </div>
      )}
      {isModalVisible && (
        <div
          className="absolute inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center"
          style={{ zIndex: 3 }}
        >
          <div className="bg-white p-8 rounded shadow-lg w-80 relative">
            <button
              className="absolute top-2 right-2 text-4xl text-gray-900"
              onClick={() => setModalVisible(false)}
            >
              &times;
            </button>
            <form onSubmit={handleModalSubmit}>
              <div className="mb-4">
                <label htmlFor="email" className="block text-gray-700">
                  Email:
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border border-gray-300 p-2 rounded w-full"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="password" className="block text-gray-700">
                  Password:
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border border-gray-300 p-2 rounded w-full"
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-[#11b682] text-white py-2 px-4 rounded-lg w-full"
              >
                Log In
              </button>
            </form>
            {loading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex flex-col items-center justify-center">
                <div className="loader"></div>
                <p className="mt-4 text-gray-700">{loadingMessage}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

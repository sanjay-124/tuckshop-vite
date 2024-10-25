import React, { createContext, useState, useContext, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from './fireconfig';
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [expense, setExpense] = useState(0);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await updateUserData(currentUser.email);
      } else {
        setUser(null);
        setBalance(0);
        setExpense(0);
      }
    });

    return () => unsubscribe();
  }, []);

  const updateUserData = async (email) => {
    try {
      const userRef = doc(db, "users", email);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setBalance(userData.balance || 0);
        setExpense(userData.transactionAmount || 0);
      } else {
        console.log("User document does not exist");
        // You might want to create a user document here or handle this case appropriately
      }
    } catch (error) {
      console.error("Error updating user data:", error);
    }
  };

  const updateBalance = async (newBalance) => {
    try {
      if (user) {
        const userRef = doc(db, "users", user.email);
        await updateDoc(userRef, { balance: newBalance });
        setBalance(newBalance);
      }
    } catch (error) {
      console.error("Error updating balance:", error);
    }
  };

  const logout = async () => {
    try {
      const auth = getAuth();
      await auth.signOut();
      setUser(null);
      setBalance(0);
      setExpense(0);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, balance, expense, updateBalance, logout, updateUserData }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

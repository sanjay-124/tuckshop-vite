import React, { createContext, useState, useContext, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from './fireconfig';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, setDoc } from 'firebase/firestore';

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
        // We won't create a new document here, as it should have been created during signup
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

  const placeOrder = async (orderAmount) => {
    try {
      if (user) {
        const userRef = doc(db, "users", user.email);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const currentBalance = userData.balance || 0;
          const currentTransactionAmount = userData.transactionAmount || 0;
          
          if (currentBalance >= orderAmount) {
            const newBalance = currentBalance - orderAmount;
            const newTransactionAmount = currentTransactionAmount + orderAmount;
            
            await updateDoc(userRef, { 
              balance: newBalance,
              transactionAmount: newTransactionAmount
            });
            
            setBalance(newBalance);
            setExpense(newTransactionAmount);
            
            return true; // Order placed successfully
          } else {
            console.log("Insufficient balance");
            return false; // Insufficient balance
          }
        } else {
          console.log("User document does not exist");
          return false; // User document doesn't exist
        }
      }
    } catch (error) {
      console.error("Error placing order:", error);
      return false; // Error occurred
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, balance, expense, updateBalance, logout, updateUserData, placeOrder }}>
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

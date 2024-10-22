import React, { createContext, useState, useContext, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from './fireconfig';
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore/lite';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [expense, setExpense] = useState(0);
  const [loading, setLoading] = useState(true);

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
      setLoading(false);
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

        const ordersRef = collection(db, "orders");
        const q = query(ordersRef, where("userEmail", "==", email), where("status", "==", true));
        const querySnapshot = await getDocs(q);
        let totalExpense = 0;
        querySnapshot.forEach((doc) => {
          totalExpense += doc.data().statusAmount || 0;
        });
        setExpense(totalExpense);
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
    <UserContext.Provider value={{ user, setUser, balance, expense, updateBalance, logout, updateUserData, loading }}>
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

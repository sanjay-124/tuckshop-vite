import React, { createContext, useState, useContext, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from './fireconfig';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion, runTransaction } from 'firebase/firestore/lite';
import { onSnapshot } from 'firebase/firestore';

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

  useEffect(() => {
    if (user) {
      const ordersRef = collection(db, "orders");
      const q = query(ordersRef, 
        where("userEmail", "==", user.email), 
        where("status", "==", true), 
        where("processed", "==", false)
      );

      const unsubscribe = onSnapshot(q, async (snapshot) => {
        for (const change of snapshot.docChanges()) {
          if (change.type === "added" || change.type === "modified") {
            const orderData = change.doc.data();
            
            try {
              await runTransaction(db, async (transaction) => {
                const userRef = doc(db, "users", user.email);
                const userDoc = await transaction.get(userRef);
                
                if (userDoc.exists()) {
                  const userData = userDoc.data();
                  const newBalance = userData.balance - orderData.transactionAmount;
                  
                  transaction.update(userRef, {
                    balance: newBalance,
                    transactions: arrayUnion({
                      type: "debit",
                      amount: orderData.transactionAmount,
                      date: new Date().toISOString(),
                      orderId: change.doc.id
                    })
                  });

                  // Mark the order as processed
                  transaction.update(change.doc.ref, { processed: true });
                }
              });

              // Update local state
              await updateUserData(user.email);
            } catch (error) {
              console.error("Error processing order:", error);
            }
          }
        }
      });

      return () => unsubscribe();
    }
  }, [user]);

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

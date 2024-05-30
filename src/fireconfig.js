import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore/lite";

const firebaseConfig = {
  apiKey: "AIzaSyA8zrRMNF-Th_tIZvV4xU0lmzspqYvO1Ng",
  authDomain: "tuckshop-2024.firebaseapp.com",
  projectId: "tuckshop-2024",
  storageBucket: "tuckshop-2024.appspot.com",
  messagingSenderId: "19612875316",
  appId: "1:19612875316:web:0d4c925f42058e524ae861",
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

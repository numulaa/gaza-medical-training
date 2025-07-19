import { initializeApp } from "firebase/app";
import { getFirestore, collection } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

const firebaseConfig = {
  apiKey: "AIzaSyCpGwK5d2pBI_xkNy66fjemxBF797KGBnk",
  authDomain: "doctors-connect-be573.firebaseapp.com",
  projectId: "doctors-connect-be573",
  storageBucket: "doctors-connect-be573.firebasestorage.app",
  messagingSenderId: "869626308470",
  appId: "1:869626308470:web:24ae0a18ed7eca77c03c57",
};

// Initialize Firebase
const firebase = initializeApp(firebaseConfig);
export const db = getFirestore(firebase);
export const usersCollection = collection(db, "users");
export const responsesCollection = collection(db, "cases");
export const repliesCollection = collection(db, "replies");

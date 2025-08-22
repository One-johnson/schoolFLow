import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  projectId: "schoolflow-731q1",
  appId: "1:349830314157:web:e0bc3133825a7c34586e24",
  storageBucket: "schoolflow-731q1.firebasestorage.app",
  apiKey: "AIzaSyDdEt90BYxkmlomk7AeOdRWfOXq7HY5O14",
  authDomain: "schoolflow-731q1.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "349830314157",
  databaseURL: "https://schoolflow-731q1-default-rtdb.firebaseio.com",
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const database = getDatabase(app);

export { app, auth, database };

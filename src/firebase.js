// Import the functions you need from the Firebase SDKs
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // Auth import korun

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDnpNlgH1NasEcyhxJHq_1W4lBpngMRUT8",
  authDomain: "qcsc-elc.firebaseapp.com",
  projectId: "qcsc-elc",
  storageBucket: "qcsc-elc.appspot.com", // "firebasestorage.app" er poriborte "appspot.com" use korun
  messagingSenderId: "550231317490",
  appId: "1:550231317490:web:d8027a369ae039af93a96b",
  measurementId: "G-3CFDVC64Y5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize and export Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app); // Auth o export korun
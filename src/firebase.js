// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBeIkPqnPAslEOFMRDczg0CA8quV_1x5d0",
    authDomain: "savings-tracker-8098d.firebaseapp.com",
    projectId: "savings-tracker-8098d",
    storageBucket: "savings-tracker-8098d.firebasestorage.app",
    messagingSenderId: "204702982870",
    appId: "1:204702982870:web:ced49af22ca248147b1f77",
    measurementId: "G-JHRMFHS2X9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

export default app;

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBAX_00TYSAmwSIONkec7YpT4w-ANCTfHw",
  authDomain: "infinity-gaming-lounge.firebaseapp.com",
  projectId: "infinity-gaming-lounge",
  storageBucket: "infinity-gaming-lounge.firebasestorage.app",
  messagingSenderId: "730363663943",
  appId: "1:730363663943:web:43b6073a83f1872e7d0362",
  measurementId: "G-CGB805VJBD"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
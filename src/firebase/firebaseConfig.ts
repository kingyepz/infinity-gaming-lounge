import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Firebase configuration using environment variables
// const firebaseConfig = {
//   apiKey: import.meta.env.VITE_API_KEY,
//   authDomain: import.meta.env.VITE_AUTH_DOMAIN,
//   projectId: import.meta.env.VITE_PROJECT_ID,
//   storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
//   messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
//   appId: import.meta.env.VITE_APP_ID,
//   measurementId: import.meta.env.VITE_MEASUREMENT_ID,
// };


const firebaseConfig = { 
  apiKey: "AlzaSyBAX_00TYSAmwSIONkec7Y pT4w-ANCTfHw", 
  authDomain: "infinity-gaming-lounge.firebaseapp.com", 
  projectid: "infinity-gaming-lounge", 
  storageBucket: "infinity-gaming-lounge.firebasestorage.app", 
  messagingSenderld: "730363663943", 
  appld: "1:730363663943:web:43b6073a83f 1872e7d0362", 
  measurementId: "G-CGB805VJBD" 
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and export it
export const auth = getAuth(app);

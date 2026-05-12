import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyChAztHRQUd3D9I4exeD7h9UQTti_RfFGU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "maxxgymapp.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "maxxgymapp",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "maxxgymapp.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "84904356602",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:84904356602:web:6cb4649107c163b2417743"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

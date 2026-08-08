import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyA_6ST3OZo-rhNe_rNIHXVyuW6SlTK24yA",
  authDomain: "clics-a2fed.firebaseapp.com",
  projectId: "clics-a2fed",
  storageBucket: "clics-a2fed.firebasestorage.app",
  messagingSenderId: "752562957806",
  appId: "1:752562957806:web:986830349ca0640d9232ff",
  measurementId: "G-JV26C9SZ5M"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// firebase/config.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database'; // <-- Real-time Database
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBZ4NX95D18gqP1u4h_2oHILnjWW8B0VqY",
  authDomain: "capacitaciones-web-app.firebaseapp.com",
  projectId: "capacitaciones-web-app",
  storageBucket: "capacitaciones-web-app.firebasestorage.app",
  messagingSenderId: "3296895941",
  appId: "1:3296895941:web:e21101ea484e10da8c21ac",
  measurementId: "G-C63HPXNJHQ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const rtdb = getDatabase(app); // Aquí se obtiene RTDB
const auth = getAuth(app);

export { db, rtdb, auth }
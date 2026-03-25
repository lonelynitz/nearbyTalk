import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyA090405MCfWLv9P_OKw75X-4w3agnvYXw",
  authDomain: "nearbytalk-bd8fb.firebaseapp.com",
  projectId: "nearbytalk-bd8fb",
  storageBucket: "nearbytalk-bd8fb.firebasestorage.app",
  messagingSenderId: "176107226517",
  appId: "1:176107226517:web:693245030c5c603d29229c",
  measurementId: "G-J3FW7KWNJX",
  databaseURL: "https://nearbytalk-bd8fb-default-rtdb.asia-southeast1.firebasedatabase.app",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);

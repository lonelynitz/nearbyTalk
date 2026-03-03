import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyAnv-NhLUQEHFn9gi_lqYaNy6dCgNhg-bc",
  authDomain: "match-vibe-f67fb.firebaseapp.com",
  projectId: "match-vibe-f67fb",
  storageBucket: "match-vibe-f67fb.firebasestorage.app",
  messagingSenderId: "991364219874",
  appId: "1:991364219874:web:e7ba7cc7e6d13ec804afbb",
  databaseURL: "https://match-vibe-f67fb-default-rtdb.asia-southeast1.firebasedatabase.app",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);

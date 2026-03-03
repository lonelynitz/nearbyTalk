import { signInAnonymously as fbSignInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';

export async function signInAnonymously() {
  return fbSignInAnonymously(auth);
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

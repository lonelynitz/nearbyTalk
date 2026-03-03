import { doc, setDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export async function startVideoSync(roomId, broadcasterUid, fileName) {
  await setDoc(doc(db, 'videoSync', roomId), {
    broadcasterUid,
    fileName,
    state: 'paused',
    currentTime: 0,
    version: 1,
    updatedAt: serverTimestamp(),
  });
}

export async function updateVideoSync(roomId, state, currentTime, version) {
  await setDoc(doc(db, 'videoSync', roomId), {
    state,
    currentTime,
    version,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function stopVideoSync(roomId) {
  await deleteDoc(doc(db, 'videoSync', roomId));
}

export function listenForVideoSync(roomId, callback) {
  return onSnapshot(doc(db, 'videoSync', roomId), (snap) => {
    if (snap.exists()) {
      callback(snap.data());
    } else {
      callback(null);
    }
  });
}

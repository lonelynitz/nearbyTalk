import { doc, setDoc, deleteDoc, collection, query, where, getDocs, serverTimestamp, Timestamp } from 'firebase/firestore';
import { ref, set, onDisconnect, onValue, serverTimestamp as rtdbTimestamp } from 'firebase/database';
import { db, rtdb } from '../config/firebase';

export async function registerPresence(uid, nickname, geohash, lat, lng, radiusKm) {
  const expiresAt = Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000));

  await setDoc(doc(db, 'onlineUsers', uid), {
    uid, nickname, geohash, lat, lng, radiusKm,
    status: 'available',
    createdAt: serverTimestamp(),
    expiresAt,
  });

  const presRef = ref(rtdb, `presence/${uid}`);
  await set(presRef, { state: 'online', lastSeen: rtdbTimestamp() });
  onDisconnect(presRef).set({ state: 'offline', lastSeen: rtdbTimestamp() });
}

export async function updateStatus(uid, status) {
  await setDoc(doc(db, 'onlineUsers', uid), { status }, { merge: true });
}

export async function removePresence(uid) {
  await deleteDoc(doc(db, 'onlineUsers', uid));
  await set(ref(rtdb, `presence/${uid}`), { state: 'offline', lastSeen: rtdbTimestamp() });
}

export async function getNearbyUsers(geohashPrefixes, radiusKm, myLat, myLng, excludeUid, blockedUids = []) {
  const results = [];

  for (const prefix of geohashPrefixes) {
    const q = query(
      collection(db, 'onlineUsers'),
      where('geohash', '>=', prefix),
      where('geohash', '<', prefix + '\uf8ff'),
      where('status', '==', 'available')
    );
    const snap = await getDocs(q);
    snap.forEach(d => {
      const data = d.data();
      if (data.uid !== excludeUid && !blockedUids.includes(data.uid)) {
        results.push(data);
      }
    });
  }

  const { distance } = await import('../utils/geohash.js');
  return results.filter(u => distance(myLat, myLng, u.lat, u.lng) <= radiusKm);
}

export function subscribeToPresence(uid, callback) {
  const presRef = ref(rtdb, `presence/${uid}`);
  return onValue(presRef, snap => {
    callback(snap.exists() ? snap.val() : { state: 'offline' });
  });
}

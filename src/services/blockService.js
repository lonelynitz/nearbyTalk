import { doc, setDoc, deleteDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

const STORAGE_KEY = 'nearbytalk_blocked';

export function getBlockedLocal() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveBlockedLocal(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export async function blockUser(myUid, blockedUid) {
  const local = getBlockedLocal();
  if (!local.includes(blockedUid)) {
    local.push(blockedUid);
    saveBlockedLocal(local);
  }

  await setDoc(doc(db, 'blocks', myUid, 'list', blockedUid), {
    blockedAt: serverTimestamp(),
  });
}

export async function unblockUser(myUid, blockedUid) {
  const local = getBlockedLocal().filter(id => id !== blockedUid);
  saveBlockedLocal(local);

  await deleteDoc(doc(db, 'blocks', myUid, 'list', blockedUid));
}

export async function syncBlockList(myUid) {
  const snap = await getDocs(collection(db, 'blocks', myUid, 'list'));
  const remote = snap.docs.map(d => d.id);
  const local = getBlockedLocal();
  const merged = [...new Set([...local, ...remote])];
  saveBlockedLocal(merged);
  return merged;
}

export function isBlocked(uid) {
  return getBlockedLocal().includes(uid);
}

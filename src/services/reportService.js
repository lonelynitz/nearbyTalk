import { doc, setDoc, getDoc, addDoc, collection, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { BAN_THRESHOLD } from '../utils/constants';

export async function reportUser(reporterUid, reportedUid, roomId, reason) {
  await addDoc(collection(db, 'reports'), {
    reporterUid, reportedUid, roomId, reason,
    timestamp: serverTimestamp(),
  });

  const countRef = doc(db, 'reportCounts', reportedUid);
  const countSnap = await getDoc(countRef);

  if (countSnap.exists()) {
    const newCount = (countSnap.data().count || 0) + 1;
    await setDoc(countRef, {
      count: newCount,
      lastReportAt: serverTimestamp(),
    });

    if (newCount >= BAN_THRESHOLD) {
      await setDoc(doc(db, 'bannedUsers', reportedUid), {
        bannedAt: serverTimestamp(),
        reason: 'Auto-banned: exceeded report threshold',
      });
    }
  } else {
    await setDoc(countRef, { count: 1, lastReportAt: serverTimestamp() });
  }
}

export async function isBanned(uid) {
  const snap = await getDoc(doc(db, 'bannedUsers', uid));
  return snap.exists();
}

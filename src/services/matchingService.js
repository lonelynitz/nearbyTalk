import {
  doc, setDoc, deleteDoc, getDoc, collection, query, where, getDocs,
  serverTimestamp, runTransaction, onSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { distance } from '../utils/geohash';

export async function joinQueue(uid, nickname, geohash, lat, lng, radiusKm) {
  console.log('[Match] Joining queue:', { uid, nickname, geohash, lat, lng, radiusKm });
  await setDoc(doc(db, 'matchQueue', uid), {
    uid, nickname, geohash, lat, lng, radiusKm,
    status: 'searching',
    roomId: null,
    joinedAt: serverTimestamp(),
  });
  console.log('[Match] Joined queue successfully');
}

export async function leaveQueue(uid) {
  try {
    await deleteDoc(doc(db, 'matchQueue', uid));
    console.log('[Match] Left queue');
  } catch (err) {
    console.warn('[Match] leaveQueue error:', err);
  }
}

export async function findMatch(uid, nickname, geohash, lat, lng, radiusKm, blockedUids = []) {
  console.log('[Match] Finding match for:', uid);

  try {
    const q = query(
      collection(db, 'matchQueue'),
      where('status', '==', 'searching')
    );

    const snap = await getDocs(q);
    console.log('[Match] Queue has', snap.size, 'searching users');

    const candidates = [];

    snap.forEach(d => {
      const data = d.data();
      console.log('[Match] Found user in queue:', data.uid, data.nickname, 'status:', data.status);
      if (data.uid !== uid && !blockedUids.includes(data.uid)) {
        const dist = distance(lat, lng, data.lat, data.lng);
        console.log('[Match] Distance to', data.nickname, ':', dist, 'km, max radius:', Math.max(radiusKm, data.radiusKm));
        if (dist <= Math.max(radiusKm, data.radiusKm)) {
          candidates.push({ ...data, distance: dist });
        }
      }
    });

    console.log('[Match] Candidates found:', candidates.length);

    if (candidates.length === 0) return null;

    candidates.sort((a, b) => a.distance - b.distance);
    const match = candidates[0];
    console.log('[Match] Best match:', match.nickname, match.uid);

    const roomId = await runTransaction(db, async (transaction) => {
      const matchRef = doc(db, 'matchQueue', match.uid);
      const matchDoc = await transaction.get(matchRef);

      if (!matchDoc.exists() || matchDoc.data().status !== 'searching') {
        throw new Error('Match no longer available');
      }

      const newRoomId = `room_${[uid, match.uid].sort().join('_')}_${Date.now()}`;
      console.log('[Match] Creating room:', newRoomId);

      transaction.update(doc(db, 'matchQueue', uid), {
        status: 'matched', roomId: newRoomId,
      });
      transaction.update(matchRef, {
        status: 'matched', roomId: newRoomId,
      });

      transaction.set(doc(db, 'chatRooms', newRoomId), {
        users: [uid, match.uid].sort(),
        nicknames: { [uid]: nickname, [match.uid]: match.nickname },
        status: 'active',
        isFriendChat: false,
        createdAt: serverTimestamp(),
        endedAt: null,
      });

      return newRoomId;
    });

    console.log('[Match] Room created successfully:', roomId);
    return { roomId, peerUid: match.uid, peerNickname: match.nickname };
  } catch (err) {
    console.error('[Match] findMatch error:', err);
    return null;
  }
}

export function listenForMatch(uid, callback) {
  console.log('[Match] Setting up match listener for:', uid);
  let called = false;
  return onSnapshot(doc(db, 'matchQueue', uid), async (snap) => {
    if (called) return;
    if (snap.exists()) {
      const data = snap.data();
      console.log('[Match] Listener update:', data.status, data.roomId);
      if (data.status === 'matched' && data.roomId) {
        called = true;
        console.log('[Match] Matched! Room:', data.roomId);
        try {
          const roomSnap = await getDoc(doc(db, 'chatRooms', data.roomId));
          if (roomSnap.exists()) {
            const room = roomSnap.data();
            const peerUid = room.users.find(u => u !== uid);
            const peerNickname = room.nicknames?.[peerUid] || 'Stranger';
            console.log('[Match] Peer:', peerNickname, peerUid);
            callback({ roomId: data.roomId, peerUid, peerNickname });
          } else {
            console.warn('[Match] Room doc not found');
            callback({ roomId: data.roomId, peerUid: null, peerNickname: 'Stranger' });
          }
        } catch (err) {
          console.error('[Match] Error fetching room:', err);
          callback({ roomId: data.roomId, peerUid: null, peerNickname: 'Stranger' });
        }
      }
    }
  }, (err) => {
    console.error('[Match] Listener error:', err);
  });
}

import {
  doc, setDoc, deleteDoc, getDoc, getDocs, collection, query, where,
  serverTimestamp, onSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export async function registerFriendCode(code, uid, nickname) {
  await setDoc(doc(db, 'friendCodes', code), {
    uid, nickname, createdAt: serverTimestamp(),
  });
}

export async function lookupFriendCode(code) {
  const snap = await getDoc(doc(db, 'friendCodes', code));
  return snap.exists() ? snap.data() : null;
}

export async function sendFriendRequest(fromUid, fromNickname, fromCode, toUid) {
  await setDoc(doc(db, 'friendRequests', toUid, 'pending', fromUid), {
    fromUid, fromNickname, fromCode,
    timestamp: serverTimestamp(),
    status: 'pending',
  });
}

export function listenForFriendRequests(uid, callback) {
  return onSnapshot(collection(db, 'friendRequests', uid, 'pending'), (snap) => {
    const requests = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(requests.filter(r => r.status === 'pending'));
  });
}

export async function acceptFriendRequest(myUid, myNickname, myCode, friendUid, friendNickname, friendCode) {
  await setDoc(doc(db, 'friends', myUid, 'list', friendUid), {
    nickname: friendNickname, friendCode, addedAt: serverTimestamp(), lastChatAt: null,
  });
  await setDoc(doc(db, 'friends', friendUid, 'list', myUid), {
    nickname: myNickname, friendCode: myCode, addedAt: serverTimestamp(), lastChatAt: null,
  });
  await deleteDoc(doc(db, 'friendRequests', myUid, 'pending', friendUid));
}

export async function declineFriendRequest(myUid, friendUid) {
  await deleteDoc(doc(db, 'friendRequests', myUid, 'pending', friendUid));
}

export async function removeFriend(myUid, friendUid) {
  await deleteDoc(doc(db, 'friends', myUid, 'list', friendUid));
  await deleteDoc(doc(db, 'friends', friendUid, 'list', myUid));
}

export function listenForFriends(uid, callback) {
  return onSnapshot(collection(db, 'friends', uid, 'list'), (snap) => {
    callback(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
  });
}

export async function createFriendChatRoom(uid1, nick1, uid2, nick2) {
  const roomId = `friend_${[uid1, uid2].sort().join('_')}`;
  const existing = await getDoc(doc(db, 'chatRooms', roomId));
  if (existing.exists() && existing.data().status === 'active') {
    return roomId;
  }

  await setDoc(doc(db, 'chatRooms', roomId), {
    users: [uid1, uid2].sort(),
    nicknames: { [uid1]: nick1, [uid2]: nick2 },
    status: 'active',
    isFriendChat: true,
    createdAt: serverTimestamp(),
    endedAt: null,
  });
  return roomId;
}

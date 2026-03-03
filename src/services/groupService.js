import {
  doc, setDoc, updateDoc, getDoc, getDocs,
  collection, query, where, onSnapshot, serverTimestamp, arrayUnion, arrayRemove,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { MAX_GROUP_SIZE } from '../utils/constants';

// Generate a short room code (6 chars)
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Create a new group room
export async function createGroup(creatorUid, creatorNickname, groupName) {
  const roomCode = generateRoomCode();
  const groupRef = doc(collection(db, 'groupChats'));

  await setDoc(groupRef, {
    name: groupName,
    roomCode,
    creatorUid,
    members: [creatorUid],
    nicknames: { [creatorUid]: creatorNickname },
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return { groupId: groupRef.id, roomCode };
}

// Join a group by room code
export async function joinGroupByCode(uid, nickname, roomCode) {
  const q = query(
    collection(db, 'groupChats'),
    where('roomCode', '==', roomCode.toUpperCase()),
    where('status', '==', 'active')
  );
  const snap = await getDocs(q);

  if (snap.empty) {
    return { error: 'Room not found. Check the code and try again.' };
  }

  const groupDoc = snap.docs[0];
  const groupData = groupDoc.data();

  if (groupData.members.includes(uid)) {
    return { groupId: groupDoc.id, alreadyMember: true };
  }

  if (groupData.members.length >= MAX_GROUP_SIZE) {
    return { error: 'Room is full (max 10 members).' };
  }

  await updateDoc(doc(db, 'groupChats', groupDoc.id), {
    members: arrayUnion(uid),
    [`nicknames.${uid}`]: nickname,
    updatedAt: serverTimestamp(),
  });

  return { groupId: groupDoc.id };
}

// Listen for groups the user belongs to
export function listenForGroups(uid, callback) {
  const q = query(
    collection(db, 'groupChats'),
    where('members', 'array-contains', uid),
    where('status', '==', 'active')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// Leave a group
export async function leaveGroup(uid, groupId) {
  const groupRef = doc(db, 'groupChats', groupId);
  await updateDoc(groupRef, {
    members: arrayRemove(uid),
    updatedAt: serverTimestamp(),
  });
}

// Kick a member (creator only)
export async function kickMember(creatorUid, targetUid, groupId) {
  const groupRef = doc(db, 'groupChats', groupId);
  const groupSnap = await getDoc(groupRef);
  if (!groupSnap.exists() || groupSnap.data().creatorUid !== creatorUid) return false;

  await updateDoc(groupRef, {
    members: arrayRemove(targetUid),
    updatedAt: serverTimestamp(),
  });
  return true;
}

// Publish member's ECDH public key for group key exchange
export async function publishMemberPublicKey(groupId, uid, jwk) {
  await setDoc(doc(db, 'groupChats', groupId, 'memberKeys', uid), {
    publicKey: jwk,
    updatedAt: serverTimestamp(),
  });
}

// Listen for all member public keys
export function listenForMemberPublicKeys(groupId, callback) {
  return onSnapshot(collection(db, 'groupChats', groupId, 'memberKeys'), (snap) => {
    const keys = {};
    snap.docs.forEach(d => { keys[d.id] = d.data().publicKey; });
    callback(keys);
  });
}

// Publish encrypted group key for a specific member
export async function publishEncryptedGroupKey(groupId, targetUid, senderUid, encryptedPayload, version) {
  await setDoc(doc(db, 'groupChats', groupId, 'keys', targetUid), {
    encryptedGroupKey: encryptedPayload,
    senderUid,
    version,
    updatedAt: serverTimestamp(),
  });
}

// Listen for my encrypted group key
export function listenForMyGroupKey(groupId, uid, callback) {
  return onSnapshot(doc(db, 'groupChats', groupId, 'keys', uid), (snap) => {
    if (snap.exists()) callback(snap.data());
  });
}

// Get group details
export async function getGroup(groupId) {
  const snap = await getDoc(doc(db, 'groupChats', groupId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Listen for group changes
export function listenForGroup(groupId, callback) {
  return onSnapshot(doc(db, 'groupChats', groupId), (snap) => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() });
  });
}

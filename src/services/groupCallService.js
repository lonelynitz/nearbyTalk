import {
  doc, setDoc, updateDoc, onSnapshot, collection, addDoc, serverTimestamp,
  arrayUnion, arrayRemove,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Create a group call
export async function createGroupCall(callId, groupId, initiatorUid, type) {
  await setDoc(doc(db, 'groupCalls', callId), {
    groupId,
    initiatorUid,
    type,
    participants: [initiatorUid],
    status: 'active',
    createdAt: serverTimestamp(),
    endedAt: null,
  });
  return callId;
}

// Join a group call
export async function joinGroupCall(callId, uid) {
  await updateDoc(doc(db, 'groupCalls', callId), {
    participants: arrayUnion(uid),
  });
}

// Leave a group call
export async function leaveGroupCall(callId, uid) {
  await updateDoc(doc(db, 'groupCalls', callId), {
    participants: arrayRemove(uid),
  });
}

// Listen for group call changes
export function listenForGroupCall(callId, callback) {
  return onSnapshot(doc(db, 'groupCalls', callId), (snap) => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() });
  });
}

// Deterministic pair key: always sorted so both peers use the same doc
function pairKey(uidA, uidB) {
  return [uidA, uidB].sort().join('_');
}

// Set offer for a specific peer pair
export async function setGroupOffer(callId, fromUid, toUid, offer) {
  const pk = pairKey(fromUid, toUid);
  await setDoc(doc(db, 'groupCalls', callId, 'signaling', pk), {
    offer: { type: offer.type, sdp: offer.sdp },
    answer: null,
    offererUid: fromUid,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

// Set answer for a specific peer pair
export async function setGroupAnswer(callId, fromUid, toUid, answer) {
  const pk = pairKey(fromUid, toUid);
  await updateDoc(doc(db, 'groupCalls', callId, 'signaling', pk), {
    answer: { type: answer.type, sdp: answer.sdp },
    updatedAt: serverTimestamp(),
  });
}

// Listen for signaling data for a specific pair
export function listenForGroupSignaling(callId, fromUid, toUid, callback) {
  const pk = pairKey(fromUid, toUid);
  return onSnapshot(doc(db, 'groupCalls', callId, 'signaling', pk), (snap) => {
    if (snap.exists()) callback(snap.data());
  });
}

// Add ICE candidate for a specific pair
export async function addGroupCandidate(callId, fromUid, toUid, senderUid, candidate) {
  const pk = pairKey(fromUid, toUid);
  const col = senderUid === [fromUid, toUid].sort()[0] ? 'candidates_a' : 'candidates_b';
  await addDoc(collection(db, 'groupCalls', callId, 'signaling', pk, col), candidate.toJSON());
}

// Listen for ICE candidates for a specific pair (from the other side)
export function listenForGroupCandidates(callId, fromUid, toUid, myUid, callback) {
  const pk = pairKey(fromUid, toUid);
  const col = myUid === [fromUid, toUid].sort()[0] ? 'candidates_b' : 'candidates_a';
  return onSnapshot(collection(db, 'groupCalls', callId, 'signaling', pk, col), (snap) => {
    snap.docChanges().forEach(change => {
      if (change.type === 'added') callback(change.doc.data());
    });
  });
}

// End group call
export async function endGroupCall(callId) {
  await updateDoc(doc(db, 'groupCalls', callId), {
    status: 'ended',
    endedAt: serverTimestamp(),
  });
}

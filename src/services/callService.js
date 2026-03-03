import {
  doc, setDoc, updateDoc, onSnapshot, collection, addDoc, serverTimestamp,
  query, where,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export async function createCall(callId, callerUid, calleeUid, type) {
  await setDoc(doc(db, 'calls', callId), {
    callerUid, calleeUid, type,
    status: 'ringing',
    offer: null, answer: null,
    createdAt: serverTimestamp(),
    endedAt: null,
  });
  return callId;
}

export function listenForCall(callId, callback) {
  return onSnapshot(doc(db, 'calls', callId), (snap) => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() });
  });
}

export function listenForIncomingCalls(uid, callback) {
  const q = query(
    collection(db, 'calls'),
    where('calleeUid', '==', uid),
    where('status', '==', 'ringing')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export async function setOffer(callId, offer) {
  return updateDoc(doc(db, 'calls', callId), {
    offer: { type: offer.type, sdp: offer.sdp },
    status: 'active',
  });
}

export async function setAnswer(callId, answer) {
  return updateDoc(doc(db, 'calls', callId), {
    answer: { type: answer.type, sdp: answer.sdp },
  });
}

export async function addCandidate(callId, collName, candidate) {
  return addDoc(collection(db, 'calls', callId, collName), candidate.toJSON());
}

export function listenForCandidates(callId, collName, callback) {
  return onSnapshot(collection(db, 'calls', callId, collName), (snap) => {
    snap.docChanges().forEach((change) => {
      if (change.type === 'added') callback(change.doc.data());
    });
  });
}

export async function endCall(callId) {
  return updateDoc(doc(db, 'calls', callId), {
    status: 'ended', endedAt: serverTimestamp(),
  });
}

import { ref, push, onChildAdded, off, remove, serverTimestamp } from 'firebase/database';
import { doc, updateDoc, serverTimestamp as fsTimestamp } from 'firebase/firestore';
import { rtdb, db } from '../config/firebase';

export function sendEncryptedMessage(roomId, senderUid, encryptedPayload, extra = {}) {
  const messagesRef = ref(rtdb, `chats/${roomId}/messages`);
  return push(messagesRef, {
    sender: senderUid,
    iv: encryptedPayload.iv,
    ciphertext: encryptedPayload.ciphertext,
    type: 'text',
    timestamp: serverTimestamp(),
    ...extra,
  });
}

export function subscribeToMessages(roomId, callback) {
  const messagesRef = ref(rtdb, `chats/${roomId}/messages`);
  const handler = onChildAdded(messagesRef, (snapshot) => {
    callback({ id: snapshot.key, ...snapshot.val() });
  });
  return () => off(messagesRef, 'child_added', handler);
}

export async function cleanupRoom(roomId) {
  await remove(ref(rtdb, `chats/${roomId}`));
  try {
    await updateDoc(doc(db, 'chatRooms', roomId), {
      status: 'ended',
      endedAt: fsTimestamp(),
    });
  } catch {}
}

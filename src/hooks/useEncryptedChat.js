import { useState, useEffect, useCallback, useRef } from 'react';
import { generateKeyPair, exportPublicKey, importPublicKey } from '../crypto/keyManager';
import { deriveSharedKey, encrypt, decrypt } from '../crypto/encryption';
import { sendEncryptedMessage, subscribeToMessages, cleanupRoom } from '../services/chatService';
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { filterText } from '../utils/profanityFilter';

export default function useEncryptedChat({ roomId, uid, peerUid, isFriendChat = false }) {
  const [messages, setMessages] = useState([]);
  const [encryptionReady, setEncryptionReady] = useState(false);
  const [peerDisconnected, setPeerDisconnected] = useState(false);
  const sharedKeyRef = useRef(null);
  const privateKeyRef = useRef(null);

  useEffect(() => {
    if (!roomId || !uid || !peerUid) return;

    let cancelled = false;
    const unsubs = [];

    async function init() {
      const keyPair = await generateKeyPair();
      privateKeyRef.current = keyPair.privateKey;

      const pubJwk = await exportPublicKey(keyPair.publicKey);
      await setDoc(doc(db, 'chatRooms', roomId, 'keys', uid), {
        publicKey: pubJwk, createdAt: serverTimestamp(),
      });

      const unsub = onSnapshot(doc(db, 'chatRooms', roomId, 'keys', peerUid), async (snap) => {
        if (cancelled || !snap.exists()) return;
        const theirJwk = snap.data().publicKey;
        const theirPubKey = await importPublicKey(theirJwk);
        const shared = await deriveSharedKey(privateKeyRef.current, theirPubKey);
        sharedKeyRef.current = shared;
        setEncryptionReady(true);
      });
      unsubs.push(unsub);

      const unsubMsgs = subscribeToMessages(roomId, async (msg) => {
        if (cancelled) return;
        if (!sharedKeyRef.current) return;
        try {
          const text = await decrypt(sharedKeyRef.current, msg.iv, msg.ciphertext);
          setMessages(prev => {
            if (prev.find(m => m.id === msg.id)) return prev;
            return [...prev, { ...msg, text: filterText(text) }];
          });
        } catch {
          setMessages(prev => {
            if (prev.find(m => m.id === msg.id)) return prev;
            return [...prev, { ...msg, text: msg.sender === uid ? '[sent by you]' : '[decryption failed]' }];
          });
        }
      });
      unsubs.push(unsubMsgs);

      // Listen for peer disconnect (room status change)
      const unsubRoom = onSnapshot(doc(db, 'chatRooms', roomId), (snap) => {
        if (!snap.exists()) {
          setPeerDisconnected(true);
          return;
        }
        const data = snap.data();
        if (data.status === 'ended') setPeerDisconnected(true);
      });
      unsubs.push(unsubRoom);
    }

    init();

    return () => {
      cancelled = true;
      unsubs.forEach(u => u());
    };
  }, [roomId, uid, peerUid]);

  const sendMessage = useCallback(async (plaintext) => {
    if (!sharedKeyRef.current || !plaintext.trim()) return;
    const encrypted = await encrypt(sharedKeyRef.current, plaintext.trim());
    await sendEncryptedMessage(roomId, uid, encrypted);
  }, [roomId, uid]);

  // Only cleanup keys on unmount, DON'T delete the room automatically
  useEffect(() => {
    return () => {
      sharedKeyRef.current = null;
      privateKeyRef.current = null;
    };
  }, [roomId]);

  // Explicit end chat function for when user clicks "End"
  const endChat = useCallback(() => {
    if (!isFriendChat && roomId) {
      cleanupRoom(roomId);
    }
  }, [roomId, isFriendChat]);

  return { messages, sendMessage, encryptionReady, peerDisconnected, endChat };
}

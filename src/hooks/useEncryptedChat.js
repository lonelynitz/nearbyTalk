import { useState, useEffect, useCallback, useRef } from 'react';
import { generateKeyPair, exportPublicKey, importPublicKey, exportPrivateKey, importPrivateKey } from '../crypto/keyManager';
import { deriveSharedKey, encrypt, decrypt } from '../crypto/encryption';
import { sendEncryptedMessage, subscribeToMessages, cleanupRoom } from '../services/chatService';
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { filterText } from '../utils/profanityFilter';
import { subscribeToPresence } from '../services/userService';

async function getOrCreateKeyPair(roomId, uid) {
  const storageKey = `keypair_${roomId}_${uid}`;
  const stored = sessionStorage.getItem(storageKey);
  if (stored) {
    try {
      const { pub, priv } = JSON.parse(stored);
      const publicKey = await importPublicKey(pub);
      const privateKey = await importPrivateKey(priv);
      return { publicKey, privateKey, pubJwk: pub };
    } catch {
      // Fall through to generate new
    }
  }
  const keyPair = await generateKeyPair();
  const pubJwk = await exportPublicKey(keyPair.publicKey);
  const privJwk = await exportPrivateKey(keyPair.privateKey);
  sessionStorage.setItem(storageKey, JSON.stringify({ pub: pubJwk, priv: privJwk }));
  return { publicKey: keyPair.publicKey, privateKey: keyPair.privateKey, pubJwk };
}

export default function useEncryptedChat({ roomId, uid, peerUid, isFriendChat = false }) {
  const [messages, setMessages] = useState([]);
  const [encryptionReady, setEncryptionReady] = useState(false);
  const [peerDisconnected, setPeerDisconnected] = useState(false);
  const sharedKeyRef = useRef(null);
  const privateKeyRef = useRef(null);
  const pendingMessagesRef = useRef([]);

  useEffect(() => {
    if (!roomId || !uid || !peerUid) return;

    let cancelled = false;
    const unsubs = [];

    async function decryptAndAdd(msg, key) {
      try {
        const text = await decrypt(key, msg.iv, msg.ciphertext);
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
    }

    async function init() {
      const { publicKey, privateKey, pubJwk } = await getOrCreateKeyPair(roomId, uid);
      privateKeyRef.current = privateKey;

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

        // Flush any messages that arrived before the key was ready
        const pending = pendingMessagesRef.current.splice(0);
        for (const msg of pending) {
          await decryptAndAdd(msg, shared);
        }

        // Flush any outgoing messages queued before key was ready
        const outbox = pendingOutboxRef.current.splice(0);
        for (const plaintext of outbox) {
          const encrypted = await encrypt(shared, plaintext);
          await sendEncryptedMessage(roomId, uid, encrypted);
        }
      });
      unsubs.push(unsub);

      const unsubMsgs = subscribeToMessages(roomId, async (msg) => {
        if (cancelled) return;
        if (!sharedKeyRef.current) {
          // Queue message until key is ready
          pendingMessagesRef.current.push(msg);
          return;
        }
        await decryptAndAdd(msg, sharedKeyRef.current);
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

      // Listen for peer presence via RTDB onDisconnect
      const unsubPresence = subscribeToPresence(peerUid, (presence) => {
        if (presence.state === 'offline') {
          setPeerDisconnected(true);
        }
      });
      unsubs.push(unsubPresence);
    }

    init();

    return () => {
      cancelled = true;
      unsubs.forEach(u => u());
    };
  }, [roomId, uid, peerUid]);

  const pendingOutboxRef = useRef([]);

  const sendMessage = useCallback(async (plaintext) => {
    if (!plaintext.trim()) return;
    if (!sharedKeyRef.current) {
      // Queue outgoing messages until encryption is ready
      pendingOutboxRef.current.push(plaintext.trim());
      return;
    }
    const encrypted = await encrypt(sharedKeyRef.current, plaintext.trim());
    await sendEncryptedMessage(roomId, uid, encrypted);
  }, [roomId, uid]);

  // Only cleanup keys on unmount, DON'T delete the room automatically
  useEffect(() => {
    return () => {
      sharedKeyRef.current = null;
      privateKeyRef.current = null;
      pendingMessagesRef.current = [];
      pendingOutboxRef.current = [];
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

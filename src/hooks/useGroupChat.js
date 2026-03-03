import { useState, useEffect, useCallback, useRef } from 'react';
import { generateKeyPair, exportPublicKey, importPublicKey } from '../crypto/keyManager';
import { generateGroupKey, encryptGroupKeyForMember, decryptGroupKeyFromCreator } from '../crypto/groupKeyManager';
import { encrypt, decrypt } from '../crypto/encryption';
import { sendEncryptedMessage, subscribeToMessages } from '../services/chatService';
import {
  publishMemberPublicKey, listenForMemberPublicKeys,
  publishEncryptedGroupKey, listenForMyGroupKey, listenForGroup,
} from '../services/groupService';
import { filterText } from '../utils/profanityFilter';

export default function useGroupChat({ groupId, uid, nickname, isCreator }) {
  const [messages, setMessages] = useState([]);
  const [encryptionReady, setEncryptionReady] = useState(false);
  const [members, setMembers] = useState([]);
  const [nicknames, setNicknames] = useState({});
  const groupKeyRef = useRef(null);
  const privateKeyRef = useRef(null);
  const keyVersionRef = useRef(0);

  useEffect(() => {
    if (!groupId || !uid) return;

    let cancelled = false;
    const unsubs = [];

    async function init() {
      // Generate ECDH keypair for this group session
      const keyPair = await generateKeyPair();
      privateKeyRef.current = keyPair.privateKey;

      const pubJwk = await exportPublicKey(keyPair.publicKey);
      await publishMemberPublicKey(groupId, uid, pubJwk);

      if (isCreator) {
        // Creator: generate group key and distribute to all members
        const gKey = await generateGroupKey();
        groupKeyRef.current = gKey;
        keyVersionRef.current = 1;

        // Watch for member public keys, encrypt group key for each
        const unsubKeys = listenForMemberPublicKeys(groupId, async (memberKeys) => {
          if (cancelled) return;
          for (const [memberUid, jwk] of Object.entries(memberKeys)) {
            if (memberUid === uid) continue;
            try {
              const memberPubKey = await importPublicKey(jwk);
              const encrypted = await encryptGroupKeyForMember(
                gKey, privateKeyRef.current, memberPubKey
              );
              await publishEncryptedGroupKey(
                groupId, memberUid, uid,
                { iv: encrypted.iv, ciphertext: encrypted.ciphertext },
                keyVersionRef.current
              );
            } catch (e) {
              console.error('Failed to encrypt group key for member:', memberUid, e);
            }
          }
          if (!cancelled) setEncryptionReady(true);
        });
        unsubs.push(unsubKeys);
      } else {
        // Member: listen for my encrypted group key from creator
        const unsubMyKey = listenForMyGroupKey(groupId, uid, async (data) => {
          if (cancelled || !data.encryptedGroupKey) return;
          if (data.version <= keyVersionRef.current) return;

          try {
            // Get creator's public key
            const unsubCreatorKey = listenForMemberPublicKeys(groupId, async (memberKeys) => {
              if (cancelled) return;
              const creatorPubJwk = memberKeys[data.senderUid];
              if (!creatorPubJwk) return;
              const creatorPubKey = await importPublicKey(creatorPubJwk);
              const gKey = await decryptGroupKeyFromCreator(
                data.encryptedGroupKey, privateKeyRef.current, creatorPubKey
              );
              groupKeyRef.current = gKey;
              keyVersionRef.current = data.version;
              if (!cancelled) setEncryptionReady(true);
            });
            // Clean up this one-shot listener after first resolution
            setTimeout(() => unsubCreatorKey(), 5000);
          } catch (e) {
            console.error('Failed to decrypt group key:', e);
          }
        });
        unsubs.push(unsubMyKey);
      }

      // Subscribe to messages
      const unsubMsgs = subscribeToMessages(groupId, async (msg) => {
        if (cancelled || !groupKeyRef.current) return;
        try {
          const text = await decrypt(groupKeyRef.current, msg.iv, msg.ciphertext);
          setMessages(prev => {
            if (prev.find(m => m.id === msg.id)) return prev;
            return [...prev, {
              ...msg,
              text: filterText(text),
              senderNickname: msg.senderNickname || 'Unknown',
            }];
          });
        } catch {
          setMessages(prev => {
            if (prev.find(m => m.id === msg.id)) return prev;
            return [...prev, {
              ...msg,
              text: msg.sender === uid ? '[sent by you]' : '[decryption failed]',
              senderNickname: msg.senderNickname || 'Unknown',
            }];
          });
        }
      });
      unsubs.push(unsubMsgs);

      // Listen for group changes (members, nicknames)
      const unsubGroup = listenForGroup(groupId, (group) => {
        if (!cancelled) {
          setMembers(group.members || []);
          setNicknames(group.nicknames || {});
        }
      });
      unsubs.push(unsubGroup);
    }

    init();

    return () => {
      cancelled = true;
      unsubs.forEach(u => u());
    };
  }, [groupId, uid, nickname, isCreator]);

  const sendMessage = useCallback(async (plaintext) => {
    if (!groupKeyRef.current || !plaintext.trim()) return;
    const encrypted = await encrypt(groupKeyRef.current, plaintext.trim());
    await sendEncryptedMessage(groupId, uid, encrypted, {
      senderNickname: nickname,
      type: 'text',
    });
  }, [groupId, uid, nickname]);

  const sendSystemMessage = useCallback(async (text) => {
    if (!groupKeyRef.current) return;
    const encrypted = await encrypt(groupKeyRef.current, text);
    await sendEncryptedMessage(groupId, uid, encrypted, {
      senderNickname: 'System',
      type: 'system',
    });
  }, [groupId, uid]);

  return { messages, sendMessage, sendSystemMessage, encryptionReady, members, nicknames };
}

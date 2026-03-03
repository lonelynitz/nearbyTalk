import { useState, useEffect, useCallback } from 'react';
import { ref, set, onValue } from 'firebase/database';
import { rtdb } from '../config/firebase';

export default function useReadReceipts({ roomId, uid, peerUid }) {
  const [peerLastRead, setPeerLastRead] = useState(null);

  // Listen for peer's last read timestamp
  useEffect(() => {
    if (!roomId || !peerUid) return;

    const readRef = ref(rtdb, `readReceipts/${roomId}/${peerUid}`);
    const unsub = onValue(readRef, (snap) => {
      if (snap.exists()) {
        setPeerLastRead(snap.val().lastRead);
      }
    });

    return () => unsub();
  }, [roomId, peerUid]);

  // Mark messages as read
  const markAsRead = useCallback((timestamp) => {
    if (!roomId || !uid || !timestamp) return;
    const readRef = ref(rtdb, `readReceipts/${roomId}/${uid}`);
    set(readRef, { lastRead: timestamp, updatedAt: Date.now() });
  }, [roomId, uid]);

  // Check if a message has been read by peer
  const isReadByPeer = useCallback((messageTimestamp) => {
    if (!peerLastRead || !messageTimestamp) return false;
    return peerLastRead >= messageTimestamp;
  }, [peerLastRead]);

  return { peerLastRead, markAsRead, isReadByPeer };
}

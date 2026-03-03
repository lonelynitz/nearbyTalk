import { useState, useEffect, useCallback, useRef } from 'react';
import { ref, set, onValue, remove, serverTimestamp } from 'firebase/database';
import { rtdb } from '../config/firebase';

export default function useTypingIndicator({ roomId, uid, peerUid }) {
  const [peerIsTyping, setPeerIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const stopTimeoutRef = useRef(null);

  // Listen for peer typing
  useEffect(() => {
    if (!roomId || !peerUid) return;

    const typingRef = ref(rtdb, `typing/${roomId}/${peerUid}`);
    const unsub = onValue(typingRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        // Only show if typing happened within last 4 seconds
        if (data.timestamp && Date.now() - data.timestamp < 4000) {
          setPeerIsTyping(true);
        }
      } else {
        setPeerIsTyping(false);
      }
    });

    return () => unsub();
  }, [roomId, peerUid]);

  // Auto-clear peer typing after 3s inactivity
  useEffect(() => {
    if (!peerIsTyping) return;

    const timer = setTimeout(() => setPeerIsTyping(false), 3000);
    return () => clearTimeout(timer);
  }, [peerIsTyping]);

  // Set own typing status
  const setTyping = useCallback(() => {
    if (!roomId || !uid) return;

    const typingRef = ref(rtdb, `typing/${roomId}/${uid}`);
    set(typingRef, { typing: true, timestamp: Date.now() });

    // Clear any existing stop timeout
    if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);

    // Auto-stop typing after 2s of no keystrokes
    stopTimeoutRef.current = setTimeout(() => {
      remove(typingRef);
    }, 2000);
  }, [roomId, uid]);

  // Stop typing
  const stopTyping = useCallback(() => {
    if (!roomId || !uid) return;
    const typingRef = ref(rtdb, `typing/${roomId}/${uid}`);
    remove(typingRef);
    if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
  }, [roomId, uid]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (roomId && uid) {
        remove(ref(rtdb, `typing/${roomId}/${uid}`));
      }
      if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
    };
  }, [roomId, uid]);

  return { peerIsTyping, setTyping, stopTyping };
}

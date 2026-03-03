import { useState, useCallback, useRef, useEffect } from 'react';
import { joinQueue, leaveQueue, findMatch, listenForMatch } from '../services/matchingService';
import { getBlockedLocal } from '../services/blockService';

export default function useMatchmaking({ uid, nickname, position, geohash, radiusKm }) {
  const [status, setStatus] = useState('idle');
  const [matchData, setMatchData] = useState(null);
  const unsubRef = useRef(null);
  const retryRef = useRef(null);
  const activeRef = useRef(false);

  const startSearching = useCallback(async () => {
    if (!uid || !geohash || !position) {
      console.warn('[Matchmaking] Missing data:', { uid, geohash, position });
      return;
    }
    console.log('[Matchmaking] Starting search for uid:', uid, 'at', position.lat, position.lng, 'radius:', radiusKm);
    setStatus('searching');
    activeRef.current = true;

    try {
      await joinQueue(uid, nickname, geohash, position.lat, position.lng, radiusKm);
      console.log('[Matchmaking] Joined queue successfully');
    } catch (err) {
      console.error('[Matchmaking] Failed to join queue:', err);
      setStatus('idle');
      activeRef.current = false;
      return;
    }

    const blockedUids = getBlockedLocal();
    console.log('[Matchmaking] Blocked UIDs:', blockedUids);

    // Try to find a match immediately
    const result = await findMatch(uid, nickname, geohash, position.lat, position.lng, radiusKm, blockedUids);
    console.log('[Matchmaking] Immediate findMatch result:', result);

    if (result && activeRef.current) {
      setStatus('matched');
      setMatchData(result);
      activeRef.current = false;
      return;
    }

    // If no immediate match, listen for someone to match us
    // AND keep retrying findMatch every 3 seconds
    if (activeRef.current) {
      unsubRef.current = listenForMatch(uid, (data) => {
        if (!activeRef.current) return;
        activeRef.current = false;
        if (retryRef.current) {
          clearInterval(retryRef.current);
          retryRef.current = null;
        }
        setStatus('matched');
        setMatchData(data);
      });

      // Retry finding match every 3s (in case someone joins after us)
      retryRef.current = setInterval(async () => {
        if (!activeRef.current) {
          clearInterval(retryRef.current);
          retryRef.current = null;
          return;
        }
        console.log('[Matchmaking] Retrying findMatch...');
        const retryResult = await findMatch(uid, nickname, geohash, position.lat, position.lng, radiusKm, blockedUids);
        console.log('[Matchmaking] Retry result:', retryResult);
        if (retryResult && activeRef.current) {
          activeRef.current = false;
          if (retryRef.current) {
            clearInterval(retryRef.current);
            retryRef.current = null;
          }
          if (unsubRef.current) {
            unsubRef.current();
            unsubRef.current = null;
          }
          setStatus('matched');
          setMatchData(retryResult);
        }
      }, 3000);
    }
  }, [uid, nickname, geohash, position, radiusKm]);

  const stopSearching = useCallback(async () => {
    // Immediately update UI
    activeRef.current = false;
    setStatus('idle');
    setMatchData(null);
    if (retryRef.current) {
      clearInterval(retryRef.current);
      retryRef.current = null;
    }
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }
    try {
      await leaveQueue(uid);
    } catch (err) {
      console.warn('Failed to leave queue:', err);
    }
  }, [uid]);

  useEffect(() => {
    return () => {
      activeRef.current = false;
      if (unsubRef.current) unsubRef.current();
      if (retryRef.current) clearInterval(retryRef.current);
    };
  }, []);

  return { status, matchData, startSearching, stopSearching };
}

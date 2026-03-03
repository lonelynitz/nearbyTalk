import { useState, useEffect, useCallback, useRef } from 'react';
import { startVideoSync, updateVideoSync, stopVideoSync, listenForVideoSync } from '../services/videoSyncService';
import { VIDEO_SYNC_DEBOUNCE_MS } from '../utils/constants';

export default function useVideoSync({ roomId, uid }) {
  const [syncState, setSyncState] = useState(null);
  const versionRef = useRef(0);
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    if (!roomId) return;
    const unsub = listenForVideoSync(roomId, (data) => {
      setSyncState(data);
      if (data) versionRef.current = data.version;
    });
    return unsub;
  }, [roomId]);

  const isBroadcaster = syncState?.broadcasterUid === uid;

  const startBroadcasting = useCallback(async (fileName) => {
    versionRef.current = 1;
    await startVideoSync(roomId, uid, fileName);
  }, [roomId, uid]);

  const publishPlay = useCallback(async (currentTime) => {
    const now = Date.now();
    if (now - lastUpdateRef.current < VIDEO_SYNC_DEBOUNCE_MS) return;
    lastUpdateRef.current = now;
    versionRef.current++;
    await updateVideoSync(roomId, 'playing', currentTime, versionRef.current);
  }, [roomId]);

  const publishPause = useCallback(async (currentTime) => {
    versionRef.current++;
    lastUpdateRef.current = Date.now();
    await updateVideoSync(roomId, 'paused', currentTime, versionRef.current);
  }, [roomId]);

  const publishSeek = useCallback(async (currentTime) => {
    versionRef.current++;
    lastUpdateRef.current = Date.now();
    await updateVideoSync(roomId, syncState?.state || 'paused', currentTime, versionRef.current);
  }, [roomId, syncState?.state]);

  const stopBroadcasting = useCallback(async () => {
    await stopVideoSync(roomId);
  }, [roomId]);

  return { syncState, isBroadcaster, startBroadcasting, publishPlay, publishPause, publishSeek, stopBroadcasting };
}

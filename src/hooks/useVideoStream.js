import { useState, useRef, useCallback } from 'react';
import { ICE_SERVERS } from '../utils/constants';

export default function useVideoStream({ roomId, uid }) {
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [incomingVideoStream, setIncomingVideoStream] = useState(null);
  const videoElRef = useRef(null);
  const capturedStreamRef = useRef(null);

  // Broadcaster: capture stream from a video element playing a local file
  const startBroadcast = useCallback((videoElement) => {
    if (!videoElement) return null;
    videoElRef.current = videoElement;

    // captureStream() returns a MediaStream from the video element
    const stream = videoElement.captureStream ? videoElement.captureStream() :
                   videoElement.mozCaptureStream ? videoElement.mozCaptureStream() : null;

    if (!stream) {
      console.error('captureStream not supported');
      return null;
    }

    capturedStreamRef.current = stream;
    setIsBroadcasting(true);
    return stream;
  }, []);

  const stopBroadcast = useCallback(() => {
    capturedStreamRef.current?.getTracks().forEach(t => t.stop());
    capturedStreamRef.current = null;
    videoElRef.current = null;
    setIsBroadcasting(false);
  }, []);

  // Viewer: set the incoming stream from WebRTC
  const setViewerStream = useCallback((stream) => {
    setIncomingVideoStream(stream);
  }, []);

  return {
    isBroadcasting,
    incomingVideoStream,
    capturedStream: capturedStreamRef.current,
    startBroadcast,
    stopBroadcast,
    setViewerStream,
  };
}

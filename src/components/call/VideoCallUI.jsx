import { useRef, useEffect } from 'react';

export default function VideoCallUI({ localStream, remoteStream, peerNickname, callStatus }) {
  const localRef = useRef(null);
  const remoteRef = useRef(null);

  useEffect(() => {
    if (localRef.current && localStream) localRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteRef.current && remoteStream) remoteRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  return (
    <div className="video-call-ui">
      <video ref={remoteRef} autoPlay playsInline className="remote-video" />
      <div className="video-peer-name">{peerNickname}</div>
      <div className="local-video-pip">
        <video ref={localRef} autoPlay playsInline muted />
      </div>
      {callStatus !== 'connected' && (
        <div className="call-status-text" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'rgba(0,0,0,0.7)', padding: '12px 24px', borderRadius: '8px' }}>
          {callStatus === 'ended' ? 'Call Ended' : 'Connecting...'}
        </div>
      )}
    </div>
  );
}

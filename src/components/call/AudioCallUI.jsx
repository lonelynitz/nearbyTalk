import { useEffect, useRef } from 'react';
import NicknameAvatar from '../shared/NicknameAvatar';

export default function AudioCallUI({ peerNickname, callStatus, remoteStream }) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current && remoteStream) {
      audioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div className="audio-call-ui">
      <NicknameAvatar nickname={peerNickname} size={100} />
      <h2>{peerNickname}</h2>
      <p className="call-status-text">
        {callStatus === 'connected' ? 'Connected' :
         callStatus === 'ended' ? 'Call Ended' : 'Connecting...'}
      </p>
      <audio ref={audioRef} autoPlay playsInline />
    </div>
  );
}

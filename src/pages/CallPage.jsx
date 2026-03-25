import { useState, useContext } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import useWebRTC from '../hooks/useWebRTC';
import AudioCallUI from '../components/call/AudioCallUI';
import VideoCallUI from '../components/call/VideoCallUI';
import CallControls from '../components/call/CallControls';

export default function CallPage() {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const peerUid = searchParams.get('peer');
  const peerNickname = searchParams.get('nick');
  const callType = searchParams.get('type') || 'audio';
  const isFriendChat = searchParams.get('friend') === '1';

  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(callType === 'audio');

  const {
    localStream,
    remoteStream,
    callStatus,
    startCall,
    endCall,
  } = useWebRTC({
    roomId,
    uid: user?.uid,
    peerUid,
    callType,
  });

  function handleEnd() {
    endCall();
    navigate(`/chat/${roomId}?peer=${peerUid}&nick=${peerNickname}${isFriendChat ? '&friend=1' : ''}`);
  }

  function handleToggleMute() {
    if (localStream) {
      localStream.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
      setMuted(prev => !prev);
    }
  }

  function handleToggleVideo() {
    if (localStream) {
      localStream.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
      setVideoOff(prev => !prev);
    }
  }

  return (
    <div className="call-page">
      <div className="call-page-header">
        <button className="btn-icon" onClick={() => navigate('/lobby')} title="Home">🏠</button>
      </div>
      {callType === 'video' ? (
        <VideoCallUI
          localStream={localStream}
          remoteStream={remoteStream}
          peerNickname={peerNickname}
          callStatus={callStatus}
        />
      ) : (
        <AudioCallUI
          peerNickname={peerNickname}
          callStatus={callStatus}
          remoteStream={remoteStream}
        />
      )}

      <CallControls
        muted={muted}
        videoOff={videoOff}
        callType={callType}
        onToggleMute={handleToggleMute}
        onToggleVideo={handleToggleVideo}
        onEnd={handleEnd}
      />
    </div>
  );
}

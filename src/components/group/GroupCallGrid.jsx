import { useRef, useEffect } from 'react';
import NicknameAvatar from '../shared/NicknameAvatar';

function VideoTile({ stream, nickname, muted = false, isLocal = false }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const hasVideo = stream?.getVideoTracks().some(t => t.enabled);

  return (
    <div className="call-grid-tile">
      {hasVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className={`grid-video ${isLocal ? 'mirrored' : ''}`}
        />
      ) : (
        <div className="grid-audio-placeholder">
          <NicknameAvatar nickname={nickname} size={64} />
        </div>
      )}
      <span className="grid-tile-name">{isLocal ? 'You' : nickname}</span>
    </div>
  );
}

export default function GroupCallGrid({ localStream, remoteStreams, nicknames, uid }) {
  const totalStreams = 1 + remoteStreams.size;
  const cols = totalStreams <= 2 ? 2 : totalStreams <= 4 ? 2 : 3;

  return (
    <div className="group-call-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      <VideoTile stream={localStream} nickname="You" muted={true} isLocal={true} />
      {[...remoteStreams.entries()].map(([peerUid, stream]) => (
        <VideoTile
          key={peerUid}
          stream={stream}
          nickname={nicknames?.[peerUid] || 'Unknown'}
        />
      ))}
    </div>
  );
}

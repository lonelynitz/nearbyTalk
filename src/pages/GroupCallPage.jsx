import { useState, useContext, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import useGroupWebRTC from '../hooks/useGroupWebRTC';
import GroupCallGrid from '../components/group/GroupCallGrid';
import CallControls from '../components/call/CallControls';
import { getGroup } from '../services/groupService';
import { createGroupCall } from '../services/groupCallService';

export default function GroupCallPage() {
  const { callId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const callType = searchParams.get('type') || 'audio';
  const groupId = callId; // We use groupId as callId for simplicity

  const [groupInfo, setGroupInfo] = useState(null);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(callType === 'audio');

  useEffect(() => {
    if (!groupId || !user) return;
    getGroup(groupId).then(g => {
      if (g) setGroupInfo(g);
    });
    // Ensure group call doc exists; ignore error if already exists
    createGroupCall(groupId, groupId, user.uid, callType).catch(() => {});
  }, [groupId, user, callType]);

  const { localStream, remoteStreams, callStatus, endCall } = useGroupWebRTC({
    callId: groupId,
    groupId,
    uid: user?.uid,
    callType,
    memberUids: groupInfo?.members || [],
  });

  function handleEnd() {
    endCall();
    navigate(`/group/${groupId}`);
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
    <div className="call-page group-call-page">
      <div className="group-call-header">
        <h3>{groupInfo?.name || 'Group Call'}</h3>
        <span className="call-status-text">{callStatus}</span>
        <button className="btn-icon" onClick={() => navigate('/lobby')} title="Home">🏠</button>
      </div>

      <GroupCallGrid
        localStream={localStream}
        remoteStreams={remoteStreams}
        nicknames={groupInfo?.nicknames || {}}
        uid={user?.uid}
      />

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

import { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import useGroupChat from '../hooks/useGroupChat';
import useRateLimiter from '../hooks/useRateLimiter';
import useVideoSync from '../hooks/useVideoSync';
import useVideoStream from '../hooks/useVideoStream';
import EncryptionBanner from '../components/chat/EncryptionBanner';
import MessageList from '../components/chat/MessageList';
import ChatInput from '../components/chat/ChatInput';
import MemberList from '../components/group/MemberList';
import VideoPlayer from '../components/video/VideoPlayer';
import { getGroup, kickMember } from '../services/groupService';

export default function GroupChatPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user, nickname } = useContext(AuthContext);

  const [groupInfo, setGroupInfo] = useState(null);
  const [showMembers, setShowMembers] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    if (!groupId || !user) return;
    getGroup(groupId).then(g => {
      if (g) {
        setGroupInfo(g);
        setIsCreator(g.creatorUid === user.uid);
      }
    });
  }, [groupId, user]);

  const { messages, sendMessage, encryptionReady, members, nicknames } = useGroupChat({
    groupId, uid: user?.uid, nickname, isCreator,
  });

  const { checkLimit } = useRateLimiter('group-message', 1, 1000);

  const { syncState, isBroadcaster, startBroadcasting, publishPlay, publishPause, publishSeek, stopBroadcasting } = useVideoSync({ roomId: groupId, uid: user?.uid });
  const { startBroadcast, stopBroadcast, incomingVideoStream } = useVideoStream({ roomId: groupId, uid: user?.uid });

  function handleSend(text) {
    if (!checkLimit()) return;
    sendMessage(text);
  }

  async function handleKick(targetUid) {
    await kickMember(user.uid, targetUid, groupId);
  }

  function handleCall(type) {
    navigate(`/group-call/${groupId}?type=${type}`);
  }

  function handleStartBroadcast(videoEl, fileName) {
    startBroadcast(videoEl);
    startBroadcasting(fileName);
  }

  function handleStopBroadcast() {
    stopBroadcast();
    stopBroadcasting();
    setShowVideoPlayer(false);
  }

  function handleCopyCode() {
    if (groupInfo?.roomCode) {
      navigator.clipboard.writeText(groupInfo.roomCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  }

  const videoActive = showVideoPlayer || syncState;

  return (
    <div className="chat-page group-chat-page">
      <header className="chat-header">
        <div className="chat-peer-info">
          <button className="btn-back" onClick={() => navigate('/friends')}>←</button>
          <div>
            <h3>{groupInfo?.name || 'Group'}</h3>
            <span className="group-member-count">
              {members.length} members
              {groupInfo?.roomCode && (
                <> · <span className="room-code-header" onClick={handleCopyCode} title="Click to copy">
                  {codeCopied ? 'Copied!' : `Code: ${groupInfo.roomCode}`}
                </span></>
              )}
            </span>
          </div>
        </div>
        <div className="chat-actions">
          <button className="btn-icon" onClick={() => setShowVideoPlayer(true)} title="Watch Together">🎬</button>
          <button className="btn-icon" onClick={() => handleCall('audio')} title="Group Audio Call">📞</button>
          <button className="btn-icon" onClick={() => handleCall('video')} title="Group Video Call">📹</button>
          <button className="btn-icon" onClick={() => setShowMembers(!showMembers)} title="Members">👥</button>
        </div>
      </header>

      <EncryptionBanner ready={encryptionReady} />

      {videoActive && (
        <VideoPlayer
          syncState={syncState}
          isBroadcaster={isBroadcaster || !syncState}
          onStartBroadcast={handleStartBroadcast}
          onStopBroadcast={handleStopBroadcast}
          onPlay={publishPlay}
          onPause={publishPause}
          onSeek={publishSeek}
          incomingVideoStream={incomingVideoStream}
        />
      )}

      <div className="group-chat-body">
        <div className="group-messages-area">
          <MessageList messages={messages} myUid={user?.uid} isGroup={true} />
        </div>

        {showMembers && (
          <MemberList
            members={members}
            nicknames={nicknames}
            creatorUid={groupInfo?.creatorUid}
            myUid={user?.uid}
            onKick={handleKick}
            onClose={() => setShowMembers(false)}
          />
        )}
      </div>

      <ChatInput onSend={handleSend} disabled={!encryptionReady} />
    </div>
  );
}

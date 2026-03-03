import { useState, useContext } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import useEncryptedChat from '../hooks/useEncryptedChat';
import useRateLimiter from '../hooks/useRateLimiter';
import useBlockList from '../hooks/useBlockList';
import useVideoSync from '../hooks/useVideoSync';
import useVideoStream from '../hooks/useVideoStream';
import useTypingIndicator from '../hooks/useTypingIndicator';
import useReadReceipts from '../hooks/useReadReceipts';
import NicknameAvatar from '../components/shared/NicknameAvatar';
import EncryptionBanner from '../components/chat/EncryptionBanner';
import MessageList from '../components/chat/MessageList';
import ChatInput from '../components/chat/ChatInput';
import TypingIndicator from '../components/chat/TypingIndicator';
import IcebreakerGames from '../components/chat/IcebreakerGames';
import VideoPlayer from '../components/video/VideoPlayer';
import ReportModal from '../components/safety/ReportModal';
import BlockConfirmModal from '../components/safety/BlockConfirmModal';
import { sendFriendRequest } from '../services/friendService';

export default function ChatPage() {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, nickname, friendCode } = useContext(AuthContext);

  const peerUid = searchParams.get('peer');
  const peerNickname = searchParams.get('nick');
  const isFriendChat = searchParams.get('friend') === '1';

  const { messages, sendMessage, encryptionReady, peerDisconnected, endChat } = useEncryptedChat({
    roomId, uid: user?.uid, peerUid, isFriendChat,
  });

  const { checkLimit } = useRateLimiter('message', 1, 1000);
  const { blockUser } = useBlockList(user?.uid);

  const { syncState, isBroadcaster, startBroadcasting, publishPlay, publishPause, publishSeek, stopBroadcasting } = useVideoSync({ roomId, uid: user?.uid });
  const { startBroadcast, stopBroadcast, incomingVideoStream } = useVideoStream({ roomId, uid: user?.uid });

  const { peerIsTyping, setTyping, stopTyping } = useTypingIndicator({
    roomId, uid: user?.uid, peerUid,
  });

  const { markAsRead, isReadByPeer } = useReadReceipts({
    roomId, uid: user?.uid, peerUid,
  });

  const [showReport, setShowReport] = useState(false);
  const [showBlock, setShowBlock] = useState(false);
  const [friendRequestSent, setFriendRequestSent] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [showIcebreaker, setShowIcebreaker] = useState(false);

  // Mark messages as read when new messages arrive
  if (messages.length > 0) {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.sender !== user?.uid && lastMsg.timestamp) {
      markAsRead(lastMsg.timestamp);
    }
  }

  function handleSend(text) {
    if (!checkLimit()) return;
    sendMessage(text);
    stopTyping();
  }

  function handleTyping() {
    setTyping();
  }

  function handleEndChat() {
    endChat();
    navigate('/lobby');
  }

  function handleCall(type) {
    navigate(`/call/${roomId}?peer=${peerUid}&nick=${peerNickname}&type=${type}${isFriendChat ? '&friend=1' : ''}`);
  }

  async function handleAddFriend() {
    if (!peerUid || friendRequestSent) return;
    await sendFriendRequest(user.uid, nickname, friendCode, peerUid);
    setFriendRequestSent(true);
  }

  function handleReport(reason) { setShowReport(false); }

  function handleBlock() {
    blockUser(peerUid, peerNickname);
    setShowBlock(false);
    navigate('/lobby');
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

  function handleIcebreakerSend(text) {
    sendMessage(text);
  }

  const videoActive = showVideoPlayer || syncState;

  return (
    <div className="chat-page">
      <header className="chat-header">
        <div className="chat-peer-info">
          <NicknameAvatar nickname={peerNickname} size={36} />
          <div>
            <h3>{peerNickname}</h3>
            {peerDisconnected && <span className="peer-disconnected">Disconnected</span>}
          </div>
        </div>
        <div className="chat-actions">
          {!isFriendChat && !friendRequestSent && (
            <button className="btn-icon" onClick={handleAddFriend} title="Add Friend">👤+</button>
          )}
          {friendRequestSent && <span className="friend-sent-badge">Request Sent</span>}
          <button className="btn-icon" onClick={() => setShowIcebreaker(!showIcebreaker)} title="Icebreaker Games">🎮</button>
          <button className="btn-icon" onClick={() => setShowVideoPlayer(true)} title="Watch Together">🎬</button>
          <button className="btn-icon" onClick={() => handleCall('audio')} title="Audio Call">📞</button>
          <button className="btn-icon" onClick={() => handleCall('video')} title="Video Call">📹</button>
          <button className="btn-icon" onClick={() => setShowReport(true)} title="Report">⚠️</button>
          <button className="btn-icon" onClick={() => setShowBlock(true)} title="Block">🚫</button>
          <button className="btn-end" onClick={handleEndChat}>End</button>
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

      {showIcebreaker && (
        <IcebreakerGames
          onSend={handleIcebreakerSend}
          onClose={() => setShowIcebreaker(false)}
        />
      )}

      <MessageList
        messages={messages}
        myUid={user?.uid}
        isReadByPeer={isReadByPeer}
      />

      {peerIsTyping && <TypingIndicator nickname={peerNickname} />}

      <ChatInput
        onSend={handleSend}
        onTyping={handleTyping}
        disabled={!encryptionReady || peerDisconnected}
      />

      {showReport && (
        <ReportModal
          peerNickname={peerNickname} peerUid={peerUid} reporterUid={user?.uid}
          onReport={handleReport} onClose={() => setShowReport(false)}
        />
      )}
      {showBlock && (
        <BlockConfirmModal nickname={peerNickname} onConfirm={handleBlock} onCancel={() => setShowBlock(false)} />
      )}
    </div>
  );
}

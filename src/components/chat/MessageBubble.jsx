import NicknameAvatar from '../shared/NicknameAvatar';

export default function MessageBubble({ message, isMine, isGroup, showReadReceipt }) {
  const time = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  if (message.type === 'system') {
    return (
      <div className="message-system">
        <span>{message.text}</span>
      </div>
    );
  }

  if (message.type === 'videoSync') {
    return (
      <div className="message-system video-sync-msg">
        <span>🎬 {message.text}</span>
      </div>
    );
  }

  return (
    <div className={`message-bubble ${isMine ? 'mine' : 'theirs'}`}>
      {isGroup && !isMine && (
        <div className="message-sender">
          <NicknameAvatar nickname={message.senderNickname} size={20} />
          <span className="message-sender-name">{message.senderNickname}</span>
        </div>
      )}
      <p>{message.text}</p>
      <div className="message-meta">
        <span className="message-time">{time}</span>
        {isMine && showReadReceipt && (
          <span className="read-receipt" title="Read">✓✓</span>
        )}
        {isMine && !showReadReceipt && (
          <span className="sent-receipt" title="Sent">✓</span>
        )}
      </div>
    </div>
  );
}

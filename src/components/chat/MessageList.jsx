import { useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';

export default function MessageList({ messages, myUid, isGroup = false, isReadByPeer }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Find the last message sent by me (for read receipt display)
  let lastMyMsgIndex = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].sender === myUid && messages[i].type !== 'system') {
      lastMyMsgIndex = i;
      break;
    }
  }

  return (
    <div className="message-list">
      {messages.length === 0 && (
        <div className="chat-empty"><p>Say hello!</p></div>
      )}
      {messages.map((msg, idx) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          isMine={msg.sender === myUid}
          isGroup={isGroup}
          showReadReceipt={
            !isGroup &&
            idx === lastMyMsgIndex &&
            msg.sender === myUid &&
            isReadByPeer &&
            isReadByPeer(msg.timestamp)
          }
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

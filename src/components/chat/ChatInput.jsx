import { useState } from 'react';
import { containsProfanity, filterText } from '../../utils/profanityFilter';

export default function ChatInput({ onSend, onTyping, disabled }) {
  const [text, setText] = useState('');
  const [warning, setWarning] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim() || disabled) return;

    if (containsProfanity(text)) {
      setWarning('Message filtered for inappropriate language.');
      onSend(filterText(text));
    } else {
      setWarning('');
      onSend(text.trim());
    }
    setText('');
  }

  return (
    <div className="chat-input-bar">
      {warning && <div className="profanity-warning">{warning}</div>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flex: 1, gap: '10px' }}>
        <input
          type="text"
          placeholder={disabled ? 'Waiting for encryption...' : 'Type a message...'}
          value={text}
          onChange={e => { setText(e.target.value); if (onTyping) onTyping(); }}
          disabled={disabled}
          autoFocus
        />
        <button type="submit" disabled={!text.trim() || disabled} className="btn-send">
          ➤
        </button>
      </form>
    </div>
  );
}

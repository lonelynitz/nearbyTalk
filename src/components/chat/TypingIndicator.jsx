export default function TypingIndicator({ nickname }) {
  return (
    <div className="typing-indicator">
      <div className="typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <span className="typing-text">{nickname} is typing...</span>
    </div>
  );
}

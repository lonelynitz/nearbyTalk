import { useState } from 'react';

export default function FriendCodeCard({ code }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="friend-code-card">
      <h4>Your Friend Code</h4>
      <div className="code-display">
        <code>{code}</code>
        <button className="copy-btn" onClick={handleCopy} type="button">
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <p className="code-hint">Share this code with someone to add them as a friend</p>
    </div>
  );
}

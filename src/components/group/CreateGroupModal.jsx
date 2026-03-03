import { useState } from 'react';

export default function CreateGroupModal({ onCreate, onClose }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function handleCreate() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await onCreate(name.trim());
      setResult(res);
    } catch (err) {
      console.error('Failed to create group:', err);
    }
    setLoading(false);
  }

  function handleCopy() {
    if (result?.roomCode) {
      navigator.clipboard.writeText(result.roomCode);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content create-group-modal" onClick={e => e.stopPropagation()}>
        {!result ? (
          <>
            <h3>Create Room</h3>
            <input
              type="text"
              placeholder="Room name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="modal-input"
              maxLength={30}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={onClose} type="button">Cancel</button>
              <button
                className="btn btn-primary"
                onClick={handleCreate}
                disabled={loading || !name.trim()}
                type="button"
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </>
        ) : (
          <>
            <h3>Room Created! 🎉</h3>
            <p className="room-code-label">Share this code with others to join:</p>
            <div className="room-code-display">
              <span className="room-code-value">{result.roomCode}</span>
              <button className="btn-copy" onClick={handleCopy} type="button" title="Copy code">📋</button>
            </div>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={onClose} type="button">Done</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

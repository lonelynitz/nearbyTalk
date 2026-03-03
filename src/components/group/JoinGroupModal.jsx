import { useState } from 'react';

export default function JoinGroupModal({ onJoin, onClose }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleJoin() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed || trimmed.length < 4) {
      setError('Please enter a valid room code');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await onJoin(trimmed);
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      }
      // If success, parent will navigate and close
    } catch (err) {
      setError('Failed to join room. Try again.');
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content join-group-modal" onClick={e => e.stopPropagation()}>
        <h3>Join Room</h3>
        <p className="join-hint">Enter the room code shared with you</p>
        <input
          type="text"
          placeholder="e.g. ABC123"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          className="modal-input room-code-input"
          maxLength={8}
          onKeyDown={e => e.key === 'Enter' && handleJoin()}
          autoFocus
        />
        {error && <p className="modal-error">{error}</p>}
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose} type="button">Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleJoin}
            disabled={loading || !code.trim()}
            type="button"
          >
            {loading ? 'Joining...' : 'Join'}
          </button>
        </div>
      </div>
    </div>
  );
}

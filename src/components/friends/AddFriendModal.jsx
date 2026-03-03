import { useState } from 'react';

export default function AddFriendModal({ onAdd, onClose }) {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    const result = await onAdd(code.trim());
    if (result.error) {
      setStatus({ type: 'error', text: result.error });
    } else {
      setStatus({ type: 'success', text: `Friend request sent to ${result.nickname}!` });
      setCode('');
    }
    setLoading(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>Add Friend by Code</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text" placeholder="Enter friend code (NT-...)"
            value={code} onChange={e => setCode(e.target.value)}
            className="modal-input"
          />
          {status && <p className={`status-msg ${status.type}`}>{status.text}</p>}
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={onClose} type="button">Cancel</button>
            <button className="btn btn-primary" type="submit" disabled={loading || !code.trim()}>
              {loading ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { REPORT_REASONS } from '../../utils/constants';
import { reportUser } from '../../services/reportService';

export default function ReportModal({ peerNickname, peerUid, reporterUid, onReport, onClose }) {
  const [reason, setReason] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    if (!reason) return;
    setSending(true);
    await reportUser(reporterUid, peerUid, '', reason);
    setDone(true);
    setSending(false);
    if (onReport) onReport(reason);
    setTimeout(onClose, 1500);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {done ? (
          <div>
            <h3>Report Submitted</h3>
            <p>Thank you for helping keep NearbyTalk safe.</p>
          </div>
        ) : (
          <>
            <h3>Report {peerNickname}</h3>
            <p>Why are you reporting this user?</p>
            <div className="report-reasons">
              {REPORT_REASONS.map(r => (
                <button key={r} className="report-reason-btn" onClick={() => setReason(r)} type="button"
                  style={reason === r ? { borderColor: 'var(--accent)', background: 'var(--bg-hover)' } : {}}>
                  {r}
                </button>
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={onClose} type="button">Cancel</button>
              <button className="btn btn-danger" onClick={handleSubmit} disabled={!reason || sending} type="button">
                {sending ? 'Sending...' : 'Report'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

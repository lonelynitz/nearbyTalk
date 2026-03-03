export default function BlockConfirmModal({ nickname, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>Block User</h3>
        <p>Are you sure you want to block <strong>{nickname}</strong>? You won't be matched with them again.</p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel} type="button">Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm} type="button">Block</button>
        </div>
      </div>
    </div>
  );
}

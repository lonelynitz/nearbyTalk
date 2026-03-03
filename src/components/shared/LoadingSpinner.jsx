export default function LoadingSpinner({ text }) {
  return (
    <div className="loading-spinner-container">
      <div>
        <div className="spinner"></div>
        {text && <p style={{ marginTop: 12, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{text}</p>}
      </div>
    </div>
  );
}

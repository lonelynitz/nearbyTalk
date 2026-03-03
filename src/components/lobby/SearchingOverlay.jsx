export default function SearchingOverlay({ onCancel }) {
  function handleCancel(e) {
    e.stopPropagation();
    e.preventDefault();
    if (onCancel) onCancel();
  }

  return (
    <div className="searching-overlay" onClick={handleCancel}>
      <div className="searching-animation" style={{ pointerEvents: 'none' }}>
        <div className="pulse-ring"></div>
        <div className="pulse-ring"></div>
        <div className="pulse-ring"></div>
        <div className="searching-center-dot"></div>
      </div>
      <h2>Finding a stranger nearby...</h2>
      <p>Waiting for someone in your area</p>
      <button className="btn-cancel-search" onClick={handleCancel} type="button" style={{ position: 'relative', zIndex: 100 }}>Cancel</button>
    </div>
  );
}

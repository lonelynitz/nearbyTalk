export default function GroupListItem({ group, onClick }) {
  function handleCopyCode(e) {
    e.stopPropagation();
    if (group.roomCode) {
      navigator.clipboard.writeText(group.roomCode);
    }
  }

  return (
    <div className="group-list-item" onClick={onClick}>
      <div className="group-avatar">
        {group.name.charAt(0).toUpperCase()}
      </div>
      <div className="group-item-info">
        <h4>{group.name}</h4>
        <p>{group.members.length} members · Code: <span className="room-code-inline">{group.roomCode}</span></p>
      </div>
      <div className="group-item-actions">
        <button className="btn-copy-sm" onClick={handleCopyCode} type="button" title="Copy room code">📋</button>
        <button className="btn-chat-sm" type="button">Chat</button>
      </div>
    </div>
  );
}

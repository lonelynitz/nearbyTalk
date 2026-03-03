import NicknameAvatar from '../shared/NicknameAvatar';

export default function MemberList({ members, nicknames, creatorUid, myUid, onKick, onClose }) {
  return (
    <div className="member-list-panel">
      <div className="member-list-header">
        <h3>Members ({members.length})</h3>
        <button className="btn-icon" onClick={onClose} type="button">✕</button>
      </div>
      <div className="member-list-items">
        {members.map(uid => (
          <div key={uid} className="member-item">
            <NicknameAvatar nickname={nicknames[uid] || '??'} size={36} />
            <div className="member-info">
              <span className="member-name">{nicknames[uid] || 'Unknown'}</span>
              {uid === creatorUid && <span className="member-badge">Creator</span>}
              {uid === myUid && <span className="member-badge you">You</span>}
            </div>
            {myUid === creatorUid && uid !== myUid && (
              <button className="btn-kick" onClick={() => onKick(uid)} type="button">Kick</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

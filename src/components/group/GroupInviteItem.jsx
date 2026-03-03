import NicknameAvatar from '../shared/NicknameAvatar';

export default function GroupInviteItem({ invite, onAccept, onDecline }) {
  return (
    <div className="group-invite-item">
      <NicknameAvatar nickname={invite.inviterNickname} size={40} />
      <div className="invite-info">
        <h4>{invite.groupName}</h4>
        <p>Invited by {invite.inviterNickname}</p>
      </div>
      <div className="request-actions">
        <button className="btn-accept-sm" onClick={() => onAccept(invite.id)} type="button">Join</button>
        <button className="btn-decline-sm" onClick={() => onDecline(invite.id)} type="button">Decline</button>
      </div>
    </div>
  );
}

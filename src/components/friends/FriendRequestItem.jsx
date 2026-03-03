import NicknameAvatar from '../shared/NicknameAvatar';

export default function FriendRequestItem({ request, onAccept, onDecline }) {
  return (
    <div className="friend-request-item">
      <NicknameAvatar nickname={request.fromNickname} size={40} />
      <div className="request-info">
        <h4>{request.fromNickname}</h4>
        <p>wants to be your friend</p>
      </div>
      <div className="request-actions">
        <button className="btn-accept-sm" onClick={() => onAccept(request)} type="button">Accept</button>
        <button className="btn-decline-sm" onClick={() => onDecline(request)} type="button">Decline</button>
      </div>
    </div>
  );
}

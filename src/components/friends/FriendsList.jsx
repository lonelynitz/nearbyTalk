import { useNavigate } from 'react-router-dom';
import NicknameAvatar from '../shared/NicknameAvatar';
import { createFriendChatRoom } from '../../services/friendService';

export default function FriendsList({ friends, myUid, myNickname }) {
  const navigate = useNavigate();

  async function handleChat(friend) {
    const roomId = await createFriendChatRoom(myUid, myNickname, friend.uid, friend.nickname);
    navigate(`/chat/${roomId}?peer=${friend.uid}&nick=${friend.nickname}&friend=1`);
  }

  if (friends.length === 0) {
    return <div className="friends-empty"><p>No friends yet. Add someone using a friend code!</p></div>;
  }

  return (
    <div className="friends-list">
      {friends.map(f => (
        <div key={f.uid} className="friend-item" onClick={() => handleChat(f)}>
          <NicknameAvatar nickname={f.nickname} size={44} />
          <div className="friend-info">
            <h4>{f.nickname}</h4>
            <p className="friend-code-small">{f.friendCode}</p>
          </div>
          <button className="btn-chat-sm" type="button">Chat</button>
        </div>
      ))}
    </div>
  );
}

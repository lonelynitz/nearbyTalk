import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import useFriends from '../hooks/useFriends';
import useGroups from '../hooks/useGroups';
import FriendCodeCard from '../components/friends/FriendCodeCard';
import AddFriendModal from '../components/friends/AddFriendModal';
import FriendRequestItem from '../components/friends/FriendRequestItem';
import FriendsList from '../components/friends/FriendsList';
import CreateGroupModal from '../components/group/CreateGroupModal';
import JoinGroupModal from '../components/group/JoinGroupModal';
import GroupListItem from '../components/group/GroupListItem';
import LoadingSpinner from '../components/shared/LoadingSpinner';

export default function FriendsPage() {
  const { user, nickname, friendCode, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showJoinRoom, setShowJoinRoom] = useState(false);

  const {
    friends, requests, loading,
    addByCode, acceptRequest, declineRequest,
  } = useFriends(user?.uid, nickname, friendCode);

  const {
    groups, loading: groupsLoading,
    create: createGroup, joinByCode,
  } = useGroups(user?.uid, nickname);

  async function handleJoinRoom(roomCode) {
    const result = await joinByCode(roomCode);
    if (result?.groupId) {
      setShowJoinRoom(false);
      navigate(`/group/${result.groupId}`);
    }
    return result;
  }

  if (authLoading || loading || groupsLoading) return <LoadingSpinner />;

  return (
    <div className="friends-page">
      <header className="friends-header">
        <button className="btn-back" onClick={() => navigate('/lobby')}>🏠 Home</button>
        <h1>Friends & Rooms</h1>
        <button className="btn-icon" onClick={() => setShowAddModal(true)} title="Add Friend">
          +
        </button>
      </header>

      <FriendCodeCard code={friendCode} />

      {requests.length > 0 && (
        <section className="friends-section">
          <h3>Friend Requests ({requests.length})</h3>
          {requests.map(req => (
            <FriendRequestItem
              key={req.fromUid}
              request={req}
              onAccept={acceptRequest}
              onDecline={declineRequest}
            />
          ))}
        </section>
      )}

      <section className="friends-section">
        <h3>My Friends ({friends.length})</h3>
        <FriendsList friends={friends} myUid={user?.uid} myNickname={nickname} />
      </section>

      <section className="friends-section">
        <div className="section-header-with-action">
          <h3>Group Rooms ({groups.length})</h3>
          <div className="room-actions">
            <button className="btn btn-secondary btn-sm" onClick={() => setShowJoinRoom(true)} type="button">
              Join Room
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreateRoom(true)} type="button">
              Create Room
            </button>
          </div>
        </div>
        {groups.length === 0 && (
          <p className="friends-empty-text">No rooms yet. Create one or join with a code!</p>
        )}
        {groups.map(g => (
          <GroupListItem key={g.id} group={g} onClick={() => navigate(`/group/${g.id}`)} />
        ))}
      </section>

      {showAddModal && (
        <AddFriendModal onAdd={addByCode} onClose={() => setShowAddModal(false)} />
      )}

      {showCreateRoom && (
        <CreateGroupModal
          onCreate={createGroup}
          onClose={() => setShowCreateRoom(false)}
        />
      )}

      {showJoinRoom && (
        <JoinGroupModal
          onJoin={handleJoinRoom}
          onClose={() => setShowJoinRoom(false)}
        />
      )}
    </div>
  );
}

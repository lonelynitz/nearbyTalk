import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import useGeolocation from '../hooks/useGeolocation';
import useMatchmaking from '../hooks/useMatchmaking';
import NicknameAvatar from '../components/shared/NicknameAvatar';
import RadiusSelector from '../components/shared/RadiusSelector';
import SearchingOverlay from '../components/lobby/SearchingOverlay';
import ThemeToggle from '../components/shared/ThemeToggle';

export default function LobbyPage() {
  const { user, nickname, friendCode } = useContext(AuthContext);
  const navigate = useNavigate();
  const { position, geohash, error: geoError, loading: geoLoading } = useGeolocation();
  const [radius, setRadius] = useState(50);

  const { status, matchData, startSearching, stopSearching } = useMatchmaking({
    uid: user?.uid,
    nickname,
    position,
    geohash,
    radiusKm: radius,
  });

  function handleFind() {
    if (!position) return;
    startSearching();
  }

  function handleCancel() {
    stopSearching();
  }

  // Navigate to chat when matched
  useEffect(() => {
    if (status === 'matched' && matchData) {
      const { roomId, peerUid, peerNickname } = matchData;
      navigate(`/chat/${roomId}?peer=${peerUid}&nick=${encodeURIComponent(peerNickname)}`);
    }
  }, [status, matchData, navigate]);

  return (
    <div className="lobby-page">
      <header className="lobby-header">
        <h1>NearbyTalk</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <ThemeToggle />
          <button className="btn-icon" onClick={() => navigate('/friends')} title="Friends">
            👥
          </button>
        </div>
      </header>

      <div className="lobby-card">
        <div className="lobby-identity">
          <NicknameAvatar nickname={nickname} size={64} />
          <div>
            <h2>{nickname}</h2>
            <p className="friend-code-text">{friendCode}</p>
          </div>
        </div>

        <div className="lobby-location">
          {geoLoading && <p className="location-status">Getting your location...</p>}
          {geoError && <p className="location-status error">Location access denied. Please enable GPS.</p>}
          {position && !geoError && (
            <p className="location-status success">📍 Location acquired</p>
          )}
        </div>

        <RadiusSelector value={radius} onChange={setRadius} />

        <button
          className="btn btn-primary btn-find"
          onClick={handleFind}
          disabled={!position || geoLoading || status === 'searching'}
        >
          {status === 'searching' ? 'Searching...' : 'Find a Stranger'}
        </button>
      </div>

      {status === 'searching' && (
        <SearchingOverlay onCancel={handleCancel} />
      )}
    </div>
  );
}

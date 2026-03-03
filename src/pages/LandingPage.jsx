import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import useGroups from '../hooks/useGroups';
import LandingHero from '../components/landing/LandingHero';
import CreateGroupModal from '../components/group/CreateGroupModal';
import JoinGroupModal from '../components/group/JoinGroupModal';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, nickname } = useContext(AuthContext);
  const { create, joinByCode } = useGroups(user?.uid, nickname);

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  async function handleJoinByCode(code) {
    const result = await joinByCode(code);
    if (result?.error) return result;
    if (result?.groupId) {
      setShowJoin(false);
      navigate(`/group/${result.groupId}`);
    }
  }

  return (
    <div className="landing-page">
      <LandingHero
        onStart={() => navigate('/lobby')}
        onStartRoom={() => setShowCreate(true)}
        onJoinRoom={() => setShowJoin(true)}
      />

      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>No Sign-Up Needed</h3>
            <p>You get a random nickname automatically. No email, no password, no hassle.</p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h3>Find Nearby Strangers</h3>
            <p>Set your range and we'll match you with someone nearby using GPS.</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h3>Chat Securely</h3>
            <p>All messages are end-to-end encrypted. Not even we can read them.</p>
          </div>
          <div className="step-card">
            <div className="step-number">4</div>
            <h3>Voice & Video Calls</h3>
            <p>Upgrade to audio or video calls directly in the chat. Peer-to-peer, no servers.</p>
          </div>
        </div>
      </section>

      <section className="features-section">
        <h2>Features</h2>
        <div className="features-grid">
          <div className="feature-item">
            <span className="feature-icon">🔒</span>
            <h4>E2E Encryption</h4>
            <p>AES-256 encryption on every message</p>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📍</span>
            <h4>GPS Matching</h4>
            <p>Find people within your chosen radius</p>
          </div>
          <div className="feature-item">
            <span className="feature-icon">👤</span>
            <h4>Anonymous</h4>
            <p>No account, no tracking, no data stored</p>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🎙️</span>
            <h4>Voice & Video</h4>
            <p>WebRTC peer-to-peer calls</p>
          </div>
          <div className="feature-item">
            <span className="feature-icon">👥</span>
            <h4>Friend System</h4>
            <p>Add friends by code and chat anytime</p>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🛡️</span>
            <h4>Safety First</h4>
            <p>Report, block, and profanity filters</p>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <p>NearbyTalk &mdash; Anonymous. Encrypted. Nearby.</p>
      </footer>

      {showCreate && (
        <CreateGroupModal onCreate={create} onClose={() => setShowCreate(false)} />
      )}
      {showJoin && (
        <JoinGroupModal onJoin={handleJoinByCode} onClose={() => setShowJoin(false)} />
      )}
    </div>
  );
}

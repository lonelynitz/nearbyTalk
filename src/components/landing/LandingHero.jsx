import ThemeToggle from '../shared/ThemeToggle';

export default function LandingHero({ onStart, onStartRoom, onJoinRoom }) {
  return (
    <div className="landing-hero">
      <div className="landing-theme-toggle">
        <ThemeToggle />
      </div>
      <h1>NearbyTalk</h1>
      <p className="tagline">Chat with strangers nearby. Anonymous. Encrypted. Safe.</p>
      <div className="hero-buttons">
        <button className="btn-start" onClick={onStart}>
          Start Chatting
        </button>
        <button className="btn-start btn-start-room" onClick={onStartRoom}>
          Start Room
        </button>
      </div>
      <button className="btn-join-room" onClick={onJoinRoom}>
        Have a room code? Join Room
      </button>
    </div>
  );
}

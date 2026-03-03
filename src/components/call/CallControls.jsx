export default function CallControls({ muted, videoOff, callType, onToggleMute, onToggleVideo, onEnd }) {
  return (
    <div className="call-controls">
      <button
        className={`call-btn call-btn-mute ${muted ? 'active' : ''}`}
        onClick={onToggleMute}
        type="button"
      >
        {muted ? '🔇' : '🎙️'}
      </button>
      {callType === 'video' && (
        <button
          className={`call-btn call-btn-video ${videoOff ? 'active' : ''}`}
          onClick={onToggleVideo}
          type="button"
        >
          {videoOff ? '📷' : '📹'}
        </button>
      )}
      <button className="call-btn call-btn-end" onClick={onEnd} type="button">
        📞
      </button>
    </div>
  );
}

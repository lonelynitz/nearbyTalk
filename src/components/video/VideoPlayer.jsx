import { useState, useRef, useEffect, useCallback } from 'react';
import { SUPPORTED_VIDEO_TYPES } from '../../utils/constants';

export default function VideoPlayer({
  syncState,
  isBroadcaster,
  onStartBroadcast,
  onStopBroadcast,
  onPlay,
  onPause,
  onSeek,
  incomingVideoStream,
}) {
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [fileName, setFileName] = useState('');
  const ignoreEventsRef = useRef(false);

  // Broadcaster: handle file selection
  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!SUPPORTED_VIDEO_TYPES.includes(file.type)) {
      alert('Unsupported video format. Use MP4, WebM, or OGG.');
      return;
    }
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setFileName(file.name);
  }

  // Broadcaster: video is loaded, start broadcasting
  function handleVideoLoaded() {
    if (!isBroadcaster || !videoRef.current) return;
    onStartBroadcast(videoRef.current, fileName);
  }

  // Broadcaster: sync controls
  function handlePlay() {
    if (isBroadcaster && videoRef.current) {
      onPlay(videoRef.current.currentTime);
    }
  }

  function handlePause() {
    if (isBroadcaster && videoRef.current) {
      onPause(videoRef.current.currentTime);
    }
  }

  function handleSeeked() {
    if (isBroadcaster && videoRef.current) {
      onSeek(videoRef.current.currentTime);
    }
  }

  function handleStop() {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(null);
    setFileName('');
    onStopBroadcast();
  }

  // Viewer: apply sync state from broadcaster
  useEffect(() => {
    if (isBroadcaster || !syncState || !videoRef.current) return;
    ignoreEventsRef.current = true;

    const video = videoRef.current;
    const timeDiff = Math.abs(video.currentTime - syncState.currentTime);

    if (timeDiff > 1) {
      video.currentTime = syncState.currentTime;
    }

    if (syncState.state === 'playing' && video.paused) {
      video.play().catch(() => {});
    } else if (syncState.state === 'paused' && !video.paused) {
      video.pause();
    }

    setTimeout(() => { ignoreEventsRef.current = false; }, 300);
  }, [syncState?.version, isBroadcaster]);

  // Viewer: set incoming stream as source
  useEffect(() => {
    if (!isBroadcaster && incomingVideoStream && videoRef.current) {
      videoRef.current.srcObject = incomingVideoStream;
    }
  }, [incomingVideoStream, isBroadcaster]);

  // No active sync and not picking a file — show picker button
  if (!syncState && !videoUrl) {
    return (
      <div className="video-picker-area">
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm,video/ogg"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <button
          className="btn btn-primary video-picker-btn"
          onClick={() => fileInputRef.current?.click()}
          type="button"
        >
          🎬 Watch Together
        </button>
      </div>
    );
  }

  return (
    <div className="video-player-container">
      <div className="video-sync-banner">
        <span>🎬 {isBroadcaster ? `Sharing: ${fileName || syncState?.fileName}` : `Watching: ${syncState?.fileName || 'Video'}`}</span>
        {isBroadcaster && (
          <button className="btn-stop-video" onClick={handleStop} type="button">Stop</button>
        )}
      </div>

      <div className="video-player-wrapper">
        <video
          ref={videoRef}
          src={isBroadcaster ? videoUrl : undefined}
          controls={isBroadcaster}
          autoPlay={!isBroadcaster}
          playsInline
          className="shared-video"
          onLoadedData={handleVideoLoaded}
          onPlay={isBroadcaster ? handlePlay : undefined}
          onPause={isBroadcaster ? handlePause : undefined}
          onSeeked={isBroadcaster ? handleSeeked : undefined}
        />
      </div>

      {!isBroadcaster && syncState && (
        <div className="video-viewer-controls">
          <span className="sync-indicator">
            {syncState.state === 'playing' ? '▶ Playing' : '⏸ Paused'}
          </span>
        </div>
      )}
    </div>
  );
}

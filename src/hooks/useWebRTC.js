import { useState, useRef, useEffect, useCallback } from 'react';
import { ICE_SERVERS } from '../utils/constants';
import { createCall, setOffer, setAnswer, addCandidate, listenForCandidates, listenForCall, endCall as endCallService } from '../services/callService';

export default function useWebRTC({ roomId, uid, peerUid, callType }) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callStatus, setCallStatus] = useState('idle');
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const unsubs = useRef([]);

  // Deterministic callId — same for both peers
  const callId = [uid, peerUid].sort().join('_') + '_' + roomId;
  const isInitiator = uid < peerUid;

  const startCall = useCallback(async () => {
    if (!roomId || !uid) return;
    setCallStatus('getting-media');

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: callType === 'video' ? { facingMode: 'user', width: 640, height: 480 } : false,
    });
    localStreamRef.current = stream;
    setLocalStream(stream);

    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    const remote = new MediaStream();
    setRemoteStream(remote);
    pc.ontrack = (e) => e.streams[0].getTracks().forEach(t => remote.addTrack(t));

    pc.oniceconnectionstatechange = () => {
      const s = pc.iceConnectionState;
      if (s === 'connected' || s === 'completed') setCallStatus('connected');
      if (s === 'disconnected' || s === 'failed') setCallStatus('ended');
    };

    const candCol = isInitiator ? 'offerCandidates' : 'answerCandidates';
    pc.onicecandidate = (e) => {
      if (e.candidate) addCandidate(callId, candCol, e.candidate);
    };

    setCallStatus('signaling');

    if (isInitiator) {
      await createCall(callId, uid, peerUid, callType);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await setOffer(callId, offer);

      unsubs.current.push(listenForCall(callId, (data) => {
        if (data.answer && !pc.currentRemoteDescription) {
          pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        }
      }));
      unsubs.current.push(listenForCandidates(callId, 'answerCandidates', (c) => {
        pc.addIceCandidate(new RTCIceCandidate(c));
      }));
    } else {
      unsubs.current.push(listenForCall(callId, async (data) => {
        if (data.offer && !pc.currentRemoteDescription) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await setAnswer(callId, answer);
        }
      }));
      unsubs.current.push(listenForCandidates(callId, 'offerCandidates', (c) => {
        pc.addIceCandidate(new RTCIceCandidate(c));
      }));
    }
  }, [roomId, uid, peerUid, callType, callId, isInitiator]);

  const endCall = useCallback(async () => {
    pcRef.current?.close();
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    unsubs.current.forEach(u => u());
    unsubs.current = [];
    setCallStatus('ended');
  }, []);

  useEffect(() => {
    startCall();
    return () => {
      pcRef.current?.close();
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      unsubs.current.forEach(u => u());
    };
  }, []);

  return { localStream, remoteStream, callStatus, startCall, endCall };
}

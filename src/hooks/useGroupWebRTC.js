import { useState, useRef, useEffect, useCallback } from 'react';
import { ICE_SERVERS } from '../utils/constants';
import {
  createGroupCall, joinGroupCall, leaveGroupCall, listenForGroupCall,
  setGroupOffer, setGroupAnswer, addGroupCandidate, listenForGroupCandidates,
  listenForGroupSignaling,
} from '../services/groupCallService';

export default function useGroupWebRTC({ callId, groupId, uid, callType, memberUids }) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [callStatus, setCallStatus] = useState('idle');
  const pcsRef = useRef(new Map()); // Map<peerUid, RTCPeerConnection>
  const localStreamRef = useRef(null);
  const unsubs = useRef([]);

  const connectToPeer = useCallback(async (peerUid, stream) => {
    if (!uid || !peerUid || pcsRef.current.has(peerUid)) return;

    const isInitiator = uid < peerUid;
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcsRef.current.set(peerUid, pc);

    // Add local tracks
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    // Handle remote tracks
    const remoteStream = new MediaStream();
    pc.ontrack = (e) => {
      e.streams[0].getTracks().forEach(t => remoteStream.addTrack(t));
      setRemoteStreams(prev => new Map(prev).set(peerUid, remoteStream));
    };

    // ICE candidates
    pc.onicecandidate = (e) => {
      if (e.candidate) addGroupCandidate(callId, uid, peerUid, uid, e.candidate);
    };

    pc.oniceconnectionstatechange = () => {
      const s = pc.iceConnectionState;
      if (s === 'disconnected' || s === 'failed') {
        setRemoteStreams(prev => {
          const next = new Map(prev);
          next.delete(peerUid);
          return next;
        });
      }
    };

    // Listen for candidates from peer
    unsubs.current.push(
      listenForGroupCandidates(callId, uid, peerUid, uid, (c) => {
        pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
      })
    );

    // Signaling
    if (isInitiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await setGroupOffer(callId, uid, peerUid, offer);

      unsubs.current.push(
        listenForGroupSignaling(callId, uid, peerUid, (data) => {
          if (data.answer && !pc.currentRemoteDescription) {
            pc.setRemoteDescription(new RTCSessionDescription(data.answer)).catch(() => {});
          }
        })
      );
    } else {
      unsubs.current.push(
        listenForGroupSignaling(callId, uid, peerUid, async (data) => {
          if (data.offer && !pc.currentRemoteDescription) {
            await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await setGroupAnswer(callId, uid, peerUid, answer);
          }
        })
      );
    }
  }, [callId, uid]);

  useEffect(() => {
    if (!callId || !uid || !memberUids?.length) return;

    async function init() {
      setCallStatus('getting-media');

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video' ? { facingMode: 'user', width: 640, height: 480 } : false,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      setCallStatus('connecting');

      // Join the call
      await joinGroupCall(callId, uid);

      // Connect to all existing members
      for (const peerUid of memberUids) {
        if (peerUid !== uid) {
          await connectToPeer(peerUid, stream);
        }
      }

      // Listen for new participants joining
      const unsubCall = listenForGroupCall(callId, (callData) => {
        if (callData.status === 'ended') {
          setCallStatus('ended');
          return;
        }
        // Connect to any new participants
        for (const peerUid of callData.participants) {
          if (peerUid !== uid && !pcsRef.current.has(peerUid)) {
            connectToPeer(peerUid, localStreamRef.current);
          }
        }
        if (callData.participants.length > 1) setCallStatus('connected');
      });
      unsubs.current.push(unsubCall);
    }

    init();

    return () => {
      pcsRef.current.forEach(pc => pc.close());
      pcsRef.current.clear();
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      unsubs.current.forEach(u => u());
      unsubs.current = [];
    };
  }, [callId, uid, callType]);

  const endCall = useCallback(async () => {
    pcsRef.current.forEach(pc => pc.close());
    pcsRef.current.clear();
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    unsubs.current.forEach(u => u());
    unsubs.current = [];
    setCallStatus('ended');
    if (callId) await leaveGroupCall(callId, uid);
  }, [callId, uid]);

  return { localStream, remoteStreams, callStatus, endCall };
}

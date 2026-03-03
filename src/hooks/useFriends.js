import { useState, useEffect, useCallback } from 'react';
import {
  listenForFriends, listenForFriendRequests,
  sendFriendRequest, acceptFriendRequest, declineFriendRequest,
  lookupFriendCode, registerFriendCode, removeFriend,
} from '../services/friendService';

export default function useFriends(uid, nickname, friendCode) {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) { setLoading(false); return; }

    const unsub1 = listenForFriends(uid, (list) => {
      setFriends(list);
      setLoading(false);
    });
    const unsub2 = listenForFriendRequests(uid, setRequests);

    if (friendCode && nickname) {
      registerFriendCode(friendCode, uid, nickname);
    }

    return () => { unsub1(); unsub2(); };
  }, [uid, nickname, friendCode]);

  const addByCode = useCallback(async (code) => {
    const found = await lookupFriendCode(code);
    if (!found) return { error: 'Friend code not found' };
    if (found.uid === uid) return { error: 'That is your own code' };
    await sendFriendRequest(uid, nickname, friendCode, found.uid);
    return { success: true, nickname: found.nickname };
  }, [uid, nickname, friendCode]);

  const acceptRequest = useCallback(async (request) => {
    await acceptFriendRequest(uid, nickname, friendCode, request.fromUid, request.fromNickname, request.fromCode);
  }, [uid, nickname, friendCode]);

  const declineRequest = useCallback(async (request) => {
    await declineFriendRequest(uid, request.fromUid);
  }, [uid]);

  return { friends, requests, loading, addByCode, acceptRequest, declineRequest };
}

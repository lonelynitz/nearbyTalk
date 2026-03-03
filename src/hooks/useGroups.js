import { useState, useEffect, useCallback } from 'react';
import {
  createGroup, joinGroupByCode, listenForGroups, leaveGroup, kickMember,
} from '../services/groupService';

export default function useGroups(uid, nickname) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) { setLoading(false); return; }

    const unsub = listenForGroups(uid, (list) => {
      setGroups(list);
      setLoading(false);
    });

    return () => unsub();
  }, [uid]);

  const create = useCallback(async (groupName) => {
    return createGroup(uid, nickname, groupName);
  }, [uid, nickname]);

  const joinByCode = useCallback(async (roomCode) => {
    return joinGroupByCode(uid, nickname, roomCode);
  }, [uid, nickname]);

  const leave = useCallback(async (groupId) => {
    await leaveGroup(uid, groupId);
  }, [uid]);

  const kick = useCallback(async (targetUid, groupId) => {
    return kickMember(uid, targetUid, groupId);
  }, [uid]);

  return { groups, loading, create, joinByCode, leave, kick };
}

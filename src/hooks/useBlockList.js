import { useState, useEffect, useCallback } from 'react';
import { getBlockedLocal, blockUser as blockUserService, unblockUser as unblockUserService, syncBlockList } from '../services/blockService';

export default function useBlockList(myUid) {
  const [blocked, setBlocked] = useState([]);

  useEffect(() => {
    if (!myUid) return;
    syncBlockList(myUid).then(setBlocked);
  }, [myUid]);

  const blockUser = useCallback(async (uid, nickname) => {
    await blockUserService(myUid, uid);
    setBlocked(getBlockedLocal());
  }, [myUid]);

  const unblockUser = useCallback(async (uid) => {
    await unblockUserService(myUid, uid);
    setBlocked(getBlockedLocal());
  }, [myUid]);

  return { blocked, blockUser, unblockUser };
}

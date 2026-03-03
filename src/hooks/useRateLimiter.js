import { useRef, useCallback } from 'react';
import { createRateLimiter } from '../utils/rateLimiter';

export default function useRateLimiter(name, maxActions, windowMs) {
  const limiterRef = useRef(createRateLimiter(maxActions, windowMs));

  const checkLimit = useCallback(() => {
    const ok = limiterRef.current.canPerform();
    if (ok) limiterRef.current.record();
    return ok;
  }, []);

  return { checkLimit };
}

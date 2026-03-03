export function createRateLimiter(maxActions, windowMs) {
  const timestamps = [];

  function canPerform() {
    const now = Date.now();
    while (timestamps.length > 0 && timestamps[0] <= now - windowMs) {
      timestamps.shift();
    }
    return timestamps.length < maxActions;
  }

  function record() {
    timestamps.push(Date.now());
  }

  function remaining() {
    const now = Date.now();
    while (timestamps.length > 0 && timestamps[0] <= now - windowMs) {
      timestamps.shift();
    }
    return maxActions - timestamps.length;
  }

  return { canPerform, record, remaining };
}

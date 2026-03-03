const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

export function encode(lat, lng, precision = 5) {
  let latRange = [-90, 90];
  let lngRange = [-180, 180];
  let hash = '';
  let bit = 0;
  let ch = 0;
  let isLng = true;

  while (hash.length < precision) {
    const range = isLng ? lngRange : latRange;
    const val = isLng ? lng : lat;
    const mid = (range[0] + range[1]) / 2;

    if (val >= mid) {
      ch |= (1 << (4 - bit));
      range[0] = mid;
    } else {
      range[1] = mid;
    }

    isLng = !isLng;
    bit++;

    if (bit === 5) {
      hash += BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }
  return hash;
}

export function decode(hash) {
  let latRange = [-90, 90];
  let lngRange = [-180, 180];
  let isLng = true;

  for (const c of hash) {
    const idx = BASE32.indexOf(c);
    for (let bit = 4; bit >= 0; bit--) {
      const range = isLng ? lngRange : latRange;
      const mid = (range[0] + range[1]) / 2;
      if ((idx >> bit) & 1) {
        range[0] = mid;
      } else {
        range[1] = mid;
      }
      isLng = !isLng;
    }
  }

  return {
    lat: (latRange[0] + latRange[1]) / 2,
    lng: (lngRange[0] + lngRange[1]) / 2,
  };
}

export function neighbors(hash) {
  const { lat, lng } = decode(hash);
  const precision = hash.length;
  const latErr = 180 / Math.pow(2, Math.ceil(precision * 5 / 2));
  const lngErr = 360 / Math.pow(2, Math.floor(precision * 5 / 2));

  const deltas = [
    [-latErr, -lngErr], [-latErr, 0], [-latErr, lngErr],
    [0, -lngErr],                      [0, lngErr],
    [latErr, -lngErr],  [latErr, 0],   [latErr, lngErr],
  ];

  return deltas.map(([dLat, dLng]) =>
    encode(lat + dLat, lng + dLng, precision)
  );
}

export function distance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2))
    * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

export function getPrecisionForRadius(radiusKm) {
  if (radiusKm <= 10) return 5;
  return 4;
}

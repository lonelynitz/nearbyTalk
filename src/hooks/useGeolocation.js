import { useState, useEffect } from 'react';
import { encode, getPrecisionForRadius } from '../utils/geohash';

export default function useGeolocation() {
  const [position, setPosition] = useState(null);
  const [geohash, setGeohash] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const hash = encode(latitude, longitude, getPrecisionForRadius(10));
        setPosition({ lat: latitude, lng: longitude });
        setGeohash(hash);
        setLoading(false);
      },
      (err) => {
        switch (err.code) {
          case 1: setError('Location permission denied. Please allow GPS access.'); break;
          case 2: setError('Location unavailable. Try again.'); break;
          case 3: setError('Location request timed out. Try again.'); break;
          default: setError('Failed to get location.');
        }
        setLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  return { position, geohash, error, loading };
}

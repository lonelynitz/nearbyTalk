import { useState, useEffect } from 'react';
import { signInAnonymously, onAuthChange } from '../services/authService';
import { generateNickname, generateFriendCode } from '../utils/nicknameGenerator';

const NICK_KEY = 'nearbytalk_nickname';
const CODE_KEY = 'nearbytalk_friendcode';

export function useAnonymousAuth() {
  const [user, setUser] = useState(null);
  const [nickname, setNickname] = useState(null);
  const [friendCode, setFriendCode] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        let nick = localStorage.getItem(NICK_KEY);
        let code = localStorage.getItem(CODE_KEY);
        if (!nick) {
          nick = generateNickname();
          localStorage.setItem(NICK_KEY, nick);
        }
        if (!code) {
          code = generateFriendCode(nick, firebaseUser.uid);
          localStorage.setItem(CODE_KEY, code);
        }
        setNickname(nick);
        setFriendCode(code);
      } else {
        try {
          await signInAnonymously();
        } catch (err) {
          console.error('Anonymous auth failed:', err);
        }
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { user, nickname, friendCode, loading };
}

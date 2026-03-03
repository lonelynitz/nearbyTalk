import { createContext } from 'react';
import { useAnonymousAuth } from '../hooks/useAnonymousAuth';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const auth = useAnonymousAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

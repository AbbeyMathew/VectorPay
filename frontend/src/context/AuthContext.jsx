import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/endpoints';
import { setUnauthorizedHandler } from '../api/client';

const AuthContext = createContext(null);

export const homePathFor = (user) => (user?.isAdmin ? '/admin' : '/dashboard');

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready'

  useEffect(() => {
    let active = true;
    // Any 401 from the API (expired session, password changed elsewhere) signs the UI out.
    setUnauthorizedHandler(() => setUser(null));

    authApi
      .me()
      .then((res) => active && setUser(res.data.user))
      .catch(() => {})
      .finally(() => active && setStatus('ready'));

    return () => { active = false; };
  }, []);

  const signIn = useCallback(async (credentials) => {
    const res = await authApi.login(credentials);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const signUp = useCallback(async (details) => {
    const res = await authApi.register(details);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, status, signIn, signUp, signOut }),
    [user, status, signIn, signUp, signOut]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

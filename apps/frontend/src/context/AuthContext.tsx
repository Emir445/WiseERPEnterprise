import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';
import { authApi, sessionStore } from '../lib/api';
import type { SessionUser } from '../lib/types';

type AuthContextValue = {
  user: SessionUser | null;
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
  can(permission?: string): boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<SessionUser | null>(() => sessionStore.user());
  const value = useMemo<AuthContextValue>(() => ({
    user,
    async login(email, password) {
      const auth = await authApi.login(email, password);
      sessionStore.save(auth);
      setUser(auth.user);
    },
    async logout() {
      await authApi.logout();
      setUser(null);
    },
    can(permission) {
      if (!permission) return true;
      return !!user?.permissions?.includes(permission);
    },
  }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider não configurado.');
  return value;
}

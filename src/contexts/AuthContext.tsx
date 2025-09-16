import React, { createContext, useEffect, useMemo, useState } from 'react';
import { getToken, parseJwt } from '@utils/auth';

export type Role = 'admin' | 'user';

export interface AuthUser {
  role: Role;
  phone?: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAdmin: boolean;
  login: (phone: string, code: string) => void;
  loginAsAdmin: () => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

function base64UrlEncode(obj: Record<string, any>): string {
  const json = JSON.stringify(obj);
  const base64 = btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return base64;
}

function createFakeJwt(payload: Record<string, any>): string {
  const header = { alg: 'none', typ: 'JWT' };
  const encHeader = base64UrlEncode(header);
  const encPayload = base64UrlEncode(payload);
  // Signature omitted for demo ("none")
  return `${encHeader}.${encPayload}.`;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  // Initialize from localStorage
  useEffect(() => {
    const t = getToken();
    if (t) {
      setToken(t);
      const payload = parseJwt(t);
      if (payload?.role) {
        setUser({ role: payload.role as Role, phone: payload?.phone });
      }
    }
  }, []);

  const isAdmin = useMemo(() => user?.role === 'admin', [user]);

  const login = (phone: string, code: string) => {
    // For demo: accept any phone/code; assign role user
    const fake = createFakeJwt({ role: 'user', phone, code });
    localStorage.setItem('token', fake);
    setToken(fake);
    setUser({ role: 'user', phone });
  };

  const loginAsAdmin = () => {
    const fake = createFakeJwt({ role: 'admin', phone: 'admin' });
    localStorage.setItem('token', fake);
    setToken(fake);
    setUser({ role: 'admin', phone: 'admin' });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value: AuthContextValue = {
    user,
    token,
    isAdmin,
    login,
    loginAsAdmin,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

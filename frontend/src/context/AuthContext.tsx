import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole } from '../types';
import { loginApi, getMeApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  quickDemoLogin: (role: UserRole) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('sih_auth_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function checkAuth() {
      const storedToken = localStorage.getItem('sih_auth_token');
      if (storedToken) {
        try {
          const profile = await getMeApi();
          setUser(profile);
          setToken(storedToken);
        } catch {
          localStorage.removeItem('sih_auth_token');
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    }
    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await loginApi(username, password);
      localStorage.setItem('sih_auth_token', data.access_token);
      setToken(data.access_token);
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  };

  const quickDemoLogin = async (role: UserRole) => {
    if (role === 'OFFICER') {
      await login('officer', 'officer123');
    } else if (role === 'SUPERVISOR') {
      await login('supervisor', 'super123');
    } else if (role === 'ADMIN') {
      await login('admin', 'admin123');
    }
  };

  const logout = () => {
    localStorage.removeItem('sih_auth_token');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, quickDemoLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

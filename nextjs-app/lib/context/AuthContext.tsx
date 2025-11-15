'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { authStorage } from '@/lib/storage/auth';
import { Octokit } from '@octokit/rest';

interface AuthContextType {
  token: string | null;
  user: any | null;
  login: (token: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load from localStorage on mount
    const savedToken = authStorage.getToken();
    const savedUser = authStorage.getUser();

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(savedUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (newToken: string) => {
    try {
      // Verify token by fetching user data
      const octokit = new Octokit({ auth: newToken });
      const { data: userData } = await octokit.rest.users.getAuthenticated();

      setToken(newToken);
      setUser(userData);
      authStorage.setToken(newToken);
      authStorage.setUser(userData);
    } catch (error) {
      throw new Error('Invalid token');
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    authStorage.removeToken();
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

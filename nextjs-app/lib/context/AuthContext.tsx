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

  console.log('AuthProvider - Current state:', { token: !!token, user, isLoading });

  useEffect(() => {
    console.log('AuthProvider - Checking localStorage for saved auth');
    // Load from localStorage on mount
    const savedToken = authStorage.getToken();
    const savedUser = authStorage.getUser();

    console.log('AuthProvider - Found in localStorage:', { token: !!savedToken, user: savedUser });

    if (savedToken && savedUser) {
      console.log('AuthProvider - Setting auth from localStorage');
      setToken(savedToken);
      setUser(savedUser);
    }
    console.log('AuthProvider - Setting isLoading to false');
    setIsLoading(false);
  }, []);

  const login = async (newToken: string) => {
    console.log('AuthProvider - Login called with token');
    try {
      // Verify token by fetching user data
      const octokit = new Octokit({ auth: newToken });
      const { data: userData } = await octokit.rest.users.getAuthenticated();
      
      console.log('AuthProvider - User authenticated:', userData);

      setToken(newToken);
      setUser(userData);
      authStorage.setToken(newToken);
      authStorage.setUser(userData);
      
      console.log('AuthProvider - Login successful, auth saved');
    } catch (error) {
      console.error('AuthProvider - Login failed:', error);
      throw new Error('Invalid token');
    }
  };

  const logout = () => {
    console.log('AuthProvider - Logout called');
    setToken(null);
    setUser(null);
    authStorage.removeToken();
    console.log('AuthProvider - Logout complete, auth cleared');
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

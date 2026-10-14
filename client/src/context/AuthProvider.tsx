import React, { useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import api from '../services/api';
import { AuthContext } from './AuthContextValue';
import { User } from '../types';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const hasInitialized = useRef<boolean>(false);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const login = useCallback((userData: User, token: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.get('/auth/profile');
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
          }
        } catch (err: any) {
          console.error('Failed to fetch profile:', err);
          if (err.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
          }
        } finally {
          setInitialLoading(false);
          setLoading(false);
        }
      } else {
        setInitialLoading(false);
      }
    };

    if (!hasInitialized.current) {
      hasInitialized.current = true;
      initializeAuth();
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      initialLoading,
      login,
      logout,
      triggerRefresh,
      refreshTrigger
    }}>
      {children}
    </AuthContext.Provider>
  );
};

import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { AuthContext } from './AuthContextValue';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const hasInitialized = useRef(false);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const login = useCallback((userData, token) => {
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
        } catch (err) {
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

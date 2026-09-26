import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/index.ts';
import { authService } from '../services/api.ts';

interface AuthContextType {
  currentUser: User | null;
  role: UserRole | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isManager: boolean;
  isSiteEntry: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('auth_token');
    const activeUserId = localStorage.getItem('active_user_id');

    if (!token && !activeUserId) {
      setCurrentUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await authService.getMe();
      if (data && data.user) {
        setCurrentUser({
          id: data.user.userId,
          username: data.user.username,
          fullName: data.user.fullName,
          role: data.user.role,
        });
      }
    } catch (err) {
      console.warn('Could not restore user session:', err);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('active_user_id');
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (username: string, password: string) => {
    const res = await authService.login(username, password);
    localStorage.setItem('auth_token', res.token);
    localStorage.setItem('active_user_id', String(res.user.userId));
    setCurrentUser({
      id: res.user.userId,
      username: res.user.username,
      fullName: res.user.fullName,
      role: res.user.role,
    });
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('active_user_id');
    setCurrentUser(null);
  };

  const role = currentUser?.role || null;
  const isAdmin = role === 'admin';
  const isManager = role === 'manager' || role === 'admin';
  const isSiteEntry = role === 'site_entry';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        loading,
        login,
        logout,
        isAdmin,
        isManager,
        isSiteEntry,
      }}
    >
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

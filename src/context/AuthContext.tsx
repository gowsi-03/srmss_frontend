import React, { createContext, useState, useEffect, useContext } from 'react';
import apiClient from '../api/apiClient';

export type UserRole = 'ADMIN' | 'SUPERVISOR' | 'OPERATOR';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role?: UserRole) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Check if token exists on load and fetch user info
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('srmss_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await apiClient.get('/auth/me');
        setUser(response.data);
      } catch (error) {
        console.error('Auto-login failed:', error);
        localStorage.removeItem('srmss_token');
        localStorage.removeItem('srmss_user');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { accessToken, user: loggedUser } = response.data;
      
      localStorage.setItem('srmss_token', accessToken);
      localStorage.setItem('srmss_user', JSON.stringify(loggedUser));
      setUser(loggedUser);
    } catch (error) {
      localStorage.removeItem('srmss_token');
      localStorage.removeItem('srmss_user');
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string, role: UserRole = 'OPERATOR') => {
    setLoading(true);
    try {
      await apiClient.post('/auth/register', { email, password, name, role });
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('srmss_token');
    localStorage.removeItem('srmss_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

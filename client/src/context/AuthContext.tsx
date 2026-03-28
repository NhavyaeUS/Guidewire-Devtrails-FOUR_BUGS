import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

interface Worker {
  id: string;
  name: string;
  phone: string;
  city: string;
  zone: string;
  platform: string;
  avgDailyHours: number;
  avgDailyEarnings: number;
  riskScore: number;
  riskTier: string;
  isAdmin: boolean;
}

interface AuthContextType {
  worker: Worker | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, worker: Worker) => void;
  logout: () => void;
  updateWorker: (worker: Worker) => void;
  setAdminPassword: (password: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [worker, setWorker] = useState<Worker | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await api.get('/workers/profile');
          setWorker(res.worker);
        } catch (error) {
          console.error('Failed to restore session', error);
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [token]);

  const login = (newToken: string, newWorker: Worker) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setWorker(newWorker);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('adminPassword');
    setToken(null);
    setWorker(null);
  };

  const updateWorker = (updatedWorker: Worker) => {
    setWorker(updatedWorker);
  };

  const setAdminPassword = (password: string) => {
    localStorage.setItem('adminPassword', password);
  };

  return (
    <AuthContext.Provider value={{ worker, token, isLoading, login, logout, updateWorker, setAdminPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

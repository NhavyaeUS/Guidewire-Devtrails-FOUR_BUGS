import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  worker: any | null;
  token: string | null;
  login: (token: string, worker: any) => void;
  logout: () => void;
  updateWorker: (worker: any) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [worker, setWorker] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedWorker = localStorage.getItem('worker');

    if (savedToken && savedWorker) {
      setToken(savedToken);
      setWorker(JSON.parse(savedWorker));
    }
    setLoading(false);
  }, []);

  const login = (newToken: string, newWorker: any) => {
    setToken(newToken);
    setWorker(newWorker);
    localStorage.setItem('token', newToken);
    localStorage.setItem('worker', JSON.stringify(newWorker));
  };

  const logout = () => {
    setToken(null);
    setWorker(null);
    localStorage.removeItem('token');
    localStorage.removeItem('worker');
    localStorage.removeItem('adminPassword');
  };

  const updateWorker = (newWorker: any) => {
    setWorker(newWorker);
    localStorage.setItem('worker', JSON.stringify(newWorker));
  };

  return (
    <AuthContext.Provider value={{ worker, token, login, logout, updateWorker, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

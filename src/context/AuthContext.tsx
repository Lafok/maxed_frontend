import { createContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import { User } from '../types';
import api from '../services/api';

interface DecodedToken {
  sub: string;
  // Add other token claims if necessary
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  setUser: (user: User | null) => void;
  login: (newToken: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      api.get<User>('/users/me')
        .then(response => {
          setUser(response.data);
        })
        .catch(error => {
          console.error("Failed to fetch user data on initial load", error);
          localStorage.removeItem('token');
        });
    }
  }, []);

  const login = (newToken: string) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
    api.get<User>('/users/me')
      .then(response => {
        setUser(response.data);
      })
      .catch(error => {
        console.error("Failed to fetch user data on login", error);
        setUser(null);
      });
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ token, user, setUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

import { createContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';

interface User {
  sub: string; // 'sub' (subject) in JWT is the username
}

interface AuthContextType {
  token: string | null;
  user: User | null;
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
      try {
        const decodedUser: User = jwtDecode(storedToken);
        setUser(decodedUser);
      } catch (error) {
        console.error("Failed to decode token on initial load", error);
        // Handle invalid token case, e.g., by logging out
        localStorage.removeItem('token');
      }
    }
  }, []);

  const login = (newToken: string) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
    try {
      const decodedUser: User = jwtDecode(newToken);
      setUser(decodedUser);
    } catch (error) {
      console.error("Failed to decode token on login", error);
      setUser(null);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

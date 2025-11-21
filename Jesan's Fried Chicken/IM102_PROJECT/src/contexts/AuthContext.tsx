// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type UserRole = 'customer' | 'staff' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  token: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<User>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);
export const useAuth = () => useContext(AuthContext);

// ✅ Backend URL (desktop localhost or mobile IP via .env)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/auth';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  // Persist user session
  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [user]);

  // ✅ LOGIN
  const login = async (email: string, password: string, role: UserRole): Promise<User> => {
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Login failed');
      }

      const data = await res.json();
      const loggedInUser: User = { ...data.user, token: data.token };
      setUser(loggedInUser);
      return loggedInUser;
    } catch (err: any) {
      if (err instanceof TypeError) {
        throw new Error('Cannot reach server. Check your network or backend IP.');
      }
      throw err;
    }
  };

  // ✅ LOGOUT
  const logout = async () => {
    if (user) {
      try {
        await fetch(`${API_URL}/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        });
      } catch (err) {
        console.warn('Logout sync failed (offline/mobile) — safe to ignore.');
      }
    }
    setUser(null);
    localStorage.removeItem('user');
  };

  // ✅ REGISTER
  const register = async (name: string, email: string, password: string, role: UserRole) => {
    try {
      const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Registration failed');
      }
    } catch (err: any) {
      if (err instanceof TypeError) {
        throw new Error('Cannot reach server. Check your network or backend IP.');
      }
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

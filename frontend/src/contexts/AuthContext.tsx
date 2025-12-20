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
  loading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<User>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  forgotPassword: (email: string) => Promise<{ message: string }>;
  resetPassword: (email: string, token: string, newPassword: string) => Promise<{ message: string }>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);
export const useAuth = () => useContext(AuthContext);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/auth';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
    setLoading(false);
  }, []);

  // Persist user session
  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [user]);

  // ----------------------
  // LOGIN
  // ----------------------
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

  // ----------------------
  // LOGOUT
  // ----------------------
  const logout = async () => {
    if (user) {
      try {
        await fetch(`${API_URL}/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        });
      } catch {
        console.warn('Logout sync failed (offline/mobile) — safe to ignore.');
      }
    }
    setUser(null);
    localStorage.removeItem('user');
  };

  // ----------------------
  // REGISTER
  // ----------------------
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

  // ----------------------
  // FORGOT PASSWORD
  // ----------------------
  const forgotPassword = async (email: string) => {
    const res = await fetch(`${API_URL}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to send reset email.');
    }
    return res.json();
  };

  // ----------------------
  // RESET PASSWORD
  // ----------------------
  const resetPassword = async (email: string, token: string, newPassword: string) => {
    const res = await fetch(`${API_URL}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, token, newPassword }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to reset password.');
    }
    return res.json();
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, register, forgotPassword, resetPassword }}
    >
      {children}
    </AuthContext.Provider>
  );
};

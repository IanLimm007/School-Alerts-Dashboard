import React, { createContext, useContext, useState } from 'react';
import { User, Role } from '../types';
import { mockUsers } from '../data/mockData';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => { success: boolean; message: string };
  logout: () => void;
  switchRole: (role: Role) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const login = (email: string, password: string) => {
    if (password !== 'password123') {
      return { success: false, message: 'Invalid email or password.' };
    }
    const user = mockUsers.find(u => u.email === email && u.active);
    if (!user) {
      return { success: false, message: 'Account not found or access has been revoked.' };
    }
    setCurrentUser(user);
    return { success: true, message: 'Login successful.' };
  };

  const logout = () => setCurrentUser(null);

  const switchRole = (role: Role) => {
    // For demo: switch to a user of that role
    const user = mockUsers.find(u => u.role === role && u.active);
    if (user) setCurrentUser(user);
  };

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated: !!currentUser, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'student' | 'teacher' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  score: number;
  answeredQuestions: Record<string, { correct: boolean; answeredAt: string }>;
  wazariAnsweredQuestions: Record<string, { correct: boolean; answeredAt: string }>;
  scoreAchievedAt?: string | null;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  updateUserScore: (questionId: number, points: number, correct: boolean) => Promise<void>;
  updateWazariScore: (questionId: number, points: number, correct: boolean) => Promise<void>;
  isAuthenticated: boolean;
  isTeacher: boolean;
  token: string | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!token);

  useEffect(() => {
    if (token) {
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => { if (res.ok) return res.json(); throw new Error('Invalid token'); })
        .then(userData => setUser(userData))
        .catch(() => logout())
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      return true;
    } catch {
      return false;
    }
  };

  const signup = async (name: string, email: string, password: string, role: UserRole): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  const updateUserScore = async (questionId: number, points: number, correct: boolean) => {
    if (!user || !token) return;
    const questionKey = String(questionId);
    setUser(prev => {
      if (!prev) return null;
      return {
        ...prev,
        score: correct ? prev.score + points : prev.score,
        answeredQuestions: {
          ...prev.answeredQuestions,
          [questionKey]: { correct, answeredAt: new Date().toISOString() }
        }
      };
    });
    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ questionId, isCorrect: correct, points })
      });
    } catch (err) {
      console.error('Failed to save progress', err);
    }
  };

  const updateWazariScore = async (questionId: number, points: number, correct: boolean) => {
    if (!user || !token) return;
    const questionKey = String(questionId);
    setUser(prev => {
      if (!prev) return null;
      return {
        ...prev,
        score: correct ? prev.score + points : prev.score,
        wazariAnsweredQuestions: {
          ...prev.wazariAnsweredQuestions,
          [questionKey]: { correct, answeredAt: new Date().toISOString() }
        }
      };
    });
    try {
      await fetch('/api/wazari/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ questionId, isCorrect: correct, points })
      });
    } catch (err) {
      console.error('Failed to save wazari progress', err);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      signup,
      logout,
      updateUserScore,
      updateWazariScore,
      isAuthenticated: !!user,
      isTeacher: user?.role === 'teacher',
      token,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, otpMethod?: string) => Promise<{ userId: string; otpMethod: string; destination: string }>;
  verifyOtp: (userId: string, otp: string) => Promise<void>;
  resendOtp: (userId: string, otpMethod: string) => Promise<void>;
  signup: (name: string, email: string, phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, password: string, otpMethod: string = 'email') => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, otpMethod }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }

    return {
      userId: data.userId,
      otpMethod: data.otpMethod,
      destination: data.destination,
    };
  };

  const verifyOtp = async (userId: string, otp: string) => {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, otp }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'OTP verification failed');
    }

    setUser(data.user);
    // Use replace to prevent back navigation to login after authentication
    router.replace('/dashboard');
  };

  const resendOtp = async (userId: string, otpMethod: string) => {
    const res = await fetch('/api/auth/resend-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, otpMethod }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Failed to resend OTP');
    }
  };

  const signup = async (name: string, email: string, phone: string, password: string) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Signup failed');
    }
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    // Clear browser history to prevent forward navigation back to protected pages
    window.history.replaceState(null, '', '/login');
    router.replace('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, verifyOtp, resendOtp, signup, logout, checkAuth }}>
      {children}
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

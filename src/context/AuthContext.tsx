import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types.ts';
import { useToast } from './ToastContext.tsx';
import { apiFetch, setAuthToken, removeAuthToken, getAuthToken } from '../lib/api.ts';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  signup: (name: string, email: string, password: string, confirmPassword?: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  googleLogin: (payload: { googleId?: string; email: string; name?: string; avatar?: string; credential?: string }) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (updates: { name?: string; phone?: string; address?: string; city?: string; country?: string }) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { showToast } = useToast();

  const refreshUser = useCallback(async () => {
    try {
      const res = await apiFetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          return;
        }
      }
      // If server returned no user or 401
      if (getAuthToken()) {
        removeAuthToken();
      }
      setUser(null);
    } catch (err) {
      console.error('Failed to check authentication status', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Synchronize guest cart upon authentication
  const syncGuestCart = async () => {
    try {
      const storedGuestCart = localStorage.getItem('velour_guest_cart');
      if (storedGuestCart) {
        const guestItems = JSON.parse(storedGuestCart);
        if (Array.isArray(guestItems) && guestItems.length > 0) {
          await apiFetch('/api/cart/merge', {
            method: 'POST',
            body: JSON.stringify({ guestItems })
          });
          localStorage.removeItem('velour_guest_cart');
        }
      }
    } catch (e) {
      console.warn('Failed to merge guest cart', e);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      if (data.token) {
        setAuthToken(data.token);
      }
      setUser(data.user);
      await syncGuestCart();
      showToast(`Welcome back, ${data.user.name}`, 'success');
      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during login' };
    }
  };

  const signup = async (name: string, email: string, password: string, confirmPassword?: string) => {
    try {
      const res = await apiFetch('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, confirmPassword: confirmPassword || password })
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Registration failed' };
      }

      if (data.token) {
        setAuthToken(data.token);
      }
      setUser(data.user);
      await syncGuestCart();
      showToast(`Welcome to VELOUR, ${data.user.name}`, 'success');
      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during registration' };
    }
  };

  const googleLogin = async (payload: { googleId?: string; email: string; name?: string; avatar?: string; credential?: string }) => {
    try {
      const res = await apiFetch('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Google authentication failed' };
      }

      if (data.token) {
        setAuthToken(data.token);
      }
      setUser(data.user);
      await syncGuestCart();
      showToast(`Signed in with Google as ${data.user.name}`, 'success');
      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Google Sign-In connection error' };
    }
  };

  const logout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout error', e);
    }
    removeAuthToken();
    setUser(null);
    showToast('You have been signed out', 'info');
  };

  const updateProfile = async (updates: { name?: string; phone?: string; address?: string; city?: string; country?: string }) => {
    try {
      const res = await apiFetch('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to update profile' };
      }
      setUser(data.user);
      showToast('Profile updated successfully', 'success');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error updating profile' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        signup,
        googleLogin,
        logout,
        refreshUser,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

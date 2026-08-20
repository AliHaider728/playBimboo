"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getAuthToken, removeAuthToken, setAuthToken } from '../services/api';
import { identifyTikTokUser } from '../lib/tiktokPixel';

interface AuthContextType {
  customerProfile: any | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: (mode?: 'login' | 'signup') => void;
  closeAuthModal: () => void;
  authModalMode: 'login' | 'signup';
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customerProfile, setCustomerProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  const refreshProfile = async () => {
    if (!getAuthToken()) {
      setCustomerProfile(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const profile = await api.getMe();
      if (profile && profile.role === 'customer') {
        setCustomerProfile(profile);
        // Fire ttq.identify() so TikTok can match this session to the known user
        identifyTikTokUser({ email: profile.email, phone: profile.phone }).catch(() => {});
      } else if (profile && profile.role !== 'customer') {
        // If an admin logs in, we might not want to treat them as a customer on the storefront,
        // but for now we can just set them if needed, or leave it as is.
        setCustomerProfile(profile);
      } else {
        setCustomerProfile(null);
        removeAuthToken(); // Invalid token
      }
    } catch {
      setCustomerProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
    const handleAuthChange = () => refreshProfile();
    window.addEventListener('pb-auth-changed', handleAuthChange);
    return () => window.removeEventListener('pb-auth-changed', handleAuthChange);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const result = await api.login(email, password);
      if (result && result.token) {
        setAuthToken(result.token);
        await refreshProfile();
        return true;
      }
      return false;
    } catch (err) {
      throw err;
    }
  };

  const logout = async () => {
    removeAuthToken();
    setCustomerProfile(null);
    api.logout().catch(() => {});
  };

  const openAuthModal = (mode: 'login' | 'signup' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        customerProfile,
        isLoggedIn: !!customerProfile,
        isLoading,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        authModalMode,
        login,
        logout,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

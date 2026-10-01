"use client";
import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { trackTikTokCompleteRegistration } from '../../lib/tiktokPixel';
import Link from 'next/link';
import { useRouter, usePathname, useParams } from 'next/navigation';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot-password'>(defaultMode as 'login' | 'signup');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLocked = React.useRef(false);
  
  const { showToast } = useToast();
  const { login } = useAuth();

  // Reset form when opened or mode changed
  useEffect(() => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setMode(defaultMode as 'login' | 'signup');
  }, [isOpen, defaultMode]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  
  const titles = {
    'login': 'Welcome Back!',
    'signup': 'Create an Account',
    'forgot-password': 'Reset Password'
  };

  const subtitles = {
    'login': 'Sign in to access your orders and wishlist.',
    'signup': 'Join PlayBimboo to track orders and save your favorites.',
    'forgot-password': 'Enter your email and we\'ll send you a link to reset your password.'
  };
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'signup') {
      if (password !== confirmPassword) {
        return showToast('Passwords do not match', 'error');
      }
      if (password.length < 8) {
        return showToast('Password must be at least 8 characters', 'error');
      }
    }
    
    if (submitLocked.current) return;
    submitLocked.current = true;
    setIsSubmitting(true);
    try {
      if (mode === 'signup') {
        const result = await api.register(email, password, name);
        if (!result) throw new Error('Could not create your account. Please try again.');
        trackTikTokCompleteRegistration();
        showToast('Account created successfully. Please sign in.', 'success');
        setMode('login');
      } else if (mode === 'forgot-password') {
        const result = await api.forgotPassword(email);
        if (!result) throw new Error('Could not request a reset link. Please try again.');
        showToast('If an account exists, a password reset link has been sent.', 'success');
        setMode('login');
      } else {
        const success = await login(email, password);
        if (success) {
          showToast('Welcome back!', 'success');
          onClose();
        } else {
          showToast('Invalid email or password', 'error');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      submitLocked.current = false;
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 sm:p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="font-heading font-black text-2xl text-slate-900">{titles[mode]}</h2>
              <p className="text-sm text-slate-500 mt-1">{subtitles[mode]}</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 -mr-2 -mt-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-600 text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 transition-colors"
                />
              </div>
            )}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 transition-colors"
              />
            </div>
            
            {mode !== 'forgot-password' && (
              <div>
                <div className="flex justify-between mb-1 items-center">
                  <label className="text-xs font-bold text-slate-700">Password</label>
                  {mode === 'login' && (
                    <button 
                      type="button" 
                      onClick={() => setMode('forgot-password')}
                      className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 transition-colors pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 transition-colors pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-linear-to-r from-rose-500 to-orange-400 hover:from-rose-600 hover:to-orange-500 text-white font-heading font-black text-sm shadow-md shadow-rose-200 disabled:opacity-50 flex items-center justify-center transition-all"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'
                )}
              </button>
            </div>
          </form>

          <div className="text-center pt-2">
            {mode === 'forgot-password' ? (
              <button 
                onClick={() => setMode('login')}
                className="text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors"
              >
                Back to Login
              </button>
            ) : (
              <p className="text-xs text-slate-500 font-medium">
                {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                <button 
                  onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                  className="text-rose-500 hover:text-rose-600 font-bold transition-colors"
                >
                  {mode === 'login' ? 'Sign up' : 'Log in'}
                </button>
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

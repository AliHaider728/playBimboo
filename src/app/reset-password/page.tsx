"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { api, API_BASE_URL } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Lock, Mail, ArrowRight, CheckCircle } from 'lucide-react';
import { Logo as StoreLogo } from '../../components/common/Logo';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 font-sans py-16 flex items-center justify-center p-4">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const token = searchParams.get('token');
  const isActivation = searchParams.get('activate') === '1';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tokenInput, setTokenInput] = useState(token || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return showToast('Passwords do not match', 'error');
    }
    if (password.length < 8) {
      return showToast('Password must be at least 8 characters long', 'error');
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL || 'http://localhost:5000/api'}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenInput, newPassword: password })
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }
      
      setSuccess(true);
      showToast(isActivation ? 'Account activated successfully!' : 'Password reset successful!', 'success');
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl shadow-slate-200/50">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-500">
            <CheckCircle className="h-8 w-8" />
          </div>
          <h2 className="mb-2 font-heading text-2xl font-black text-slate-900">
            {isActivation ? 'Account Activated' : 'Password Reset Complete'}
          </h2>
          <p className="mb-8 text-sm text-slate-500">
            Your password has been successfully saved. You will be redirected to the login page momentarily.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="w-full rounded-2xl bg-rose-500 py-3.5 text-sm font-bold text-white transition-all hover:bg-rose-600 active:scale-95"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <StoreLogo className="h-10 w-auto" />
        </div>
        
        <div className="rounded-3xl bg-white p-8 shadow-xl shadow-slate-200/50">
          <div className="mb-8 text-center">
            <h1 className="font-heading text-2xl font-black text-slate-900">
              {isActivation ? 'Activate Account' : 'Set New Password'}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {isActivation 
                ? 'Welcome! Please set a password to activate your account.'
                : 'Please enter your new password below.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                6-Digit Verification Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  required
                  maxLength={6}
                  className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 py-3.5 px-4 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-rose-500 focus:bg-white focus:shadow-lg focus:shadow-rose-100 text-center tracking-[0.5em] font-mono text-xl"
                  placeholder="------"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-rose-500 focus:bg-white focus:shadow-lg focus:shadow-rose-100"
                  placeholder="At least 8 characters"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-rose-500 focus:bg-white focus:shadow-lg focus:shadow-rose-100"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full overflow-hidden rounded-2xl bg-slate-900 py-3.5 text-sm font-bold text-white shadow-xl shadow-slate-900/20 transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-slate-900/30 disabled:opacity-70"
            >
              <div className="relative z-10 flex items-center justify-center gap-2">
                <span>{isSubmitting ? 'Saving...' : 'Save Password'}</span>
                {!isSubmitting && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
              </div>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

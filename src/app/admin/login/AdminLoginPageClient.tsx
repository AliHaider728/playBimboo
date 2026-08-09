"use client";
import React, { useState } from 'react';
import { useRouter } from "next/navigation";

import { Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

import { api, setAuthToken, getLastApiError } from '../../../services/api';

export const AdminLoginPageClient: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState('playbimboo@gmail.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.login(email, password);
      if (res && res.token) {
        setAuthToken(res.token);
        localStorage.setItem('pb_admin_user', JSON.stringify(res.user));
        router.push('/admin');
      } else {
        const apiError = getLastApiError();
        if (apiError && apiError.toLowerCase().includes('failed to fetch')) {
          setError('Backend API is unreachable. Please verify the backend server is running on port 5000.');
        } else {
          setError(apiError || 'Invalid admin credentials. Please check your email and password.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 font-sans flex items-center justify-center p-4">
      

      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-2xl max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 font-black text-xl flex items-center justify-center mx-auto shadow-md">
            PB
          </div>
          <h1 className="font-heading font-black text-2xl text-slate-900">PlayBimboo Admin Dashboard</h1>
          <p className="text-xs text-slate-500 font-medium">
            Sign in to manage inventory, customer orders, coupons, and sales reports.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-xs text-rose-700 font-semibold">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Admin Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="playbimboo@gmail.com"
              className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 font-sans focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••••••"
              className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 font-sans focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-heading font-extrabold text-xs shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            ) : (
              <>
                <span>Sign In to Admin Panel</span>
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </>
            )}
          </button>
        </form>

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-900 space-y-1">
          <p className="font-bold text-amber-950">Default Admin Seed Credentials:</p>
          <p>Email: <code className="font-mono bg-white px-1 py-0.5 rounded text-rose-600 font-bold">playbimboo@gmail.com</code></p>
          <p>Password: <code className="font-mono bg-white px-1 py-0.5 rounded text-rose-600 font-bold">admin123</code></p>
        </div>

        <div className="text-center pt-2 border-t border-slate-100">
          <button
            onClick={() => router.push('/')}
            className="text-xs text-slate-500 hover:text-slate-800 font-bold"
          >
            &larr; Return to Customer Storefront
          </button>
        </div>
      </div>
    </div>
  );
};
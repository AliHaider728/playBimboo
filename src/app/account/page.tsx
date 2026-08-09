"use client";
import React, { useState } from 'react';
import { User, Package, MapPin, LogOut, Clock, XCircle, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { SeoHead } from '../../components/common/SeoHead';
import { formatPrice } from '../../utils/formatters';
import { useDialog } from '../../context/DialogContext';
import { getSafeImageSrc } from '../../utils/images';

export default function AccountPage() {
  const { orders, settings } = useStore();
  const { customerProfile, isLoggedIn, openAuthModal, logout, isLoading } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn || !customerProfile) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans py-12 flex items-center justify-center">
        <SeoHead title="My Account" />
        <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-xl max-w-md w-full text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-2">
            <User className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="font-heading font-black text-2xl text-slate-900">Please Log In</h2>
          <p className="text-sm text-slate-500 font-medium">
            You must be logged in to view your order history, tracking details, and saved wishlist.
          </p>
          <button
            onClick={() => openAuthModal('login')}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-heading font-black text-sm shadow-md transition-all"
          >
            Log In / Sign Up
          </button>
        </div>
      </div>
    );
  }

  // Filter orders to only show those belonging to the logged-in customer (fallback client-side filter)
  const customerOrders = orders.filter(o => o.email?.toLowerCase() === customerProfile.email?.toLowerCase());

  return (
    <div className="min-h-screen bg-slate-50 font-sans py-6">
      <SeoHead title="My Account & Order History" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'My Account' }]} />

        {/* Profile Header */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm mb-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {customerProfile.avatar ? (
              <img
                src={customerProfile.avatar}
                alt={customerProfile.name}
                className="w-16 h-16 rounded-full object-cover ring-4 ring-rose-100"
              />
            ) : (
              <div className="w-16 h-16 rounded-full ring-4 ring-rose-100 flex items-center justify-center bg-rose-500 text-white font-heading font-black text-2xl">
                {customerProfile.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'U'}
              </div>
            )}
            <div>
              <h1 className="font-heading font-black text-2xl text-slate-900">{customerProfile.name}</h1>
              <span className="text-xs text-slate-500 font-medium">{customerProfile.email} {customerProfile.phone ? `• ${customerProfile.phone}` : ''}</span>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Account Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="space-y-2 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm h-fit">
            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-heading font-bold text-xs transition-colors ${
                activeTab === 'orders' ? 'bg-rose-500 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Order History ({customerOrders.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-heading font-bold text-xs transition-colors ${
                activeTab === 'profile' ? 'bg-rose-500 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Profile Settings</span>
            </button>
          </aside>

          <main className="lg:col-span-3">
            {activeTab === 'orders' && (
              <div className="space-y-4">
                <h2 className="font-heading font-black text-xl text-slate-900 mb-4">Your Recent Toy Orders</h2>
                {customerOrders.length === 0 ? (
                  <p className="text-xs text-slate-500 p-6 bg-white rounded-3xl text-center">No past orders found.</p>
                ) : (
                  customerOrders.map(order => {
                    return (
                      <div key={order.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div>
                            <span className="font-heading font-bold text-sm text-slate-900">{order.id}</span>
                            <span className="text-xs text-slate-400 block">{order.date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full font-bold text-xs ${
                              order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                              order.status === 'Shipped' ? 'bg-sky-100 text-sky-800' :
                              order.status === 'Cancelled' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {order.status}
                            </span>

                          </div>
                        </div>

                        <div className="space-y-2">
                          {order.items.map((it, i) => (
                            <div key={i} className="flex items-center gap-3 text-xs sm:text-sm">
                              <img src={getSafeImageSrc(it.image)} alt="" className="w-10 h-10 object-cover rounded-lg bg-slate-100" />
                              <span className="flex-1 font-medium text-slate-800">
                                {it.name} (Qty: {it.quantity}) {it.selectedVariant ? `[${it.selectedVariant}]` : ''}
                              </span>
                              <span className="font-bold text-slate-900">{formatPrice(it.price * it.quantity, settings.currency)}</span>
                            </div>
                          ))}
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                          <span className="text-slate-500 font-medium">Tracking Code: {order.trackingNumber || 'Pending'}</span>
                          <span className="font-heading font-extrabold text-base text-rose-600">Total: {formatPrice(order.total, settings.currency)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="space-y-4">
                <h2 className="font-heading font-black text-xl text-slate-900 mb-4">Security Settings</h2>
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm max-w-xl">
                  <h3 className="font-heading font-bold text-sm text-slate-900 mb-4">Change Password</h3>
                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const pwd = (form.elements.namedItem('newPassword') as HTMLInputElement).value;
                      const confirm = (form.elements.namedItem('confirmPassword') as HTMLInputElement).value;
                      if (pwd !== confirm) {
                        return showToast('Passwords do not match', 'error');
                      }
                      if (pwd.length < 8) {
                        return showToast('Password must be at least 8 characters', 'error');
                      }
                      try {
                        const { api } = await import('../../services/api');
                        await api.changePassword(pwd);
                        showToast('Password changed successfully!', 'success');
                        form.reset();
                      } catch (err: any) {
                        showToast(err.message || 'Failed to change password', 'error');
                      }
                    }} 
                    className="space-y-4"
                  >
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">New Password</label>
                      <input
                        name="newPassword"
                        type="password"
                        required
                        className="w-full px-4 py-2.5 text-base sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Confirm New Password</label>
                      <input
                        name="confirmPassword"
                        type="password"
                        required
                        className="w-full px-4 py-2.5 text-base sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-heading font-bold text-xs shadow-md transition-colors"
                    >
                      Update Password
                    </button>
                  </form>
                </div>
              </div>
            )}          </main>
        </div>
      </div>
    </div>
  );
};



"use client";
import React, { useEffect } from 'react';
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  Users,
  Tag,
  BarChart3,
  Settings,
  Palette,
  LogOut,
  ExternalLink,
  Bell,
  MessageSquare,
  Mail,
  Menu,
  X as CloseIcon
} from 'lucide-react';
import { getAuthToken, removeAuthToken, api, isSuperAdmin } from '../../../services/api';

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = usePathname();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const token = getAuthToken();

  useEffect(() => {
    if (!token) {
      router.replace('/admin/login');
    }
  }, [token, router]);

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Products', path: '/admin/products', icon: Package },
    { label: 'Categories', path: '/admin/categories', icon: Layers },
    { label: 'Attributes', path: '/admin/attributes', icon: Settings },
    { label: 'Orders', path: '/admin/orders', icon: ShoppingBag },
    { label: 'Customers', path: '/admin/customers', icon: Users },
    { label: 'Reviews', path: '/admin/reviews', icon: MessageSquare },
    { label: 'Contact Messages', path: '/admin/contact-messages', icon: Mail },
    { label: 'Coupons & Deals', path: '/admin/coupons', icon: Tag },
    { label: 'Sales Reports', path: '/admin/reports', icon: BarChart3 },
    { label: 'Store Settings', path: '/admin/settings', icon: Settings },
    ...(isSuperAdmin() ? [{ label: 'Store Appearance', path: '/admin/store-appearance', icon: Palette }] : []),
  ];

  const handleSignOut = async () => {
    await api.logout();
    removeAuthToken();
    localStorage.removeItem('pb_admin_user');
    router.push('/admin/login');
  };

  if (!token) {
    return null;
  }

  return (
    <div className="admin-shell min-h-screen bg-slate-100 font-sans text-slate-800 flex">
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col justify-between p-4 border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 overflow-y-auto ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div>
          {/* Logo Header */}
          <div className="flex items-center justify-between pb-6 pt-2 px-2 border-b border-slate-800 mb-4">
            <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-400 text-slate-950 font-black">
                PB
              </div>
              <div>
                <span className="font-heading font-black text-white text-base block leading-tight">
                  PlayBimboo
                </span>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                  Admin Control
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = pathname === item.path || (item.path !== '/admin' && pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    isActive
                      ? 'bg-rose-500 text-white shadow-md'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-colors"
          >
            <span>View Live Storefront</span>
            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
          </Link>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Manager</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 -ml-2 rounded-xl text-slate-600 hover:bg-slate-100"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-heading font-extrabold text-sm text-slate-900">
              {navItems.find(i => i.path === pathname)?.label || 'Admin Management'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-full hover:bg-slate-100 text-slate-600">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
            </button>

            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-xs">
                PB
              </div>
              <div className="hidden sm:block">
                <span className="font-heading font-bold text-xs text-slate-900 block leading-tight">
                  PlayBimboo Manager
                </span>
                <span className="text-[10px] text-slate-500 font-medium">admin@playbimboo.com</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

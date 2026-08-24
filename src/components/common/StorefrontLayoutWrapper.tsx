"use client";
import React from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Header } from './Header';
import { Footer } from './Footer';
import { MobileBottomNav } from './MobileBottomNav';

const CartDrawer = dynamic(() => import('../cart/CartDrawer').then(mod => mod.CartDrawer), { ssr: false });
const FloatingWhatsApp = dynamic(() => import('./FloatingWhatsApp').then(mod => mod.FloatingWhatsApp), { ssr: false });

export const StorefrontLayoutWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-800 pb-20 xl:pb-0">
      <Header />
      <CartDrawer />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <FloatingWhatsApp />
      <MobileBottomNav />
    </div>
  );
};

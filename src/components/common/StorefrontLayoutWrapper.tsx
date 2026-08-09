"use client";
import React from 'react';
import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Footer } from './Footer';
import { CartDrawer } from '../cart/CartDrawer';
import { MobileBottomNav } from './MobileBottomNav';
import { FloatingWhatsApp } from './FloatingWhatsApp';

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

import React from 'react';
import Script from 'next/script';
import '../index.css';
import { Providers } from './Providers';
import { AuthModalWrapper } from './AuthModalWrapper';
import { StorefrontLayoutWrapper } from '../components/common/StorefrontLayoutWrapper';
import { DelayedScripts } from '../components/analytics/DelayedScripts';
import { Fredoka, Plus_Jakarta_Sans } from 'next/font/google';

const fredoka = Fredoka({ 
  subsets: ['latin'], 
  weight: ['400', '500', '600', '700'],
  variable: '--font-heading',
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({ 
  subsets: ['latin'], 
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata = {
  title: 'Play Bimboo - Magical Toys, Games & Playland',
  description: 'Discover endless play with Play Bimboo! Shop action figures, educational toys, board games, plush soft toys, and outdoor play.',
  icons: {
    icon: [
      { url: '/playbimbooLOGO_rounded.webp', type: 'image/webp' },
      { url: '/favicon_rounded.ico', type: 'image/x-icon' }
    ]
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
      </head>
      <body className={`font-sans antialiased bg-slate-50 text-slate-800 selection:bg-amber-200 selection:text-amber-900 ${fredoka.variable} ${plusJakartaSans.variable}`}>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-M49DLCLB"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        <DelayedScripts />
        <Providers>
          <AuthModalWrapper />
          <StorefrontLayoutWrapper>
            {children}
          </StorefrontLayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}

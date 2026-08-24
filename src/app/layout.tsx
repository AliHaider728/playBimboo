import React from 'react';
import Script from 'next/script';
import '../index.css';
import { Providers } from './Providers';
import { AuthModalWrapper } from './AuthModalWrapper';
import { StorefrontLayoutWrapper } from '../components/common/StorefrontLayoutWrapper';
import MetaPixel from '../components/analytics/MetaPixel';
import TikTokPixel from '../components/analytics/TikTokPixel';
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
  const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <Script
          id="meta-pixel-stub"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];}(window,document,'script');
            `,
          }}
        />
        <Script
          id="gtm-script"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-M49DLCLB');
            `,
          }}
        />

        {GA_MEASUREMENT_ID && (
          <Script
            id="google-analytics-stub"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false }); // PageView handled by lazy load
              `,
            }}
          />
        )}
        
        {GA_MEASUREMENT_ID && (
          <Script
            strategy="lazyOnload"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          />
        )}
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
        <MetaPixel />
          <TikTokPixel />
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

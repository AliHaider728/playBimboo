"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useParams } from 'next/navigation';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle2,
  Heart,
  Facebook,
  Instagram,
  Youtube,
  PackageSearch,
  UserCircle2
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import dynamic from 'next/dynamic';

const Ballpit = dynamic(() => import('../Ballpit/Ballpit'), {
  ssr: false,
});

// Adjust this import path to wherever the transparent logo file lives in your project
import playBimbooLogo from '../../assets/images/playbimboo-logo.webp';

// ─────────────────────────────────────────────────────────
// Hardcoded real store contact info.
// These are the confirmed real values — do NOT replace with
// settings.phone / settings.email / settings.address, which
// was the source of the data-flicker bug (settings context
// loads async and could momentarily return stale/empty data,
// overwriting these correct values after initial render).
// If these ever need to change, update them directly here.
// ─────────────────────────────────────────────────────────
const STORE_PHONE = '0310-7172222';
const STORE_EMAIL = 'Sales@playbimboo.com';
const STORE_ADDRESS = 'Mumtaz Market, Gujranwala';

export const Footer: React.FC = () => {
  const { settings } = useStore();
  const { isLoggedIn, openAuthModal } = useAuth();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail) {
      setSubscribed(true);
      setNewsletterEmail('');
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  const [isFooterVisible, setIsFooterVisible] = useState(false);
  const footerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsFooterVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    
    if (footerRef.current) {
      observer.observe(footerRef.current);
    }
    
    return () => observer.disconnect();
  }, []);

  return (
    <footer ref={footerRef} className="relative overflow-hidden bg-black pb-6 pt-10 font-sans text-slate-300 sm:pt-12">
      {/* Ballpit background animation — sits behind everything, doesn't block clicks */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-30" aria-hidden="true">
        {isFooterVisible && (
          <Ballpit
          count={60}
          gravity={0}
          friction={0.998}
          wallBounce={0.95}
          followCursor={false}
          colors={[0xffffff, 0x8b5cf6, 0x18181b]} /* white -> vivid violet -> near-black, high contrast like the React Bits demo */
          materialParams={{ metalness: 0.15, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.1 }}
          minSize={0.35}
          maxSize={0.7}
          size0={0.5}
          ambientIntensity={1.4}
          lightIntensity={300}
        />
        )}
      </div>

      {/* Light dark overlay — just enough to keep text readable without hiding the balls */}
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-black/55 via-black/70 to-black/85" aria-hidden="true" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Newsletter Banner */}
        <div className="relative mb-8 overflow-hidden rounded-3xl bg-linear-to-r from-rose-500 via-amber-500 to-sky-500 p-5 text-white shadow-xl sm:p-7">
          <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <p className="font-heading font-black text-2xl sm:text-3xl mb-2 text-white drop-shadow-sm">
                Subscribe to receive emails about new arrivals, exclusive offers, and latest updates.
              </p>
            </div>

            <div className="w-full lg:w-auto lg:min-w-105">
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                <label htmlFor="footer-newsletter-email" className="sr-only">Email address</label>
                <input
                  id="footer-newsletter-email"
                  type="email"
                  required
                  placeholder="Enter your email address..."
                  value={newsletterEmail}
                  onChange={e => setNewsletterEmail(e.target.value)}
                  className="px-5 py-3.5 rounded-2xl bg-white text-slate-900 placeholder-slate-400 font-medium text-sm focus:outline-none focus:ring-4 focus:ring-white/40 flex-1 shadow-inner"
                />
                <button
                  type="submit"
                  className="px-7 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-heading font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                >
                  <span>Subscribe</span>
                  <Send className="w-4 h-4" />
                </button>
              </form>

              {subscribed && (
                <div role="status" aria-live="polite" className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-900/40 p-2.5 text-xs font-bold text-emerald-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span>Yay! Check your inbox for your 15% OFF coupon code!</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Grid: Brand / Customer Care / Connect */}
        <div className="grid grid-cols-1 gap-8 border-b border-white/10 pb-8 md:grid-cols-3 md:gap-10">

          {/* Column 1: Store Bio */}
          <div className="space-y-5">
            <img
              src={typeof playBimbooLogo === 'string' ? playBimbooLogo : playBimbooLogo.src}
              alt="Play Bimboo"
              className="h-14 w-auto object-contain"
            />
            <p className="max-w-sm text-sm font-medium leading-relaxed text-white/80">
              Play Bimboo is your magical destination for premium, non-toxic toys, creative STEM kits, action figures, and family board games. Inspiring young minds to explore, imagine, and grow!
            </p>

            {/* Social links */}
            <div className="flex items-center gap-2.5 pt-1">
              {settings.socialLinks?.facebook && (
                <a
                  href={settings.socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="w-9 h-9 rounded-full bg-white/5 hover:bg-linear-to-br hover:from-rose-500 hover:to-amber-500 flex items-center justify-center transition-colors"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              )}
              {settings.socialLinks?.instagram && (
                <a
                  href={settings.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-9 h-9 rounded-full bg-white/5 hover:bg-linear-to-br hover:from-rose-500 hover:to-amber-500 flex items-center justify-center transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {settings.socialLinks?.youtube && (
                <a
                  href={settings.socialLinks.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="w-9 h-9 rounded-full bg-white/5 hover:bg-linear-to-br hover:from-rose-500 hover:to-amber-500 flex items-center justify-center transition-colors"
                >
                  <Youtube className="w-4 h-4" />
                </a>
              )}
              {settings.socialLinks?.tiktok && (
                <a
                  href={settings.socialLinks.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="TikTok"
                  className="w-9 h-9 rounded-full bg-white/5 hover:bg-linear-to-br hover:from-sky-400 hover:to-blue-500 flex items-center justify-center transition-colors"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 2.22-1.15 4.39-2.95 5.73-1.74 1.3-4.04 1.81-6.17 1.34-2.11-.47-3.92-1.89-4.83-3.83-.93-1.95-.91-4.26.06-6.19.98-1.93 2.72-3.34 4.79-3.89.84-.22 1.7-.33 2.56-.31v4.06c-1.43.08-2.82.72-3.69 1.83-.88 1.1-1.12 2.65-.63 3.98.48 1.31 1.65 2.31 2.99 2.62 1.34.31 2.77.01 3.86-.78 1.12-.82 1.81-2.14 1.85-3.56.09-3.93.03-7.87.03-11.8V.02z"/></svg>
                </a>
              )}
            </div>
          </div>

          {/* Column 2: Customer Care */}
          <div>
            <h4 className="font-heading font-bold text-white text-base uppercase tracking-wider mb-5">
              Customer Care
            </h4>
            <ul className="space-y-3 text-sm font-medium text-white/80">
              <li>
                <Link href="/about" className="hover:text-rose-400 transition-colors relative group inline-block">
                  About Us
                  <span className="absolute left-0 -bottom-0.5 w-0 h-px bg-rose-400 transition-all group-hover:w-full" />
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-rose-400 transition-colors relative group inline-block">
                  Contact Us
                  <span className="absolute left-0 -bottom-0.5 w-0 h-px bg-rose-400 transition-all group-hover:w-full" />
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-rose-400 transition-colors relative group inline-block">
                  Frequently Asked Questions
                  <span className="absolute left-0 -bottom-0.5 w-0 h-px bg-rose-400 transition-all group-hover:w-full" />
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="hover:text-rose-400 transition-colors relative group inline-block">
                  Saved Wishlist
                  <span className="absolute left-0 -bottom-0.5 w-0 h-px bg-rose-400 transition-all group-hover:w-full" />
                </Link>
              </li>
              <li>
                <Link href="/return-policy" className="hover:text-rose-400 transition-colors relative group inline-block">
                  Return Policy
                  <span className="absolute left-0 -bottom-0.5 w-0 h-px bg-rose-400 transition-all group-hover:w-full" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact + Account */}
          <div className="space-y-6">
            <div>
              <h4 className="font-heading font-bold text-white text-base uppercase tracking-wider mb-5">
                Get In Touch
              </h4>
              <div className="space-y-3 text-sm font-medium text-white/80">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  </span>
                  <span>{STORE_ADDRESS}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                    <Phone className="w-3.5 h-3.5 text-amber-400" />
                  </span>
                  <a href={`tel:+92${STORE_PHONE.replace(/[^0-9]/g, '').replace(/^0/, '')}`} className="hover:text-amber-400 transition-colors">
                    {STORE_PHONE}
                  </a>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                    <Mail className="w-3.5 h-3.5 text-sky-400" />
                  </span>
                  <div className="flex flex-col gap-1.5 pt-1">
                    <a href={`mailto:${STORE_EMAIL}`} className="hover:text-sky-400 transition-colors leading-none">
                      {STORE_EMAIL}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {isLoggedIn ? (
              <Link
                href="/account"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-linear-to-r from-rose-500 to-amber-500 hover:opacity-90 text-white font-heading font-bold text-xs shadow-md transition-opacity"
              >
                <UserCircle2 className="w-3.5 h-3.5" />
                My Account
              </Link>
            ) : (
              <button
                onClick={() => openAuthModal('login')}
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-linear-to-r from-rose-500 to-amber-500 hover:opacity-90 text-white font-heading font-bold text-xs shadow-md transition-opacity"
              >
                <UserCircle2 className="w-3.5 h-3.5" />
                Login / Sign Up
              </button>
            )}
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-white/60">
          <p className="flex items-center gap-1.5 text-center md:text-left">
            &copy; {new Date().getFullYear()} {settings.storeName}. All rights reserved.
          </p>

          <p className="flex items-center gap-1.5 text-center md:text-right text-white/50">
            <span>Designed &amp; Developed by</span>
            <a
              href="https://tecnosphere.com.pk/"
              target="_blank"
              rel="noopener noreferrer"
              className="relative inline-block font-heading font-bold bg-linear-to-r from-rose-400 via-amber-400 to-sky-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-[shine_4s_linear_infinite] transition-opacity hover:opacity-80"
            >
              TecnoSphere
            </a>
          </p>
        </div>
      </div>

      {/* Local keyframes for the credit-link shine animation */}
      <style>{`
        @keyframes shine {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
      `}</style>
    </footer>
  );
};
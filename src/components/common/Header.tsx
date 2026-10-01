"use client";
import React, { useState, useRef, useEffect, useMemo, useDeferredValue } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useParams } from 'next/navigation';
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  X,
  ChevronDown
} from 'lucide-react';
import { Logo } from './Logo';
import { useStore } from '../../context/StoreContext';
import { formatPrice } from '../../utils/formatters';
import { isProductVisibleOnStorefront } from '../../utils/products';
import { orderedVisibleNavigation } from '../../config/storeAppearance';
import { StorefrontNavigationItem } from '../../types';
import { getSafeImageSrc } from '../../utils/images';

export const Header: React.FC = () => {
  const { cartTotalItems, wishlist, setIsCartOpen, products, settings } = useStore();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [openMenuId, setOpenMenuId] = useState('');
  
  // Smart Scroll state
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const navigationRef = useRef<HTMLElement>(null);
  const router = useRouter();
  const desktopNavigation = orderedVisibleNavigation(settings, 'desktop');
  const desktopRoots = desktopNavigation.filter(item => !item.parentId);

  // Filter search autosuggest results
  const searchResults = useMemo(() => {
    const term = deferredSearchQuery.trim().toLowerCase();
    return term ? products
        .filter(p =>
          isProductVisibleOnStorefront(p) && (
            p.name.toLowerCase().includes(term) ||
            p.category.toLowerCase().includes(term) ||
            p.brand.toLowerCase().includes(term) ||
            p.tags.some(t => t.toLowerCase().includes(term))
          )
        )
        .slice(0, 5)
    : [];
  }, [products, deferredSearchQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
      if (navigationRef.current && !navigationRef.current.contains(e.target as Node)) setOpenMenuId('');
    };
    document.addEventListener('mousedown', handleClickOutside);
    const handleEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpenMenuId(''); };
    document.addEventListener('keydown', handleEscape);
    
    // Smart Scroll logic
    let lastScrollY = window.scrollY;
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          setIsScrolled(currentScrollY > 20);
          if (currentScrollY > lastScrollY && currentScrollY > 100) {
            setIsScrolledDown(true);
          } else if (currentScrollY < lastScrollY) {
            setIsScrolledDown(false);
          }
          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchFocused(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header 
      className={`sticky top-0 z-50 transition-all duration-300 ease-out border-b border-slate-100
        ${isScrolledDown ? '-translate-y-full' : 'translate-y-0'} 
        ${isScrolled ? 'bg-slate-50/80 backdrop-blur-lg shadow-sm' : 'bg-slate-50 shadow-xs'}`}
    >
      {/* Top Announcement Bar - Infinite Marquee */}
      <div className="bg-white text-slate-600 py-2 border-b border-slate-100 overflow-hidden relative">
        <style>{`
          @keyframes announcement-marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .announcement-track {
            animation: announcement-marquee 22s linear infinite;
          }
          .announcement-track:hover {
            animation-play-state: paused;
          }
        `}</style>
        <div className="flex whitespace-nowrap announcement-track w-max">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-8 px-4">
              <span className="flex items-center gap-1.5 text-xs sm:text-sm font-bold">
                <span>🚚</span> Free Shipping All Over Pakistan
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1.5 text-xs sm:text-sm font-bold">
                <span>💳</span> Cash on Delivery (COD) Nationwide
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-500">
                <span className="text-amber-400">⭐</span> Rated 4.9/5 by 12,000+ happy parents
              </span>
              <span className="text-slate-300">|</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-[1560px] mx-auto px-2 sm:px-6 lg:px-8 py-0">
        <div className="bg-white rounded-b-3xl sm:rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 px-4 md:px-8 py-3 md:py-4 flex items-center justify-between gap-3 md:gap-6 xl:gap-10 mt-0 sm:mt-4 mb-0 relative z-50">
          
          {/* Logo Component - Left */}
          <div className="flex-shrink-0 flex items-center justify-start">
            <Logo size="md" className="scale-95 md:scale-110 origin-left" />
          </div>

          {/* Consolidated Desktop Nav */}
          <nav ref={navigationRef} className="hidden xl:flex items-center gap-8 text-base font-heading font-bold text-slate-600 flex-shrink-0 ml-4">
            {desktopRoots.map(item => {
              const children = desktopNavigation.filter(child => child.parentId === item.id && child.visible);
              return item.menuType === 'dropdown' && children.length > 0 ? (
              <div key={item.id} className="relative" onMouseEnter={() => item.enabled && setOpenMenuId(item.id)} onMouseLeave={() => setOpenMenuId('')}>
                <button
                  type="button"
                  disabled={!item.enabled}
                  aria-disabled={!item.enabled}
                  aria-expanded={openMenuId === item.id}
                  aria-haspopup="menu"
                  onClick={() => item.enabled && setOpenMenuId(openMenuId === item.id ? '' : item.id)}
                  onKeyDown={event => { if (event.key === 'ArrowDown' && item.enabled) { event.preventDefault(); setOpenMenuId(item.id); setTimeout(() => navigationRef.current?.querySelector<HTMLElement>(`[data-menu="${item.id}"] a, [data-menu="${item.id}"] button`)?.focus(), 0); } }}
                  className="flex items-center gap-1.5 py-1 transition-colors hover:text-rose-500 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rose-500 disabled:cursor-not-allowed disabled:text-slate-300"
                  title={item.enabled ? undefined : 'Coming soon'}
                >
                  <span>{item.label}</span>
                  {item.badgeText && <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-black text-rose-600">{item.badgeText}</span>}
                  <ChevronDown className="w-4 h-4" />
                </button>
                {item.enabled && openMenuId === item.id && <div data-menu={item.id} role="menu" className="absolute left-0 top-full z-50 w-64 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl">
                  {children.map(child => <NavigationDestination key={child.id} item={child} onNavigate={() => setOpenMenuId('')} className="flex items-center justify-between rounded-xl px-4 py-3 text-base font-semibold text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-2 focus-visible:outline-rose-500" />)}
                </div>}
              </div>
            ) : item.enabled ? (
              <NavigationDestination key={item.id} item={item} className="flex items-center gap-1.5 transition-colors hover:text-rose-500 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rose-500" />
            ) : (
              <span key={item.id} aria-disabled="true" title="Coming soon" className="flex cursor-not-allowed items-center gap-1.5 text-slate-300">
                {item.label}{item.badgeText && <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px]">{item.badgeText}</span>}
              </span>
            );})}
          </nav>

          {/* Search Bar with Autosuggest - Mobile & Desktop */}
          <div ref={searchRef} className="flex-1 min-w-0 xl:max-w-xl relative mx-auto block">
            <form onSubmit={handleSearchSubmit} className="w-full relative flex items-center">
              <Search className="w-4 h-4 md:w-5 md:h-5 text-slate-400 absolute left-3 md:left-4 pointer-events-none" />
              <input
                type="text"
                placeholder="Search toys..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setIsSearchFocused(true);
                }}
                onFocus={() => setIsSearchFocused(true)}
                className="w-full pl-9 md:pl-11 pr-8 md:pr-10 py-2.5 md:py-3.5 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-rose-300 rounded-full text-sm md:text-base font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-rose-50 transition-all truncate"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 md:right-3.5 md:top-3.5 p-0.5 text-slate-400 hover:text-slate-600 rounded-full"
                >
                  <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
              )}
            </form>

            {/* Live Search Autosuggest Dropdown */}
            {isSearchFocused && searchQuery.trim().length > 0 && (
              <div className="absolute top-full left-0 md:right-0 w-[280px] md:w-auto mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-50 overflow-hidden">
                <div className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">
                  Top Matching Toys
                </div>
                {searchResults.length === 0 ? (
                  <p className="text-sm text-slate-500 p-3 text-center">No matching toys found.</p>
                ) : (
                  <div className="space-y-1">
                    {searchResults.map(prod => (
                      <Link
                        key={prod.id}
                        href={`/product/${prod.slug}`}
                        onClick={() => {
                          setIsSearchFocused(false);
                          setSearchQuery('');
                        }}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-rose-50/80 transition-colors"
                      >
                        <img
                          src={getSafeImageSrc(prod.images[0])}
                          alt={prod.name}
                          className="w-8 h-8 md:w-12 md:h-12 object-cover rounded-lg bg-slate-100"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs md:text-sm font-heading font-bold text-slate-800 truncate">
                            {prod.name}
                          </h4>
                          <span className="text-[9px] md:text-xs text-sky-600 font-semibold truncate block">{prod.categoryNames && prod.categoryNames.length > 0 ? prod.categoryNames[0] : (prod.category || 'Uncategorized')}</span>
                        </div>
                        <span className="text-[10px] md:text-sm font-bold text-slate-900 ml-1">{formatPrice(prod.price, settings.currency)}</span>
                      </Link>
                    ))}
                    <button
                      onClick={handleSearchSubmit}
                      className="w-full text-center text-xs md:text-sm font-bold text-rose-500 hover:text-rose-600 py-2 pt-2 border-t border-slate-100 mt-1"
                    >
                      View all results for "{searchQuery}" &rarr;
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions & Cart / Wishlist */}
          <div className="flex items-center justify-end gap-2 md:gap-4 lg:gap-7 flex-shrink-0">

            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="hidden xl:flex items-center gap-2.5 group"
              title="Wishlist"
            >
              <div className="relative p-2.5 rounded-full bg-slate-50 group-hover:bg-rose-50 text-slate-600 transition-colors">
                <Heart className="w-5 h-5 md:w-6 md:h-6" />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                    {wishlist.length}
                  </span>
                )}
              </div>
              <span className="text-base font-heading font-bold text-slate-900">Wishlist</span>
            </Link>

            {/* Cart Drawer Trigger Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-1.5 md:gap-2.5 px-3 md:px-6 py-2.5 md:py-3.5 rounded-full bg-gradient-to-r from-rose-500 to-rose-400 hover:from-rose-600 hover:to-rose-500 text-white shadow-[0_4px_14px_rgba(225,29,72,0.3)] transition-all duration-200 active:scale-95"
            >
              <ShoppingBag className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden whitespace-nowrap font-heading text-sm font-bold sm:inline-block md:text-base">Cart (<span key={`desktop-cart-${cartTotalItems}`} className="cart-count-pop inline-block">{mounted ? cartTotalItems : 0}</span>)</span>
              <span key={`mobile-cart-${cartTotalItems}`} className="cart-count-pop inline-block whitespace-nowrap font-heading text-sm font-bold sm:hidden">{mounted ? cartTotalItems : 0}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

const NavigationDestination: React.FC<{ item: StorefrontNavigationItem; className: string; onNavigate?: () => void }> = ({ item, className, onNavigate }) => {
  const content = <>{item.label}{item.badgeText && <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-black text-rose-600">{item.badgeText}</span>}</>;
  if (!item.enabled) return <span role="menuitem" aria-disabled="true" className={`${className} cursor-not-allowed text-slate-300`}>{content}</span>;
  if (item.linkType === 'external_url') return <a role="menuitem" href={item.externalUrl} target={item.openInNewTab ? '_blank' : undefined} rel={item.openInNewTab ? 'noopener noreferrer' : undefined} onClick={onNavigate} className={className}>{content}</a>;
  return <Link role="menuitem" href={item.path || '/'} onClick={onNavigate} className={className}>{content}</Link>;
};

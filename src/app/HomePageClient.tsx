"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useParams } from 'next/navigation';
import {
  Sparkles,
  ArrowRight,
  Boxes,
  Shield,
  GraduationCap,
  Heart,
  Sun,
  Dices,
  Star,
  Baby,
  Blocks,
  Rocket,
  Gamepad2,
  Gift,
  Flame,
  Atom,
  Lightbulb
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/common/ProductCard';
import { ProductImage } from '../components/common/ProductImage';
import { ProductSpotlight } from '../components/home/ProductSpotlight';
import { TrustBadges } from '../components/common/TrustBadges';
import { SeoHead } from '../components/common/SeoHead';
import { AGE_GROUPS } from '../data/mockData';
import { Product } from '../types';
import { formatPrice } from '../utils/formatters';
import { getSafeImageSrc } from '../utils/images';
import { isProductVisibleOnStorefront } from '../utils/products';
import playBimbooVideo from '../assets/newplaybimboo.mp4';
import logoImage from '../assets/images/play_bimboo_logo_1785311841625.webp';
import promoToysImage from '../assets/images/promo_toys.webp';

export const HomePageClient: React.FC = () => {
  const { products, categories, settings } = useStore();
  const [selectedQuickViewProduct, setSelectedQuickViewProduct] = useState<Product | null>(null);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const visibleProducts = mounted ? products.filter(isProductVisibleOnStorefront) : [];
  const featuredProducts = [...new Map(
    visibleProducts.filter(p => p.isFeatured || p.isBestseller).map(product => [product.id, product])
  ).values()].slice(0, 4);
  const markedNewArrivals = visibleProducts.filter(p => p.isNewArrival);
  const recentProducts = [...visibleProducts].sort((a, b) => {
    const aTime = Date.parse(a.createdAt || a.updatedAt || '');
    const bTime = Date.parse(b.createdAt || b.updatedAt || '');
    return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
  });
  const newArrivals = (markedNewArrivals.length > 0 ? markedNewArrivals : recentProducts).slice(0, 4);
  const spotlightProduct = visibleProducts.find(p => p.isSpotlight);
  const sectionByKey = Object.fromEntries(settings.homepageSections.map(section => [section.key, section]));

  const categoryIcons: Record<string, React.ReactNode> = {
    'building-sets': <Boxes className="w-6 h-6 text-amber-500" />,
    'action-figures': <Shield className="w-6 h-6 text-rose-500" />,
    'educational-stem': <GraduationCap className="w-6 h-6 text-sky-500" />,
    'soft-toys': <Heart className="w-6 h-6 text-pink-500" />,
    'outdoor-toys': <Sun className="w-6 h-6 text-emerald-500" />,
    'board-games': <Dices className="w-6 h-6 text-purple-500" />
  };

  const ageIcons: Record<string, React.ReactNode> = {
    '0-2': <Baby className="w-6 h-6 text-amber-600" />,
    '3-5': <Blocks className="w-6 h-6 text-rose-600" />,
    '6-8': <Rocket className="w-6 h-6 text-sky-600" />,
    '9-12': <Gamepad2 className="w-6 h-6 text-purple-600" />,
    '13+': <Gamepad2 className="w-6 h-6 text-indigo-600" />
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <SeoHead
        title="Playful Toys & Games Store"
        description="Shop top-rated STEM toys, building sets, action figures, soft plushies, and board games for kids of all ages. Safe, non-toxic & fast delivery!"
      />

      {/* Hero Banner Section */}
      {sectionByKey.hero?.enabled && <section style={{ order: sectionByKey.hero.order }} className="relative w-full min-h-[650px] lg:h-[700px] overflow-visible flex flex-col justify-center pt-8 pb-32 lg:py-0 mt-0">
        {/* Full Background Video */}
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-[#E2F1F8]">
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="w-full h-full object-cover object-[42%_center]"
          >
            <source src={playBimbooVideo} type="video/mp4" />
          </video>
        </div>

        {/* Left Readability Gradient Overlay */}
        <div 
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, rgba(255,253,248,1) 0%, rgba(255,253,248,0.98) 20%, rgba(255,253,248,0.88) 30%, rgba(255,253,248,0.55) 38%, rgba(255,253,248,0.15) 47%, rgba(255,253,248,0) 55%)'
          }}
        />

        {/* Mobile-only dark overlay for readability on small screens */}
        <div className="absolute inset-0 z-10 pointer-events-none bg-white/70 lg:hidden block" />

        {/* Hero Content */}
        <div className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-12 w-full relative z-20 flex flex-col justify-center h-full">
          <div className="max-w-[620px] space-y-6 text-center lg:text-left mt-8 lg:mt-0">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-slate-200 text-rose-600 text-xs sm:text-sm font-heading font-extrabold">
              <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
              <span>⭐ Over 1,000+ Magical Toys for Curious Minds!</span>
            </div>

            <h1 className="font-heading font-black text-4xl sm:text-5xl lg:text-[72px] text-slate-900 leading-[1.1] tracking-tight drop-shadow-sm">
              {sectionByKey.hero.heading}
            </h1>

            <p className="text-slate-800 lg:text-slate-600 font-sans text-base sm:text-lg max-w-[500px] mx-auto lg:mx-0 leading-relaxed font-medium">
              {sectionByKey.hero.subheading}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                href={sectionByKey.hero.ctaLink || '/category/all'}
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-linear-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-heading font-extrabold text-base shadow-[0_8px_20px_-8px_rgba(244,63,94,0.5)] flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
              >
                <span>{sectionByKey.hero.ctaLabel || 'Explore All Toys'} &rarr;</span>
              </Link>

              <Link
                href="/category/educational-stem"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-white hover:bg-slate-50 text-slate-800 font-heading font-extrabold text-base border border-slate-200 shadow-[0_4px_14px_rgba(0,0,0,0.05)] flex items-center justify-center gap-2 transition-all"
              >
                <Gift className="w-5 h-5 text-sky-500" />
                <span>Shop STEM & Learning</span>
              </Link>
            </div>

            {/* Social Proof Badges */}
            <div className="pt-4 flex items-center justify-center lg:justify-start gap-4">
              <div className="flex -space-x-3">
                <img className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="Parent 1" />
                <img className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80" alt="Parent 2" />
                <img className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm" src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=100&q=80" alt="Parent 3" />
              </div>
              <div className="flex flex-col text-xs text-slate-600 font-medium text-left">
                <div className="flex text-amber-400 gap-0.5 mb-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
                <span className="font-bold text-slate-900">4.9/5 from 12,000+ happy parents</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Floating Trust Bar overlapping hero bottom */}
        <div className="lg:absolute lg:bottom-0 lg:left-0 lg:w-full lg:translate-y-1/2 z-30 px-4 sm:px-6 lg:px-8 mt-12 lg:mt-0">
          <div className="max-w-[1200px] mx-auto">
            <TrustBadges />
          </div>
        </div>
      </section>}

      {spotlightProduct && (
        <div style={{ order: (sectionByKey.hero?.order ?? 0) + 0.5 }} className="mt-10 sm:mt-16 lg:mt-20">
          <ProductSpotlight product={spotlightProduct} />
        </div>
      )}

      {/* Shop by Category Section */}
      {sectionByKey.categories?.enabled && <section style={{ order: sectionByKey.categories.order }} className="py-14 sm:py-16 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-rose-500 font-heading">
              {sectionByKey.categories.subheading}
            </span>
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 mt-1">
              {sectionByKey.categories.heading}
            </h2>
          </div>
          <Link
            href={sectionByKey.categories.ctaLink || '/category/all'}
            className="mt-2 sm:mt-0 font-heading font-bold text-xs sm:text-sm text-rose-500 hover:text-rose-600 flex items-center gap-1 group"
          >
            <span>{sectionByKey.categories.ctaLabel || 'View All Categories'}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map(cat => (
            <Link
              key={cat.id || cat.slug}
              href={`/category/${cat.slug}`}
              className="group bg-white rounded-3xl p-4 border border-slate-100 shadow-xs hover:shadow-xl hover:shadow-rose-100 hover:-translate-y-1.5 transition-all text-center flex flex-col items-center justify-between h-52"
            >
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-50 mb-3">
                <img
                  src={getSafeImageSrc(cat.image)}
                  alt={cat.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-slate-900/0 transition-colors" />
                <div className="absolute top-2 right-2 p-2 rounded-xl bg-white/90 backdrop-blur-md shadow-sm">
                  {categoryIcons[cat.slug] || <Boxes className="w-5 h-5 text-amber-500" />}
                </div>
              </div>

              <div>
                <h3 className="font-heading font-bold text-xs sm:text-sm text-slate-800 group-hover:text-rose-500 line-clamp-1">
                  {cat.name}
                </h3>
                <span className="text-[11px] text-slate-400 font-medium">
                  {cat.itemCount} items
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>}

      {/* Shop by Age Group Section */}
      {sectionByKey.ageGroups?.enabled && <section style={{ order: sectionByKey.ageGroups.order }} className="py-12 w-full bg-linear-to-r from-amber-50/70 via-rose-50/50 to-sky-50/70 border-y border-slate-200/60 mt-6 sm:mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-600 font-heading">
              Tailored for Every Stage
            </span>
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 mt-1">
              {sectionByKey.ageGroups.heading}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
              {sectionByKey.ageGroups.subheading}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {AGE_GROUPS.map(age => (
              <Link
                key={age.id}
                href={`/category/all?age=${age.id}`}
                className={`group p-5 rounded-3xl border ${age.color} bg-white hover:shadow-lg transition-all text-center flex flex-col items-center justify-between gap-3`}
              >
                <div className="p-4 rounded-2xl bg-slate-50 group-hover:scale-110 transition-transform">
                  {ageIcons[age.id]}
                </div>

                <div>
                  <span className="font-heading font-extrabold text-lg sm:text-xl text-slate-900 block">
                    {age.label}
                  </span>
                  <span className="text-xs font-medium text-slate-500">{age.name}</span>
                </div>

                <span className="text-xs font-heading font-bold text-rose-500 group-hover:underline inline-flex items-center gap-1">
                  Explore Toys &rarr;
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>}

      {/* Featured / Bestseller Products Section */}
      {sectionByKey.featuredProducts?.enabled && featuredProducts.length > 0 && <section style={{ order: sectionByKey.featuredProducts.order }} className="py-14 sm:py-16 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-rose-500 font-heading flex items-center gap-1">
              <Flame className="w-4 h-4 fill-rose-500" />
              {sectionByKey.featuredProducts.subheading}
            </span>
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 mt-1">
              {sectionByKey.featuredProducts.heading}
            </h2>
          </div>
          <Link
            href={sectionByKey.featuredProducts.ctaLink || '/category/all'}
            className="mt-2 sm:mt-0 font-heading font-bold text-xs sm:text-sm text-rose-500 hover:text-rose-600 flex items-center gap-1"
          >
            <span>{sectionByKey.featuredProducts.ctaLabel || 'Shop All Bestsellers'} &rarr;</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {featuredProducts.slice(0, 3).map(product => (
            <ProductCard
              key={product.id || product.slug}
              product={product}
              layout="compact"
              onQuickView={prod => setSelectedQuickViewProduct(prod)}
            />
          ))}
        </div>
      </section>}

      {/* Brand Discovery Campaign Section */}
      {sectionByKey.brandCampaign?.enabled && <section style={{ order: sectionByKey.brandCampaign.order }} className="py-14 sm:py-16 w-full max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-10">
        <div className="relative w-full rounded-[28px] md:rounded-[36px] overflow-hidden flex flex-col justify-center min-h-125 md:h-[600px] lg:h-[650px] shadow-xl group">
          {/* Full Background Image */}
          <img 
              src={typeof promoToysImage === 'string' ? promoToysImage : (promoToysImage as any).src}
            alt="Magical Learning Toys"
            className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-1000 group-hover:scale-[1.02]"
          />
          
          {/* Light Readability Overlay */}
          <div className="absolute inset-0 bg-[#14083c]/15 pointer-events-none" />
          
          {/* Mobile-only stronger overlay for readability */}
          <div className="absolute inset-0 bg-linear-to-t from-[#14083c]/80 via-[#14083c]/40 to-transparent md:hidden pointer-events-none" />
          <div className="absolute inset-0 bg-linear-to-r from-[#14083c]/40 to-transparent hidden md:block pointer-events-none" />

          {/* Content Overlay */}
          <div className="relative z-10 w-full md:w-[44%] p-8 sm:p-12 lg:p-16 flex flex-col items-center md:items-start text-center md:text-left space-y-6 md:ml-4 lg:ml-8 mt-auto md:mt-0">
            
            {/* Logo */}
            <div className="bg-white/95   backdrop-blur-sm px-2.5 py-1.5 rounded-2xl shadow-sm border border-white/20 mb-2 shrink-0 animate-fade-in">
              <img 
                  src={typeof logoImage === 'string' ? logoImage : ((logoImage as any)?.url || (logoImage as any)?.src)} 
                  alt="Play Bimboo" 
                className="w-32 h-auto object-contain"
              />
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-900/40 border border-indigo-400/30 text-white text-xs font-bold tracking-wider backdrop-blur-md animate-fade-in">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              <span>PLAY • LEARN • GROW</span>
            </div>

            {/* Headline */}
            <h3 className="font-heading font-black text-3xl sm:text-4xl lg:text-[44px] leading-[1.15] text-white animate-fade-in-up">
              {sectionByKey.brandCampaign.heading}
            </h3>

            {/* Copy */}
            <p className="text-sm sm:text-base text-slate-100 font-sans leading-relaxed max-w-[420px] animate-fade-in-up [animation-delay:100ms]">
              {sectionByKey.brandCampaign.subheading}
            </p>

            {/* CTA & Pills Container */}
            <div className="pt-4 w-full flex flex-col items-center md:items-start gap-5 animate-fade-in-up [animation-delay:200ms]">
              <Link
                href={sectionByKey.brandCampaign.ctaLink || '/category/all'}
                className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-[20px] bg-linear-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-900 font-heading font-extrabold text-sm shadow-[0_8px_20px_-6px_rgba(251,191,36,0.6)] transition-all hover:scale-[1.02] active:scale-95"
              >
                <span>{sectionByKey.brandCampaign.ctaLabel || 'Explore PlayBimboo Favorites'}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              
              {/* Category Pills */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-900/30 border border-blue-400/20 text-blue-100 text-xs font-semibold backdrop-blur-md">
                  <Atom className="w-3.5 h-3.5 text-blue-300" /> STEM
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-900/30 border border-pink-400/20 text-pink-100 text-xs font-semibold backdrop-blur-md">
                  <Lightbulb className="w-3.5 h-3.5 text-pink-300" /> Creativity
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-900/30 border border-teal-400/20 text-teal-100 text-xs font-semibold backdrop-blur-md">
                  <Sparkles className="w-3.5 h-3.5 text-teal-300" /> Imagination
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>}

      {/* New Arrivals Grid */}
      {sectionByKey.newArrivals?.enabled && newArrivals.length > 0 && <section style={{ order: sectionByKey.newArrivals.order }} className="py-14 sm:py-16 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-sky-600 font-heading">
              {sectionByKey.newArrivals.subheading}
            </span>
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 mt-1">
              {sectionByKey.newArrivals.heading}
            </h2>
          </div>
          <Link
            href={sectionByKey.newArrivals.ctaLink || '/category/all'}
            className="mt-2 sm:mt-0 font-heading font-bold text-xs sm:text-sm text-sky-600 hover:text-sky-700 flex items-center gap-1"
          >
            <span>{sectionByKey.newArrivals.ctaLabel || 'Browse New Additions'} &rarr;</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {newArrivals.slice(0, 3).map(product => (
            <ProductCard
              key={product.id || product.slug}
              product={product}
              layout="compact"
              onQuickView={prod => setSelectedQuickViewProduct(prod)}
            />
          ))}
        </div>
      </section>}

      {/* Quick View Product Modal */}
      {selectedQuickViewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 relative shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedQuickViewProduct(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-500"
            >
              &times;
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <img
                src={getSafeImageSrc(selectedQuickViewProduct.images?.[0])}
                alt={selectedQuickViewProduct.name}
                className="w-full h-64 object-cover rounded-2xl bg-slate-100"
              />
              <div className="space-y-3">
                <span className="text-xs font-bold text-sky-600 uppercase">
                  {selectedQuickViewProduct.category || 'Uncategorized'}
                </span>
                <h3 className="font-heading font-bold text-lg text-slate-900">
                  {selectedQuickViewProduct.name}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="font-heading font-extrabold text-2xl text-rose-600">
                    {formatPrice(selectedQuickViewProduct.price, settings.currency)}
                  </span>
                  {(selectedQuickViewProduct.originalPrice ?? 0) > 0 && (
                    <span className="text-sm font-bold text-slate-400 line-through">
                      {formatPrice(selectedQuickViewProduct.originalPrice, settings.currency)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 line-clamp-3">
                  {selectedQuickViewProduct.shortDescription || selectedQuickViewProduct.description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()}
                </p>
                <div className="pt-2">
                  <Link
                    href={`/product/${selectedQuickViewProduct.slug}`}
                    onClick={() => setSelectedQuickViewProduct(null)}
                    className="w-full inline-block text-center py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-heading font-bold text-xs"
                  >
                    View Full Product Details &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
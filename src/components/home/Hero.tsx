import React from 'react';
import Link from 'next/link';
import { Sparkles, Gift, Star } from 'lucide-react';
import { HeroVideoClient } from './HeroVideoClient';
import { TrustBadges } from '../common/TrustBadges';

export const Hero: React.FC<{ sectionSettings: any }> = ({ sectionSettings }) => {
  if (!sectionSettings?.enabled) return null;

  return (
    <section style={{ order: sectionSettings.order }} className="relative w-full min-h-[650px] lg:h-[700px] overflow-visible flex flex-col justify-center pt-8 pb-32 lg:py-0 mt-0">
      <HeroVideoClient />

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
            {sectionSettings.heading}
          </h1>

          <p className="text-slate-800 lg:text-slate-600 font-sans text-base sm:text-lg max-w-[500px] mx-auto lg:mx-0 leading-relaxed font-medium">
            {sectionSettings.subheading}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
            <Link
              href={sectionSettings.ctaLink || '/category/all'}
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-linear-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-heading font-extrabold text-base shadow-[0_8px_20px_-8px_rgba(244,63,94,0.5)] flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
            >
              <span>{sectionSettings.ctaLabel || 'Explore All Toys'} &rarr;</span>
            </Link>

            <Link
              href="#spotlight"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-white hover:bg-slate-50 text-slate-800 font-heading font-extrabold text-base border border-slate-200 shadow-[0_4px_14px_rgba(0,0,0,0.05)] flex items-center justify-center gap-2 transition-all"
            >
              <Gift className="w-5 h-5 text-sky-500" />
              <span>See Spotlight</span>
            </Link>
          </div>

          {/* Social Proof Badges */}
          <div className="pt-4 flex items-center justify-center lg:justify-start gap-4">
            <div className="flex -space-x-3">
              <img className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="Parent 1" width={40} height={40} />
              <img className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80" alt="Parent 2" width={40} height={40} />
              <img className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm" src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=100&q=80" alt="Parent 3" width={40} height={40} />
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
    </section>
  );
};
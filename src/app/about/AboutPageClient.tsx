"use client";
import React from 'react';
import {
  Rocket,
  Heart,
  ShieldCheck,
  Sparkles,
  Award,
  Play,
  Youtube,
  Instagram,
  Facebook,
  Users,
  Star,
  Clock,
  Truck,
  PackageCheck,
  LayoutGrid,
  Quote,
  Mail,
  BadgeCheck
} from 'lucide-react';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { SeoHead } from '../../components/common/SeoHead';
import { useStore } from '../../context/StoreContext';

export const AboutPageClient: React.FC = () => {
  const { settings } = useStore();
  return (
    <div className="min-h-screen bg-slate-50 font-sans py-8">
      <SeoHead title="About Play Bimboo Store" />

      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'About Us' }]} />

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-amber-400 via-rose-500 to-sky-500 rounded-3xl p-8 sm:p-14 text-white shadow-xl mb-12 text-center relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-yellow-200 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Our Story & Mission
            </span>
            <h1 className="font-heading font-black text-3xl sm:text-5xl text-white">
              Inspiring Young Explorers Every Single Day!
            </h1>
            <p className="text-xs sm:text-base text-white/90 leading-relaxed font-medium">
              Founded by a passionate parent and educator, Play Bimboo exists to nurture creativity, wonder, and STEM problem-solving skills in children through safe, high-quality toys.
            </p>
          </div>
        </div>

        {/* Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-500 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="font-heading font-black text-lg text-slate-900">100% Non-Toxic & Safe</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every single toy in our catalog undergoes rigorous safety testing for BPA, lead, and phthalates before reaching your child's hands.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-sky-100 text-sky-500 flex items-center justify-center mx-auto">
              <Rocket className="w-7 h-7" />
            </div>
            <h3 className="font-heading font-black text-lg text-slate-900">STEM Learning First</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              We collaborate with educators to curate hands-on building sets, coding kits, and logic puzzles that encourage brain growth.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-500 flex items-center justify-center mx-auto">
              <Award className="w-7 h-7" />
            </div>
            <h3 className="font-heading font-black text-lg text-slate-900">Happiness Guaranteed</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              We stand by our 30-day hassle-free return policy. If your kid isn't thrilled, our customer support will make it right!
            </p>
          </div>
        </div>

        {/* Brand Story & Video Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16 items-center">
          <div className="space-y-6">
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-slate-900">
              The Story Behind Play Bimboo
            </h2>
            <div className="space-y-4 text-sm text-slate-600 leading-relaxed font-medium">
              <p>
                It all started with a simple idea: toys shouldn't just be plastic distractions. They should be tools for growth, imagination, and family bonding. Play Bimboo was born out of a desire to create a magical space where parents could find high-quality, thoughtfully curated toys without compromising on safety or educational value.
              </p>
              <p>
                Our journey began in a small workshop where we tested and curated the very best STEM kits, puzzles, and creative sets. Today, we're proud to serve thousands of families across the globe, bringing smiles and "aha!" moments to young explorers every single day.
              </p>
              <p>
                We believe that every child is a natural innovator. With the right toys, they can build, discover, and learn the skills they need to shape the future. Thank you for being a part of our story!
              </p>
            </div>
            <div className="flex items-center gap-4 pt-2">
              <img className="w-14 h-14 rounded-full border-4 border-white object-cover bg-slate-200 shadow-sm" src="https://tecnosphere.com.pk/_next/static/media/1731794527039.077be4b7.webp" alt="Abrar Ansari - Founder" />
              <div className="text-xs font-bold text-slate-700">
                <p className="flex items-center gap-1">Abrar Ansari <BadgeCheck className="w-3.5 h-3.5 text-sky-500" /></p>
                <p className="text-slate-500 font-medium">Founder</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-2">
              <Youtube className="w-8 h-8" />
            </div>
            <h2 className="font-heading font-black text-2xl text-slate-900">Join Our Play Community</h2>
            <p className="text-sm text-slate-500 max-w-sm">
              Follow Play Bimboo on our official social channels to see toys in action, get exclusive offers, and share your magical moments!
            </p>

            <div className="flex gap-4 pt-4">
              {settings.socialLinks?.youtube && (
                <a
                  href={settings.socialLinks.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full bg-rose-50 hover:bg-rose-500 text-rose-500 hover:text-white flex items-center justify-center transition-all shadow-sm"
                >
                  <Youtube className="w-5 h-5" />
                </a>
              )}
              {settings.socialLinks?.instagram && (
                <a
                  href={settings.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full bg-rose-50 hover:bg-rose-500 text-rose-500 hover:text-white flex items-center justify-center transition-all shadow-sm"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {settings.socialLinks?.facebook && (
                <a
                  href={settings.socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full bg-rose-50 hover:bg-rose-500 text-rose-500 hover:text-white flex items-center justify-center transition-all shadow-sm"
                >
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {settings.socialLinks?.tiktok && (
                <a
                  href={settings.socialLinks.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full bg-rose-50 hover:bg-rose-500 text-rose-500 hover:text-white flex items-center justify-center transition-all shadow-sm"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 2.22-1.15 4.39-2.95 5.73-1.74 1.3-4.04 1.81-6.17 1.34-2.11-.47-3.92-1.89-4.83-3.83-.93-1.95-.91-4.26.06-6.19.98-1.93 2.72-3.34 4.79-3.89.84-.22 1.7-.33 2.56-.31v4.06c-1.43.08-2.82.72-3.69 1.83-.88 1.1-1.12 2.65-.63 3.98.48 1.31 1.65 2.31 2.99 2.62 1.34.31 2.77.01 3.86-.78 1.12-.82 1.81-2.14 1.85-3.56.09-3.93.03-7.87.03-11.8V.02z"/></svg>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ───────────────────────────────────────────── */}
        {/* Trust / Stats Bar */}
        {/* ───────────────────────────────────────────── */}
        <div className="rounded-3xl bg-slate-900 p-8 sm:p-10 mb-16 shadow-xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-white/10 text-amber-300 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <p className="font-heading font-black text-2xl sm:text-3xl text-white">12,000+</p>
              <p className="text-[11px] sm:text-xs text-white/60 font-medium">Happy Parents</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-white/10 text-rose-300 flex items-center justify-center mx-auto">
                <Star className="w-6 h-6" />
              </div>
              <p className="font-heading font-black text-2xl sm:text-3xl text-white">4.9/5</p>
              <p className="text-[11px] sm:text-xs text-white/60 font-medium">Average Rating</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-white/10 text-sky-300 flex items-center justify-center mx-auto">
                <PackageCheck className="w-6 h-6" />
              </div>
              <p className="font-heading font-black text-2xl sm:text-3xl text-white">500+</p>
              <p className="text-[11px] sm:text-xs text-white/60 font-medium">Toys Curated</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-white/10 text-emerald-300 flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6" />
              </div>
              <p className="font-heading font-black text-2xl sm:text-3xl text-white">2-4 Days</p>
              <p className="text-[11px] sm:text-xs text-white/60 font-medium">Nationwide Delivery</p>
            </div>
          </div>
        </div>

        {/* ───────────────────────────────────────────── */}
        {/* Why Choose Play Bimboo */}
        {/* ───────────────────────────────────────────── */}
        <div className="mb-16">
          <div className="text-center max-w-xl mx-auto mb-10 space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-500 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Why Choose Us
            </span>
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-slate-900">
              Why Families Choose Play Bimboo
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              From the moment you order to the moment it lands in your child's hands, every step is built around safety, speed, and a little bit of magic.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-500 flex items-center justify-center">
                <PackageCheck className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-sm text-slate-900">Sustainable Packaging</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Every order is carefully packed in protective, eco-conscious packaging so it arrives safe and sound.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-500 flex items-center justify-center">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-sm text-slate-900">Fast Delivery Across Pakistan</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Quick and reliable delivery straight to your doorstep, nationwide, with Cash on Delivery available.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-500 flex items-center justify-center">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-sm text-slate-900">Safe Materials for Kids</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Every toy is selected with your child's safety in mind, using non-toxic, quality-tested materials.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-500 flex items-center justify-center">
                <LayoutGrid className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-sm text-slate-900">A Toy for Every Explorer</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Explore RC toys, STEM kits, dolls, puzzles, and more — curated for every age and interest.
              </p>
            </div>
          </div>
        </div>

        {/* ───────────────────────────────────────────── */}
        {/* NEW SECTION: Customer Testimonials */}
        {/* ───────────────────────────────────────────── */}
        <div className="mb-16">
          <div className="text-center max-w-xl mx-auto mb-10 space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-500 text-xs font-bold uppercase tracking-wider">
              <Heart className="w-3.5 h-3.5" />
              What Parents Say
            </span>
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-slate-900">
              Loved by Families Everywhere
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                "The STEM kit my son got kept him busy for hours. Great quality and quick delivery too!"
              </p>
              <p className="text-xs font-bold text-slate-800">— Ayesha K.</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                "Love that everything is non-toxic and safety tested. Peace of mind as a parent."
              </p>
              <p className="text-xs font-bold text-slate-800">— Bilal R.</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                "Packaging was so protective, nothing was damaged. Will definitely order again."
              </p>
              <p className="text-xs font-bold text-slate-800">— Sana M.</p>
            </div>
          </div>
        </div>

        {/* ───────────────────────────────────────────── */}
        {/* Our Promise Quote */}
        {/* ───────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-sky-50 via-white to-rose-50 rounded-3xl border border-slate-100 shadow-sm p-8 sm:p-12 mb-16 text-center relative overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-white shadow-sm text-rose-400 flex items-center justify-center mx-auto mb-5">
            <Quote className="w-7 h-7" />
          </div>
          <p className="max-w-2xl mx-auto font-heading font-bold text-base sm:text-xl text-slate-800 leading-relaxed">
            "At Play Bimboo, we're passionate about creating unforgettable childhood moments through fun, safe, and engaging toys — chosen with care, so every playtime becomes a memory worth keeping."
          </p>
          <p className="mt-5 text-xs font-bold text-slate-500 uppercase tracking-wider">— Abrar Ansari, Founder</p>
        </div>

        {/* ───────────────────────────────────────────── */}
        {/* NEW SECTION: Newsletter CTA */}
        {/* ───────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-amber-400 via-rose-500 to-sky-500 rounded-3xl p-8 sm:p-12 text-white shadow-xl mb-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-5">
            <Mail className="w-7 h-7" />
          </div>
          <h2 className="font-heading font-black text-2xl sm:text-3xl mb-3">Stay in the Loop</h2>
          <p className="text-xs sm:text-sm text-white/90 max-w-md mx-auto mb-6">
            Get early access to new arrivals, exclusive discounts, and fun learning tips — straight to your inbox.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 rounded-full px-5 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-full px-6 py-3 text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
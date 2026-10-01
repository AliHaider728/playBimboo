"use client";
import React, { useRef, useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { SeoHead } from '../../components/common/SeoHead';
import { useStore } from '../../context/StoreContext';
import { api, getLastApiError } from '../../services/api';
import { useToast } from '../../context/ToastContext';

// TikTok SVG (not in lucide-react)
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 2.22-1.15 4.39-2.95 5.73-1.74 1.3-4.04 1.81-6.17 1.34-2.11-.47-3.92-1.89-4.83-3.83-.93-1.95-.91-4.26.06-6.19.98-1.93 2.72-3.34 4.79-3.89.84-.22 1.7-.33 2.56-.31v4.06c-1.43.08-2.82.72-3.69 1.83-.88 1.1-1.12 2.65-.63 3.98.48 1.31 1.65 2.31 2.99 2.62 1.34.31 2.77.01 3.86-.78 1.12-.82 1.81-2.14 1.85-3.56.09-3.93.03-7.87.03-11.8V.02z"/>
  </svg>
);

// Facebook SVG (inline for exact brand icon)
const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

// Instagram SVG
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

// YouTube SVG
const YouTubeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

// ─────────────────────────────────────────────────────────
// Hardcoded real store contact info.
// These are the confirmed real values — kept in sync with
// Footer.tsx. Do NOT fall back to settings.phone / .email /
// .address, which was the source of the data-flicker bug
// (settings context loads async and could momentarily show
// stale/empty data after the real values had already rendered).
// If these ever need to change, update them directly here
// (and in Footer.tsx to keep both in sync).
// ─────────────────────────────────────────────────────────
const STORE_PHONE = '0310-7172222';
const STORE_EMAIL = 'Sales@playbimboo.com';
const STORE_ADDRESS = 'Mumtaz Market, Gujranwala';

export const ContactPageClient: React.FC = () => {
  const { settings } = useStore();
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLocked = useRef(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLocked.current) return;
    submitLocked.current = true;
    setIsSubmitting(true);
    try {
      const result = await api.submitContact({ name, email, subject, message });
      if (!result) throw new Error(getLastApiError() || 'Could not send your message. Please try again.');
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
      }, 4000);
    } catch (err: any) {
      showToast(err.message || 'Failed to send message', 'error');
    } finally {
      submitLocked.current = false;
      setIsSubmitting(false);
    }
  };

  const phoneDisplay = STORE_PHONE;
  const phoneLink = `tel:+92${phoneDisplay.replace(/[^0-9]/g, '').replace(/^0/, '')}`;
  const emailDisplay = STORE_EMAIL;
  const emailLink = `mailto:${emailDisplay}`;
  const addressDisplay = STORE_ADDRESS;

  const socialLinks = [
    {
      key: 'facebook',
      label: 'Facebook',
      href: settings.socialLinks?.facebook || 'https://facebook.com/playbimbootoys',
      icon: <FacebookIcon className="w-5 h-5" />,
      hoverClass: 'hover:text-blue-600'
    },
    {
      key: 'instagram',
      label: 'Instagram',
      href: settings.socialLinks?.instagram || 'https://www.instagram.com/playbimbootoys',
      icon: <InstagramIcon className="w-5 h-5" />,
      hoverClass: 'hover:text-pink-600'
    },
    {
      key: 'youtube',
      label: 'YouTube',
      href: settings.socialLinks?.youtube || 'https://youtube.com/@playbimboo',
      icon: <YouTubeIcon className="w-5 h-5" />,
      hoverClass: 'hover:text-red-600'
    },
    {
      key: 'tiktok',
      label: 'TikTok',
      href: settings.socialLinks?.tiktok || 'https://tiktok.com/@playbimbootoys',
      icon: <TikTokIcon className="w-5 h-5" />,
      hoverClass: 'hover:text-slate-900'
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans py-8">
      <SeoHead title="Contact Us" />

      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'Contact Us' }]} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left column: contact info + follow us */}
          <div className="lg:col-span-5 space-y-6">

            {/* Contact Information Card */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <h1 className="font-heading font-black text-2xl text-slate-900">Get in Touch with Play Bimboo</h1>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Have questions about our toys, orders, delivery, or anything else? Send us a message and our team will get back to you as soon as possible.
              </p>

              <div className="space-y-4 pt-4 border-t border-slate-100 text-xs text-slate-700">
                {/* Address */}
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-rose-50 text-rose-500">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold block text-slate-900">Store Address</span>
                    <span>{addressDisplay}</span>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-sky-50 text-sky-500">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold block text-slate-900">Phone Support</span>
                    <a href={phoneLink} className="hover:text-rose-500 transition-colors">
                      {phoneDisplay}
                    </a>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-amber-50 text-amber-500">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold block text-slate-900">Email Customer Service</span>
                    <a href={emailLink} className="hover:text-rose-500 transition-colors">
                      {emailDisplay}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Follow Us Card — ONE row, exactly 4 icons */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <h2 className="font-heading font-black text-lg text-slate-900 mb-5">Follow Us</h2>
              <div className="flex items-center gap-4 flex-wrap">
                {socialLinks.map(({ key, label, href, icon, hoverClass }) => (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Follow PlayBimboo on ${label}`}
                    className={`p-3 bg-slate-50 rounded-xl border border-slate-100 shadow-sm hover:shadow-md text-slate-500 ${hoverClass} transition-all`}
                  >
                    {icon}
                  </a>
                ))}
              </div>
            </div>

          </div>

          {/* Right column: contact form */}
          <div className="lg:col-span-7">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
              <h2 className="font-heading font-black text-xl text-slate-900">Send Us a Direct Message</h2>

              {submitted ? (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto animate-bounce" />
                  <h3 className="font-heading font-bold text-base">Message Sent Successfully!</h3>
                  <p className="text-xs">Thank you for reaching out to Play Bimboo. We'll reply shortly!</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Your Name</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Subject</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Order Tracking or Toy Suggestion"
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Message</label>
                    <textarea
                      required
                      rows={5}
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-2xl bg-rose-500 text-white font-heading font-extrabold text-xs hover:bg-rose-600 shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

"use client";
import React, { useState } from 'react';
import {
  HelpCircle,
  ChevronDown,
  ShieldCheck,
  Truck,
  RefreshCw,
  CreditCard,
  Clock,
  PackageCheck,
  MapPinned,
  AlertTriangle,
  MessageCircleQuestion
} from 'lucide-react';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { SeoHead } from '../../components/common/SeoHead';

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'What payment methods do you accept?',
      a: 'We offer Cash on Delivery (COD) across Pakistan. Additional online payment options may be available during checkout.',
      icon: CreditCard,
      color: 'text-emerald-500 bg-emerald-50'
    },
    {
      q: 'What are the delivery charges?',
      a: 'Delivery charges are calculated at checkout based on your location. We occasionally offer free shipping promotions, so keep an eye on our latest offers.',
      icon: Truck,
      color: 'text-sky-500 bg-sky-50'
    },
    {
      q: 'How long does delivery take?',
      a: 'Orders are usually delivered within 2–5 business days. Delivery to remote areas may take a little longer.',
      icon: Clock,
      color: 'text-amber-500 bg-amber-50'
    },
    {
      q: 'What happens after I place my order?',
      a: 'Once your order is placed, you\u2019ll receive an order confirmation. Our team will process and pack your order before handing it over to our courier partner for delivery.',
      icon: PackageCheck,
      color: 'text-rose-500 bg-rose-50'
    },
    {
      q: 'Can I track my order?',
      a: 'Yes! Once your order has been shipped, we\u2019ll provide you with a tracking number so you can monitor your delivery status.',
      icon: MapPinned,
      color: 'text-violet-500 bg-violet-50'
    },
    {
      q: 'What if I receive a damaged or incorrect product?',
      a: 'If your order arrives damaged or you receive the wrong item, please contact us within 48 hours of delivery. We\u2019ll help resolve the issue as quickly as possible.',
      icon: AlertTriangle,
      color: 'text-orange-500 bg-orange-50'
    },
    {
      q: 'Can I return or exchange a product?',
      a: 'Yes. Products can be returned or exchanged according to our Return & Refund Policy. Please ensure the item is unused and in its original packaging.',
      icon: RefreshCw,
      color: 'text-teal-500 bg-teal-50'
    },
    {
      q: 'Are your toys safe for children?',
      a: 'Yes. We carefully select quality toys that are suitable for children. Please follow the recommended age mentioned on each product page.',
      icon: ShieldCheck,
      color: 'text-lime-500 bg-lime-50'
    },
    {
      q: 'How can I contact PlayBimboo?',
      a: 'You can reach us through WhatsApp, email, or our Contact Us page. Our support team is always happy to assist you with your questions.',
      icon: MessageCircleQuestion,
      color: 'text-fuchsia-500 bg-fuchsia-50'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans py-8">
      <SeoHead title="Frequently Asked Questions (FAQ)" />

      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16">
        <Breadcrumbs items={[{ label: 'FAQs' }]} />

        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-100 shadow-sm mb-8 text-center space-y-3 max-w-7xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-sky-100 text-sky-500 flex items-center justify-center mx-auto">
            <HelpCircle className="w-7 h-7" />
          </div>
          <h1 className="font-heading font-black text-3xl text-slate-900">Frequently Asked Questions</h1>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Everything you need to know about Play Bimboo safety, shipping speeds, gift options, and easy returns.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 max-w-7xl mx-auto">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`group bg-white rounded-3xl border shadow-xs overflow-hidden transition-colors duration-300 ${
                  isOpen ? 'border-rose-200 shadow-sm' : 'border-slate-100'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className={`w-full p-6 text-left flex items-start gap-4 transition-colors ${isOpen ? 'bg-slate-50/50' : 'hover:bg-slate-50/50'}`}
                >
                  <div className={`shrink-0 p-2 rounded-xl transition-transform duration-300 ${faq.color} ${isOpen ? 'scale-110' : ''}`}>
                    <faq.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-heading font-bold text-sm sm:text-base transition-colors ${isOpen ? 'text-rose-500' : 'text-slate-900 group-hover:text-rose-500'}`}>
                      {faq.q}
                    </h3>
                  </div>
                  <div className="shrink-0 pt-1">
                    <ChevronDown
                      className={`w-5 h-5 transition-transform duration-300 ease-out ${isOpen ? 'rotate-180 text-rose-500' : 'text-slate-400'}`}
                    />
                  </div>
                </button>

                {/* Smooth height animation using a grid-rows trick instead of an instant mount/unmount */}
                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-6 pb-6 text-xs text-slate-600 leading-relaxed border-t border-slate-50 pt-3">
                      {faq.a}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};


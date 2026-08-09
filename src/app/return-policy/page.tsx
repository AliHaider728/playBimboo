"use client";
import React from 'react';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { SeoHead } from '../../components/common/SeoHead';
import { RefreshCw, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

export default function ReturnPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans py-8">
      <SeoHead title="Return Policy - PlayBimboo" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'Return Policy' }]} />

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8">
          <div className="text-center space-y-4 pb-8 border-b border-slate-100">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-500 flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="w-8 h-8" />
            </div>
            <h1 className="font-heading font-black text-3xl text-slate-900">30-Day Happiness Guarantee</h1>
            <p className="text-slate-500 max-w-lg mx-auto">
              We want you and your child to love every toy from PlayBimboo.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="shrink-0 p-2 bg-emerald-100 text-emerald-600 rounded-xl mt-1">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg text-slate-900 mb-2">Our Return Policy</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  If your child is not completely delighted with their toy, you can return it within 30 days of delivery in its original box for a full refund or exchange.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};



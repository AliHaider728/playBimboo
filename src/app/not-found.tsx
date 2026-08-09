"use client";
import React from 'react';
import Link from "next/link";
import { Rocket, Sparkles, Home } from 'lucide-react';
import { SeoHead } from '../components/common/SeoHead';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans py-16 flex items-center justify-center p-4">
      <SeoHead title="404 - Toy Lost in Space!" />

      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-100 shadow-xl max-w-lg text-center space-y-6">
        <div className="relative w-24 h-24 mx-auto bg-rose-100 rounded-full flex items-center justify-center text-rose-500 animate-bounce">
          <Rocket className="w-12 h-12" />
          <Sparkles className="w-5 h-5 absolute -top-1 -right-1 text-yellow-400 fill-yellow-400" />
        </div>

        <div className="space-y-2">
          <span className="font-heading font-black text-6xl text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500">
            404
          </span>
          <h1 className="font-heading font-black text-2xl text-slate-900">Oops! Toy Lost in Space!</h1>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            The page you are looking for seems to have flown away in a cosmic rocket. Let's head back to the main toy store!
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-heading font-extrabold text-xs shadow-md transition-all hover:scale-105"
          >
            <Home className="w-4 h-4" />
            <span>Back to Play Bimboo Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

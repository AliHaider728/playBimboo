"use client";
import React from 'react';
import Link from "next/link";
import { Heart, Trash2, ShoppingBag } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { ProductCard } from '../../components/common/ProductCard';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { SeoHead } from '../../components/common/SeoHead';
import { isProductVisibleOnStorefront } from '../../utils/products';

export default function WishlistPage() {
  const { wishlist, products, toggleWishlist } = useStore();

  const wishlistedProducts = products.filter(
    p => wishlist.includes(p.id) && isProductVisibleOnStorefront(p)
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans py-6">
      <SeoHead title="My Wishlist" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'Wishlist' }]} />

        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 flex items-center gap-2">
              <Heart className="w-7 h-7 text-rose-500 fill-rose-500" />
              <span>Saved Favorite Toys</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              You have {wishlistedProducts.length} toy(s) saved for later play.
            </p>
          </div>
        </div>

        {wishlistedProducts.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-400 flex items-center justify-center mx-auto">
              <Heart className="w-8 h-8" />
            </div>
            <h3 className="font-heading font-bold text-lg text-slate-800">Your Wishlist is Empty</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Tap the heart icon on any toy to save it to your wishlist!
            </p>
            <Link href="/category/all"
              className="inline-block px-6 py-2.5 rounded-2xl bg-rose-500 text-white font-heading font-bold text-xs"
            >
              Discover Toys
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 items-start gap-5 sm:grid-cols-2 lg:gap-6">
            {wishlistedProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};



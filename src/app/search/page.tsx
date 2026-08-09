"use client";
import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { ProductCard } from '../../components/common/ProductCard';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { SeoHead } from '../../components/common/SeoHead';
import { isProductVisibleOnStorefront } from '../../utils/products';

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const { products } = useStore();

  const [sortBy, setSortBy] = useState<'featured' | 'price-low' | 'price-high'>('featured');

  const results = products.filter(p =>
    isProductVisibleOnStorefront(p) && (
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      (p.categoryNames?.length ? p.categoryNames : [p.category]).some(category => category.toLowerCase().includes(query.toLowerCase())) ||
      p.brand.toLowerCase().includes(query.toLowerCase()) ||
      p.tags.some(t => t.toLowerCase().includes(query.toLowerCase()))
    )
  );

  const sortedResults = [...results].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    return 0;
  });

  const breadcrumbItems = [
    { label: 'Search Results' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans py-6">
      <SeoHead title={`Search Results for "${query}"`} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm mb-8">
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 flex items-center gap-3">
            <Search className="w-6 h-6 text-rose-500" />
            <span>Search Results for "{query}"</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Found {results.length} matching toy(s) in our catalog.
          </p>
        </div>

        {results.length > 0 && (
          <div className="flex justify-end mb-6">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-3.5 py-2 text-xs font-heading font-bold rounded-2xl border border-slate-200 bg-white text-slate-800"
            >
              <option value="featured">Sort by: Best Match</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        )}

        {sortedResults.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="font-heading font-bold text-lg text-slate-800">No Toys Match Your Search</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try searching for terms like "blocks", "robot", "plush", or "puzzle".
            </p>
            <Link href="/category/all"
              className="inline-block px-6 py-2.5 rounded-2xl bg-rose-500 text-white font-heading font-bold text-xs"
            >
              Browse All Toys
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 items-start gap-5 sm:grid-cols-2 lg:gap-6">
            {sortedResults.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

import { Suspense } from 'react';
export default function SearchResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center">Loading...</div>}>
      <SearchResultsContent />
    </Suspense>
  );
}
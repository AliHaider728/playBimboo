"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { ProductCard } from '../common/ProductCard';
import dynamic from 'next/dynamic';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types';

interface Props {
  products: Product[];
  sectionSettings: any;
}

const QuickViewModal = dynamic(() => import('./QuickViewModal').then(module => module.QuickViewModal));

export const NewArrivalsClient: React.FC<Props> = ({ products, sectionSettings }) => {
  const { addToCart } = useStore();
  const [selectedQuickViewProduct, setSelectedQuickViewProduct] = useState<Product | null>(null);
  const [visibleCount, setVisibleCount] = useState(3);

  if (!sectionSettings?.enabled || products.length === 0) return null;

  return (
    <>
      <section style={{ order: sectionSettings.order }} className="py-14 sm:py-16 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-sky-600 font-heading">
              {sectionSettings.subheading}
            </span>
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 mt-1">
              {sectionSettings.heading}
            </h2>
          </div>
          <Link
            href={sectionSettings.ctaLink || '/category/all'}
            className="mt-2 sm:mt-0 font-heading font-bold text-xs sm:text-sm text-sky-600 hover:text-sky-700 flex items-center gap-1"
          >
            <span>{sectionSettings.ctaLabel || 'Browse New Additions'} &rarr;</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {products.slice(0, visibleCount).map(product => (
            <ProductCard
              key={product.id || product.slug}
              product={product}
              layout="compact"
              onQuickView={prod => setSelectedQuickViewProduct(prod)}
            />
          ))}
        </div>

        {visibleCount < products.length ? (
          <div className="mt-10 flex justify-center">
            <button
              onClick={() => setVisibleCount(prev => prev + 3)}
              className="px-6 py-2.5 rounded-xl border-2 border-sky-600 text-sky-600 font-bold hover:bg-sky-50 transition-colors"
            >
              Load More
            </button>
          </div>
        ) : (
          <div className="mt-10 flex justify-center">
            <p className="text-sm font-semibold text-slate-500">You've seen it all!</p>
          </div>
        )}
      </section>

      {selectedQuickViewProduct && (
        <QuickViewModal
          product={selectedQuickViewProduct}
          onClose={() => setSelectedQuickViewProduct(null)}
          onAddToCart={(p) => {
            addToCart(p, 1);
            setSelectedQuickViewProduct(null);
          }}
        />
      )}
    </>
  );
};

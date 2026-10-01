"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ProductCard } from '../common/ProductCard';
import dynamic from 'next/dynamic';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types';

interface Props {
  products: Product[];
  sectionSettings: any;
}

const QuickViewModal = dynamic(() => import('./QuickViewModal').then(module => module.QuickViewModal));

export const FeaturedProductsClient: React.FC<Props> = ({ products, sectionSettings }) => {
  const { addToCart } = useStore();
  const [selectedQuickViewProduct, setSelectedQuickViewProduct] = useState<Product | null>(null);

  if (!sectionSettings?.enabled || products.length === 0) return null;

  return (
    <>
      <section style={{ order: sectionSettings.order }} className="py-14 sm:py-16 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-rose-500 font-heading">
              {sectionSettings.subheading}
            </span>
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 mt-1">
              {sectionSettings.heading}
            </h2>
          </div>
          <Link
            href={sectionSettings.ctaLink || '/category/all'}
            className="mt-2 sm:mt-0 font-heading font-bold text-xs sm:text-sm text-rose-500 hover:text-rose-600 flex items-center gap-1 group"
          >
            <span>{sectionSettings.ctaLabel || 'View All Favorites'}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {products.map((product, index) => (
            <ProductCard
              key={product.id || product.slug}
              product={product}
              layout="compact"
              priority={index < 2}
              onQuickView={prod => setSelectedQuickViewProduct(prod)}
            />
          ))}
        </div>
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

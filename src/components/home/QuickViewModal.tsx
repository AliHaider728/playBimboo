"use client";
import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Star, Shield, Package } from 'lucide-react';
import { Product } from '../../types';
import { getSafeImageSrc } from '../../utils/images';
import { formatPrice } from '../../utils/formatters';

interface Props {
  product: Product;
  onClose: () => void;
  onAddToCart: (p: Product) => void;
}

export const QuickViewModal: React.FC<Props> = ({ product, onClose, onAddToCart }) => {
  const router = useRouter();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 relative shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-500"
        >
          &times;
        </button>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
          <div className="relative w-full h-64 rounded-2xl bg-slate-100 overflow-hidden">
            <Image
              src={getSafeImageSrc(product.images?.[0]) || '/placeholder.png'}
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="space-y-3">
            <span className="text-xs font-bold text-sky-600 uppercase">
              {product.categoryNames && product.categoryNames.length > 0 ? product.categoryNames[0] : (product.category || 'Uncategorized')}
            </span>
            <h3 className="font-heading font-bold text-lg text-slate-900">
              {product.name}
            </h3>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-current' : 'fill-slate-200 text-slate-200'}`} />
                ))}
              </div>
              <span className="text-xs font-medium text-slate-500">
                ({product.reviewCount} reviews)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-heading font-black text-2xl text-rose-500">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-slate-400 line-through text-sm font-semibold">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
            <div className="pt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span>100% Safe & Non-toxic</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Package className="w-4 h-4 text-sky-500" />
                <span>Fast, tracked delivery</span>
              </div>
            </div>
            <div className="pt-6">
              {product.productType === 'variable' ? (
                <button
                  onClick={() => {
                    onClose();
                    router.push(`/product/${product.slug}`);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <ShoppingBag className="w-5 h-5" />
                  Select Options
                </button>
              ) : (
                <button
                  onClick={() => onAddToCart(product)}
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <ShoppingBag className="w-5 h-5" />
                  Add to Cart
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

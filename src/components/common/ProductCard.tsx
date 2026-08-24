"use client";
import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { Heart, ShoppingBag, Eye, Check, Loader2 } from 'lucide-react';
import { Product } from '../../types';
import { useStore } from '../../context/StoreContext';
import { formatPrice } from '../../utils/formatters';
import { getSafeImageSrc } from '../../utils/images';
import { ProductImage } from './ProductImage';
import { formatProductAgeGroups, formatProductCategories, getEffectiveProductAvailability, normalizeInventory } from '../../utils/products';
import { ReviewSummary } from './ReviewSummary';
import { useToast } from '../../context/ToastContext';
import { trackAddToCart } from "../../lib/metaPixel";
import { trackTikTokAddToCart } from "../../lib/tiktokPixel";

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
  layout?: 'standard' | 'compact';
  priority?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onQuickView, layout = 'standard', priority = false }) => {
  const { addToCart, toggleWishlist, isInWishlist, settings } = useStore();
  const { showToast } = useToast();
  const router = useRouter();
  const [cartActionState, setCartActionState] = useState<'idle' | 'adding' | 'added'>('idle');
  const cartActionLocked = useRef(false);
  const addTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isWishlisted = isInWishlist(product.id);
  const thumbnailUrl = product.imageThumbnailUrls?.[0]?.trim();
  const cardImageUrl = thumbnailUrl || product.images?.[0];
  const isVariable = product.productType === 'variable';
  const hasVariants = isVariable || Boolean(product.variants?.some(group => group.options.length > 0));
  const isAvailable = getEffectiveProductAvailability(product);
  const cardDescription = (product.shortDescription || product.description || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const compact = layout === 'compact';

  useEffect(() => () => {
    if (addTimerRef.current) clearTimeout(addTimerRef.current);
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
  }, []);

  const activeVars = (isVariable && product.variations) ? product.variations.filter(v => v.enabled) : [];
  const multipleVariations = activeVars.length > 1;

  let validDefaultVariation: any = null;
  if (activeVars.length === 1 && normalizeInventory(activeVars[0]).inStock) {
    validDefaultVariation = activeVars[0];
  } else if (isVariable && activeVars.length > 0) {
    if (product.defaultAttributes && Object.keys(product.defaultAttributes).length > 0) {
      const match = activeVars.find(v => Object.entries(product.defaultAttributes!).every(([k, val]) => v.attributes[k] === val));
      if (match && normalizeInventory(match).inStock) {
        validDefaultVariation = match;
      }
    }
  }

  const showViewProductOnly = isVariable && (multipleVariations || (!multipleVariations && activeVars.length === 0));
  const showAddToCart = !showViewProductOnly;

  let displayPrice = product.price;
  let displayOriginalPrice = product.originalPrice;
  let pricePrefix = '';
  let displayPriceStr = formatPrice(displayPrice, settings.currency);

  if (isVariable && product.variations && product.variations.length > 0) {
    const activeVariations = product.variations.filter(v => v.enabled);
    if (activeVariations.length > 0) {
      const prices = activeVariations.map(v => v.salePrice !== undefined && v.salePrice !== null ? v.salePrice : v.regularPrice);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      displayPrice = minPrice;
      if (minPrice < maxPrice) {
        displayPriceStr = `${formatPrice(minPrice, settings.currency)} – ${formatPrice(maxPrice, settings.currency)}`;
        pricePrefix = '';
      } else {
        displayPriceStr = formatPrice(minPrice, settings.currency);
      }
    }
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (showViewProductOnly) {
      router.push(`/product/${product.slug}`);
      return;
    }
    
    if (cartActionLocked.current) return;
    performAddToCart(validDefaultVariation);
  };

  const performAddToCart = (variationToUse: any) => {
    cartActionLocked.current = true;
    setCartActionState('adding');
    addTimerRef.current = setTimeout(() => {
      if (variationToUse) {
        addToCart(product, 1, JSON.stringify(variationToUse.attributes), variationToUse.id);
      } else {
        addToCart(product, 1);
      }
      
      const priceToAdd = variationToUse 
        ? (variationToUse.salePrice !== undefined && variationToUse.salePrice !== null ? variationToUse.salePrice : variationToUse.regularPrice) 
        : product.price;

      trackAddToCart({
        id: product.id,
        name: product.name,
        price: priceToAdd || product.price,
        quantity: 1,
        currency: "PKR",
      });

      trackTikTokAddToCart({
        id: product.id,
        name: product.name,
        price: priceToAdd || product.price,
        quantity: 1,
        currency: "PKR",
      });

      showToast(`Added ${product.name} to cart.`, 'success');
      setCartActionState('added');
      resetTimerRef.current = setTimeout(() => {
        cartActionLocked.current = false;
        setCartActionState('idle');
      }, 900);
    }, 180);
  };


  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  return (
    <article className="group relative flex h-full w-full flex-col overflow-hidden rounded-[28px] border border-slate-200/70 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.05)] transition-all duration-300 ease-out hover:-translate-y-1 hover:border-rose-200 hover:shadow-[0_20px_45px_rgba(244,63,94,0.14)]">

      {/* ---------- IMAGE ---------- */}
      <div className="relative aspect-[1/1] w-full shrink-0 overflow-hidden bg-white">
        <Link
          href={`/product/${product.slug}`}
          className={`flex h-full w-full items-center justify-center ${compact ? 'p-2.5' : 'p-3 sm:p-4'}`}
          aria-label={`View ${product.name}`}
        >
          <Image
            src={getSafeImageSrc(cardImageUrl, { width: 600 })}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={priority}
            className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.06]"
          />
        </Link>

        {/* Top-left badges */}
        <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-col items-start gap-1.5">
          {!isAvailable ? (
            <span className="rounded-full bg-slate-800 px-3 py-1 text-[11px] font-extrabold tracking-wide text-white shadow-sm uppercase">
              Sold Out
            </span>
          ) : (
            <>
              {(product.discountPercent ?? 0) > 0 && (
                <span className="rounded-full bg-rose-500 px-3 py-1 text-[11px] font-extrabold tracking-wide text-white shadow-sm">
                  -{product.discountPercent}%
                </span>
              )}
              {product.isBestseller && (
                <span className="rounded-full bg-amber-400 px-3 py-1 text-[11px] font-bold tracking-wide text-amber-950 shadow-sm">
                  BESTSELLER
                </span>
              )}
              {product.isNewArrival && (
                <span className="rounded-full bg-sky-500 px-3 py-1 text-[11px] font-bold tracking-wide text-white shadow-sm">
                  NEW
                </span>
              )}
              {(product.soldCount ?? 0) >= 50 && (
                <span className="rounded-full bg-orange-500 px-3 py-1 text-[11px] font-bold tracking-wide text-white shadow-sm flex items-center gap-1">
                  🔥 {product.soldCount}+ Sold
                </span>
              )}
            </>
          )}
        </div>

        {/* Wishlist button */}
        <button
          onClick={handleWishlistToggle}
          aria-label={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
          aria-pressed={isWishlisted}
          className={`absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full shadow-sm ring-1 ring-black/5 backdrop-blur transition-all duration-200 active:scale-90 ${
            isWishlisted
              ? 'scale-105 bg-rose-500 text-white'
              : 'bg-white/90 text-slate-500 hover:scale-110 hover:text-rose-500'
          }`}
        >
          <Heart className={`h-4 w-4 transition-all duration-200 ${isWishlisted ? 'scale-110 fill-white' : ''}`} strokeWidth={2.2} />
        </button>

        {/* Quick view — desktop hover */}
        {onQuickView && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onQuickView(product);
            }}
            className="absolute bottom-3 right-3 z-10 hidden h-9 w-9 items-center justify-center rounded-full bg-white text-slate-700 opacity-0 shadow-md ring-1 ring-black/5 transition-all duration-200 hover:bg-rose-500 hover:text-white group-hover:opacity-100 sm:flex"
            title="Quick View"
          >
            <Eye className="h-4 w-4" strokeWidth={2.2} />
          </button>
        )}

      </div>

      {/* ---------- CONTENT ---------- */}
      <div className={`flex flex-1 flex-col ${compact ? 'p-4' : 'p-5 sm:p-6'}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-[10px] font-bold uppercase tracking-[0.1em]">
            <span className="truncate text-sky-600">{formatProductCategories(product)}</span>
            <span aria-hidden="true" className="text-slate-300">•</span>
            <span className="whitespace-nowrap text-indigo-500">{formatProductAgeGroups(product)}</span>
          </div>
          {product.brand && (
            <span className="shrink-0 text-xs font-medium text-slate-400">{product.brand}</span>
          )}
        </div>

        <Link
          href={`/product/${product.slug}`}
          className={`mt-2 line-clamp-2 font-bold leading-snug text-slate-900 transition-colors hover:text-rose-500 ${compact ? 'text-base sm:text-lg' : 'text-lg sm:text-xl'}`}
        >
          {product.name}
        </Link>

        <div className="mt-2.5 flex items-baseline gap-2">
          <span className={`font-black leading-none tracking-tight text-rose-500 ${compact ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'}`}>
            {pricePrefix}{displayPriceStr}
          </span>
          {displayOriginalPrice && displayOriginalPrice > displayPrice && !pricePrefix && (
            <span className="text-base font-medium text-slate-400 line-through">
              {formatPrice(displayOriginalPrice, settings.currency)}
            </span>
          )}
        </div>

        {cardDescription ? (
          <p className={`mt-2.5 line-clamp-2 leading-relaxed text-slate-500 ${compact ? 'text-xs' : 'text-sm'}`}>
            {cardDescription}
          </p>
        ) : (
          <p className={`mt-2.5 line-clamp-2 leading-relaxed text-slate-400 ${compact ? 'text-xs' : 'text-sm'}`}>
            A fun, quality toy selected for curious young minds.
          </p>
        )}

        <div className="mt-2.5">
          <ReviewSummary rating={product.rating} reviewCount={product.reviewCount} compact />
        </div>

        {/* ---------- ACTIONS ---------- */}
        <div className={`flex items-center gap-2 border-t border-slate-100 ${compact ? 'mt-3 pt-3' : 'mt-4 pt-4'}`}>
          <a
            href={`https://wa.me/923107172222?text=${encodeURIComponent(`Hello, I am interested in this product:\nProduct: ${product.name}\nPrice: ${formatPrice(displayPrice, settings.currency)}\nLink: /product/${product.slug}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const fullUrl = `${window.location.origin}/product/${product.slug}`;
              const whatsappUrl = `https://wa.me/923107172222?text=${encodeURIComponent(`Hello, I am interested in this product:\nProduct: ${product.name}\nPrice: ${formatPrice(displayPrice, settings.currency)}\nLink: ${fullUrl}`)}`;
              window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
            }}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#25D366]/10 text-[#25D366] transition-colors duration-200 hover:bg-[#25D366] hover:text-white"
            title="Order via WhatsApp"
          >
            <svg className="h-[19px] w-[19px]" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>
          </a>

          <button
            onClick={handleAddToCart}
            disabled={!isAvailable || cartActionState !== 'idle'}
            aria-busy={cartActionState === 'adding'}
            className={`relative flex h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-2xl px-3 text-[13px] font-bold tracking-wide shadow-sm transition-all duration-300 active:scale-95 ${
              cartActionState === 'added'
                ? 'bg-emerald-500 text-white shadow-emerald-200'
                : !isAvailable
                ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                : 'bg-rose-500 text-white hover:bg-rose-600 hover:shadow-lg hover:shadow-rose-200'
            }`}
          >
            {cartActionState === 'added' ? (
              <>
                <Check className="h-4 w-4" />
                <span>Added</span>
              </>
            ) : cartActionState === 'adding' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Adding...</span>
              </>
            ) : showViewProductOnly ? (
              <>
                <Eye className="h-4 w-4" />
                <span>View Product</span>
              </>
            ) : !isAvailable ? (
              <span className="whitespace-nowrap">Sold Out</span>
            ) : (
              <>
                <ShoppingBag className="h-4 w-4" />
                <span>Add to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
};


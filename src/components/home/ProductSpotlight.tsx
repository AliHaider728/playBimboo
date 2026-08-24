"use client";
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { ArrowRight, Check, Loader2, PackageCheck, ShoppingBag, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types';
import { formatPrice } from '../../utils/formatters';
import { getSafeImageSrc } from '../../utils/images';
import { formatProductAgeGroups, getEffectiveProductAvailability, normalizeInventory, getVariationDisplayLabel } from '../../utils/products';
import { useToast } from '../../context/ToastContext';
import { trackAddToCart } from "../../lib/metaPixel";

export const ProductSpotlight: React.FC<{ product: Product }> = ({ product }) => {
  const { addToCart, settings } = useStore();
  const { showToast } = useToast();
  const router = useRouter();
  const [cartActionState, setCartActionState] = useState<'idle' | 'adding' | 'added'>('idle');
  const cartActionLocked = useRef(false);
  const addTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const isVariable = product.productType === 'variable';
  const activeVariations = useMemo(() => 
    isVariable ? (product.variations?.filter(v => v.enabled) || []) : [],
  [isVariable, product.variations]);
  
  const defaultVariation = useMemo(() => isVariable
    ? activeVariations.find(variation =>
        normalizeInventory(variation).inStock &&
        Object.keys(product.defaultAttributes || {}).length > 0 &&
        Object.entries(product.defaultAttributes || {}).every(
          ([key, value]) => variation.attributes[key] === value
        )
      ) || (activeVariations.length === 1 ? activeVariations[0] : undefined)
    : undefined, [isVariable, activeVariations, product.defaultAttributes]);

  const [selectedVariationId, setSelectedVariationId] = useState<string | null>(defaultVariation?.id || null);

  const selectedVariation = isVariable && selectedVariationId 
    ? activeVariations.find(v => v.id === selectedVariationId) 
    : defaultVariation;

  const currentPrice = selectedVariation 
    ? (selectedVariation.salePrice !== undefined && selectedVariation.salePrice !== null ? selectedVariation.salePrice : selectedVariation.regularPrice)
    : product.price;
    
  const currentOriginalPrice = selectedVariation 
    ? (selectedVariation.regularPrice !== undefined && selectedVariation.regularPrice !== null ? selectedVariation.regularPrice : product.originalPrice)
    : product.originalPrice;

  const isAvailable = selectedVariation 
    ? normalizeInventory(selectedVariation).inStock
    : getEffectiveProductAvailability(product);
    
  const canAddDirectly = !isVariable || Boolean(selectedVariation);

  const hasDiscount = Number(currentOriginalPrice) > Number(currentPrice) && Number(currentOriginalPrice) > 0;
  const discountPercentage = hasDiscount
    ? Math.round(((Number(currentOriginalPrice) - currentPrice) / Number(currentOriginalPrice)) * 100)
    : 0;
  const savings = hasDiscount ? Number(currentOriginalPrice) - currentPrice : 0;
  const highlights = useMemo(() => product.features?.filter(Boolean).slice(0, 3) || [], [product.features]);
  const categories = useMemo(() => product.categoryNames?.length ? product.categoryNames : product.category ? [product.category] : [], [product.categoryNames, product.category]);

  const descriptionText = useMemo(() => {
    return product.shortDescription || product.description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }, [product.shortDescription, product.description]);

  const ageGroupsText = useMemo(() => formatProductAgeGroups(product), [product]);

  const variationOptions = useMemo(() => {
    return activeVariations.map((variation, index) => ({
      id: variation.id,
      isVarAvailable: normalizeInventory(variation).inStock,
      label: getVariationDisplayLabel(variation, product.attributes || [], index)
    }));
  }, [activeVariations, product.attributes]);

  useEffect(() => () => {
    if (addTimerRef.current) clearTimeout(addTimerRef.current);
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
  }, []);

  const handlePrimaryAction = () => {
    if (!isAvailable || !canAddDirectly) {
      router.push(`/product/${product.slug}`);
      return;
    }
    if (cartActionLocked.current) return;
    cartActionLocked.current = true;
    setCartActionState('adding');
    addTimerRef.current = setTimeout(() => {
      if (selectedVariation) {
        addToCart(product, 1, JSON.stringify(selectedVariation.attributes), selectedVariation.id);
      } else {
        addToCart(product, 1);
      }

      trackAddToCart({
        id: product.id,
        name: product.name,
        price: currentPrice,
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

  return (
    <section aria-labelledby="product-spotlight-heading" className="mx-auto w-full max-w-7xl px-4 pt-16 pb-10 sm:px-6 sm:pt-20 sm:pb-14 lg:px-8 lg:pt-24">
      <div className="relative overflow-hidden rounded-[32px] border border-indigo-100 bg-linear-to-br from-indigo-950 via-indigo-900 to-fuchsia-900 p-5 shadow-[0_28px_70px_-30px_rgba(49,46,129,0.65)] sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-rose-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="relative grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          <Link href={`/product/${product.slug}`} className="group block w-full overflow-hidden rounded-[26px] shadow-xl relative aspect-square" aria-label={`View ${product.name}`}>
            <Image
              src={getSafeImageSrc(product.images?.[0], { width: 600 })}
              alt={product.name}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.025]"
              loading="lazy"
            />
          </Link>

          <div className="text-white">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-[11px] font-black uppercase tracking-[0.18em] backdrop-blur">
              <Sparkles className="h-4 w-4 text-amber-300" /> Featured pick
            </span>
            <h2 id="product-spotlight-heading" className="mt-5 font-heading text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">{product.name}</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-indigo-100 sm:text-base">{descriptionText}</p>

            <div className="mt-5 flex flex-wrap items-end gap-x-3 gap-y-2">
              <span className="font-heading text-3xl font-black text-white sm:text-4xl">{formatPrice(currentPrice, settings.currency)}</span>
              {hasDiscount && <span className="pb-1 text-base font-bold text-indigo-200 line-through">{formatPrice(Number(currentOriginalPrice), settings.currency)}</span>}
              {discountPercentage > 0 && <span className="mb-1 rounded-full bg-amber-300 px-3 py-1 text-xs font-black text-indigo-950">Save {discountPercentage}% · {formatPrice(savings, settings.currency)}</span>}
            </div>

            <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-indigo-100">
              {categories.slice(0, 2).map(category => <span key={category} className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5">{category}</span>)}
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5">{ageGroupsText}</span>
              <span className={`rounded-full px-3 py-1.5 ${isAvailable ? 'bg-emerald-400/20 text-emerald-100' : 'bg-rose-400/20 text-rose-100'}`}>{isAvailable ? 'In stock' : 'Currently unavailable'}</span>
            </div>

            {highlights.length > 0 && <ul className="mt-5 grid gap-2 text-sm text-indigo-50 sm:grid-cols-2">{highlights.map(highlight => <li key={highlight} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />{highlight}</li>)}</ul>}

            {isVariable && activeVariations.length > 0 && (
              <div className="mt-6">
                <div className="text-xs font-bold text-indigo-200 uppercase tracking-wider mb-3">Available Options</div>
                <div className="flex flex-wrap gap-2">
                  {variationOptions.map((opt) => {
                    const isSelected = selectedVariationId === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setSelectedVariationId(opt.id)}
                        disabled={!opt.isVarAvailable}
                        className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                          isSelected
                            ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-900/30'
                            : !opt.isVarAvailable
                            ? 'bg-white/5 border-white/10 text-white/40 cursor-not-allowed'
                            : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button type="button" disabled={(!isAvailable && canAddDirectly) || cartActionState !== 'idle'} aria-busy={cartActionState === 'adding'} onClick={handlePrimaryAction} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-rose-500 px-6 text-sm font-black text-white shadow-lg shadow-rose-950/30 transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-60">
                {cartActionState === 'adding' ? <Loader2 className="h-5 w-5 animate-spin" /> : cartActionState === 'added' ? <Check className="h-5 w-5" /> : canAddDirectly ? <ShoppingBag className="h-5 w-5" /> : <PackageCheck className="h-5 w-5" />}
                {cartActionState === 'adding' ? 'Adding...' : cartActionState === 'added' ? 'Added' : canAddDirectly ? isAvailable ? 'Add to Cart' : 'Out of Stock' : 'Choose Options'}
              </button>
              <Link href={`/product/${product.slug}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-6 text-sm font-black text-white backdrop-blur transition hover:bg-white/20">View Product <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

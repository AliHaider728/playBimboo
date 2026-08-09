"use client";
import React, { useEffect, useState, useMemo } from 'react';
import Link from "next/link";
import { useParams } from "next/navigation";

import {
  Star,
  ShoppingBag,
  Heart,
  ShieldCheck,
  Truck,
  RotateCcw,
  Check,
  Plus,
  Minus,
  MessageSquarePlus,
  Info,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Loader2
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { useToast } from '../../../context/ToastContext';
import { ProductCard } from '../../../components/common/ProductCard';
import { ProductImage } from '../../../components/common/ProductImage';
import { ReviewSummary } from '../../../components/common/ReviewSummary';
import { Breadcrumbs } from '../../../components/common/Breadcrumbs';

import { formatPrice } from '../../../utils/formatters';
import { useScrollLock } from '../../../hooks/useScrollLock';
import { api, getLastApiError } from '../../../services/api';
import {
  getEffectiveAvailableQuantity,
  getEffectiveProductAvailability,
  getAttributeTermLabel,
  formatProductAgeGroups,
  getProductCategoryNames,
  getProductDeliveryType,
  getVariationAttributeValue,
  isProductVisibleOnStorefront,
  isVariantOptionAvailable,
  normalizeInventory
} from '../../../utils/products';
import { ProductDetailContent } from '../../../components/product/ProductDetailContent';
import { Review } from '../../../types';
import { getSafeImageSrc } from '../../../utils/images';

const getPlainDescription = (description: string) =>
  description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

export const ProductDetailPageClient: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { products, productsLoading, addToCart, toggleWishlist, isInWishlist, refreshProducts, settings, submitCustomerReview } = useStore();
  const { showToast } = useToast();

  const product = products.find(
    p => (p.slug === slug || p.id === slug) && isProductVisibleOnStorefront(p)
  );

  // Gallery state
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [overrideImage, setOverrideImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'safety' | 'reviews'>('desc');
  const [cartActionState, setCartActionState] = useState<'idle' | 'adding' | 'added'>('idle');
  const cartActionLocked = React.useRef(false);
  const addTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState('50% 50%');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const lightboxRef = React.useRef<HTMLDivElement>(null);
  const lightboxCloseRef = React.useRef<HTMLButtonElement>(null);
  const lightboxTriggerRef = React.useRef<HTMLButtonElement>(null);

  useEffect(() => () => {
    if (addTimerRef.current) clearTimeout(addTimerRef.current);
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
  }, []);

  // Write review modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [sizeGuideModalOpen, setSizeGuideModalOpen] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newTitle, setNewTitle] = useState('');
  const [newComment, setNewComment] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [productReviews, setProductReviews] = useState<Review[]>([]);

  useScrollLock(lightboxOpen || sizeGuideModalOpen || reviewModalOpen);

  const [apiRelatedProducts, setApiRelatedProducts] = useState<any[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const loadRelatedProducts = async (productId: string) => {
    setRelatedLoading(true);
    try { const res = await api.getRelatedProducts(productId); setApiRelatedProducts(res || []); } catch(e) { console.error(e); setApiRelatedProducts([]); } finally { setRelatedLoading(false); }
  };
  const loadProductReviews = async (productId: string) => {
    const result = await api.getProductReviews(productId);
    if (!result) return;
    setProductReviews(result.map(review => ({
      ...review,
      id: String(review.id || review._id || ''),
      productId: String(review.productId || productId),
      reviewerName: String(review.reviewerName || review.authorName || 'PlayBimboo customer'),
      rating: Number(review.rating || 0),
      createdAt: String((review as any).createdAt || (review as any).date || '').slice(0, 10),
      title: String(review.title || ''),
      status: review.status || 'approved',
      content: String(review.content || review.comment || ''),
      verifiedPurchase: Boolean(review.verifiedPurchase),
      source: review.source || 'customer'
    })));
  };

  useEffect(() => {
    if (product?.id) { void loadProductReviews(product.id); void loadRelatedProducts(product.id); }
  }, [product?.id]);

  // Reset ALL per-product local state when navigating between products via client-side routing.
  // React Router reuses the same component instance for /product/:slug routes, so state
  // from the previous product leaks into the next one unless explicitly reset here.
  useEffect(() => {
    if (!product?.id) return;
    // Gallery state — this was the confirmed root cause of the stale image bug
    setActiveImageIndex(0);
    setOverrideImage(null);
    // Quantity & variant selections
    setQuantity(1);
    setSelectedVariants({});
    // Cart CTA button state
    setCartActionState('idle');
    cartActionLocked.current = false;
    if (addTimerRef.current) { clearTimeout(addTimerRef.current); addTimerRef.current = null; }
    if (resetTimerRef.current) { clearTimeout(resetTimerRef.current); resetTimerRef.current = null; }
    // Gallery zoom & lightbox
    setIsZooming(false);
    setZoomOrigin('50% 50%');
    setLightboxOpen(false);
    setLightboxIndex(0);
    // Modals
    setReviewModalOpen(false);
    setSizeGuideModalOpen(false);
    // Write-review form
    setNewRating(5);
    setNewTitle('');
    setNewComment('');
    setNewUserName('');
    // Reset tab to default (tab availability effect will correct it if needed)
    setActiveTab('desc');
    // Show skeleton again for related products on next product
    setRelatedLoading(true);
    setApiRelatedProducts([]);
  }, [product?.id]);

  const sanitizedSpecs = useMemo(() => Object.entries(product?.specifications || {}).filter(
    ([key, val]) => key.trim() !== '' && typeof val === 'string' && val.trim() !== ''
  ), [product?.specifications]);

  const hasDesc = useMemo(() => Boolean((product?.productDetailBlocks || []).filter(b => b.enabled).length > 0 || product?.description || product?.productDetailCustomCss), [product?.productDetailBlocks, product?.description, product?.productDetailCustomCss]);
  const hasSpecs = useMemo(() => Boolean(sanitizedSpecs.length > 0), [sanitizedSpecs]);
  const hasSafety = useMemo(() => Boolean(
    (product?.safetyInfo && product.safetyInfo.trim() !== '') ||
    (product?.specifications?.Material && product.specifications.Material.trim() !== '') ||
    (product?.specifications?.['Safety Notes'] && product.specifications['Safety Notes'].trim() !== '') ||
    sanitizedSpecs.some(([key]) => key.toLowerCase().includes('safety') || key.toLowerCase().includes('material'))
  ), [product?.safetyInfo, product?.specifications, sanitizedSpecs]);
  
  const approvedReviews = useMemo(() => productReviews.filter(r => r.status === 'approved'), [productReviews]);
  const hasReviews = useMemo(() => Boolean(approvedReviews.length > 0), [approvedReviews]);
  
  const availableTabs = useMemo(() => [
    hasDesc && 'desc',
    hasSpecs && 'specs',
    hasSafety && 'safety',
    'reviews'
  ].filter(Boolean) as string[], [hasDesc, hasSpecs, hasSafety]);

  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0] as any);
    }
  }, [hasDesc, hasSpecs, hasSafety, hasReviews]);

  // Size Guide Focus Trap
  const sizeGuideRef = React.useRef<HTMLDivElement>(null);
  const sizeGuideTriggerRef = React.useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (sizeGuideModalOpen) {
      const modal = sizeGuideRef.current;
      if (!modal) return;
      const focusableElements = modal.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement?.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement?.focus();
            }
          }
        }
      };

      modal.addEventListener('keydown', handleKeyDown);
      firstElement?.focus();

      return () => {
        modal.removeEventListener('keydown', handleKeyDown);
        sizeGuideTriggerRef.current?.focus();
      };
    }
  }, [sizeGuideModalOpen]);

  useEffect(() => {
    if (product?.productType !== 'variable') {
      setSelectedAttributes({});
      return;
    }

    const enabledVariations = (product.variations || []).filter(variation => variation.enabled);
    const selectedDefault = enabledVariations.find(variation =>
      Boolean(product.defaultVariationId) && variation.id === product.defaultVariationId
    ) || enabledVariations.find(variation =>
      Object.keys(product.defaultAttributes || {}).length > 0 &&
      Object.entries(product.defaultAttributes || {}).every(
        ([key, value]) => variation.attributes[key] === value
      )
    );

    setSelectedAttributes(selectedDefault ? { ...selectedDefault.attributes } : {});
  }, [product?.id, product?.defaultVariationId]);

  const isVariable = product?.productType === 'variable';
  const variationAttributes = useMemo(() => (product?.attributes || []).filter(attribute => attribute.usedForVariations), [product?.attributes]);
  const currentVariation = useMemo(() => isVariable
    ? product?.variations?.find(variation => {
        if (!variation.enabled) return false;
        return variationAttributes.length > 0 && variationAttributes.every(attribute => {
          const selectedValue = selectedAttributes[attribute.slug];
          return Boolean(selectedValue) && getVariationAttributeValue(variation, attribute) === selectedValue;
        });
      })
    : undefined, [isVariable, product?.variations, variationAttributes, selectedAttributes]);

  useEffect(() => {
    if (!isVariable) return;

    let isCurrent = true;
    const variationImageUrl = currentVariation?.image?.url;
    setOverrideImage(null);
    setActiveImageIndex(0);

    if (variationImageUrl) {
      setOverrideImage(variationImageUrl);
    }

    return () => {
      isCurrent = false;
    };
  }, [currentVariation?.id, isVariable]);

  const lightboxImages = useMemo(() => product
    ? overrideImage && !product.images.includes(overrideImage)
      ? [overrideImage, ...product.images]
      : product.images
    : [], [product?.images, overrideImage]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const modal = lightboxRef.current;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightboxOpen(false);
      if (event.key === 'ArrowLeft' && lightboxImages.length > 1) {
        setLightboxIndex(index => (index - 1 + lightboxImages.length) % lightboxImages.length);
      }
      if (event.key === 'ArrowRight' && lightboxImages.length > 1) {
        setLightboxIndex(index => (index + 1) % lightboxImages.length);
      }
      if (event.key === 'Tab' && modal) {
        const controls = [...modal.querySelectorAll<HTMLElement>('button:not([disabled])')];
        if (controls.length === 0) return;
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    lightboxCloseRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      lightboxTriggerRef.current?.focus();
    };
  }, [lightboxOpen, lightboxImages.length]);

  if (productsLoading && !product) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <Loader2 className="h-10 w-10 animate-spin text-rose-500" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="font-heading font-black text-2xl text-slate-800 mb-2">Toy Not Found</h2>
        <p className="text-sm text-slate-500 mb-6">The toy you are looking for might have moved to another playhouse.</p>
        <Link href="/category/all" className="px-6 py-3 rounded-2xl bg-rose-500 text-white font-heading font-bold text-sm">
          Explore All Toys
        </Link>
      </div>
    );
  }

  const flatRate = settings.flatDeliveryRate ?? settings.standardShippingFee;
  const productDeliveryType = getProductDeliveryType(product);
  const deliveryFee = productDeliveryType === 'fixed'
    ? (product.customDeliveryFee ?? flatRate)
    : productDeliveryType === 'free'
    ? 0
    : flatRate;

  const isWishlisted = isInWishlist(product.id);


  let currentPrice = product.price;
  let currentOriginalPrice = product.originalPrice;
  let totalVariantOffset = 0;

  if (isVariable) {
    if (currentVariation) {
      currentPrice = currentVariation.salePrice !== undefined && currentVariation.salePrice !== null ? currentVariation.salePrice : currentVariation.regularPrice;
      currentOriginalPrice = currentVariation.salePrice !== undefined && currentVariation.salePrice !== null ? currentVariation.regularPrice : undefined;
    } else {
       // Find minimum price for 'From Rs. X' display later
       const allPrices = (product.variations || []).map(v => v.salePrice !== undefined && v.salePrice !== null ? v.salePrice : v.regularPrice);
       currentPrice = allPrices.length > 0 ? Math.min(...allPrices) : product.price;
    }
  } else {
    totalVariantOffset = product.variants
      ? product.variants.reduce((sum, group) => {
          const selectedOptName = selectedVariants[group.name];
          if (!selectedOptName) return sum;
          const foundOpt = group.options.find(o => o.name === selectedOptName);
          return sum + (foundOpt?.priceOffset || 0);
        }, 0)
      : 0;
    currentPrice = product.price + totalVariantOffset;
  }

  const variantGroups = (product.variants || []).filter(group => group.options.length > 0);
  const allVariantsSelected = isVariable
    ? variationAttributes.length > 0 && variationAttributes.every(attr => Boolean(selectedAttributes[attr.slug]))
    : variantGroups.every(group => Boolean(selectedVariants[group.name]));

  const effectiveAvailable = isVariable
    ? getEffectiveProductAvailability(product, selectedAttributes)
    : getEffectiveProductAvailability(product, selectedVariants);

  const selectedVariantStock = isVariable
    ? getEffectiveAvailableQuantity(product, selectedAttributes)
    : getEffectiveAvailableQuantity(product, selectedVariants);

  const canPurchase =
    effectiveAvailable &&
    productDeliveryType !== 'none' &&
    allVariantsSelected &&
    (selectedVariantStock === undefined || quantity <= selectedVariantStock);

  const handleVariantSelect = (groupName: string, optionName: string) => {
    setSelectedVariants(prev => ({ ...prev, [groupName]: optionName }));
  };

  const handleAttributeSelect = (slug: string, value: string) => {
    setSelectedAttributes(prev => ({ ...prev, [slug]: value }));
  };

  const formattedVariantString = Object.entries(selectedVariants)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');

  const handleAddToCart = () => {
    if (!allVariantsSelected) {
      showToast('Please select every product option before adding to cart.', 'error');
      return;
    }
    if (!canPurchase) {
      showToast('This product option is currently out of stock or unavailable for delivery.', 'error');
      return;
    }
    if (cartActionLocked.current) return;
    cartActionLocked.current = true;
    setCartActionState('adding');
    addTimerRef.current = setTimeout(() => {
      if (isVariable) {
        addToCart({ ...product, price: currentPrice }, quantity, undefined, currentVariation?.id);
      } else {
        const productToCart = totalVariantOffset ? { ...product, price: currentPrice } : product;
        addToCart(productToCart, quantity, formattedVariantString || undefined);
      }
      showToast(`Added ${quantity} x ${product.name} to cart.`, 'success');
      setCartActionState('added');
      resetTimerRef.current = setTimeout(() => {
        cartActionLocked.current = false;
        setCartActionState('idle');
      }, 900);
    }, 180);
  };

  const handleToggleWishlist = () => {
    toggleWishlist(product.id);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newComment) return;
    try {
      const result = await submitCustomerReview({
        productId: product.id,
        reviewerName: newUserName,
        rating: newRating,
        content: newComment,
        verifiedPurchase: false, // Defaulting to false for public submissions
        title: newTitle
      });
      if (!result.success) throw new Error(result.message || 'Review submission failed.');
      // After submission, it goes to pending, so it won't show up immediately for customers anyway
      // But we still refresh the products to update any stats if needed
      await refreshProducts();
      showToast('Thank you! Your review has been submitted and is awaiting approval.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Review submission failed.', 'error');
      return;
    } finally {
      setReviewModalOpen(false);
      setNewTitle('');
      setNewComment('');
      setNewUserName('');
    }
  };

  const breadcrumbItems = [
    ...(product.category && product.categorySlug
      ? [{ label: product.category, path: `/category/${product.categorySlug}` }]
      : []),
    { label: product.name }
  ];
  const activeImageUrl = overrideImage || product.images[activeImageIndex] || product.images[0];
  const openLightbox = () => {
    const selectedIndex = lightboxImages.indexOf(activeImageUrl);
    setLightboxIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setLightboxOpen(true);
  };
  const handleZoomPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== 'mouse' || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((event.clientX - bounds.left) / bounds.width) * 100));
    const y = Math.min(100, Math.max(0, ((event.clientY - bounds.top) / bounds.height) * 100));
    setZoomOrigin(`${x}% ${y}%`);
    setIsZooming(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-4 font-sans sm:py-6 overflow-x-hidden">
      

      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={breadcrumbItems} />

        {/* Top Detail Section: Gallery + Product Info */}
        <div className="mb-5 grid grid-cols-1 items-start gap-5 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6 lg:grid-cols-12 lg:gap-8">
          {/* Left Column: Image Gallery */}
          <div className="self-start space-y-2.5 lg:col-span-6">
            {/* Main Preview Image with Hover Zoom Effect */}
            <button
              ref={lightboxTriggerRef}
              type="button"
              onClick={openLightbox}
              onPointerMove={handleZoomPointerMove}
              onPointerLeave={() => { setIsZooming(false); setZoomOrigin('50% 50%'); }}
              className="group/gallery relative flex aspect-square w-full cursor-zoom-in items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2"
              aria-label={`Enlarge ${product.name} image`}
            >
              <img
                src={getSafeImageSrc(activeImageUrl)}
                alt={product.name}
                style={{ transformOrigin: zoomOrigin }}
                className={`h-full w-full object-contain object-center transition-transform duration-200 ease-out motion-reduce:transition-none ${isZooming ? 'scale-[1.75]' : 'scale-100'}`}
              />
              <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-slate-950/70 px-3 py-1.5 text-[10px] font-bold text-white opacity-0 backdrop-blur transition-opacity group-hover/gallery:opacity-100"><ZoomIn className="h-3.5 w-3.5" /> Click to enlarge</span>
              {(product.discountPercent ?? 0) > 0 && (
                <span className="absolute top-4 left-4 z-10 bg-rose-500 text-white font-heading font-extrabold text-xs px-3 py-1.5 rounded-full shadow-md">
                  -{product.discountPercent}% OFF
                </span>
              )}
            </button>

            {/* Gallery Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {product.images.map((img, idx) => (
                  <button
                    key={`${img}-${idx}`}
                    type="button"
                    onClick={() => {
                      setActiveImageIndex(idx);
                      setOverrideImage(null);
                    }}
                    aria-label={`Show ${product.name} image ${idx + 1}`}
                    aria-current={!overrideImage && activeImageIndex === idx ? 'true' : undefined}
                    className={`relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 sm:h-20 sm:w-20 ${
                      (!overrideImage && activeImageIndex === idx) ? 'border-rose-500 bg-rose-50 shadow-sm' : 'border-slate-200 bg-white opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img src={getSafeImageSrc(img)} alt={`${product.name} thumbnail ${idx + 1}`} className="h-full w-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Product Information & Buy Panel */}
          <div className="self-start lg:col-span-6">
            <div>
              {/* Category & Brand Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-500 bg-rose-50 px-3 py-1 rounded-full">
                    {product.brand}
                  </span>
                  {(product.soldCount ?? 0) >= 50 && (
                    <span className="text-xs font-bold tracking-wider text-white bg-orange-500 px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                      🔥 {product.soldCount}+ Sold
                    </span>
                  )}
                </div>
                <ReviewSummary rating={product.rating} reviewCount={product.reviewCount} />
              </div>

              {/* Product Title */}
              <h1 className="mb-3 font-heading text-2xl font-black leading-tight text-slate-900 sm:text-3xl">
                {product.name}
              </h1>

              <div className="mb-3 grid gap-1.5 rounded-2xl border border-slate-100 bg-slate-50/70 px-3 py-2.5 text-xs sm:grid-cols-2" aria-label="Product categories and recommended age groups">
                <div><span className="font-black text-slate-700">Categories: </span><span className="font-semibold text-sky-700">{getProductCategoryNames(product).join(', ') || 'Uncategorized'}</span></div>
                <div><span className="font-black text-slate-700">Age: </span><span className="font-semibold text-indigo-700">{formatProductAgeGroups(product).replace(/^Ages\s*/i, '')}</span></div>
              </div>

              {/* Price & Stock */}
              <div className="mb-3 flex flex-col items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                <div>
                  <div className="flex items-baseline gap-3">
                    <span className="font-heading text-2xl font-black text-slate-900 sm:text-3xl">
                      {formatPrice(currentPrice, settings.currency)}
                    </span>
                    {(product.originalPrice ?? 0) > 0 && (
                      <span className="text-base text-slate-400 line-through font-semibold">
                        {formatPrice(product.originalPrice, settings.currency)}
                      </span>
                    )}
                  </div>
                  {(product.discountPercent ?? 0) > 0 && (
                    <span className="text-xs font-bold text-emerald-600">
                      You save {formatPrice(product.originalPrice! - currentPrice, settings.currency)} ({product.discountPercent}% discount)
                    </span>
                  )}
                </div>

                <div className="text-left sm:text-right">
                  <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold ${
                    ((isVariable ? (product.attributes?.length || 0) > 0 : variantGroups.length > 0) && !allVariantsSelected)
                      ? 'bg-amber-100 text-amber-800'
                      : effectiveAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      ((isVariable ? (product.attributes?.length || 0) > 0 : variantGroups.length > 0) && !allVariantsSelected)
                        ? 'bg-amber-500'
                        : effectiveAvailable ? 'bg-emerald-500' : 'bg-rose-500'
                    }`} />
                    {((isVariable ? (product.attributes?.length || 0) > 0 : variantGroups.length > 0) && !allVariantsSelected)
                      ? 'Select options to check stock'
                      : !effectiveAvailable
                      ? 'Out of Stock'
                      : selectedVariantStock === undefined ? 'In Stock' : `In Stock (${selectedVariantStock} left)`}
                  </span>
                </div>
              </div>

              {/* Delivery Charge Info Badge */}
              <div className="mb-3 flex items-center gap-2.5 rounded-2xl border border-sky-100 bg-sky-50 p-3 text-xs font-semibold text-sky-900">
                <Truck className="w-4 h-4 text-sky-600 shrink-0" />
                <span>
                  Delivery Fee:{' '}
                  {productDeliveryType === 'none' ? (
                    <strong className="text-rose-600">Delivery unavailable</strong>
                  ) : deliveryFee === 0 ? (
                    <strong className="text-emerald-600">FREE Delivery</strong>
                  ) : (
                    <strong>{formatPrice(deliveryFee, settings.currency)}</strong>
                  )}
                  {productDeliveryType === 'store_threshold' && settings.freeShippingThreshold > 0 && deliveryFee > 0 && (
                    <span className="block sm:inline text-sky-700 font-normal ml-1">
                      (Free delivery on total orders above {formatPrice(settings.freeShippingThreshold, settings.currency)})
                    </span>
                  )}
                </span>
              </div>

              {/* Description snippet */}
              <p className="mb-3 font-sans text-sm leading-relaxed text-slate-600">
                {product.shortDescription || getPlainDescription(product.description).slice(0, 240)}
              </p>

              {/* Product Attributes (New Variable Workflow) */}
              {isVariable && product.attributes && product.attributes.length > 0 && (
                <div className="mb-3 space-y-3 border-t border-slate-100 pt-3">
                  <div className="mb-1.5 flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900">Options</h4>
                    {product.sizeGuide && (
                      <button 
                        ref={sizeGuideTriggerRef}
                        onClick={() => setSizeGuideModalOpen(true)} 
                        className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <Info className="w-3.5 h-3.5" /> Size Guide
                      </button>
                    )}
                  </div>
                  {product.attributes.map((attr) => {
                    if (!attr.visible) return null;
                    const displayType = attr.source === 'global' ? (attr.displayTypeOverride || attr.displayType) : attr.displayType;
                    const terms = attr.source === 'global' 
                      ? attr.terms.filter(t => (attr.selectedTermIds || []).includes(t.id))
                      : attr.terms;
                    const selectedValue = selectedAttributes[attr.slug] || '';
                    const selectedLabel = getAttributeTermLabel(attr, selectedValue);
                    const isTermInStock = (termValue: string) => product.variations?.some(variation => {
                      if (!variation.enabled || !normalizeInventory(variation).inStock) return false;
                      return variationAttributes.every(candidateAttribute => {
                        const expectedValue = candidateAttribute.slug === attr.slug
                          ? termValue
                          : selectedAttributes[candidateAttribute.slug];
                        return !expectedValue || getVariationAttributeValue(variation, candidateAttribute) === expectedValue;
                      });
                    }) ?? false;

                    return (
                      <div key={attr.id || attr.slug} className="space-y-2">
                        <label className="text-xs font-heading font-extrabold text-slate-800 uppercase tracking-wider block">
                          Select {attr.name}:
                          <span className="ml-1 font-medium normal-case text-slate-600">
                            {selectedLabel || 'Choose an option'}
                          </span>
                        </label>

                        {displayType === 'dropdown' ? (
                          <select
                            value={selectedAttributes[attr.slug] || ''}
                            onChange={(e) => handleAttributeSelect(attr.slug, e.target.value)}
                            className="w-full sm:w-64 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                          >
                            <option value="" disabled>Choose {attr.name}</option>
                            {terms.map(t => <option key={t.id} value={t.value}>{t.label}</option>)}
                          </select>
                        ) : displayType === 'radio' ? (
                          <div className="space-y-1">
                            {terms.map((t) => (
                              <label key={t.id} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name={attr.slug}
                                  value={t.value}
                                  checked={selectedAttributes[attr.slug] === t.value}
                                  onChange={() => handleAttributeSelect(attr.slug, t.value)}
                                  className="text-rose-500 focus:ring-rose-500"
                                />
                                <span className="text-sm font-medium text-slate-700">{t.label}</span>
                              </label>
                            ))}
                          </div>
                        ) : displayType === 'color_swatches' ? (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {terms.map((t) => {
                              const isSelected = selectedValue === t.value;
                              const isOptionInStock = isTermInStock(t.value);
                              return (
                                <button
                                  key={t.id}
                                  type="button"
                                  title={`${attr.name}: ${t.label}`}
                                  aria-label={`${attr.name}: ${t.label}${!isOptionInStock ? ' (out of stock)' : ''}`}
                                  aria-pressed={isSelected}
                                  disabled={!isOptionInStock}
                                  onClick={() => handleAttributeSelect(attr.slug, t.value)}
                                  className={`group/swatch flex min-w-[72px] items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition-all ${
                                    !isOptionInStock
                                      ? 'cursor-not-allowed border-slate-200 opacity-40'
                                      : isSelected
                                      ? 'border-slate-900 bg-slate-50 shadow-sm ring-1 ring-slate-900'
                                      : 'border-slate-200 bg-white hover:border-slate-400'
                                  }`}
                                >
                                  <span
                                    className="relative h-6 w-6 shrink-0 rounded-full border border-black/10 shadow-inner"
                                    style={{ backgroundColor: t.colorValue || t.value || '#cbd5e1' }}
                                    aria-hidden="true"
                                  >
                                  {!isOptionInStock && (
                                      <span className="absolute inset-0 m-auto h-[2px] w-full origin-center rotate-45 bg-slate-500" />
                                  )}
                                  </span>
                                  <span className="max-w-24 truncate text-xs font-bold text-slate-700">{t.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        ) : displayType === 'image_swatches' ? (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {terms.map((t) => {
                              const isSelected = selectedValue === t.value;
                              const isOptionInStock = isTermInStock(t.value);
                              return (
                                <button
                                  key={t.id}
                                  type="button"
                                  title={t.label}
                                  aria-label={`${attr.name}: ${t.label}${!isOptionInStock ? ' (out of stock)' : ''}`}
                                  aria-pressed={isSelected}
                                  disabled={!isOptionInStock}
                                  onClick={() => handleAttributeSelect(attr.slug, t.value)}
                                  className={`relative w-12 h-12 rounded-xl border-2 overflow-hidden transition-all flex items-center justify-center p-0.5 bg-slate-50 ${
                                    !isOptionInStock
                                      ? 'border-slate-200 opacity-50 cursor-not-allowed'
                                      : isSelected
                                      ? 'border-rose-500 shadow-md ring-2 ring-rose-200 ring-offset-1'
                                      : 'border-slate-200 hover:border-slate-300'
                                  }`}
                                >
                                  {t.imageUrl ? (
                                    <ProductImage src={t.imageUrl} alt={t.label} className="w-full h-full object-contain" wrapperClassName="w-full h-full" />
                                  ) : (
                                    <span className="text-[10px] font-bold text-slate-400 block p-1 text-center leading-tight">No Img</span>
                                  )}
                                  {!isOptionInStock && (
                                    <div className="absolute inset-0 m-auto w-full h-[2px] bg-slate-400 rotate-45 transform origin-center" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          // Default to Text Buttons
                          <div className="flex flex-wrap gap-2">
                            {terms.map((t) => {
                              const isSelected = selectedValue === t.value;
                              const isOptionInStock = isTermInStock(t.value);
                              return (
                                <button
                                  key={t.id}
                                  type="button"
                                  aria-pressed={isSelected}
                                  aria-label={`${attr.name}: ${t.label}${!isOptionInStock ? ' (out of stock)' : ''}`}
                                  disabled={!isOptionInStock}
                                  onClick={() => handleAttributeSelect(attr.slug, t.value)}
                                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                    !isOptionInStock
                                      ? 'bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60 line-through'
                                      : isSelected
                                      ? 'bg-slate-800 text-white shadow-sm ring-2 ring-slate-800 ring-offset-1'
                                      : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                                  }`}
                                >
                                  {t.label}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Legacy Product Variants Selection */}
              {!isVariable && product.variants && product.variants.length > 0 && (
                <div className="mb-3 space-y-3 border-t border-slate-100 pt-3">
                  {product.variants.map((vGroup) => (
                    <div key={vGroup.id || vGroup.name} className="space-y-2">
                      <label className="text-xs font-heading font-extrabold text-slate-800 uppercase tracking-wider block">
                        Select {vGroup.name}:
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {vGroup.options.map((opt) => {
                          const isSelected = selectedVariants[vGroup.name] === opt.name;
                          const isOptionInStock = isVariantOptionAvailable(opt);
                          return (
                            <button
                              key={opt.id || opt.name}
                              type="button"
                              aria-pressed={isSelected}
                              aria-label={`${vGroup.name}: ${opt.name}${!isOptionInStock ? ' (out of stock)' : ''}`}
                              disabled={!isOptionInStock}
                              onClick={() => handleVariantSelect(vGroup.name, opt.name)}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                !isOptionInStock
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60 line-through'
                                  : isSelected
                                  ? 'bg-rose-500 text-white ring-2 ring-rose-200 shadow-sm'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              {opt.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quantity Stepper & Add to Cart */}
              <div className="space-y-3 border-t border-slate-100 pt-3">
                <div className="flex items-center gap-3">
                  <span className="font-heading font-bold text-xs text-slate-700 uppercase">Quantity:</span>
                  <div className="flex items-center border border-slate-200 rounded-2xl bg-slate-50 p-1">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 text-slate-600 hover:bg-white rounded-xl transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <output aria-live="polite" className="px-4 font-heading text-sm font-bold text-slate-800">{quantity}</output>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-2 text-slate-600 hover:bg-white rounded-xl transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex w-full gap-2">
                  {/* WhatsApp Button */}
                  <a
                    href={`https://wa.me/923107172222?text=${encodeURIComponent(`Hello, I am interested in this product:\nProduct: ${product.name}\nPrice: ${formatPrice(currentPrice, settings.currency)}\nLink: ${(typeof window !== 'undefined' ? window.location.origin : '')}/product/${product.slug}${Object.keys(selectedVariants).length > 0 ? `\nVariant: ${Object.values(selectedVariants).join(', ')}` : Object.values(selectedAttributes).filter(Boolean).length > 0 ? `\nOption: ${Object.values(selectedAttributes).filter(Boolean).join(', ')}` : ''}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-12 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#25D366]/10 text-[#25D366] shadow-sm transition-colors hover:bg-[#25D366] hover:text-white sm:w-16"
                    title="Order via WhatsApp"
                    aria-label={`Order ${product.name} via WhatsApp`}
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                  </a>
                  
                  {/* Add to Cart CTA Button with bounce micro-interaction */}
                  <button
                    onClick={handleAddToCart}
                    disabled={!canPurchase || cartActionState !== 'idle'}
                    aria-busy={cartActionState === 'adding'}
                    className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl font-heading text-sm font-extrabold shadow-xl transition-all duration-300 active:scale-95 sm:text-base ${
                      cartActionState === 'added'
                        ? 'bg-emerald-500 text-white shadow-emerald-200'
                        : !canPurchase
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-200/80 hover:scale-[1.01]'
                    }`}
                  >
                    {cartActionState === 'added' ? (
                      <>
                        <Check className="w-5 h-5" />
                        <span>Added!</span>
                      </>
                    ) : cartActionState === 'adding' ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Adding...</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-5 h-5" />
                        <span>{!allVariantsSelected ? 'Select Options' : !canPurchase ? 'Sold Out' : `Add - ${formatPrice(currentPrice * quantity, settings.currency)}`}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Micro Guarantees */}
            <div className="grid grid-cols-3 gap-1.5 border-t border-slate-100 pt-3 text-center text-[10px] text-slate-500 sm:gap-3 sm:text-xs">
              <div className="rounded-2xl bg-slate-50 p-2 sm:p-2.5">
                <Truck className="w-4 h-4 mx-auto text-sky-500 mb-1" />
                <span>Cash on Delivery</span>
              </div>
              <div className="rounded-2xl bg-slate-50 p-2 sm:p-2.5">
                <ShieldCheck className="w-4 h-4 mx-auto text-emerald-500 mb-1" />
                <span>100% Child Safe</span>
              </div>
              <div className="rounded-2xl bg-slate-50 p-2 sm:p-2.5">
                <RotateCcw className="w-4 h-4 mx-auto text-amber-500 mb-1" />
                <span>Easy 7-Day Returns</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Information Tabs */}
        <div className="mb-8 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
          {availableTabs.length > 1 && (
            <div className="mb-5 flex gap-4 overflow-x-auto whitespace-nowrap border-b border-slate-200 scrollbar-hide sm:gap-8" role="tablist" aria-label="Product information">
              {availableTabs.includes('desc') && (
                <button
                  onClick={() => setActiveTab('desc')}
                  role="tab"
                  aria-selected={activeTab === 'desc'}
                  aria-controls="product-panel-desc"
                  className={`pb-3 font-heading font-bold text-xs sm:text-sm uppercase tracking-wider border-b-2 transition-colors ${
                    activeTab === 'desc' ? 'border-rose-500 text-rose-500' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Description & Features
                </button>
              )}
              {availableTabs.includes('specs') && (
                <button
                  onClick={() => setActiveTab('specs')}
                  role="tab"
                  aria-selected={activeTab === 'specs'}
                  aria-controls="product-panel-specs"
                  className={`pb-3 font-heading font-bold text-xs sm:text-sm uppercase tracking-wider border-b-2 transition-colors ${
                    activeTab === 'specs' ? 'border-rose-500 text-rose-500' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Specifications
                </button>
              )}
              {availableTabs.includes('safety') && (
                <button
                  onClick={() => setActiveTab('safety')}
                  role="tab"
                  aria-selected={activeTab === 'safety'}
                  aria-controls="product-panel-safety"
                  className={`pb-3 font-heading font-bold text-xs sm:text-sm uppercase tracking-wider border-b-2 transition-colors ${
                    activeTab === 'safety' ? 'border-rose-500 text-rose-500' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Safety & Material Info
                </button>
              )}
              {availableTabs.includes('reviews') && (
                <button
                  onClick={() => setActiveTab('reviews')}
                  role="tab"
                  aria-selected={activeTab === 'reviews'}
                  aria-controls="product-panel-reviews"
                  className={`pb-3 font-heading font-bold text-xs sm:text-sm uppercase tracking-wider border-b-2 transition-colors ${
                    activeTab === 'reviews' ? 'border-rose-500 text-rose-500' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Customer Reviews ({approvedReviews.length})
                </button>
              )}
            </div>
          )}

          {/* Tab 1: Description & Features */}
          {activeTab === 'desc' && (
            <div id="product-panel-desc" role="tabpanel" className="space-y-4 text-sm leading-relaxed text-slate-700">
              {(product.productDetailBlocks || []).filter(b => b.enabled).length > 0 ? (
                <ProductDetailContent product={product} />
              ) : (
                <>
                  {product.description && (
                    <div
                      className="max-w-none space-y-4 leading-7 whitespace-pre-wrap [&_a]:text-sky-600 [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-slate-200 [&_blockquote]:pl-4 [&_h1]:mt-7 [&_h1]:text-2xl [&_h1]:font-black [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-black [&_h3]:mt-5 [&_h3]:text-lg [&_h3]:font-bold [&_img]:h-auto [&_img]:max-w-full [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_table]:border-collapse [&_td]:border [&_td]:border-slate-200 [&_td]:p-2 [&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:p-2 [&_ul]:list-disc [&_ul]:pl-6"
                      dangerouslySetInnerHTML={{ __html: product.description }}
                    />
                  )}
                  {product.features && product.features.length > 0 && (
                    <>
                      <h4 className="font-heading font-bold text-sm text-slate-900 pt-2">Key Highlights:</h4>
                      <ul className="space-y-2 list-disc list-inside text-slate-600">
                        {product.features.map((feat, i) => (
                          <li key={i}>{feat}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* Tab 2: Specs */}
          {activeTab === 'specs' && (
            <div id="product-panel-specs" role="tabpanel" className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              {sanitizedSpecs.map(([key, val]) => (
                <div key={key} className="p-3.5 rounded-2xl bg-slate-50 flex justify-between">
                  <span className="font-bold text-slate-600">{key}:</span>
                  <span className="text-slate-900 font-medium">{val}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tab 3: Safety */}
          {activeTab === 'safety' && (
            <div id="product-panel-safety" role="tabpanel" className="space-y-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-950">
              <div className="flex items-center gap-2 font-heading font-bold text-emerald-800">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Certified Child-Safe Standards</span>
              </div>
              <p className="text-emerald-900 leading-relaxed">{product.safetyInfo}</p>
            </div>
          )}

          {/* Tab 4: Reviews Section */}
          {activeTab === 'reviews' && (
            <div id="product-panel-reviews" role="tabpanel" className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50">
                <div>
                  <h4 className="font-heading font-bold text-base text-slate-900">
                    Customer Experience & Reviews
                  </h4>
                  <div className="mt-1"><ReviewSummary rating={product.rating} reviewCount={product.reviewCount} /></div>
                </div>
                <button
                  onClick={() => setReviewModalOpen(true)}
                  className="px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-heading font-bold text-xs flex items-center gap-2 shadow-sm"
                >
                  <MessageSquarePlus className="w-4 h-4 text-amber-400" />
                  <span>Write a Review</span>
                </button>
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                {approvedReviews.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-6">
                    Be the first parent to review this toy!
                  </p>
                ) : (
                  approvedReviews.map(review => (
                    <div key={review.id} className="p-4 rounded-2xl border border-slate-100 bg-white space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-slate-100">
                            <img src={review.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.reviewerName)}&background=random`} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-800">{review.reviewerName}</span>
                              {review.verifiedPurchase && (
                                <span className="flex items-center text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full font-medium">
                                  <ShieldCheck className="w-3 h-3 mr-0.5" /> Verified
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400">{review.createdAt}</span>
                          </div>
                        </div>

                        <div className="flex text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-amber-400' : 'text-slate-200'}`}
                            />
                          ))}
                        </div>
                      </div>

                      <h5 className="font-heading font-bold text-xs text-slate-900">{review.title}</h5>
                      <p className="text-xs text-slate-600 leading-relaxed">{review.content}</p>

                      {review.imageUrl && (
                        <div className="mt-3">
                          <img 
                            src={review.imageUrl} 
                            alt="Customer review photo" 
                            className="w-24 h-24 object-cover rounded-xl border border-slate-100 cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
                            onClick={() => window.open(review.imageUrl, '_blank')}
                          />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

      </div>

      {lightboxOpen && lightboxImages.length > 0 && (
        <div
          ref={lightboxRef}
          role="dialog"
          aria-modal="true"
          aria-label={`${product.name} image gallery`}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/90 p-3 backdrop-blur-md sm:p-6"
          onMouseDown={event => { if (event.target === event.currentTarget) setLightboxOpen(false); }}
        >
          <button ref={lightboxCloseRef} type="button" onClick={() => setLightboxOpen(false)} className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" aria-label="Close image gallery"><X className="h-6 w-6" /></button>
          {lightboxImages.length > 1 && <button type="button" onClick={() => setLightboxIndex(index => (index - 1 + lightboxImages.length) % lightboxImages.length)} className="absolute left-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:left-6" aria-label="Previous product image"><ChevronLeft className="h-7 w-7" /></button>}
          <img src={getSafeImageSrc(lightboxImages[lightboxIndex])} alt={`${product.name} image ${lightboxIndex + 1} of ${lightboxImages.length}`} className="max-h-[88vh] max-w-[92vw] object-contain" />
          {lightboxImages.length > 1 && <button type="button" onClick={() => setLightboxIndex(index => (index + 1) % lightboxImages.length)} className="absolute right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-6" aria-label="Next product image"><ChevronRight className="h-7 w-7" /></button>}
          <span className="absolute bottom-4 rounded-full bg-black/40 px-3 py-1.5 text-xs font-bold text-white" aria-live="polite">{lightboxIndex + 1} / {lightboxImages.length}</span>
        </div>
      )}

      {/* Related Products */}
      {(relatedLoading || apiRelatedProducts.length > 0) && (
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="mt-10 border-t border-slate-100 pt-10 sm:mt-16 sm:pt-12">
            <h2 className="font-heading font-black text-2xl text-slate-900 mb-8 text-center sm:text-left">You May Also Like</h2>
            {relatedLoading ? (
              <div className="grid grid-cols-1 items-stretch justify-items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                {[0, 1, 2].map(i => (
                  <div key={i} className="animate-pulse rounded-3xl border border-slate-100 bg-white overflow-hidden">
                    <div className="aspect-square w-full bg-slate-200 rounded-t-3xl" />
                    <div className="p-4 space-y-3">
                      <div className="h-3 bg-slate-200 rounded-full w-1/3" />
                      <div className="h-4 bg-slate-200 rounded-full w-3/4" />
                      <div className="h-3 bg-slate-200 rounded-full w-1/2" />
                      <div className="h-3 bg-slate-100 rounded-full w-2/3" />
                      <div className="pt-2 flex items-center gap-3">
                        <div className="h-8 bg-slate-200 rounded-2xl flex-1" />
                        <div className="h-8 w-8 bg-slate-100 rounded-2xl shrink-0" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 items-stretch justify-items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                {apiRelatedProducts.map(rp => (
                  <ProductCard key={rp.id || rp._id} product={rp} layout="compact" />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Write Review Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 relative shadow-2xl border border-slate-100">
            <h3 className="font-heading font-extrabold text-lg text-slate-900 mb-4">
              Write a Review for {product.name}
            </h3>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jessica M."
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-sans focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Rating</label>
                <div className="flex gap-2 text-amber-400">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star className={`w-6 h-6 ${star <= newRating ? 'fill-amber-400' : 'text-slate-300'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Review Headline</label>
                <input
                  type="text"
                  placeholder="e.g. Kids love it!"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-sans focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Comments</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Share details about durability, play value, etc."
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-sans focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-heading font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white font-heading font-bold text-xs hover:bg-rose-600 shadow-md"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Size Guide Modal */}
      {sizeGuideModalOpen && product.sizeGuide && (
        <div 
          ref={sizeGuideRef}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="size-guide-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSizeGuideModalOpen(false);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setSizeGuideModalOpen(false);
          }}
          tabIndex={-1}
        >
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 relative shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
              <h3 id="size-guide-title" className="font-heading font-extrabold text-xl text-slate-900">
                Size Guide
              </h3>
              <button 
                onClick={() => setSizeGuideModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500 rounded-lg p-1"
                aria-label="Close Size Guide"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div 
              className="prose prose-sm prose-slate max-w-none [&_table]:w-full [&_table]:min-w-[400px] overflow-x-auto [&_th]:bg-slate-50 [&_th]:text-left [&_th]:p-3 [&_td]:p-3 [&_td]:border-t [&_td]:border-slate-100"
              dangerouslySetInnerHTML={{ __html: product.sizeGuide }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

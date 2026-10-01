"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { X, ShoppingBag, Trash2, Plus, Minus, Tag, ArrowRight, ShieldCheck, Gift } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatPrice } from '../../utils/formatters';
import { getSafeImageSrc } from '../../utils/images';
import { getVariationDisplayLabel } from '../../utils/products';
import { useScrollLock } from '../../hooks/useScrollLock';
import { trackInitiateCheckout } from "../../lib/metaPixel";
import { trackTikTokInitiateCheckout } from "../../lib/tiktokPixel";

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateCartQuantity,
    cartSubtotal,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    couponDiscountAmount,
    settings
  } = useStore();

  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponMsg, setCouponMsg] = useState<{ success: boolean; message: string } | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const couponRequestLocked = React.useRef(false);

  useScrollLock(isCartOpen);

  const router = useRouter();

  if (!isCartOpen) return null;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCodeInput.trim() || couponRequestLocked.current) return;
    couponRequestLocked.current = true;
    setIsApplyingCoupon(true);
    setCouponMsg(null);
    try {
      const res = await applyCoupon(couponCodeInput);
      setCouponMsg(res);
      if (res.success) setCouponCodeInput('');
    } catch {
      setCouponMsg({ success: false, message: 'Could not apply the promo code. Please try again.' });
    } finally {
      couponRequestLocked.current = false;
      setIsApplyingCoupon(false);
    }
  };

  const finalTotal = Math.max(0, cartSubtotal - couponDiscountAmount);

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="relative w-[85vw] max-w-md bg-white shadow-2xl flex flex-col h-[100dvh] rounded-l-3xl overflow-hidden border-l border-slate-100">
        {/* Drawer Header */}
        <div className="shrink-0 p-5 bg-gradient-to-r from-amber-50 via-rose-50 to-sky-50 border-b border-slate-200/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-500 text-white rounded-2xl shadow-md">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-extrabold text-lg text-slate-900">Your Toy Basket</h2>
              <p className="text-xs text-slate-500 font-sans">
                {cart.length === 0 ? 'Basket is currently empty' : `${cart.length} item(s) ready for fun`}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCartOpen(false)}
            className="p-2 rounded-full hover:bg-white text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center text-rose-300 mb-4 animate-bounce">
                  <ShoppingBag className="w-10 h-10" />
                </div>
                <h3 className="font-heading font-bold text-lg text-slate-700 mb-1">Your Basket is Empty</h3>
                <p className="text-xs text-slate-500 mb-6 max-w-xs">
                  Discover our magical collection of toys, action figures, and educational games!
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-3 rounded-2xl bg-rose-500 text-white font-heading font-bold text-sm hover:bg-rose-600 shadow-md transition-all"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              cart.map((item) => {
                const variation = item.product.productType === 'variable' && item.variationId
                  ? item.product.variations?.find(v => String(v.id) === String(item.variationId))
                  : undefined;
                  
                let itemPrice = item.product.price;
                if (item.resolvedUnitPrice !== undefined) {
                  itemPrice = item.resolvedUnitPrice;
                } else if (variation) {
                  itemPrice = variation.salePrice !== undefined && variation.salePrice !== null ? variation.salePrice : variation.regularPrice;
                } else if (item.selectedVariant && item.product.variants) {
                  const selections = new Map(
                    item.selectedVariant.split(',').map(part => {
                      const separator = part.indexOf(':');
                      return separator === -1 ? ['', part.trim()] : [part.slice(0, separator).trim(), part.slice(separator + 1).trim()];
                    })
                  );
                  const variantOffset = item.product.variants.reduce((sum, group) => {
                    const optionName = selections.get(group.name);
                    const option = group.options?.find(opt => opt.name === optionName);
                    return sum + Number(option?.priceOffset || 0);
                  }, 0);
                  itemPrice += variantOffset;
                }

                return (
                <div
                  key={`${item.product.id}-${item.selectedVariant || ''}-${item.variationId || ''}`}
                  className="flex gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all"
                >
                  <img
                    src={getSafeImageSrc(
                      variation?.image?.url ||
                      item.product.imageThumbnailUrls?.[0] ||
                      item.product.images[0]
                    )}
                    alt={variation?.image?.alt || item.product.name}
                    className="h-20 w-20 flex-shrink-0 rounded-xl bg-white object-contain p-1"
                  />

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <Link
                          href={`/product/${item.product.slug}`}
                          onClick={() => setIsCartOpen(false)}
                          className="font-heading font-bold text-xs sm:text-sm text-slate-800 hover:text-rose-500 line-clamp-1"
                        >
                          {item.product.name}
                        </Link>
                        <button
                          onClick={() => removeFromCart(item.product.id, item.selectedVariant, item.variationId)}
                          className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="text-[10px] text-sky-600 font-semibold uppercase block">
                        {item.product.category || 'Uncategorized'}
                      </span>
                      
                      {variation && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">
                            {getVariationDisplayLabel(variation, item.product.attributes || [], 0)}
                          </span>
                        </div>
                      )}
                      {!variation && item.selectedVariant && (
                        <span className="text-[10px] text-slate-500 block mt-1">
                          {item.selectedVariant}
                        </span>
                      )}

                      {/* Pricing Offer Badges */}
                      {!!(item.appliedOfferLabel || item.freeUnits) && (
                        <div className="mt-1 flex flex-col gap-1">
                          {item.appliedOfferLabel && (
                            <span className="inline-flex w-fit items-center rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-600">
                              <Tag className="mr-1 h-3 w-3" />
                              {item.appliedOfferLabel}
                            </span>
                          )}
                          {item.freeUnits ? (
                            <span className="inline-flex w-fit items-center rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                              <Gift className="mr-1 h-3 w-3" />
                              +{item.freeUnits} Free Unit{item.freeUnits > 1 ? 's' : ''} Included
                            </span>
                          ) : null}
                        </div>
                      )}
                    </div>


                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-slate-200 rounded-xl bg-white">
                        <button
                          onClick={() => updateCartQuantity(item.product.id, item.quantity - 1, item.selectedVariant, item.variationId)}
                          className="p-1 sm:p-1.5 text-slate-600 hover:bg-slate-100 rounded-l-xl transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-bold text-slate-800">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.product.id, item.quantity + 1, item.selectedVariant, item.variationId)}
                          className="p-1 sm:p-1.5 text-slate-600 hover:bg-slate-100 rounded-r-xl transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="font-heading font-extrabold text-sm text-slate-900">
                        {formatPrice(itemPrice * item.quantity, settings.currency)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer Summary */}
        {cart.length > 0 && (
          <div className="shrink-0 p-5 border-t border-slate-200/80 bg-slate-50/50 space-y-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            {/* Promo Code Input */}
            <div className="space-y-1.5">
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    Code: {appliedCoupon.code} (-{formatPrice(couponDiscountAmount, settings.currency)})
                  </span>
                  <button
                    onClick={removeCoupon}
                    className="text-emerald-700 hover:text-emerald-900 font-bold text-[11px] underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Promo code (e.g. PLAYFUL10)"
                      value={couponCodeInput}
                      onChange={e => setCouponCodeInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-base sm:text-xs rounded-xl border border-slate-200 bg-white font-sans focus:outline-none focus:ring-2 focus:ring-rose-400 uppercase"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isApplyingCoupon}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 text-white font-heading font-bold text-xs hover:bg-slate-900 transition-colors disabled:opacity-60 disabled:cursor-wait"
                  >
                    {isApplyingCoupon ? 'Applying…' : 'Apply'}
                  </button>
                </form>
              )}

              {couponMsg && (
                <p className={`text-[11px] ${couponMsg.success ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {couponMsg.message}
                </p>
              )}
            </div>

            {/* Subtotal & Totals */}
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-slate-800">{formatPrice(cartSubtotal, settings.currency)}</span>
              </div>

              {appliedCoupon && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount</span>
                  <span>-{formatPrice(couponDiscountAmount, settings.currency)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Shipping & Taxes</span>
                <span>Calculated at checkout</span>
              </div>

              <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-slate-900 font-heading font-extrabold text-base sm:text-lg">
                <span>Total</span>
                <span className="text-rose-600">{formatPrice(finalTotal, settings.currency)}</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => {
                  trackInitiateCheckout({
                    items: cart.map((item) => ({
                      id: item.product.id,
                      quantity: item.quantity,
                    })),
                    value: cartSubtotal,
                    currency: "PKR",
                  });
                  trackTikTokInitiateCheckout({
                    items: cart.map((item) => ({
                      id: item.product.id,
                      quantity: item.quantity,
                    })),
                    value: cartSubtotal,
                    currency: "PKR",
                  });
                  setIsCartOpen(false);
                  router.push('/checkout');
                }}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-heading font-extrabold text-sm shadow-lg shadow-rose-200/60 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-sans pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>30-Day Happiness Guarantee & Safe Checkout</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


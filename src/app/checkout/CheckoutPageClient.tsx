"use client";
import React, { useEffect, useState } from 'react';
import Link from "next/link";

import {
  Check,
  Truck,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  PackageCheck,
  Banknote,
  Clock,
  UserCheck,
  Minus,
  Plus,
  Tag,
  Gift
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { SeoHead } from '../../components/common/SeoHead';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { Order } from '../../types';
import { formatPrice } from '../../utils/formatters';
import { getProductDeliveryType } from '../../utils/products';
import { getSafeImageSrc } from '../../utils/images';
import { trackInitiateCheckout } from "../../lib/metaPixel";
import { identifyTikTokUser, trackTikTokInitiateCheckout, trackTikTokAddPaymentInfo, trackTikTokPurchase, trackTikTokPlaceAnOrder } from "../../lib/tiktokPixel";

export const CheckoutPageClient: React.FC = () => {
  const [checkoutRequestId] = useState(() => {
    const existing = ((typeof window !== "undefined") ? sessionStorage : null)?.getItem('pb_checkout_request_id');
    if (existing) return existing;
    const generated = typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `pb_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    ((typeof window !== "undefined") ? sessionStorage : null)?.setItem('pb_checkout_request_id', generated);
    return generated;
  });
  const {
    cart,
    cartSubtotal,
    appliedCoupon,
    couponDiscountAmount,
    categories,
    settings,
    placeOrder,
    updateCartQuantity
  } = useStore();
  const { showToast } = useToast();
  const { customerProfile } = useAuth();

  useEffect(() => {
    if (cart.length === 0) return;
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
  }, []);

  // Multi-step state: 1: Shipping & Customer, 2: Confirmation
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (customerProfile) {
      setEmail(prev => prev || customerProfile.email || '');
      setFullName(prev => prev || customerProfile.name || '');
    }
  }, [customerProfile]);
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country] = useState('Pakistan');
  const [orderNotes, setOrderNotes] = useState('');

  // Order result state
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Product overrides take priority; otherwise the store threshold applies.
  let highestOverrideFee = 0;
  let hasShippingOverride = false;
  let hasDefaultShippingItem = false;
  let deliveryUnavailable = false;
  cart.forEach((item) => {
    const flatRate = settings.flatDeliveryRate ?? settings.standardShippingFee;
    const deliveryType = getProductDeliveryType(item.product);
    if (deliveryType === 'none') {
      deliveryUnavailable = true;
      return;
    }
    if (deliveryType === 'fixed') {
      hasShippingOverride = true;
      highestOverrideFee = Math.max(highestOverrideFee, item.product.customDeliveryFee ?? flatRate);
      return;
    }
    if (deliveryType === 'free') {
      return;
    }
    if (deliveryType === 'category') {
      const category = categories.find(candidate => candidate.slug === item.product.categorySlug);
      const categoryType = category?.deliveryType || category?.deliveryChargeType;
      if (categoryType === 'none') {
        deliveryUnavailable = true;
      } else if (categoryType === 'free') {
        return;
      } else if (categoryType === 'fixed' || category?.deliveryCharge !== undefined) {
        hasShippingOverride = true;
        highestOverrideFee = Math.max(
          highestOverrideFee,
          category.customDeliveryFee ?? category.deliveryFee ?? category.deliveryCharge ?? flatRate
        );
      } else {
        hasDefaultShippingItem = true;
      }
      return;
    }
    hasDefaultShippingItem = true;
  });

  const defaultShippingFee =
    hasDefaultShippingItem && cartSubtotal < settings.freeShippingThreshold
      ? settings.standardShippingFee || 250
      : 0;
  const shippingFee = Math.max(hasShippingOverride ? highestOverrideFee : 0, defaultShippingFee);
  const taxFee = Math.round(cartSubtotal * settings.taxRate);
  const finalTotal = Math.max(0, cartSubtotal - couponDiscountAmount + shippingFee + taxFee);

  const handleShippingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deliveryUnavailable) {
      showToast('One or more products are not available for delivery.', 'error');
      return;
    }
    if (phone.trim().length !== 11) {
      showToast('Please enter a valid 11-digit phone number', 'error');
      return;
    }
    if (fullName.trim() && phone.trim() && street.trim() && city.trim()) {
      await handlePaymentSubmit();
    } else {
      showToast('Please fill in all required shipping fields', 'error');
    }
  };

  const handlePaymentSubmit = async () => {
    if (isPlacingOrder) return;
    setIsPlacingOrder(true);
    
    trackTikTokAddPaymentInfo();

    const created = await placeOrder({
      customerName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      shippingFee,
      items: cart.map(item => {
        let price = item.product.price;
        let image = item.product.images[0];
        let sku = item.product.sku;
        let attributes = undefined;

        if (item.product.productType === 'variable' && item.variationId) {
           const variation = item.product.variations?.find(v => String(v.id) === String(item.variationId));
           if (variation) {
             price = variation.salePrice !== undefined && variation.salePrice !== null ? variation.salePrice : variation.regularPrice;
             if (variation.image?.url) image = variation.image.url;
             if (variation.sku) sku = variation.sku;
             attributes = variation.attributes;
           }
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
           price += variantOffset;
        }

        return {
          productId: item.product.id,
          name: item.product.name,
          quantity: item.quantity,
          price: price,
          image: image,
          selectedVariant: item.selectedVariant,
          variationId: item.variationId,
          productType: item.product.productType || 'simple',
          sku: sku,
          selectedAttributes: attributes
        };
      }),
      subtotal: cartSubtotal,
      discount: couponDiscountAmount,
      shipping: shippingFee,
      total: finalTotal,
      status: 'Pending',
      shippingAddress: {
        fullName: fullName.trim(),
        phone: phone.trim(),
        street: street.trim(),
        city: city.trim(),
        state: state.trim(),
        postalCode: postalCode.trim(),
        country
      },
      paymentMethod: 'Cash on Delivery (COD)',
      trackingNumber: `PB-${Math.floor(10000000 + Math.random() * 90000000)}`,
      checkoutRequestId
    });

    setIsPlacingOrder(false);
    if (!created) {
      showToast('The order could not be placed. Please recheck stock and try again.', 'error');
      return;
    }


    // Meta Pixel - Purchase
    const metaEventId = `purchase_${created.orderId || created.id}`;

    if (typeof window !== "undefined" && window.fbq) {
      try {
        window.fbq(
          "track",
          "Purchase",
          {
            content_ids: created.items.map((item) => item.productId),

            contents: created.items.map((item) => ({
              id: item.productId,
              quantity: item.quantity,
              item_price: item.price,
            })),

            content_type: "product",

            num_items: created.items.reduce(
              (total, item) => total + item.quantity,
              0
            ),

            value: created.total,
            currency: "PKR",
          }, { eventID: metaEventId });
      } catch (err) {
        console.error("Meta Pixel tracking error:", err);
      }
    }
    try {
      trackTikTokPlaceAnOrder({
        items: created.items.map((item) => ({
          id: item.productId,
          quantity: item.quantity,
        })),
        value: created.total,
        currency: "PKR",
        eventId: metaEventId,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      });

      trackTikTokPurchase({
        items: created.items.map((item) => ({
          id: item.productId,
          quantity: item.quantity,
        })),
        value: created.total,
        currency: "PKR",
        eventId: metaEventId,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      });
    } catch (err) {
      console.error("TikTok tracking error:", err);
    }

    ((typeof window !== "undefined") ? sessionStorage : null)?.removeItem('pb_checkout_request_id');
    setCompletedOrder(created);
    setCurrentStep(2);
    const confirmationEmailSent = Boolean(created.confirmationEmailSentAt && created.confirmationEmailAccepted !== false);
    showToast(!email.trim()
      ? 'Order confirmed successfully.'
      : confirmationEmailSent
        ? 'Order confirmed. A confirmation email has been sent.'
        : 'Order confirmed. We could not send the email, but your order was placed successfully.',
      !email.trim() || confirmationEmailSent ? 'success' : 'warning');
  };

  if (cart.length === 0 && currentStep !== 2) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-400 flex items-center justify-center mb-4">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="font-heading font-black text-2xl text-slate-800 mb-2">Your Basket is Empty</h2>
        <p className="text-sm text-slate-500 mb-6">Add toys to your basket before proceeding to checkout.</p>
        <Link href="/category/all" className="px-6 py-3 rounded-2xl bg-rose-500 text-white font-heading font-bold text-sm">
          Explore Toys & Games
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans py-5 sm:py-8">
      <SeoHead title="Secure Checkout" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'Checkout' }]} />

        {/* Step Progress Bar */}
        <div className="bg-white rounded-3xl px-3 py-5 sm:p-6 border border-slate-100 shadow-sm mb-6 sm:mb-8 overflow-hidden">
          <div className="flex items-start justify-between max-w-2xl mx-auto relative">
            {/* Step 1 */}
            <div className="flex w-[72px] shrink-0 flex-col items-center gap-1 z-10 sm:w-auto">
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-heading font-black text-xs transition-all ${
                  currentStep >= 1
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-200'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {currentStep > 1 ? <Check className="w-5 h-5" /> : 1}
              </div>
              <span className="text-center text-[10px] leading-tight sm:text-xs font-heading font-bold text-slate-800">Delivery Address</span>
            </div>

            <div className={`mt-3.5 sm:mt-[18px] min-w-2 flex-1 h-1 mx-1 sm:mx-2 rounded-full ${currentStep === 2 ? 'bg-rose-500' : 'bg-slate-200'}`} />

            {/* Step 2 */}
            <div className="flex w-[72px] shrink-0 flex-col items-center gap-1 z-10 sm:w-auto">
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-heading font-black text-xs transition-all ${
                  currentStep === 2
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                2
              </div>
              <span className="text-center text-[10px] leading-tight sm:text-xs font-heading font-bold text-slate-800">Confirmation</span>
            </div>
          </div>
        </div>

        {/* STEP 2: ORDER CONFIRMATION */}
        {currentStep === 2 && completedOrder ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-100 shadow-xl max-w-3xl mx-auto text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
              <PackageCheck className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs font-heading font-extrabold text-emerald-600 uppercase tracking-widest">
                Order Placed Successfully!
              </span>
              <h1 className="font-heading font-black text-3xl text-slate-900 mt-1">
                Thank You for Shopping at PlayBimboo!
              </h1>
              <p className="text-sm text-slate-600 mt-2">
                {!completedOrder.email
                  ? <>Your order is safely recorded. Our team will contact you before dispatch.</>
                  : completedOrder.confirmationEmailAccepted !== false && completedOrder.confirmationEmailSentAt
                  ? <>We've received your order and sent a confirmation receipt to <strong>{completedOrder.email}</strong>.</>
                  : <>We've received your order successfully. The email could not be sent, but your order is safely recorded.</>}
              </p>
            </div>

            {/* Order Receipt Box */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 text-left space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div>
                  <span className="text-xs text-slate-400 uppercase font-bold block">Order ID</span>
                  <span className="font-heading font-black text-base text-rose-600">{completedOrder.id}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 uppercase font-bold block">Tracking Code</span>
                  <span className="font-mono font-bold text-xs text-slate-800">{completedOrder.trackingNumber}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 uppercase font-bold block">Payment Method</span>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1">
                    <Banknote className="w-3.5 h-3.5" />
                    Cash on Delivery (COD)
                  </span>
                </div>
              </div>

              {/* Items Summary */}
              <div className="space-y-2">
                <h4 className="font-heading font-bold text-xs text-slate-700 uppercase">Items Ordered:</h4>
                {completedOrder.items.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-slate-800 font-medium">
                      {it.quantity}x {it.name} {it.selectedVariant ? `(${it.selectedVariant})` : ''}
                    </span>
                    <span className="font-bold text-slate-900">{formatPrice(it.price * it.quantity, settings.currency)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between font-heading font-black text-slate-900 text-lg">
                <span>Total Payable on Delivery:</span>
                <span className="text-rose-600">{formatPrice(completedOrder.total, settings.currency)}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              {completedOrder.email && (
                <Link href="/account"
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-900 text-white font-heading font-bold text-sm shadow-md"
                >
                  Track Order & Account
                </Link>
              )}
              <Link href="/category/all"
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-rose-500 text-white font-heading font-bold text-sm shadow-md"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        ) : (
          /* STEP 1 & 2 GRID: FORM + STICKY ORDER SUMMARY */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Form Column */}
            <div className="lg:col-span-7 order-2 lg:order-1">
              {currentStep === 1 && (
                <form onSubmit={handleShippingSubmit} className="bg-white rounded-3xl p-4 sm:p-8 border border-slate-100 shadow-sm space-y-6">
                  <div className="flex flex-col items-start gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="font-heading font-black text-xl text-slate-900 flex items-center gap-2">
                      <Truck className="w-5 h-5 text-rose-500" />
                      <span>Delivery Address & Contact</span>
                    </h2>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5" />
                      Guest or Account Checkout
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700 block mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ali Raza"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 font-sans focus:outline-none focus:ring-2 focus:ring-rose-400"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Mobile Phone (For COD Delivery) *</label>
                      <input
                        type="tel"
                        required
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={11}
                        placeholder="e.g. 03276655557"
                        value={phone}
                        onChange={e => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 11))}
                        onBlur={() => {
                          if (phone.trim().length > 0) {
                            identifyTikTokUser({ phone: phone.trim(), email: email.trim() || undefined }).catch(() => {});
                          }
                        }}
                        className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 font-sans focus:outline-none focus:ring-2 focus:ring-rose-400"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700 block mb-1">Complete Delivery Street Address *</label>
                      <input
                        type="text"
                        required
                        placeholder="House #, Street name, Sector / Area"
                        value={street}
                        onChange={e => setStreet(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 font-sans focus:outline-none focus:ring-2 focus:ring-rose-400"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">City *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Gujranwala, Karachi, Islamabad"
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 font-sans focus:outline-none focus:ring-2 focus:ring-rose-400"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-2">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Province (Optional)</label>
                        <input
                          type="text"
                          value={state}
                          onChange={e => setState(e.target.value)}
                          className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 font-sans focus:outline-none focus:ring-2 focus:ring-rose-400"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Postal Code (Optional)</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={postalCode}
                          onChange={e => setPostalCode(e.target.value.replace(/[^0-9]/g, ''))}
                          className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 font-sans focus:outline-none focus:ring-2 focus:ring-rose-400"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700 block mb-1">Delivery Instructions / Order Notes (Optional)</label>
                      <textarea
                        rows={2}
                        placeholder="Near landmark, call before arrival, etc."
                        value={orderNotes}
                        onChange={e => setOrderNotes(e.target.value)}
                        className="w-full px-4 py-2 text-base sm:text-sm rounded-xl border border-slate-200 font-sans focus:outline-none focus:ring-2 focus:ring-rose-400"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700 block mb-1">Email Address (for order receipt)</label>
                      <input
                        type="email"
                        placeholder="e.g. ali@example.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onBlur={() => {
                          if (email.trim().length > 0) {
                            identifyTikTokUser({ email: email.trim(), phone: phone.trim() || undefined }).catch(() => {});
                          }
                        }}
                        className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 font-sans focus:outline-none focus:ring-2 focus:ring-rose-400"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isPlacingOrder}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-heading font-black text-lg shadow-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                  >
                    <span>{isPlacingOrder ? 'Placing Order…' : `Confirm Order & Pay ${formatPrice(finalTotal, settings.currency)} on Delivery`}</span>
                    {isPlacingOrder ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Check className="w-6 h-6" />}
                  </button>
                </form>
              )}

            </div>

            {/* Sticky Order Summary Column */}
            <div className="lg:col-span-5 order-1 lg:order-2">
              <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-100 shadow-sm lg:sticky lg:top-24 space-y-4">
                <h3 className="font-heading font-black text-lg text-slate-900 pb-3 border-b border-slate-100">
                  Order Summary ({cart.length} item(s))
                </h3>

                {/* Items preview */}
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {cart.map(item => {
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
                    <div key={`${item.product.id}-${item.variationId || item.selectedVariant || ''}`} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-2.5">
                      <img
                        src={getSafeImageSrc(variation?.image?.url || item.product.imageThumbnailUrls?.[0] || item.product.images[0])}
                        alt={variation?.image?.alt || item.product.name}
                        className="w-14 h-14 shrink-0 object-contain rounded-xl bg-white p-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-heading font-bold text-xs text-slate-800 truncate">
                          {item.product.name}
                        </h4>
                        {variation && (
                          <div className="mt-0.5 flex flex-wrap gap-1">
                            {Object.entries(variation.attributes).map(([key, val]) => (
                              <span key={key} className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                {val}
                              </span>
                            ))}
                          </div>
                        )}
                        {!variation && item.selectedVariant && (
                           <span className="text-xs text-slate-400 block truncate">{item.selectedVariant}</span>
                        )}

                        {/* Pricing Offer Badges */}
                        {!!(item.appliedOfferLabel || item.freeUnits) && (
                          <div className="mt-1 flex flex-col gap-1">
                            {item.appliedOfferLabel && (
                              <span className="inline-flex w-fit items-center rounded bg-rose-50 px-1.5 py-0.5 text-[9px] font-bold text-rose-600">
                                <Tag className="mr-1 h-3 w-3" />
                                {item.appliedOfferLabel}
                              </span>
                            )}
                            {item.freeUnits ? (
                              <span className="inline-flex w-fit items-center rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
                                <Gift className="mr-1 h-3 w-3" />
                                +{item.freeUnits} Free Unit{item.freeUnits > 1 ? 's' : ''}
                              </span>
                            ) : null}
                          </div>
                        )}

                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">

                          <div className="flex items-center rounded-xl border border-slate-200 bg-white">
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(item.product.id, item.quantity - 1, item.selectedVariant, item.variationId)}
                              aria-label={`Decrease quantity of ${item.product.name}`}
                              className="rounded-l-xl p-1.5 text-slate-600 transition-colors hover:bg-slate-100"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="min-w-7 px-1 text-center text-xs font-bold text-slate-800">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(item.product.id, item.quantity + 1, item.selectedVariant, item.variationId)}
                              aria-label={`Increase quantity of ${item.product.name}`}
                              className="rounded-r-xl p-1.5 text-slate-600 transition-colors hover:bg-slate-100"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <span className="font-heading font-bold text-xs text-slate-900">
                            {formatPrice(itemPrice * item.quantity, settings.currency)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );})}
                </div>

                {/* Summary calculation */}
                <div className="space-y-2 text-xs sm:text-sm text-slate-600 pt-3 border-t border-slate-100">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-bold text-slate-800">{formatPrice(cartSubtotal, settings.currency)}</span>
                  </div>

                  {appliedCoupon && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Coupon Discount ({appliedCoupon.code})</span>
                      <span>-{formatPrice(couponDiscountAmount, settings.currency)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Shipping Fee</span>
                    <span className="font-bold text-slate-800">
                      {shippingFee === 0 ? <strong className="text-emerald-600">FREE Shipping</strong> : formatPrice(shippingFee, settings.currency)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Estimated Tax</span>
                    <span className="font-bold text-slate-800">{formatPrice(taxFee, settings.currency)}</span>
                  </div>

                  <div className="flex justify-between items-baseline pt-3 border-t border-slate-200 text-slate-900 font-heading font-black text-xl">
                    <span>Total Payable</span>
                    <span className="text-rose-600">{formatPrice(finalTotal, settings.currency)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

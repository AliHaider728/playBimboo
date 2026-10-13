"use client";

// Generates a UUID for event_id deduplication (fallback to random if crypto not available)
const generateEventId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return 'ttq-' + Date.now() + '-' + Math.floor(Math.random() * 1000000000);
};

// ---------------------------------------------------------------------------
// Phone normalisation — converts Pakistani local numbers to E.164 (+92...)
// Returns undefined if the number cannot be safely normalised, so we never
// send a malformed value to TikTok.
// ---------------------------------------------------------------------------
export const normalizePakistaniPhoneToE164 = (phone: string | undefined | null): string | undefined => {
  if (!phone) return undefined;

  // Strip all non-digit characters (spaces, dashes, parentheses, dots)
  const digits = phone.replace(/\D/g, '');

  // Already E.164 with leading '+92' (12 digits total after stripping '+')
  // The caller may strip '+' before passing — handle 923XXXXXXXXX (12 digits)
  if (/^92[0-9]{10}$/.test(digits)) {
    return `+${digits}`;
  }

  // Local format: 03XXXXXXXXX (11 digits starting with 03)
  if (/^03[0-9]{9}$/.test(digits)) {
    return `+92${digits.slice(1)}`; // replace leading '0' with '+92'
  }

  // Short local format: 3XXXXXXXXX (10 digits starting with 3)
  if (/^3[0-9]{9}$/.test(digits)) {
    return `+92${digits}`;
  }

  // Doesn't match any known Pakistani format — skip to avoid bad data
  return undefined;
};

// ---------------------------------------------------------------------------
// Client-side SHA-256 hash via Web Crypto API (runs in browser only)
// Returns hex string or undefined if input is empty.
// ---------------------------------------------------------------------------
const hashDataClient = async (data: string | undefined | null): Promise<string | undefined> => {
  if (!data || !data.trim()) return undefined;
  if (typeof window === 'undefined' || !window.crypto?.subtle) return undefined;
  const encoded = new TextEncoder().encode(data.trim().toLowerCase());
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

// ---------------------------------------------------------------------------
// identifyTikTokUser — calls ttq.identify() with hashed email and/or phone.
// Only sends fields that are present. Skips entirely if both are empty.
// ---------------------------------------------------------------------------
export const identifyTikTokUser = async ({
  email,
  phone,
}: {
  email?: string | null;
  phone?: string | null;
}) => {
  if (typeof window === 'undefined') return;
  ensureTikTokQueue();

  const hasEmail = email && email.trim().length > 0;
  const hasPhone = phone && phone.trim().length > 0;

  if (!hasEmail && !hasPhone) return; // nothing to identify with

  try {
    const identifyPayload: Record<string, string> = {};

    if (hasEmail) {
      const hashed = await hashDataClient(email);
      if (hashed) identifyPayload.email = hashed;
    }

    if (hasPhone) {
      const normalized = normalizePakistaniPhoneToE164(phone);
      if (normalized) {
        const hashed = await hashDataClient(normalized);
        if (hashed) identifyPayload.phone_number = hashed;
      }
    }

    if (Object.keys(identifyPayload).length > 0) {
      window.ttq.identify(identifyPayload);
    }
  } catch {
    // Never let identify() failures surface to the user
  }
};

export const getTikTokContext = () => {
  if (typeof window === 'undefined') return {};
  const cookies: Record<string, string> = {};
  for (const part of document.cookie.split(';')) {
    const index = part.indexOf('=');
    if (index < 0) continue;
    try { cookies[part.slice(0,index).trim()] = decodeURIComponent(part.slice(index+1)); } catch { /* malformed cookie */ }
  }
  const clickId = new URL(window.location.href).searchParams.get('ttclid');
  if (clickId) {
    document.cookie = 'ttclid=' + encodeURIComponent(clickId) + '; Path=/; Max-Age=7776000; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');
  }
  return { ttclid: clickId || cookies.ttclid, ttp: cookies._ttp,
    page_url: window.location.href, page_referrer: document.referrer || undefined };
};

const ensureTikTokQueue = () => {
  if (window.ttq) return;
  const queue: any = [];
  // The delayed base loader reuses this array and drains these calls.
  for (const method of ['track', 'identify']) queue[method] = (...args: any[]) => queue.push([method, ...args]);
  window.ttq = queue;
};

export const trackTikTokEvent = (eventName: string, data?: Record<string, unknown>, providedEventId?: string) => {
  if (typeof window === 'undefined') return false;
  const eventId = providedEventId || generateEventId();
  const { email, phone, ...properties } = data || {};
  ensureTikTokQueue();
  try { window.ttq.track(eventName, properties, { event_id: eventId }); }
  catch (error) { console.error('[TikTokPixel] Browser tracking failed', error); }
  // Purchase is delivered only by Express, after MySQL commit.
  if (eventName === 'Purchase') return true;
  fetch('/api/tiktok-events', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true,
    body: JSON.stringify({ event_name: eventName, event_id: eventId,
      event_time: Math.floor(Date.now()/1000), event_data: { ...properties, email, phone }, context: getTikTokContext() })
  }).then(async response => {
    if (!response.ok) console.error('[TikTokPixel] Server forwarding failed', response.status, await response.text());
  }).catch(error => console.error('[TikTokPixel] Server forwarding network failure', error));
  return true;
};

export const trackTikTokViewContent = ({
  id,
  name,
  price,
  currency = "PKR",
}: {
  id: string;
  name: string;
  price: number;
  currency?: string;
}) => {
  trackTikTokEvent("ViewContent", {
    contents: [
      {
        content_id: id,
        content_type: "product",
        content_name: name,
      },
    ],
    value: price,
    currency,
  });
};

export const trackTikTokSearch = ({ query }: { query: string }) => {
  trackTikTokEvent("Search", {
    contents: [
      {
        content_id: query,
        content_type: "product",
        content_name: query,
      },
    ],
    search_string: query,
  });
};

export const trackTikTokAddToWishlist = ({
  id,
  name,
  price,
  currency = "PKR",
}: {
  id: string;
  name: string;
  price: number;
  currency?: string;
}) => {
  trackTikTokEvent("AddToWishlist", {
    contents: [
      {
        content_id: id,
        content_type: "product",
        content_name: name,
      },
    ],
    value: price,
    currency,
  });
};

export const trackTikTokAddToCart = ({
  id,
  name,
  price,
  quantity = 1,
  currency = "PKR",
}: {
  id: string;
  name: string;
  price: number;
  quantity?: number;
  currency?: string;
}) => {
  trackTikTokEvent("AddToCart", {
    contents: [
      {
        content_id: id,
        content_type: "product",
        content_name: name,
        quantity,
        price,
      },
    ],
    value: price * quantity,
    currency,
  });
};

export const trackTikTokInitiateCheckout = ({
    items,
  value,
  currency = "PKR",
}: {
  items: Array<{ id: string; quantity: number }>;
  value: number;
  currency?: string;
}) => {
  if (typeof window === "undefined") return;
  
  // Dedup logic (similar to Meta pixel) to avoid firing multiple times on same checkout session
  const cartSignature = items.map((item) => `${item.id}:${item.quantity}`).sort().join("|");
  const signature = `${cartSignature}:${value}:${currency}`;
  const storageKey = "tiktok_last_initiate_checkout";
  
  try {
    const existing = sessionStorage.getItem(storageKey);
    if (existing) {
      const parsed = JSON.parse(existing);
      const isSameCheckout = parsed.signature === signature;
      const isRecent = Date.now() - parsed.timestamp < 10000;
      if (isSameCheckout && isRecent) {
        return;
      }
    }
  } catch {
    // Ignore
  }

  const tracked = trackTikTokEvent("InitiateCheckout", {
    contents: items.map((item) => ({
      content_id: item.id,
      content_type: "product",
      content_name: item.id,
      quantity: item.quantity,
    })),
    value,
    currency,
  });

  if (tracked) {
    try {
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({
          signature,
          timestamp: Date.now(),
        })
      );
    } catch {
      // Ignore
    }
  }
};

export const trackTikTokAddPaymentInfo = ({
  items,
  value,
  currency = "PKR",
}: {
  items: Array<{ id: string; name: string; quantity?: number }>;
  value: number;
  currency?: string;
}) => {
  trackTikTokEvent("AddPaymentInfo", {
    contents: items.map((item) => ({
      content_id: item.id,
      content_type: "product",
      content_name: item.name,
      quantity: item.quantity,
    })),
    value,
    currency,
  });
};

export const trackTikTokPlaceAnOrder = ({
  items,
  value,
  currency = "PKR",
  eventId,
  email,
  phone,
}: {
  items: Array<{ id: string; name: string; quantity: number }>;
  value: number;
  currency?: string;
  eventId: string;
  email?: string | null;
  phone?: string | null;
}) => {
  trackTikTokEvent("PlaceAnOrder", {
    contents: items.map((item) => ({
      content_id: item.id,
      content_type: "product",
      content_name: item.name,
      quantity: item.quantity,
    })),
    value,
    currency,
    ...(email && email.trim() ? { email: email.trim() } : {}),
    ...(phone && phone.trim() ? { phone: phone.trim() } : {}),
  }, eventId);
};

export const trackTikTokPurchase = ({
  items,
  value,
  currency = "PKR",
  eventId,
  email,
  phone,
}: {
  items: Array<{ id: string; name: string; quantity: number }>;
  value: number;
  currency?: string;
  eventId: string;
  email?: string | null;
  phone?: string | null;
}) => {
  trackTikTokEvent("Purchase", {
    contents: items.map((item) => ({
      content_id: item.id,
      content_type: "product",
      content_name: item.name,
      quantity: item.quantity,
    })),
    value,
    currency,
    ...(email && email.trim() ? { email: email.trim() } : {}),
    ...(phone && phone.trim() ? { phone: phone.trim() } : {}),
  }, eventId);
};

export const trackTikTokCompleteRegistration = () => {
  trackTikTokEvent("CompleteRegistration", {});
};


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
  if (typeof window === 'undefined' || !window.ttq) return;

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

export const trackTikTokEvent = (eventName: string, data?: Record<string, unknown>, providedEventId?: string) => {
  if (typeof window === "undefined") {
    return false;
  }
  
  const eventId = providedEventId || generateEventId();

  const payload = {
    ...data,
    event_id: eventId
  };

  if (window.ttq) {
    try {
      window.ttq.track(eventName, payload);
    } catch (e) {
      console.error("[TikTokPixel] Error calling ttq.track:", e);
    }
  } else {
    console.warn("[TikTokPixel] window.ttq is not defined, skipping client tracking for", eventName);
  }

  // Forward to internal API for server-side TikTok Events API
  fetch('/api/tiktok-events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_name: eventName,
      event_id: eventId,
      event_data: payload
    })
  }).catch(() => {
    // silently fail tracking errors
  });

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
    content_id: id,
    content_name: name,
    content_type: "product",
    value: price,
    currency,
  });
};

export const trackTikTokSearch = ({ query }: { query: string }) => {
  trackTikTokEvent("Search", {
    query,
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
    content_id: id,
    content_name: name,
    content_type: "product",
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
    content_id: id,
    content_name: name,
    content_type: "product",
    value: price * quantity,
    quantity,
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
    content_id: items.map((item) => item.id).join(","), // TikTok sometimes expects a single string or array, passing comma-separated is safe
    content_type: "product",
    quantity: items.reduce((total, item) => total + item.quantity, 0),
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

export const trackTikTokAddPaymentInfo = () => {
  trackTikTokEvent("AddPaymentInfo", {});
};

export const trackTikTokPlaceAnOrder = ({
  items,
  value,
  currency = "PKR",
  eventId,
  email,
  phone,
}: {
  items: Array<{ id: string; quantity: number }>;
  value: number;
  currency?: string;
  eventId: string;
  email?: string | null;
  phone?: string | null;
}) => {
  trackTikTokEvent("PlaceAnOrder", {
    content_id: items.map((item) => item.id).join(","),
    content_type: "product",
    quantity: items.reduce((total, item) => total + item.quantity, 0),
    value,
    currency,
    // Pass raw values — the Next.js CAPI layer will normalize + hash them
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
  items: Array<{ id: string; quantity: number }>;
  value: number;
  currency?: string;
  eventId: string;
  email?: string | null;
  phone?: string | null;
}) => {
  trackTikTokEvent("Purchase", {
    content_id: items.map((item) => item.id).join(","),
    content_type: "product",
    quantity: items.reduce((total, item) => total + item.quantity, 0),
    value,
    currency,
    // Pass raw values — the Next.js CAPI layer will normalize + hash them
    ...(email && email.trim() ? { email: email.trim() } : {}),
    ...(phone && phone.trim() ? { phone: phone.trim() } : {}),
  }, eventId);
};

export const trackTikTokCompleteRegistration = () => {
  trackTikTokEvent("CompleteRegistration", {});
};


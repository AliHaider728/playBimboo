import crypto from 'crypto';
import { normalizePakistaniPhoneToE164 } from './tiktokPixel';

const hashData = (data: string | undefined | null) => {
  if (!data) return undefined;
  const trimmed = data.trim().toLowerCase();
  return crypto.createHash('sha256').update(trimmed).digest('hex');
};

export const sendTikTokEventToServer = async (
  eventName: string,
  eventId: string,
  eventData: any,
  reqIp?: string,
  reqUserAgent?: string
) => {
  const pixelId = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;
  const accessToken = process.env.TIKTOK_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    console.warn('[TikTok Events API] Missing credentials in Next.js backend');
    return;
  }

  const eventTime = Math.floor(Date.now() / 1000);

  // Extract user info — normalize phone to E.164 before hashing
  const email = eventData.email ? hashData(eventData.email) : undefined;
  const normalizedPhone = normalizePakistaniPhoneToE164(eventData.phone);
  const phone = normalizedPhone ? hashData(normalizedPhone) : undefined;
  
  // Format the properties payload matching what TikTok expects
  let properties: any = {
    content_type: eventData.content_type || 'product',
  };

  if (eventData.content_id) properties.content_id = eventData.content_id;
  if (eventData.content_name) properties.content_name = eventData.content_name;
  if (eventData.value !== undefined) properties.value = eventData.value;
  if (eventData.currency) properties.currency = eventData.currency;
  if (eventData.quantity !== undefined) properties.quantity = eventData.quantity;
  if (eventData.query) properties.query = eventData.query;
  
  // Create contents array if it's not a single content_id
  if (eventData.contents) {
      properties.contents = eventData.contents;
  }

  const payload = {
    event_source: 'web',
    event_source_id: pixelId,
    data: [
      {
        event_name: eventName,
        event_time: eventTime,
        event_id: eventId,
        user: {
          email,
          phone_number: phone,
          client_ip_address: reqIp,
          client_user_agent: reqUserAgent,
        },
        properties
      }
    ]
  };

  try {
    const response = await fetch('https://business-api.tiktok.com/open_api/v1.3/event/track/', {
      method: 'POST',
      headers: {
        'Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok || data.code !== 0) {
      console.error(`[TikTok Events API Next.js] ${eventName} track failed:`, data);
    }
  } catch (error) {
    console.error(`[TikTok Events API Next.js] ${eventName} fetch error:`, error);
  }
};

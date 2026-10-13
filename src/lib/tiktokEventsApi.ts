import { buildTikTokPayload, clientIp, sendTikTokPayload, type TikTokContext } from './tiktokEventsCore';

// Node-only helper: deliberately never imports the use-client pixel module.
export const sendTikTokEventToServer = async (
  eventName: string, eventId: string, eventData: Record<string, any>,
  reqIp?: string, reqUserAgent?: string,
  context: TikTokContext = {}, cookieHeader = '', eventTime?: number
) => {
  const publicPixelId = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID?.trim();
  const pixelId = process.env.TIKTOK_PIXEL_ID?.trim() || publicPixelId;
  const token = process.env.TIKTOK_ACCESS_TOKEN?.trim();
  if (!pixelId || !token) {
    console.error('[TikTok Events API Next.js] Delivery unavailable: server pixel ID/access token missing');
    throw new Error('TikTok server credentials missing');
  }
  if (publicPixelId && publicPixelId !== pixelId) throw new Error('TikTok browser/server pixel IDs differ');
  return sendTikTokPayload(buildTikTokPayload({ pixelId, event: eventName, eventId,
    eventData, context, cookieHeader, ip: clientIp(reqIp), userAgent: reqUserAgent,
    eventTime, testEventCode: process.env.TIKTOK_TEST_EVENT_CODE
  }), token);
};

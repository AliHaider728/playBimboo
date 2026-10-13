import { NextResponse } from 'next/server';
import { sendTikTokEventToServer } from '../../../lib/tiktokEventsApi';
import { TIKTOK_EVENTS } from '../../../lib/tiktokEventsCore';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const origin = req.headers.get('origin');
  if (origin && origin !== new URL(req.url).origin) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  let body: any;
  try {
    const raw = await req.text();
    if (raw.length > 32768) return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    body = JSON.parse(raw);
  } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  if (!body || !TIKTOK_EVENTS.has(body.event_name) || body.event_name === 'Purchase' ||
      typeof body.event_id !== 'string' || !body.event_id.trim() || body.event_id.length > 200 ||
      !body.event_data || typeof body.event_data !== 'object' || Array.isArray(body.event_data) ||
      !Number.isInteger(body.event_time) || body.event_time > Math.floor(Date.now()/1000) + 60 || body.event_time < Math.floor(Date.now()/1000) - 7*86400) {
    return NextResponse.json({ error: 'Invalid event; purchases are sent by the saved-order backend' }, { status: 400 });
  }
  try {
    await sendTikTokEventToServer(body.event_name, body.event_id, body.event_data,
      req.headers.get('x-forwarded-for') || undefined, req.headers.get('user-agent') || undefined,
      body.context || {}, req.headers.get('cookie') || '', body.event_time);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[TikTok Events Route] Delivery failed', error);
    return NextResponse.json({ success: false, error: 'TikTok event delivery failed; check server logs' }, { status: 502 });
  }
}

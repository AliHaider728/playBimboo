import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  const path = request.nextUrl.searchParams.get('path');
  const tag = request.nextUrl.searchParams.get('tag');

  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
  }

  if (!path && !tag) {
    return NextResponse.json({ message: 'Missing path or tag parameter' }, { status: 400 });
  }

  try {
    if (path) {
      revalidatePath(path);
    }
    if (tag) {
      revalidateTag(tag, 'default');
    }
    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (err) {
    return NextResponse.json({ message: 'Error revalidating' }, { status: 500 });
  }
}

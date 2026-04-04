import { NextResponse } from 'next/server';

import { clearSpadminSession } from '@/lib/spadmin-auth';

export async function POST(request: Request) {
  await clearSpadminSession();
  return NextResponse.redirect(new URL('/spadmin', request.url), 303);
}

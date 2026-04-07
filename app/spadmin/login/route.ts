import { NextResponse } from 'next/server';

import {
  createSpadminSession,
  isSpadminConfigured,
  verifySpadminPassword,
} from '@/lib/spadmin-auth';
import {
  isSameOriginRequest,
  takeRateLimitToken,
} from '@/lib/request-security';

export async function POST(request: Request) {
  const spadminUrl = new URL('/spadmin', request.url);

  if (!isSameOriginRequest(request)) {
    spadminUrl.searchParams.set('error', 'invalid-origin');
    return NextResponse.redirect(spadminUrl, 303);
  }

  const rateLimit = takeRateLimitToken(request, 'spadmin-login', 10);

  if (!rateLimit.ok) {
    spadminUrl.searchParams.set('error', 'rate-limit');
    return NextResponse.redirect(spadminUrl, 303);
  }

  const formData = await request.formData();
  const submittedPassword =
    typeof formData.get('password') === 'string'
      ? String(formData.get('password')).trim()
      : '';

  if (!isSpadminConfigured()) {
    spadminUrl.searchParams.set('error', 'config');
    return NextResponse.redirect(spadminUrl, 303);
  }

  if (!submittedPassword || !verifySpadminPassword(submittedPassword)) {
    spadminUrl.searchParams.set('error', 'invalid-password');
    return NextResponse.redirect(spadminUrl, 303);
  }

  await createSpadminSession();

  return NextResponse.redirect(spadminUrl, 303);
}

import { NextResponse } from 'next/server';

import {
  createSpadminSession,
  isSpadminConfigured,
  verifySpadminPassword,
} from '@/lib/spadmin-auth';

export async function POST(request: Request) {
  const formData = await request.formData();
  const submittedPassword =
    typeof formData.get('password') === 'string'
      ? String(formData.get('password')).trim()
      : '';
  const spadminUrl = new URL('/spadmin', request.url);

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

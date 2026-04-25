import { NextResponse } from 'next/server';

import {
  findWalletPoints,
  isTestnetWalletPointsConfigured,
} from '@/lib/testnet-wallet-points';
import {
  isSameOriginRequest,
  takeRateLimitToken,
} from '@/lib/request-security';

const walletAddressPattern = /^0x[a-fA-F0-9]{40}$/;

export async function GET(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }

  const rateLimit = takeRateLimitToken(request, 'testnet-wallet-points', 120);

  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.retryAfterSeconds),
        },
      }
    );
  }

  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address')?.trim() ?? '';

  if (!walletAddressPattern.test(address)) {
    return NextResponse.json(
      { error: 'A valid wallet address is required.' },
      { status: 400 }
    );
  }

  if (!isTestnetWalletPointsConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        warning:
          'Wallet points are not configured on the server yet. Add the testnet Supabase environment variables first.',
      },
      { status: 200 }
    );
  }

  try {
    const walletPoints = await findWalletPoints(address);

    return NextResponse.json({
      ok: true,
      found: Boolean(walletPoints),
      points: walletPoints?.totalPoints ?? 0,
    });
  } catch (error) {
    console.error('Failed to load testnet wallet points:', error);

    return NextResponse.json(
      {
        ok: false,
        warning: 'Unable to load SPK Wallet SP points right now.',
      },
      { status: 200 }
    );
  }
}

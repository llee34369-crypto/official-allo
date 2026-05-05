import { NextResponse } from 'next/server';
import { isAddress } from 'viem';

import { takeRateLimitToken } from '@/lib/request-security';
import { verifyTestnetWalletSessionToken } from '@/lib/testnet-wallet-session';

export async function GET(request: Request) {
  const rateLimit = takeRateLimitToken(request, 'testnet-wallet-session', 60);

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
  const walletAddress = searchParams.get('address')?.trim() ?? '';
  const sessionToken = searchParams.get('token')?.trim() ?? '';

  if (!isAddress(walletAddress)) {
    return NextResponse.json(
      { error: 'A valid wallet address is required.' },
      { status: 400 }
    );
  }

  if (!sessionToken) {
    return NextResponse.json(
      { error: 'A valid wallet session token is required.' },
      { status: 400 }
    );
  }

  try {
    verifyTestnetWalletSessionToken(sessionToken, walletAddress);

    return NextResponse.json({
      ok: true,
      status: 'verified',
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Wallet session validation failed.';
    const lower = message.toLowerCase();
    const status = lower.includes('expired') || lower.includes('invalid') || lower.includes('mismatch')
      ? 401
      : 500;

    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}

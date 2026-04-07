import { NextResponse } from 'next/server';
import { isAddress, verifyMessage } from 'viem';

import {
  createWhitelistEntry,
  findWhitelistEntry,
  isWhitelistSupabaseConfigured,
} from '@/lib/whitelist-supabase';
import { getWhitelistConfirmationMessage } from '@/lib/whitelist-message';
import {
  isSameOriginRequest,
  takeRateLimitToken,
} from '@/lib/request-security';

interface WhitelistPayload {
  walletAddress?: unknown;
  signature?: unknown;
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }

  const rateLimit = takeRateLimitToken(request, 'whitelist-submit', 20);

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

  if (!isWhitelistSupabaseConfigured()) {
    return NextResponse.json(
      { error: 'Whitelist Supabase is not configured on the server.' },
      { status: 503 }
    );
  }

  let payload: WhitelistPayload;

  try {
    payload = (await request.json()) as WhitelistPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const walletAddress =
    typeof payload.walletAddress === 'string' ? payload.walletAddress.trim() : '';
  const signature =
    typeof payload.signature === 'string' ? payload.signature.trim() : '';

  if (!isAddress(walletAddress)) {
    return NextResponse.json(
      { error: 'A valid wallet address is required.' },
      { status: 400 }
    );
  }

  if (!signature) {
    return NextResponse.json(
      { error: 'A valid wallet signature is required.' },
      { status: 400 }
    );
  }

  try {
    const isVerified = await verifyMessage({
      address: walletAddress as `0x${string}`,
      message: getWhitelistConfirmationMessage(walletAddress),
      signature: signature as `0x${string}`,
    });

    if (!isVerified) {
      return NextResponse.json(
        { error: 'Wallet signature verification failed.' },
        { status: 401 }
      );
    }

    const existingEntry = await findWhitelistEntry(walletAddress);

    if (existingEntry) {
      return NextResponse.json({
        ok: true,
        status: 'already_registered',
        walletAddress: existingEntry.walletAddress,
        createdAt: existingEntry.createdAt,
      });
    }

    await createWhitelistEntry(walletAddress);

    return NextResponse.json({
      ok: true,
      status: 'registered',
      walletAddress: walletAddress.toLowerCase(),
    });
  } catch (error) {
    console.error('Whitelist submission failed:', error);
    return NextResponse.json(
      { error: 'Unable to save your whitelist entry right now.' },
      { status: 500 }
    );
  }
}

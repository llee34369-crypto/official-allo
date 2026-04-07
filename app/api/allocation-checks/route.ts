import { NextResponse } from 'next/server';

import { isSupabaseConfigured, upsertAllocationCheck } from '@/lib/supabase-admin';
import {
  isSameOriginRequest,
  takeRateLimitToken,
} from '@/lib/request-security';

const walletAddressPattern = /^0x[a-fA-F0-9]{40}$/;

interface AllocationCheckPayload {
  address?: unknown;
  txCount?: unknown;
  isEligible?: unknown;
  allocation?: unknown;
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }

  const rateLimit = takeRateLimitToken(request, 'allocation-checks', 120);

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

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        warning: 'Supabase is not configured on the server.',
      },
      { status: 200 }
    );
  }

  let payload: AllocationCheckPayload;

  try {
    payload = (await request.json()) as AllocationCheckPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const address = typeof payload.address === 'string' ? payload.address.trim() : '';
  const txCount =
    typeof payload.txCount === 'number' ? payload.txCount : Number.NaN;
  const allocation =
    typeof payload.allocation === 'number' ? payload.allocation : Number.NaN;

  if (!walletAddressPattern.test(address)) {
    return NextResponse.json(
      { error: 'A valid wallet address is required.' },
      { status: 400 }
    );
  }

  if (!Number.isInteger(txCount) || txCount < 0) {
    return NextResponse.json(
      { error: 'txCount must be a non-negative integer.' },
      { status: 400 }
    );
  }

  if (typeof payload.isEligible !== 'boolean') {
    return NextResponse.json(
      { error: 'isEligible must be a boolean.' },
      { status: 400 }
    );
  }

  if (!Number.isInteger(allocation) || allocation < 0) {
    return NextResponse.json(
      { error: 'allocation must be a non-negative integer.' },
      { status: 400 }
    );
  }

  try {
    await upsertAllocationCheck({
      walletAddress: address,
      txCount,
      isEligible: payload.isEligible,
      allocation,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to save allocation check:', error);
    return NextResponse.json(
      {
        ok: false,
        warning: 'Unable to store the allocation check right now.',
      },
      { status: 200 }
    );
  }
}

import { NextResponse } from 'next/server';
import { isAddress } from 'viem';

import {
  createPendingDesktopVoiceQuestSign,
  getPendingDesktopVoiceQuestSign,
} from '@/lib/testnet-voice-quest-desktop-sign';
import {
  verifyVoiceQuestClaimToken,
} from '@/lib/testnet-voice-quest';
import { verifyTestnetWalletSessionToken } from '@/lib/testnet-wallet-session';
import { isSameOriginRequest, takeRateLimitToken } from '@/lib/request-security';

interface CreateDesktopSignPayload {
  walletAddress?: unknown;
  claimToken?: unknown;
  sessionToken?: unknown;
  expectedText?: unknown;
}

function validateWalletAddress(value: unknown) {
  const walletAddress = typeof value === 'string' ? value.trim() : '';

  if (!isAddress(walletAddress)) {
    throw new Error('A valid wallet address is required.');
  }

  return walletAddress;
}

export async function GET(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }

  const rateLimit = takeRateLimitToken(request, 'testnet-voice-quest-desktop-sign-get', 60);

  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = validateWalletAddress(searchParams.get('address'));
    const sessionToken = searchParams.get('sessionToken')?.trim() ?? '';

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'A valid session token is required.' },
        { status: 400 }
      );
    }

    verifyTestnetWalletSessionToken(sessionToken, walletAddress);

    const pending = getPendingDesktopVoiceQuestSign(walletAddress);

    return NextResponse.json({
      ok: true,
      pending: Boolean(pending && !pending.claimedAt),
      claimed: Boolean(pending?.claimedAt),
      requestId: pending?.id ?? null,
      claimToken: pending?.claimedAt ? null : pending?.claimToken ?? null,
      expectedText: pending?.claimedAt ? null : pending?.expectedText ?? null,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to load the desktop sign request.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }

  const rateLimit = takeRateLimitToken(request, 'testnet-voice-quest-desktop-sign-post', 20);

  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  let payload: CreateDesktopSignPayload;

  try {
    payload = (await request.json()) as CreateDesktopSignPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  try {
    const walletAddress = validateWalletAddress(payload.walletAddress);
    const claimToken =
      typeof payload.claimToken === 'string' ? payload.claimToken.trim() : '';
    const sessionToken =
      typeof payload.sessionToken === 'string' ? payload.sessionToken.trim() : '';
    const expectedText =
      typeof payload.expectedText === 'string' ? payload.expectedText.trim() : '';

    if (!claimToken || !sessionToken || !expectedText) {
      return NextResponse.json(
        { error: 'Wallet address, claim token, session token, and expected text are required.' },
        { status: 400 }
      );
    }

    verifyTestnetWalletSessionToken(sessionToken, walletAddress);
    verifyVoiceQuestClaimToken(claimToken, walletAddress);

    const pending = createPendingDesktopVoiceQuestSign({
      walletAddress,
      claimToken,
      expectedText,
    });

    return NextResponse.json({
      ok: true,
      requestId: pending.id,
      status: 'pending_desktop_signature',
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to create the desktop sign request.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

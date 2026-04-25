import { NextResponse } from 'next/server';

import {
  isSameOriginRequest,
  takeRateLimitToken,
} from '@/lib/request-security';

const IDENTIFIER_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

function getJwtRole(token: string | undefined) {
  if (!token) {
    return null;
  }

  const segments = token.split('.');

  if (segments.length < 2) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(segments[1], 'base64url').toString('utf8')
    ) as { role?: unknown };

    return typeof payload.role === 'string' ? payload.role : null;
  } catch {
    return null;
  }
}

function getIdentifier(value: string | undefined, fallback: string) {
  const normalized = value?.trim() || fallback;

  if (!IDENTIFIER_PATTERN.test(normalized)) {
    throw new Error('Invalid testnet realtime identifier.');
  }

  return normalized;
}

function getTestnetRealtimeConfig() {
  const url = process.env.TESTNET_POINTS_SUPABASE_URL?.trim();
  const explicitAnonKey =
    process.env.TESTNET_POINTS_REALTIME_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_TESTNET_POINTS_ANON_KEY?.trim();
  const legacyKey = process.env.TESTNET_POINTS_SUPABASE_SERVICE_ROLE_KEY?.trim();
  const anonKey =
    explicitAnonKey || (getJwtRole(legacyKey) === 'anon' ? legacyKey : null);

  if (!url || !anonKey) {
    return null;
  }

  return {
    wsUrl: `${url.replace(/\/$/, '').replace(/^http/i, 'ws')}/realtime/v1/websocket`,
    anonKey,
    schema: 'public',
    table: getIdentifier(process.env.TESTNET_POINTS_TABLE, 'wallet_points'),
    walletColumn: getIdentifier(
      process.env.TESTNET_POINTS_WALLET_COLUMN,
      'wallet_address'
    ),
    pointsColumn: getIdentifier(
      process.env.TESTNET_POINTS_VALUE_COLUMN,
      'total_points'
    ),
  };
}

export async function GET(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }

  const rateLimit = takeRateLimitToken(request, 'testnet-realtime-config', 60);

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

  try {
    const realtime = getTestnetRealtimeConfig();

    if (!realtime) {
      return NextResponse.json(
        {
          ok: false,
          warning: 'Live point updates are not configured on the server yet.',
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ ok: true, realtime });
  } catch (error) {
    console.error('Failed to build testnet realtime config:', error);

    return NextResponse.json(
      {
        ok: false,
        warning: 'Live point updates are unavailable right now.',
      },
      { status: 200 }
    );
  }
}

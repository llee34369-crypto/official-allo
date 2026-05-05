import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';

interface SignedTestnetWalletSessionPayload {
  type: 'testnet_wallet_session';
  walletAddress: string;
  exp: number;
}

const SESSION_DURATION_MS = 60 * 60 * 1000;

const normalizeWalletAddress = (value: string) => value.trim().toLowerCase();

function getSessionSecret() {
  const explicitSecret = process.env.TESTNET_WALLET_SESSION_SECRET?.trim();
  const fallbackSecret = process.env.TESTNET_VOICE_QUEST_SECRET?.trim();
  const serviceRoleKey =
    process.env.TESTNET_POINTS_SUPABASE_SERVICE_ROLE_KEY?.trim();

  const secret = explicitSecret || fallbackSecret || serviceRoleKey;

  if (!secret) {
    throw new Error(
      'Missing TESTNET_WALLET_SESSION_SECRET, TESTNET_VOICE_QUEST_SECRET, or TESTNET_POINTS_SUPABASE_SERVICE_ROLE_KEY.'
    );
  }

  return secret;
}

function encodeTokenPart(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function decodeTokenPart(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function signTokenPayload(payload: SignedTestnetWalletSessionPayload) {
  const payloadPart = encodeTokenPart(JSON.stringify(payload));
  const signature = createHmac('sha256', getSessionSecret())
    .update(payloadPart)
    .digest('base64url');

  return `${payloadPart}.${signature}`;
}

function verifySignedToken(token: string) {
  const [payloadPart, signaturePart] = token.split('.');

  if (!payloadPart || !signaturePart) {
    throw new Error('Invalid wallet session token.');
  }

  const expectedSignature = createHmac('sha256', getSessionSecret())
    .update(payloadPart)
    .digest();
  const providedSignature = Buffer.from(signaturePart, 'base64url');

  if (
    expectedSignature.length !== providedSignature.length ||
    !timingSafeEqual(expectedSignature, providedSignature)
  ) {
    throw new Error('Invalid wallet session token signature.');
  }

  const payload = JSON.parse(
    decodeTokenPart(payloadPart)
  ) as SignedTestnetWalletSessionPayload;

  if (payload.type !== 'testnet_wallet_session') {
    throw new Error('Wallet session token type mismatch.');
  }

  if (Date.now() > payload.exp) {
    throw new Error('Wallet session token expired.');
  }

  return payload;
}

export function createTestnetWalletSessionToken(walletAddress: string) {
  return signTokenPayload({
    type: 'testnet_wallet_session',
    walletAddress: normalizeWalletAddress(walletAddress),
    exp: Date.now() + SESSION_DURATION_MS,
  });
}

export function verifyTestnetWalletSessionToken(token: string, walletAddress: string) {
  const payload = verifySignedToken(token);
  const normalizedWalletAddress = normalizeWalletAddress(walletAddress);

  if (payload.walletAddress !== normalizedWalletAddress) {
    throw new Error('Wallet session wallet mismatch.');
  }

  return payload;
}

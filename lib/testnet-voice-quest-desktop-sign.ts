import 'server-only';

import { randomUUID } from 'node:crypto';

interface PendingDesktopVoiceQuestSign {
  id: string;
  walletAddress: string;
  claimToken: string;
  expectedText: string;
  createdAt: number;
  claimedAt: number | null;
}

const TTL_MS = 15 * 60 * 1000;
const pendingByWallet = new Map<string, PendingDesktopVoiceQuestSign>();

const normalizeWalletAddress = (value: string) => value.trim().toLowerCase();

function cleanupPending() {
  const now = Date.now();

  for (const [walletAddress, entry] of pendingByWallet.entries()) {
    if (now - entry.createdAt > TTL_MS) {
      pendingByWallet.delete(walletAddress);
    }
  }
}

export function createPendingDesktopVoiceQuestSign(input: {
  walletAddress: string;
  claimToken: string;
  expectedText: string;
}) {
  cleanupPending();

  const entry: PendingDesktopVoiceQuestSign = {
    id: randomUUID(),
    walletAddress: normalizeWalletAddress(input.walletAddress),
    claimToken: input.claimToken.trim(),
    expectedText: input.expectedText.trim(),
    createdAt: Date.now(),
    claimedAt: null,
  };

  pendingByWallet.set(entry.walletAddress, entry);
  return entry;
}

export function getPendingDesktopVoiceQuestSign(walletAddress: string) {
  cleanupPending();
  return pendingByWallet.get(normalizeWalletAddress(walletAddress)) ?? null;
}

export function markPendingDesktopVoiceQuestSignClaimed(
  walletAddress: string,
  claimToken: string
) {
  cleanupPending();
  const normalizedWalletAddress = normalizeWalletAddress(walletAddress);
  const entry = pendingByWallet.get(normalizedWalletAddress);

  if (!entry || entry.claimToken !== claimToken.trim()) {
    return false;
  }

  entry.claimedAt = Date.now();
  pendingByWallet.set(normalizedWalletAddress, entry);
  return true;
}

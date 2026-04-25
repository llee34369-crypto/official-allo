import { NextResponse } from 'next/server';
import { isAddress, verifyMessage } from 'viem';

import {
  DOWNLOAD_SPK_WALLET_QUEST_ID,
  DOWNLOAD_SPK_WALLET_QUEST_REWARD_POINTS,
  getTestnetQuestOwnershipMessage,
} from '@/lib/testnet-quest-message';
import {
  claimQuestReward,
  isTestnetWalletPointsConfigured,
} from '@/lib/testnet-wallet-points';
import {
  isSameOriginRequest,
  takeRateLimitToken,
} from '@/lib/request-security';

interface ClaimQuestRewardPayload {
  walletAddress?: unknown;
  signature?: unknown;
  questId?: unknown;
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }

  const rateLimit = takeRateLimitToken(request, 'testnet-quest-reward', 20);

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

  if (!isTestnetWalletPointsConfigured()) {
    return NextResponse.json(
      { error: 'Wallet points are not configured on the server.' },
      { status: 503 }
    );
  }

  let payload: ClaimQuestRewardPayload;

  try {
    payload = (await request.json()) as ClaimQuestRewardPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const walletAddress =
    typeof payload.walletAddress === 'string' ? payload.walletAddress.trim() : '';
  const signature =
    typeof payload.signature === 'string' ? payload.signature.trim() : '';
  const questId =
    typeof payload.questId === 'string' ? payload.questId.trim() : '';

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

  if (questId !== DOWNLOAD_SPK_WALLET_QUEST_ID) {
    return NextResponse.json(
      { error: 'Unsupported testnet quest.' },
      { status: 400 }
    );
  }

  try {
    const isVerified = await verifyMessage({
      address: walletAddress as `0x${string}`,
      message: getTestnetQuestOwnershipMessage(walletAddress),
      signature: signature as `0x${string}`,
    });

    if (!isVerified) {
      return NextResponse.json(
        { error: 'Wallet signature verification failed.' },
        { status: 401 }
      );
    }

    const claimResult = await claimQuestReward(
      walletAddress,
      questId,
      DOWNLOAD_SPK_WALLET_QUEST_REWARD_POINTS
    );

    return NextResponse.json({
      ok: true,
      status: 'verified',
      questId,
      alreadyClaimed: claimResult.alreadyClaimed,
      rewardPoints: claimResult.addedPoints,
      points: claimResult.totalPoints,
    });
  } catch (error) {
    console.error('Failed to claim testnet quest reward:', error);

    return NextResponse.json(
      { error: 'Unable to claim the testnet quest reward right now.' },
      { status: 500 }
    );
  }
}

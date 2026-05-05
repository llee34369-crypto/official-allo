import { NextResponse } from 'next/server';
import { isAddress, verifyMessage } from 'viem';

import {
  DAILY_VOICE_RECORD_QUEST_DAILY_LIMIT,
  DAILY_VOICE_RECORD_QUEST_ID,
  DAILY_VOICE_RECORD_QUEST_REWARD_POINTS,
  getDailyVoiceQuestOwnershipMessage,
} from '@/lib/testnet-quest-message';
import {
  claimDailyVoiceQuestReward,
  getDailyVoiceQuestStatus,
  isTestnetWalletPointsConfigured,
} from '@/lib/testnet-wallet-points';
import {
  createVoiceQuestClaimToken,
  createVoiceQuestSentence,
  getNormalizedVoiceQuestText,
  verifyVoiceQuestClaimToken,
  verifyVoiceQuestSentenceToken,
} from '@/lib/testnet-voice-quest';
import { verifyTestnetWalletSessionToken } from '@/lib/testnet-wallet-session';
import {
  isSameOriginRequest,
  takeRateLimitToken,
} from '@/lib/request-security';

interface VerifyVoiceQuestPayload {
  action: 'verify';
  walletAddress?: unknown;
  transcript?: unknown;
  sentenceToken?: unknown;
  legalAccepted?: unknown;
}

interface ClaimVoiceQuestPayload {
  action: 'claim';
  walletAddress?: unknown;
  signature?: unknown;
  claimToken?: unknown;
  sessionToken?: unknown;
}

type VoiceQuestPayload = VerifyVoiceQuestPayload | ClaimVoiceQuestPayload;

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

  const rateLimit = takeRateLimitToken(request, 'testnet-voice-quest-status', 60);

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

  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = validateWalletAddress(searchParams.get('address'));
    const status = await getDailyVoiceQuestStatus(
      walletAddress,
      DAILY_VOICE_RECORD_QUEST_DAILY_LIMIT
    );
    const sentence = createVoiceQuestSentence(walletAddress);

    return NextResponse.json({
      ok: true,
      completedToday: status.completedToday,
      remainingToday: status.remainingToday,
      dailyLimit: status.dailyLimit,
      rewardPoints: DAILY_VOICE_RECORD_QUEST_REWARD_POINTS,
      expectedText: sentence.expectedText,
      sentenceToken: sentence.sentenceToken,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unable to load the daily voice quest status right now.';

    console.error('Failed to load daily voice quest status:', error);

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }

  const rateLimit = takeRateLimitToken(request, 'testnet-voice-quest-claim', 20);

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

  let payload: VoiceQuestPayload;

  try {
    payload = (await request.json()) as VoiceQuestPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  try {
    if (payload.action === 'verify') {
      const walletAddress = validateWalletAddress(payload.walletAddress);
      const transcript =
        typeof payload.transcript === 'string' ? payload.transcript.trim() : '';
      const sentenceToken =
        typeof payload.sentenceToken === 'string' ? payload.sentenceToken.trim() : '';
      const legalAccepted = payload.legalAccepted === true;

      if (!legalAccepted) {
        return NextResponse.json(
          { error: 'You must confirm the privacy policy before verifying.' },
          { status: 400 }
        );
      }

      if (!transcript) {
        return NextResponse.json(
          { error: 'A verified transcript is required.' },
          { status: 400 }
        );
      }

      if (!sentenceToken) {
        return NextResponse.json(
          { error: 'A sentence token is required.' },
          { status: 400 }
        );
      }

      const status = await getDailyVoiceQuestStatus(
        walletAddress,
        DAILY_VOICE_RECORD_QUEST_DAILY_LIMIT
      );

      if (status.remainingToday <= 0) {
        return NextResponse.json(
          { error: 'Daily limit reached for voice recordings.' },
          { status: 409 }
        );
      }

      const sentencePayload = verifyVoiceQuestSentenceToken(sentenceToken, walletAddress);
      const normalizedTranscript = getNormalizedVoiceQuestText(transcript);
      const normalizedExpectedText = getNormalizedVoiceQuestText(
        sentencePayload.expectedText
      );

      if (normalizedTranscript !== normalizedExpectedText) {
        return NextResponse.json(
          { error: 'The recording did not match the required sentence.' },
          { status: 400 }
        );
      }

      const claimToken = createVoiceQuestClaimToken(
        walletAddress,
        sentencePayload.expectedText,
        transcript
      );

      return NextResponse.json({
        ok: true,
        status: 'verified',
        claimToken,
        expectedText: sentencePayload.expectedText,
      });
    }

    if (payload.action === 'claim') {
      const walletAddress = validateWalletAddress(payload.walletAddress);
      const signature =
        typeof payload.signature === 'string' ? payload.signature.trim() : '';
      const claimToken =
        typeof payload.claimToken === 'string' ? payload.claimToken.trim() : '';
      const sessionToken =
        typeof payload.sessionToken === 'string' ? payload.sessionToken.trim() : '';

      if (!signature && !sessionToken) {
        return NextResponse.json(
          { error: 'A valid wallet signature or session token is required.' },
          { status: 400 }
        );
      }

      if (!claimToken) {
        return NextResponse.json(
          { error: 'A verification token is required.' },
          { status: 400 }
        );
      }

      const claimPayload = verifyVoiceQuestClaimToken(claimToken, walletAddress);
      const isVerified = sessionToken
        ? Boolean(verifyTestnetWalletSessionToken(sessionToken, walletAddress))
        : await verifyMessage({
            address: walletAddress as `0x${string}`,
            message: getDailyVoiceQuestOwnershipMessage(
              walletAddress,
              claimPayload.expectedText
            ),
            signature: signature as `0x${string}`,
          });

      if (!isVerified) {
        return NextResponse.json(
          { error: 'Wallet signature verification failed.' },
          { status: 401 }
        );
      }

      const claimResult = await claimDailyVoiceQuestReward({
        walletAddress,
        questId: DAILY_VOICE_RECORD_QUEST_ID,
        pointsToAdd: DAILY_VOICE_RECORD_QUEST_REWARD_POINTS,
        dailyLimit: DAILY_VOICE_RECORD_QUEST_DAILY_LIMIT,
        expectedText: claimPayload.expectedText,
        transcriptText: claimPayload.transcriptText ?? claimPayload.expectedText,
      });

      return NextResponse.json({
        ok: true,
        status: 'claimed',
        rewardPoints: claimResult.addedPoints,
        points: claimResult.totalPoints,
        completedToday: claimResult.completedToday,
        remainingToday: claimResult.remainingToday,
        dailyLimit: DAILY_VOICE_RECORD_QUEST_DAILY_LIMIT,
      });
    }

    return NextResponse.json({ error: 'Unsupported voice quest action.' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to submit the voice quest.';
    const lower = message.toLowerCase();
    const status =
      lower.includes('daily limit reached')
        ? 409
        : lower.includes('wallet mismatch') ||
            lower.includes('expired') ||
            lower.includes('token') ||
            lower.includes('required')
          ? 400
          : 500;

    console.error('Failed to process daily voice quest:', error);

    return NextResponse.json({ error: message }, { status });
  }
}

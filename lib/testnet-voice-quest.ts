import 'server-only';

import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

interface SignedVoiceQuestTokenPayload {
  type: 'voice_sentence' | 'voice_claim';
  walletAddress: string;
  expectedText: string;
  transcriptText?: string;
  exp: number;
}

const OPENINGS = [
  'SpeakerAI helps',
  'The SpeakerAI protocol lets',
  'This voice quest helps',
  'Our secure testnet lets',
  'The voice check lets',
  'This daily challenge helps',
  'SpeakerAI testnet lets',
  'The recording quest helps',
  'The red prompt lets',
  'This wallet check helps',
  'The daily recorder lets',
  'This protocol test helps',
  'Our voice screen lets',
  'The guided reading flow helps',
  'This reward prompt lets',
  'The secure mic check helps',
  'This random phrase test lets',
  'The highlight screen helps',
  'This SpeakerAI flow lets',
  'The phrase verifier helps',
  'This mobile voice test lets',
  'The browser reading quest helps',
  'This testnet prompt lets',
  'The secure speech flow helps',
  'The onchain voice flow helps',
  'This crypto AI quest lets',
  'The wallet agent prompt helps',
  'This token voice check lets',
  'The AI reader flow helps',
  'This model driven quest lets',
  'The blockchain speech check helps',
  'This smart wallet prompt lets',
  'The tokenized voice test helps',
  'This AI protocol flow lets',
  'The crypto recorder prompt helps',
  'This onchain reading quest lets',
];

const SUBJECTS = [
  'wallet users',
  'community members',
  'testnet participants',
  'voice explorers',
  'active listeners',
  'protocol users',
  'daily testers',
  'SPK wallet users',
  'mobile users',
  'browser participants',
  'quest runners',
  'recording users',
  'voice readers',
  'reward hunters',
  'testnet explorers',
  'mic users',
  'daily claimers',
  'dashboard users',
  'protocol testers',
  'sentence readers',
  'prompt followers',
  'wallet signers',
  'voice claimers',
  'reading participants',
  'token holders',
  'onchain builders',
  'AI users',
  'protocol agents',
  'model testers',
  'wallet operators',
  'crypto participants',
  'blockchain readers',
  'token claimers',
  'agent users',
  'smart contract testers',
  'AI explorers',
  'chain users',
  'airdrop hunters',
  'prompt runners',
  'wallet delegates',
];

const ACTIONS = [
  'verify clear speech',
  'record short voice samples',
  'confirm microphone activity',
  'prove spoken accuracy',
  'read random phrases',
  'match prompted words',
  'complete secure voice checks',
  'finish guided recordings',
  'track red highlighted words',
  'follow random reading prompts',
  'complete wallet voice tasks',
  'confirm spoken word matches',
  'pass daily recording checks',
  'read generated phrase sets',
  'complete quick mic prompts',
  'verify recorded word order',
  'finish short wallet checks',
  'repeat random word groups',
  'clear the daily voice task',
  'match highlighted reading cues',
  'complete timed recording steps',
  'follow the black screen prompt',
  'read fast shifting phrases',
  'confirm random spoken patterns',
  'verify token wallet ownership',
  'read AI generated prompts',
  'confirm onchain voice checks',
  'match crypto wallet phrases',
  'complete smart agent tasks',
  'repeat blockchain prompt sets',
  'verify model generated lines',
  'follow token reward prompts',
  'clear AI voice checkpoints',
  'read random onchain phrases',
  'confirm wallet signer prompts',
  'match protocol reward phrases',
  'finish token claim recordings',
  'complete crypto reading rounds',
  'verify AI protocol prompts',
  'repeat secure chain phrases',
];

const ENDINGS = [
  'with private wallet confirmation.',
  'through smooth onchain access.',
  'inside the SpeakerAI testnet.',
  'before claiming daily SP points.',
  'during fast red highlight prompts.',
  'with secure voice reward verification.',
  'inside the black reading screen.',
  'through the daily reward flow.',
  'with one clean mobile tap.',
  'before the signature request opens.',
  'inside the guided wallet flow.',
  'without leaving the testnet page.',
  'with a fast verify step first.',
  'during the random phrase challenge.',
  'across the speaker protocol dashboard.',
  'with live prompt highlighting.',
  'before claiming the next reward.',
  'during the five time daily limit.',
  'inside the voice reward tracker.',
  'through the secure browser session.',
  'while the wallet stays connected.',
  'inside the mobile recording sheet.',
  'after the countdown completes.',
  'before the claim window closes.',
  'while the AI agent stays ready.',
  'before the token reward updates.',
  'inside the crypto voice flow.',
  'through the secure wallet session.',
  'while the onchain prompt updates.',
  'before the blockchain claim step.',
  'inside the AI reward process.',
  'through the token verification round.',
  'while the smart wallet stays active.',
  'before the protocol points settle.',
  'inside the chain synced dashboard.',
  'through the AI powered quest flow.',
  'before the wallet signature returns.',
  'while the testnet reward stays live.',
  'inside the tokenized voice check.',
  'through the crypto agent prompt.',
];

const TOKEN_DURATION_MS = 15 * 60 * 1000;

const normalizeWallet = (value: string) => value.trim().toLowerCase();

function getVoiceQuestSecret() {
  const explicitSecret = process.env.TESTNET_VOICE_QUEST_SECRET?.trim();
  const serviceRoleKey =
    process.env.TESTNET_POINTS_SUPABASE_SERVICE_ROLE_KEY?.trim();

  const secret = explicitSecret || serviceRoleKey;

  if (!secret) {
    throw new Error(
      'Missing TESTNET_VOICE_QUEST_SECRET or TESTNET_POINTS_SUPABASE_SERVICE_ROLE_KEY.'
    );
  }

  return secret;
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function encodeTokenPart(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function decodeTokenPart(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function signTokenPayload(payload: SignedVoiceQuestTokenPayload) {
  const payloadPart = encodeTokenPart(JSON.stringify(payload));
  const signature = createHmac('sha256', getVoiceQuestSecret())
    .update(payloadPart)
    .digest('base64url');

  return `${payloadPart}.${signature}`;
}

function verifySignedToken(token: string, expectedType: SignedVoiceQuestTokenPayload['type']) {
  const [payloadPart, signaturePart] = token.split('.');

  if (!payloadPart || !signaturePart) {
    throw new Error('Invalid voice quest token.');
  }

  const expectedSignature = createHmac('sha256', getVoiceQuestSecret())
    .update(payloadPart)
    .digest();
  const providedSignature = Buffer.from(signaturePart, 'base64url');

  if (
    expectedSignature.length !== providedSignature.length ||
    !timingSafeEqual(expectedSignature, providedSignature)
  ) {
    throw new Error('Invalid voice quest token signature.');
  }

  const payload = JSON.parse(
    decodeTokenPart(payloadPart)
  ) as SignedVoiceQuestTokenPayload;

  if (payload.type !== expectedType) {
    throw new Error('Voice quest token type mismatch.');
  }

  if (Date.now() > payload.exp) {
    throw new Error('Voice quest token expired.');
  }

  return payload;
}

export function createVoiceQuestSentence(walletAddress: string) {
  const normalizedWalletAddress = normalizeWallet(walletAddress);
  const seed = createHash('sha256')
    .update(`${normalizedWalletAddress}:${new Date().toISOString()}:${Math.random()}`)
    .digest();

  const pick = (values: string[], index: number) =>
    values[seed[index] % values.length];

  const expectedText = [
    pick(OPENINGS, 0),
    pick(SUBJECTS, 1),
    pick(ACTIONS, 2),
    pick(ENDINGS, 3),
  ].join(' ');

  const payload: SignedVoiceQuestTokenPayload = {
    type: 'voice_sentence',
    walletAddress: normalizedWalletAddress,
    expectedText,
    exp: Date.now() + TOKEN_DURATION_MS,
  };

  return {
    expectedText,
    sentenceToken: signTokenPayload(payload),
  };
}

export function verifyVoiceQuestSentenceToken(token: string, walletAddress: string) {
  const payload = verifySignedToken(token, 'voice_sentence');
  const normalizedWalletAddress = normalizeWallet(walletAddress);

  if (payload.walletAddress !== normalizedWalletAddress) {
    throw new Error('Voice quest wallet mismatch.');
  }

  return payload;
}

export function createVoiceQuestClaimToken(
  walletAddress: string,
  expectedText: string,
  transcriptText: string
) {
  const payload: SignedVoiceQuestTokenPayload = {
    type: 'voice_claim',
    walletAddress: normalizeWallet(walletAddress),
    expectedText: expectedText.trim(),
    transcriptText: transcriptText.trim(),
    exp: Date.now() + TOKEN_DURATION_MS,
  };

  return signTokenPayload(payload);
}

export function verifyVoiceQuestClaimToken(token: string, walletAddress: string) {
  const payload = verifySignedToken(token, 'voice_claim');
  const normalizedWalletAddress = normalizeWallet(walletAddress);

  if (payload.walletAddress !== normalizedWalletAddress) {
    throw new Error('Voice quest wallet mismatch.');
  }

  return payload;
}

export function getNormalizedVoiceQuestText(value: string) {
  return normalizeText(value);
}

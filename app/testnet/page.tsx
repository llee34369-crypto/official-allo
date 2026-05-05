'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type SVGProps } from 'react';
import { motion } from 'motion/react';
import { AppKit } from '@web3modal/base';
import { ConnectorController, OptionsController } from '@web3modal/core';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useAccount, useConnectors, useDisconnect, useSignMessage } from 'wagmi';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  LoaderCircle,
  Mic,
  Smartphone,
  Sparkles,
  ShieldCheck,
  Wallet,
  X,
  Zap,
} from 'lucide-react';
import {
  DAILY_VOICE_RECORD_QUEST_DAILY_LIMIT,
  DAILY_VOICE_RECORD_QUEST_REWARD_POINTS,
  DOWNLOAD_SPK_WALLET_QUEST_ID,
  DOWNLOAD_SPK_WALLET_QUEST_REWARD_POINTS,
  getDailyVoiceQuestOwnershipMessage,
  getTestnetQuestOwnershipMessage,
} from '@/lib/testnet-quest-message';

const TESTNET_AIRDROP_POOL = 10000000;

const SOCIAL_LINKS = {
  website: 'https://www.speakerai.org',
  x: 'https://x.com/SpeakerProtocol',
  discord: 'https://discord.gg/tyAE9eeE8c',
} as const;

interface WalletPointsRealtimeConfig {
  wsUrl: string;
  anonKey: string;
  schema: string;
  table: string;
  walletColumn: string;
  pointsColumn: string;
}

interface WalletPointsResponse {
  error?: string;
  ok?: boolean;
  warning?: string;
  points?: number;
}

interface WalletPointsRealtimeConfigResponse {
  error?: string;
  ok?: boolean;
  warning?: string;
  realtime?: WalletPointsRealtimeConfig;
}

interface WalletSessionResponse {
  error?: string;
  ok?: boolean;
  status?: string;
}

interface RealtimePostgresChangeRecord {
  [key: string]: string | number | boolean | null | undefined;
}

interface RealtimeMessagePayload {
  data?: {
    record?: RealtimePostgresChangeRecord;
  };
  status?: string;
  message?: string;
}

interface RealtimeMessage {
  event?: string;
  payload?: RealtimeMessagePayload;
}

interface VoiceQuestStatusResponse {
  error?: string;
  ok?: boolean;
  completedToday?: number;
  remainingToday?: number;
  dailyLimit?: number;
  rewardPoints?: number;
  expectedText?: string;
  languageCode?: string;
  sentenceToken?: string;
}

interface VoiceQuestVerifyResponse {
  error?: string;
  ok?: boolean;
  status?: string;
  claimToken?: string;
  expectedText?: string;
  languageCode?: string;
}

interface VoiceQuestClaimResponse {
  error?: string;
  ok?: boolean;
  points?: number;
  rewardPoints?: number;
  completedToday?: number;
  remainingToday?: number;
  dailyLimit?: number;
  status?: string;
}

interface VoiceQuestDesktopSignResponse {
  error?: string;
  ok?: boolean;
  status?: string;
  requestId?: string | null;
  pending?: boolean;
  claimed?: boolean;
  claimToken?: string | null;
  expectedText?: string | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives?: number;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
}

function XLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M18.9 2H22l-6.77 7.74L23 22h-6.1l-4.78-6.6L6.35 22H3.24l7.24-8.28L1 2h6.26l4.32 5.97L18.9 2Zm-1.07 18h1.72L6.33 3.9H4.48L17.83 20Z" />
    </svg>
  );
}

function DiscordLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M20.32 4.37A19.79 19.79 0 0 0 15.43 3c-.21.37-.45.86-.62 1.25a18.35 18.35 0 0 0-5.62 0A12.6 12.6 0 0 0 8.56 3a19.66 19.66 0 0 0-4.9 1.38C.57 9.02-.26 13.54.16 18c2.05 1.52 4.03 2.44 5.98 3.05.48-.66.91-1.36 1.28-2.09-.7-.27-1.36-.6-1.99-.98.17-.12.33-.25.49-.38 3.84 1.8 8 1.8 11.8 0 .17.14.33.27.5.38-.63.39-1.3.72-2 .99.37.73.8 1.43 1.28 2.09 1.95-.61 3.93-1.53 5.98-3.05.5-5.16-.85-9.64-3.16-13.63ZM8.85 15.27c-1.15 0-2.1-1.06-2.1-2.35 0-1.3.93-2.36 2.1-2.36 1.18 0 2.12 1.07 2.1 2.36 0 1.29-.93 2.35-2.1 2.35Zm6.3 0c-1.16 0-2.1-1.06-2.1-2.35 0-1.3.93-2.36 2.1-2.36 1.18 0 2.12 1.07 2.1 2.36 0 1.29-.93 2.35-2.1 2.35Z" />
    </svg>
  );
}

const shortenAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
const formatPoints = (value: number) => new Intl.NumberFormat('en-US').format(value);
const normalizeWalletAddress = (value: string) => value.trim().toLowerCase();
const DEFAULT_VOICE_QUEST_LANGUAGE_CODE = 'en-US';
const VOICE_QUEST_LANGUAGE_OPTIONS = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'es-ES', label: 'Spanish' },
  { value: 'fr-FR', label: 'French' },
  { value: 'de-DE', label: 'German' },
  { value: 'pt-BR', label: 'Portuguese' },
  { value: 'it-IT', label: 'Italian' },
  { value: 'nl-NL', label: 'Dutch' },
  { value: 'pl-PL', label: 'Polish' },
  { value: 'tr-TR', label: 'Turkish' },
  { value: 'ru-RU', label: 'Russian' },
  { value: 'uk-UA', label: 'Ukrainian' },
  { value: 'ar-SA', label: 'Arabic' },
  { value: 'hi-IN', label: 'Hindi' },
  { value: 'bn-BD', label: 'Bengali' },
  { value: 'ur-PK', label: 'Urdu' },
  { value: 'ta-IN', label: 'Tamil' },
  { value: 'id-ID', label: 'Indonesian' },
  { value: 'ms-MY', label: 'Malay' },
  { value: 'vi-VN', label: 'Vietnamese' },
  { value: 'th-TH', label: 'Thai' },
  { value: 'fil-PH', label: 'Filipino' },
  { value: 'sw-KE', label: 'Swahili' },
  { value: 'ko-KR', label: 'Korean' },
  { value: 'ja-JP', label: 'Japanese' },
  { value: 'zh-CN', label: 'Chinese Simplified' },
  { value: 'zh-TW', label: 'Chinese Traditional' },
] as const;
const getWalletSessionStorageKey = (walletAddress: string) =>
  `speakerai:testnet-session:${normalizeWalletAddress(walletAddress)}`;
const isSupportedVoiceQuestLanguage = (value: string) =>
  VOICE_QUEST_LANGUAGE_OPTIONS.some((option) => option.value === value);
const getSpeechRecognitionLanguageFallbacks = (preferredLanguageCode: string) => {
  const normalizedPreferredLanguageCode = preferredLanguageCode.trim();
  const browserLanguage =
    typeof navigator !== 'undefined' ? navigator.language?.trim() || '' : '';
  const fallbackCandidates = [
    normalizedPreferredLanguageCode,
    normalizedPreferredLanguageCode.split('-')[0] || '',
    browserLanguage,
    browserLanguage.split('-')[0] || '',
    DEFAULT_VOICE_QUEST_LANGUAGE_CODE,
    'en',
  ];

  return fallbackCandidates.filter(
    (value, index, values) => value && values.indexOf(value) === index
  );
};
const normalizeSpeechText = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
const getIntlSegmenter = (languageCode: string) => {
  const IntlWithSegmenter = Intl as typeof Intl & {
    Segmenter?: new (
      locales?: string | string[],
      options?: { granularity?: 'grapheme' | 'word' | 'sentence' }
    ) => {
      segment(input: string): Iterable<{ segment: string; isWordLike?: boolean }>;
    };
  };

  if (!IntlWithSegmenter.Segmenter) {
    return null;
  }

  return new IntlWithSegmenter.Segmenter(languageCode, {
    granularity: 'word',
  });
};
const segmentSpeechText = (value: string, languageCode: string) => {
  const normalized = normalizeSpeechText(value);

  if (!normalized) {
    return [];
  }

  const segmenter = getIntlSegmenter(languageCode);

  if (segmenter) {
    const segmentedWords = Array.from(segmenter.segment(normalized))
      .filter((part) => part.isWordLike !== false)
      .map((part) => part.segment.trim())
      .filter(Boolean);

    if (segmentedWords.length) {
      return segmentedWords;
    }
  }

  return normalized.split(' ').filter(Boolean);
};
const segmentDisplayText = (value: string, languageCode: string) => {
  const trimmed = value.trim();

  if (!trimmed) {
    return [];
  }

  const segmenter = getIntlSegmenter(languageCode);

  if (segmenter) {
    const segments = Array.from(segmenter.segment(trimmed))
      .filter((part) => part.isWordLike !== false)
      .map((part) => part.segment)
      .filter(Boolean);

    if (segments.length) {
      return segments;
    }
  }

  return trimmed.split(/\s+/).filter(Boolean);
};

const getMatchedWordCount = (expectedWords: string[], spokenWords: string[]) => {
  if (!expectedWords.length || !spokenWords.length) {
    return 0;
  }

  let count = 0;

  for (const spokenWord of spokenWords) {
    if (spokenWord === expectedWords[count]) {
      count += 1;

      if (count >= expectedWords.length) {
        return expectedWords.length;
      }

      continue;
    }

    count = spokenWord === expectedWords[0] ? 1 : 0;
  }

  return count;
};

const getWordProgressState = (
  index: number,
  matchedWordCount: number,
  status: string
) => {
  if (index < matchedWordCount) {
    return 'matched';
  }

  if (index === matchedWordCount && status === 'recording') {
    return 'active';
  }

  return 'pending';
};

const SPK_WALLET_CONNECTOR_IDS = [
  'cfhicbdppkipecleloppbdmakjocgnoi',
]
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

const matchesSpkWallet = (value: { id?: string; name?: string; rdns?: string | readonly string[] } | null | undefined) => {
  const connectorId = (value?.id ?? '').toLowerCase();
  const connectorName = (value?.name ?? '').toLowerCase();
  const rdnsValues = Array.isArray(value?.rdns) ? value.rdns : value?.rdns ? [value.rdns] : [];
  const normalizedRdnsValues = rdnsValues.map((item) => item.toLowerCase());
  const haystack = `${connectorId} ${connectorName} ${normalizedRdnsValues.join(' ')}`;

  if (connectorId && SPK_WALLET_CONNECTOR_IDS.includes(connectorId)) {
    return true;
  }

  return haystack.includes('spk');
};

export default function WhitelistPage() {
  const spkWalletQuestPoints = DOWNLOAD_SPK_WALLET_QUEST_REWARD_POINTS;
  const voiceQuestPoints = DAILY_VOICE_RECORD_QUEST_REWARD_POINTS;
  const autoClaimAttemptedRef = useRef<string | null>(null);
  const connectedQuestWalletRef = useRef<string | null>(null);
  const countdownTimeoutRef = useRef<number | null>(null);
  const autoCloseTimeoutRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const speechRecognitionRestartTimeoutRef = useRef<number | null>(null);
  const speechRecognitionFinalTranscriptRef = useRef('');
  const speechRecognitionStoppingRef = useRef(false);
  const voiceQuestAutoStopTriggeredRef = useRef(false);
  const voiceRecognitionActiveRef = useRef(false);
  const voiceChunksRef = useRef<Blob[]>([]);
  const voiceQuestCancelledRef = useRef(false);
  const originalConnectorStateRef = useRef<{
    unMergedConnectors: typeof ConnectorController.state.unMergedConnectors;
    connectors: typeof ConnectorController.state.connectors;
  } | null>(null);
  const originalModalOptionsRef = useRef<{
    allWallets: typeof OptionsController.state.allWallets;
    includeWalletIds: typeof OptionsController.state.includeWalletIds;
    excludeWalletIds: typeof OptionsController.state.excludeWalletIds;
    featuredWalletIds: typeof OptionsController.state.featuredWalletIds;
  } | null>(null);
  const { address, connector, isConnected, isReconnecting, status } = useAccount();
  const { open } = useWeb3Modal();
  const connectors = useConnectors();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const [walletPoints, setWalletPoints] = useState<number | null>(null);
  const [walletPointsLoading, setWalletPointsLoading] = useState(false);
  const [walletPointsWarning, setWalletPointsWarning] = useState<string | null>(null);
  const [questClaimStatus, setQuestClaimStatus] = useState<'idle' | 'claiming' | 'claimed'>('idle');
  const [questClaimWarning, setQuestClaimWarning] = useState<string | null>(null);
  const [downloadSpkWalletQuestClaimed, setDownloadSpkWalletQuestClaimed] = useState(false);
  const [walletVerifiedForSession, setWalletVerifiedForSession] = useState(false);
  const [voiceQuestOpen, setVoiceQuestOpen] = useState(false);
  const [voiceQuestStatus, setVoiceQuestStatus] = useState<
    | 'idle'
    | 'legal'
    | 'countdown'
    | 'recording'
    | 'verifying'
    | 'verified'
    | 'awaiting_desktop_signature'
    | 'signing'
    | 'success'
  >('idle');
  const [voiceQuestWarning, setVoiceQuestWarning] = useState<string | null>(null);
  const [voiceQuestTranscript, setVoiceQuestTranscript] = useState('');
  const [voiceQuestCountdown, setVoiceQuestCountdown] = useState<number | null>(null);
  const [voiceQuestLegalAccepted, setVoiceQuestLegalAccepted] = useState(false);
  const [voiceQuestBlob, setVoiceQuestBlob] = useState<Blob | null>(null);
  const [voiceQuestMimeType, setVoiceQuestMimeType] = useState('audio/webm');
  const [voiceQuestExpectedText, setVoiceQuestExpectedText] = useState('');
  const [voiceQuestLanguageCode, setVoiceQuestLanguageCode] = useState(
    DEFAULT_VOICE_QUEST_LANGUAGE_CODE
  );
  const [voiceQuestLanguageMenuOpen, setVoiceQuestLanguageMenuOpen] = useState(false);
  const [voiceQuestResolvedLanguageCode, setVoiceQuestResolvedLanguageCode] = useState(
    DEFAULT_VOICE_QUEST_LANGUAGE_CODE
  );
  const [voiceQuestSentenceToken, setVoiceQuestSentenceToken] = useState<string | null>(null);
  const [voiceQuestClaimToken, setVoiceQuestClaimToken] = useState<string | null>(null);
  const [voiceQuestCompletedToday, setVoiceQuestCompletedToday] = useState(0);
  const [voiceQuestRemainingToday, setVoiceQuestRemainingToday] = useState(
    DAILY_VOICE_RECORD_QUEST_DAILY_LIMIT
  );
  const [hasMicrophone, setHasMicrophone] = useState(true);
  const [audioInputDevices, setAudioInputDevices] = useState<
    Array<{ deviceId: string; label: string }>
  >([]);
  const [selectedAudioInputId, setSelectedAudioInputId] = useState('');
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [mobileOpenUrl, setMobileOpenUrl] = useState('');
  const [mobileVoiceQuestWallet, setMobileVoiceQuestWallet] = useState('');
  const [mobileVoiceQuestRequested, setMobileVoiceQuestRequested] = useState(false);
  const [walletSessionToken, setWalletSessionToken] = useState<string | null>(null);
  const [mobileWalletSessionToken, setMobileWalletSessionToken] = useState('');
  const [mobileSessionWalletAddress, setMobileSessionWalletAddress] = useState('');
  const [pendingDesktopVoiceQuestRequestId, setPendingDesktopVoiceQuestRequestId] = useState<
    string | null
  >(null);
  const mobileVoiceQuestPromptedRef = useRef(false);
  const mobileVoiceQuestOpenedRef = useRef(false);
  const desktopVoiceQuestRequestHandledRef = useRef<string | null>(null);
  const spkConnector = connectors.find((connector) =>
    matchesSpkWallet({
      id: connector.id,
      name: connector.name,
      rdns: connector.rdns,
    })
  );
  const isConnectedWithSpkWallet = matchesSpkWallet({
    id: connector?.id,
    name: connector?.name,
    rdns: connector?.rdns,
  });
  const canClaimSpkWalletQuest = Boolean(isConnected && address && isConnectedWithSpkWallet);
  const hasCompletedSpkWalletQuest = downloadSpkWalletQuestClaimed;
  const activeQuestWalletAddress =
    (address && canClaimSpkWalletQuest ? address : mobileSessionWalletAddress) || '';
  const hasUnlockedTestnetPage = Boolean(activeQuestWalletAddress && walletVerifiedForSession);
  const hasSessionBackedMobileFlow = Boolean(
    mobileVoiceQuestRequested &&
      mobileSessionWalletAddress &&
      mobileWalletSessionToken &&
      walletVerifiedForSession
  );
  const shouldSignVoiceQuestOnDesktop = Boolean(
    hasSessionBackedMobileFlow && !canClaimSpkWalletQuest
  );
  const normalizedConnectedAddress = address ? normalizeWalletAddress(address) : '';
  const normalizedMobileVoiceQuestWallet = mobileVoiceQuestWallet
    ? normalizeWalletAddress(mobileVoiceQuestWallet)
    : '';
  const voiceRecognitionSupported =
    typeof window !== 'undefined' &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  const shouldShowMobileOpenPanel = !isMobileViewport && Boolean(mobileOpenUrl);
  const shouldShowVoiceQuestMobileQr =
    voiceQuestOpen &&
    voiceQuestStatus === 'legal' &&
    !isMobileViewport &&
    Boolean(mobileOpenUrl);
  const mobileQrImageUrl = mobileOpenUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
        mobileOpenUrl
      )}`
    : '';
  const normalizedExpectedWords = normalizeSpeechText(voiceQuestExpectedText)
    ? segmentSpeechText(voiceQuestExpectedText, voiceQuestResolvedLanguageCode)
    : [];
  const normalizedTranscriptWords = normalizeSpeechText(voiceQuestTranscript)
    ? segmentSpeechText(voiceQuestTranscript, voiceQuestResolvedLanguageCode)
    : [];
  const displayExpectedWords = segmentDisplayText(
    voiceQuestExpectedText,
    voiceQuestResolvedLanguageCode
  );
  const expectedTextUsesWhitespace = /\s/u.test(voiceQuestExpectedText);
  const requestedVoiceQuestLanguageCode = voiceQuestLanguageCode;
  const selectedVoiceQuestLanguage =
    VOICE_QUEST_LANGUAGE_OPTIONS.find((option) => option.value === voiceQuestLanguageCode) ??
    VOICE_QUEST_LANGUAGE_OPTIONS[0];
  const matchedWordCount = getMatchedWordCount(
    normalizedExpectedWords,
    normalizedTranscriptWords
  );
  const visibleTranscriptWords = normalizedTranscriptWords.slice(-12);
  const visibleTranscriptWordStartIndex = Math.max(
    0,
    normalizedTranscriptWords.length - visibleTranscriptWords.length
  );
  const hasPerfectTranscript =
    normalizeSpeechText(voiceQuestTranscript) === normalizeSpeechText(voiceQuestExpectedText);
  const shouldUseNativeVoiceLanguageSelector = isMobileViewport;

  const stopVoiceCapture = () => {
    voiceQuestCancelledRef.current = true;
    speechRecognitionStoppingRef.current = true;
    voiceRecognitionActiveRef.current = false;
    speechRecognitionFinalTranscriptRef.current = '';
    voiceQuestAutoStopTriggeredRef.current = false;

    if (countdownTimeoutRef.current !== null) {
      window.clearTimeout(countdownTimeoutRef.current);
      countdownTimeoutRef.current = null;
    }

    if (speechRecognitionRestartTimeoutRef.current !== null) {
      window.clearTimeout(speechRecognitionRestartTimeoutRef.current);
      speechRecognitionRestartTimeoutRef.current = null;
    }

    speechRecognitionRef.current?.stop();
    speechRecognitionRef.current = null;

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    mediaRecorderRef.current = null;

    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  };

  const closeVoiceQuestModal = () => {
    stopVoiceCapture();

    if (autoCloseTimeoutRef.current !== null) {
      window.clearTimeout(autoCloseTimeoutRef.current);
      autoCloseTimeoutRef.current = null;
    }

    setVoiceQuestOpen(false);
    setVoiceQuestStatus('idle');
    setVoiceQuestWarning(null);
    setVoiceQuestCountdown(null);
    setVoiceQuestTranscript('');
    setVoiceQuestBlob(null);
    setVoiceQuestMimeType('audio/webm');
    setVoiceQuestExpectedText('');
    setVoiceQuestLanguageMenuOpen(false);
    setVoiceQuestResolvedLanguageCode(requestedVoiceQuestLanguageCode);
    setVoiceQuestSentenceToken(null);
    setVoiceQuestClaimToken(null);
    setPendingDesktopVoiceQuestRequestId(null);
    voiceChunksRef.current = [];
  };

  const resetVoiceQuestForNextAttempt = async () => {
    if (!activeQuestWalletAddress || !hasUnlockedTestnetPage) {
      closeVoiceQuestModal();
      return;
    }

    try {
      const nextSession = await fetchVoiceQuestSession(activeQuestWalletAddress);
      setVoiceQuestWarning(null);
      setVoiceQuestTranscript('');
      setVoiceQuestBlob(null);
      setVoiceQuestMimeType('audio/webm');
      setVoiceQuestCountdown(null);
      setVoiceQuestClaimToken(null);
      setPendingDesktopVoiceQuestRequestId(null);
      voiceChunksRef.current = [];

      if ((nextSession.remainingToday ?? 0) > 0) {
        setVoiceQuestStatus('legal');
        return;
      }
    } catch (error) {
      console.error('Failed to refresh voice quest after success:', error);
    }

    closeVoiceQuestModal();
  };

  const fetchVoiceQuestSession = async (
    walletAddress: string,
    signal?: AbortSignal,
    languageCode = requestedVoiceQuestLanguageCode
  ) => {
    const searchParams = new URLSearchParams({
      address: walletAddress,
      language: languageCode,
    });
    const response = await fetch(
      `/api/testnet/voice-quest?${searchParams.toString()}`,
      {
        method: 'GET',
        cache: 'no-store',
        signal,
      }
    );

    const payload = (await response.json()) as VoiceQuestStatusResponse | undefined;

    if (!response.ok || payload?.ok !== true) {
      throw new Error(payload?.error || 'Unable to load the daily voice quest.');
    }

    setVoiceQuestCompletedToday(
      typeof payload.completedToday === 'number' ? payload.completedToday : 0
    );
    setVoiceQuestRemainingToday(
      typeof payload.remainingToday === 'number'
        ? payload.remainingToday
        : DAILY_VOICE_RECORD_QUEST_DAILY_LIMIT
    );
    setVoiceQuestExpectedText(payload.expectedText?.trim() || '');
    setVoiceQuestResolvedLanguageCode(
      payload.languageCode?.trim() || languageCode || DEFAULT_VOICE_QUEST_LANGUAGE_CODE
    );
    setVoiceQuestSentenceToken(payload.sentenceToken?.trim() || null);

    return payload;
  };

  const wait = (ms: number) =>
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, ms);
    });

  const claimSpkWalletQuest = async () => {
    if (!(address && canClaimSpkWalletQuest)) {
      return;
    }

    setQuestClaimStatus('claiming');
    setQuestClaimWarning(null);

    try {
      const signature = await signMessageAsync({
        message: getTestnetQuestOwnershipMessage(address),
      });

      const response = await fetch('/api/testnet/quest-reward', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: address,
          signature,
          questId: DOWNLOAD_SPK_WALLET_QUEST_ID,
        }),
      });

      const payload = (await response.json()) as
        | {
            error?: string;
            ok?: boolean;
            points?: number;
            status?: string;
            rewardPoints?: number;
            alreadyClaimed?: boolean;
            sessionToken?: string;
          }
        | undefined;

      if (!response.ok || payload?.ok !== true) {
        throw new Error(payload?.error || 'Unable to claim the testnet quest reward.');
      }

      setWalletVerifiedForSession(true);
      setDownloadSpkWalletQuestClaimed(true);
      setQuestClaimStatus('claimed');
      setWalletSessionToken(payload?.sessionToken?.trim() || null);
      setWalletPoints((currentPoints) =>
        typeof payload?.points === 'number' ? payload.points : currentPoints
      );
      setWalletPointsWarning(null);
      setQuestClaimWarning(
        payload?.alreadyClaimed
          ? 'Your wallet is connected. This reward has already been claimed, so your SP balance stays the same.'
          : null
      );

      if (typeof window !== 'undefined' && payload?.sessionToken?.trim()) {
        window.localStorage.setItem(
          getWalletSessionStorageKey(address),
          payload.sessionToken.trim()
        );
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to claim the testnet quest reward.';

      if (message.toLowerCase().includes('user rejected')) {
        setQuestClaimWarning('Signature request was cancelled. Use Verify ownership to try again.');
      } else {
        setQuestClaimWarning(message);
      }

      setQuestClaimStatus(walletVerifiedForSession ? 'claimed' : 'idle');
    }
  };

  useEffect(() => {
    if (!(isConnected && address && isConnectedWithSpkWallet)) {
      connectedQuestWalletRef.current = null;
      desktopVoiceQuestRequestHandledRef.current = null;

      if (hasSessionBackedMobileFlow) {
        return;
      }

      setWalletPoints(null);
      setWalletPointsLoading(false);
      setWalletPointsWarning(null);
      setDownloadSpkWalletQuestClaimed(false);
      setWalletVerifiedForSession(false);
      setWalletSessionToken(null);
      setQuestClaimStatus('idle');
      setQuestClaimWarning(null);
      autoClaimAttemptedRef.current = null;
      setVoiceQuestCompletedToday(0);
      setVoiceQuestRemainingToday(DAILY_VOICE_RECORD_QUEST_DAILY_LIMIT);
      closeVoiceQuestModal();
      return;
    }

    const abortController = new AbortController();
    const normalizedAddress = address.toLowerCase();
    const isNewConnectedWallet = connectedQuestWalletRef.current !== normalizedAddress;

    if (isNewConnectedWallet) {
      connectedQuestWalletRef.current = normalizedAddress;
      desktopVoiceQuestRequestHandledRef.current = null;
      setDownloadSpkWalletQuestClaimed(false);
      setWalletVerifiedForSession(false);
      setWalletSessionToken(null);
      setQuestClaimStatus('idle');
      setQuestClaimWarning(null);
      autoClaimAttemptedRef.current = null;
    }

    let shouldReconnect = true;
    let reconnectTimeoutId: number | null = null;
    let heartbeatIntervalId: number | null = null;
    let socket: WebSocket | null = null;
    let messageRef = 1;

    const clearRealtimeConnection = () => {
      if (reconnectTimeoutId !== null) {
        window.clearTimeout(reconnectTimeoutId);
        reconnectTimeoutId = null;
      }

      if (heartbeatIntervalId !== null) {
        window.clearInterval(heartbeatIntervalId);
        heartbeatIntervalId = null;
      }

      if (socket) {
        socket.close();
        socket = null;
      }
    };

    const connectRealtime = (realtime: WalletPointsRealtimeConfig) => {
      clearRealtimeConnection();

      const topic = `realtime:testnet-wallet-points-${normalizedAddress}`;
      socket = new WebSocket(
        `${realtime.wsUrl}?apikey=${encodeURIComponent(realtime.anonKey)}&vsn=1.0.0`
      );

      socket.addEventListener('open', () => {
        messageRef = 1;

        socket?.send(
          JSON.stringify({
            topic,
            event: 'phx_join',
            payload: {
              config: {
                broadcast: { ack: false, self: false },
                presence: { enabled: false },
                postgres_changes: [
                  {
                    event: '*',
                    schema: realtime.schema,
                    table: realtime.table,
                    filter: `${realtime.walletColumn}=eq.${normalizedAddress}`,
                  },
                ],
                private: false,
              },
            },
            ref: '1',
            join_ref: '1',
          })
        );

        heartbeatIntervalId = window.setInterval(() => {
          if (socket?.readyState !== WebSocket.OPEN) {
            return;
          }

          messageRef += 1;
          socket.send(
            JSON.stringify({
              topic: 'phoenix',
              event: 'heartbeat',
              payload: {},
              ref: String(messageRef),
            })
          );
        }, 20000);
      });

      socket.addEventListener('message', (event) => {
        try {
          const message = JSON.parse(event.data) as RealtimeMessage;

          if (message.event === 'postgres_changes') {
            const record = message.payload?.data?.record;
            const nextPoints = Number(record?.[realtime.pointsColumn] ?? 0);

            if (!Number.isNaN(nextPoints)) {
              setWalletPoints(nextPoints);
              setWalletPointsWarning(null);
            }

            return;
          }

          if (message.event === 'system' && message.payload?.status === 'error') {
            setWalletPointsWarning('Live point updates are unavailable right now.');
          }
        } catch (error) {
          console.error('Failed to parse wallet points realtime message:', error);
        }
      });

      socket.addEventListener('error', () => {
        setWalletPointsWarning((currentWarning) =>
          currentWarning ?? 'Live point updates are unavailable right now.'
        );
      });

      socket.addEventListener('close', () => {
        if (heartbeatIntervalId !== null) {
          window.clearInterval(heartbeatIntervalId);
          heartbeatIntervalId = null;
        }

        if (!shouldReconnect || abortController.signal.aborted) {
          return;
        }

        reconnectTimeoutId = window.setTimeout(() => {
          connectRealtime(realtime);
        }, 3000);
      });
    };

    const initializeWalletPoints = async () => {
      setWalletPointsLoading(true);
      setWalletPointsWarning(null);

      try {
        const [walletPointsResponse, realtimeConfigResponse] = await Promise.all([
          fetch(`/api/testnet/wallet-points?address=${encodeURIComponent(address)}`, {
            method: 'GET',
            cache: 'no-store',
            signal: abortController.signal,
          }),
          fetch('/api/testnet/realtime-config', {
            method: 'GET',
            cache: 'no-store',
            signal: abortController.signal,
          }),
        ]);

        const walletPointsPayload = (await walletPointsResponse.json()) as
          | WalletPointsResponse
          | undefined;
        const realtimeConfigPayload = (await realtimeConfigResponse.json()) as
          | WalletPointsRealtimeConfigResponse
          | undefined;

        if (!walletPointsResponse.ok) {
          throw new Error(walletPointsPayload?.error || 'Unable to load wallet points.');
        }

        if (walletPointsPayload?.ok === false) {
          setWalletPoints(null);
          setWalletPointsWarning(
            walletPointsPayload.warning || 'Unable to load SPK Wallet SP points right now.'
          );
          return;
        }

        setWalletPoints(
          typeof walletPointsPayload?.points === 'number' ? walletPointsPayload.points : 0
        );

        if (
          realtimeConfigResponse.ok &&
          realtimeConfigPayload?.ok &&
          realtimeConfigPayload.realtime
        ) {
          connectRealtime(realtimeConfigPayload.realtime);
        } else if (realtimeConfigPayload?.warning) {
          setWalletPointsWarning(
            (currentWarning) => currentWarning ?? realtimeConfigPayload.warning ?? null
          );
        }
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        console.error('Failed to initialize SPK wallet points:', error);
        setWalletPoints(null);
        setWalletPointsWarning('Unable to load SPK Wallet SP points right now.');
      } finally {
        if (!abortController.signal.aborted) {
          setWalletPointsLoading(false);
        }
      }
    };

    void initializeWalletPoints();

    return () => {
      shouldReconnect = false;
      abortController.abort();
      clearRealtimeConnection();
    };
  }, [
    address,
    hasSessionBackedMobileFlow,
    isConnected,
    isConnectedWithSpkWallet,
    mobileSessionWalletAddress,
    mobileVoiceQuestRequested,
    mobileWalletSessionToken,
  ]);

  useEffect(() => {
    if (!activeQuestWalletAddress || !walletVerifiedForSession) {
      return;
    }

    const abortController = new AbortController();

    void fetchVoiceQuestSession(
      activeQuestWalletAddress,
      abortController.signal,
      requestedVoiceQuestLanguageCode
    ).catch((error) => {
      if (!abortController.signal.aborted) {
        console.error('Failed to load voice quest status:', error);
      }
    });

    return () => {
      abortController.abort();
    };
  }, [activeQuestWalletAddress, requestedVoiceQuestLanguageCode, walletVerifiedForSession]);

  useEffect(() => {
    if (!(address && canClaimSpkWalletQuest) || walletVerifiedForSession) {
      return;
    }

    if (questClaimStatus === 'claiming' || walletPointsLoading) {
      return;
    }

    if (autoClaimAttemptedRef.current === address.toLowerCase()) {
      return;
    }

    autoClaimAttemptedRef.current = address.toLowerCase();
    void claimSpkWalletQuest();
  }, [
    address,
    canClaimSpkWalletQuest,
    questClaimStatus,
    walletVerifiedForSession,
    walletPointsLoading,
  ]);

  useEffect(() => {
    if (!originalModalOptionsRef.current) {
      originalModalOptionsRef.current = {
        allWallets: OptionsController.state.allWallets,
        includeWalletIds: OptionsController.state.includeWalletIds,
        excludeWalletIds: OptionsController.state.excludeWalletIds,
        featuredWalletIds: OptionsController.state.featuredWalletIds,
      };
    }

    const enforceSpkConnectorScope = () => {
      const hasNonSpkConnectors = ConnectorController.state.connectors.some(
        (connector) =>
          !matchesSpkWallet({
            id: connector.id,
            name: connector.name,
            rdns: connector.info?.rdns,
          })
      );

      if (!originalConnectorStateRef.current && ConnectorController.state.connectors.length) {
        originalConnectorStateRef.current = {
          unMergedConnectors: [...ConnectorController.state.unMergedConnectors],
          connectors: [...ConnectorController.state.connectors],
        };
      }

      if (!hasNonSpkConnectors) {
        return;
      }

      const spkUnmergedConnectors = ConnectorController.state.unMergedConnectors.filter((connector) =>
        matchesSpkWallet({
          id: connector.id,
          name: connector.name,
          rdns: connector.info?.rdns,
        })
      );

      ConnectorController.state.unMergedConnectors = spkUnmergedConnectors;
      ConnectorController.state.connectors = ConnectorController.mergeMultiChainConnectors(spkUnmergedConnectors);
    };

    enforceSpkConnectorScope();

    const unsubscribeConnectors = ConnectorController.subscribeKey('connectors', () => {
      enforceSpkConnectorScope();
    });

    const appkit = AppKit.getInstance();
    if (appkit) {
      OptionsController.setAllWallets('HIDE');
      OptionsController.setIncludeWalletIds([]);
      OptionsController.setExcludeWalletIds([]);
      OptionsController.setFeaturedWalletIds([]);
    }

    return () => {
      unsubscribeConnectors();

      if (originalConnectorStateRef.current) {
        ConnectorController.state.unMergedConnectors = originalConnectorStateRef.current.unMergedConnectors;
        ConnectorController.state.connectors = originalConnectorStateRef.current.connectors;
      }

      if (originalModalOptionsRef.current) {
        OptionsController.setAllWallets(originalModalOptionsRef.current.allWallets);
        OptionsController.setIncludeWalletIds(originalModalOptionsRef.current.includeWalletIds);
        OptionsController.setExcludeWalletIds(originalModalOptionsRef.current.excludeWalletIds);
        OptionsController.setFeaturedWalletIds(originalModalOptionsRef.current.featuredWalletIds);
      }
    };
  }, [spkConnector?.id]);

  useEffect(() => () => {
    stopVoiceCapture();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const syncViewport = () => {
      setIsMobileViewport(mediaQuery.matches);
    };

    syncViewport();
    mediaQuery.addEventListener('change', syncViewport);

    return () => {
      mediaQuery.removeEventListener('change', syncViewport);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mobileUrl = new URL('/testnet', window.location.origin);

    if (voiceQuestOpen && address) {
      mobileUrl.searchParams.set('voiceQuest', '1');
      mobileUrl.searchParams.set('wallet', normalizeWalletAddress(address));
      mobileUrl.searchParams.set('lang', requestedVoiceQuestLanguageCode);

      if (walletVerifiedForSession && walletSessionToken) {
        mobileUrl.searchParams.set('session', walletSessionToken);
      }
    }

    setMobileOpenUrl(mobileUrl.toString());
  }, [
    address,
    requestedVoiceQuestLanguageCode,
    voiceQuestOpen,
    walletSessionToken,
    walletVerifiedForSession,
  ]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const wantsVoiceQuest = searchParams.get('voiceQuest') === '1';
    const walletFromUrl = searchParams.get('wallet')?.trim() ?? '';
    const sessionFromUrl = searchParams.get('session')?.trim() ?? '';
    const languageFromUrl = searchParams.get('lang')?.trim() ?? '';

    if (!wantsVoiceQuest) {
      return;
    }

    if (languageFromUrl) {
      if (isSupportedVoiceQuestLanguage(languageFromUrl)) {
        setVoiceQuestLanguageCode(languageFromUrl);
      }
    }

    setMobileVoiceQuestRequested(true);
    setMobileVoiceQuestWallet(walletFromUrl);
    setMobileWalletSessionToken(sessionFromUrl);
  }, []);

  useEffect(() => {
    if (
      !mobileVoiceQuestRequested ||
      !normalizedMobileVoiceQuestWallet ||
      !mobileWalletSessionToken
    ) {
      return;
    }

    const abortController = new AbortController();

    const restoreMobileSession = async () => {
      try {
        const response = await fetch(
          `/api/testnet/session?address=${encodeURIComponent(
            normalizedMobileVoiceQuestWallet
          )}&token=${encodeURIComponent(mobileWalletSessionToken)}`,
          {
            method: 'GET',
            cache: 'no-store',
            signal: abortController.signal,
          }
        );

        const payload = (await response.json()) as WalletSessionResponse | undefined;

        if (!response.ok || payload?.ok !== true) {
          throw new Error(payload?.error || 'Unable to restore your mobile session.');
        }

        setMobileSessionWalletAddress(normalizedMobileVoiceQuestWallet);
        setWalletVerifiedForSession(true);
        setWalletSessionToken(mobileWalletSessionToken);
        setDownloadSpkWalletQuestClaimed(true);
        setQuestClaimStatus('claimed');
        setQuestClaimWarning(null);
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        setQuestClaimWarning(
          error instanceof Error ? error.message : 'Unable to restore your mobile session.'
        );
      }
    };

    void restoreMobileSession();

    return () => {
      abortController.abort();
    };
  }, [
    mobileVoiceQuestRequested,
    mobileWalletSessionToken,
    normalizedMobileVoiceQuestWallet,
  ]);

  useEffect(() => {
    if (!(address && canClaimSpkWalletQuest) || walletVerifiedForSession) {
      return;
    }

    const storedSessionToken =
      typeof window !== 'undefined'
        ? window.localStorage.getItem(getWalletSessionStorageKey(address))?.trim() || ''
        : '';
    const nextSessionToken = mobileWalletSessionToken || storedSessionToken || walletSessionToken || '';

    if (!nextSessionToken) {
      return;
    }

    const abortController = new AbortController();

    const restoreWalletSession = async () => {
      try {
        const response = await fetch(
          `/api/testnet/session?address=${encodeURIComponent(address)}&token=${encodeURIComponent(
            nextSessionToken
          )}`,
          {
            method: 'GET',
            cache: 'no-store',
            signal: abortController.signal,
          }
        );

        const payload = (await response.json()) as WalletSessionResponse | undefined;

        if (!response.ok || payload?.ok !== true) {
          throw new Error(payload?.error || 'Unable to restore your wallet session.');
        }

        setWalletSessionToken(nextSessionToken);
        setWalletVerifiedForSession(true);
        setQuestClaimStatus('claimed');
        setQuestClaimWarning(null);

        if (typeof window !== 'undefined') {
          window.localStorage.setItem(
            getWalletSessionStorageKey(address),
            nextSessionToken
          );
        }
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        const message =
          error instanceof Error ? error.message : 'Unable to restore your wallet session.';

        if (
          typeof window !== 'undefined' &&
          (message.toLowerCase().includes('expired') ||
            message.toLowerCase().includes('invalid') ||
            message.toLowerCase().includes('mismatch'))
        ) {
          window.localStorage.removeItem(getWalletSessionStorageKey(address));
        }
      }
    };

    void restoreWalletSession();

    return () => {
      abortController.abort();
    };
  }, [
    address,
    canClaimSpkWalletQuest,
    mobileWalletSessionToken,
    walletSessionToken,
    walletVerifiedForSession,
  ]);

  useEffect(() => {
    if (!(typeof navigator !== 'undefined' && navigator.mediaDevices?.enumerateDevices)) {
      setHasMicrophone(false);
      return;
    }

    let disposed = false;

    const checkMicrophones = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices
          .filter((device) => device.kind === 'audioinput')
          .map((device, index) => ({
            deviceId: device.deviceId,
            label: device.label || `Microphone ${index + 1}`,
          }));

        if (!disposed) {
          setAudioInputDevices(audioInputs);
          setHasMicrophone(audioInputs.length > 0);
          setSelectedAudioInputId((currentValue) => {
            if (currentValue && audioInputs.some((device) => device.deviceId === currentValue)) {
              return currentValue;
            }

            return audioInputs[0]?.deviceId ?? '';
          });
        }
      } catch {
        if (!disposed) {
          setHasMicrophone(false);
          setAudioInputDevices([]);
          setSelectedAudioInputId('');
        }
      }
    };

    void checkMicrophones();
    navigator.mediaDevices.addEventListener?.('devicechange', checkMicrophones);

    return () => {
      disposed = true;
      navigator.mediaDevices.removeEventListener?.('devicechange', checkMicrophones);
    };
  }, []);

  const startVoiceRecording = async () => {
    if (!hasMicrophone) {
      setVoiceQuestWarning('No microphone detected. Connect a microphone and try again.');
      return;
    }

    if (!voiceRecognitionSupported) {
      setVoiceQuestWarning(
        'This browser does not support live voice verification. Please use a browser with Speech Recognition support.'
      );
      return;
    }

    setVoiceQuestWarning(null);
    setVoiceQuestTranscript('');
    setVoiceQuestBlob(null);
    speechRecognitionFinalTranscriptRef.current = '';
    voiceQuestAutoStopTriggeredRef.current = false;
    voiceQuestCancelledRef.current = false;
    speechRecognitionStoppingRef.current = false;
    voiceRecognitionActiveRef.current = true;

    try {
      mediaStreamRef.current = null;
      mediaRecorderRef.current = null;
      voiceChunksRef.current = [];

      const SpeechRecognitionCtor =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognitionCtor) {
        throw new Error('Speech recognition is not available in this browser.');
      }

      const recognition = new SpeechRecognitionCtor();
      speechRecognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      const recognitionLanguageFallbacks = getSpeechRecognitionLanguageFallbacks(
        voiceQuestResolvedLanguageCode || requestedVoiceQuestLanguageCode
      );
      let recognitionLanguageIndex = 0;
      recognition.lang = recognitionLanguageFallbacks[recognitionLanguageIndex];
      recognition.onstart = () => {
        setVoiceQuestWarning(null);
      };
      recognition.onresult = (event) => {
        let finalTranscript = speechRecognitionFinalTranscriptRef.current;
        let interimTranscript = '';

        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const result = event.results[index];
          const transcriptPart = result?.[0]?.transcript?.trim() ?? '';

          if (!transcriptPart) {
            continue;
          }

          if (result.isFinal) {
            finalTranscript = `${finalTranscript} ${transcriptPart}`.trim();
          } else {
            interimTranscript = `${interimTranscript} ${transcriptPart}`.trim();
          }
        }

        speechRecognitionFinalTranscriptRef.current = finalTranscript;
        setVoiceQuestTranscript(`${finalTranscript} ${interimTranscript}`.trim());
      };
      recognition.onerror = (event) => {
        if (event.error === 'aborted') {
          return;
        }

        if (
          (event.error === 'language-not-supported' || event.error === 'service-not-allowed') &&
          recognitionLanguageIndex < recognitionLanguageFallbacks.length - 1
        ) {
          recognitionLanguageIndex += 1;
          recognition.lang = recognitionLanguageFallbacks[recognitionLanguageIndex];

          try {
            recognition.stop();
          } catch {
            // Ignore stop failures while switching language fallback.
          }

          return;
        }

        if (event.error === 'no-speech') {
          setVoiceQuestWarning('No speech detected yet. Speak clearly and keep the microphone close.');
          return;
        }

        setVoiceQuestWarning(`Voice recognition error: ${event.error}.`);
      };
      recognition.onend = () => {
        if (
          speechRecognitionStoppingRef.current ||
          voiceQuestCancelledRef.current ||
          !voiceRecognitionActiveRef.current
        ) {
          return;
        }

        speechRecognitionRestartTimeoutRef.current = window.setTimeout(() => {
          try {
            recognition.start();
          } catch {
            // Avoid a noisy loop if the browser refuses an immediate restart.
          }
        }, 250);
      };

      try {
        recognition.start();
      } catch (error) {
        if (!(error instanceof DOMException) || error.name !== 'InvalidStateError') {
          throw error;
        }
      }

      setVoiceQuestStatus('recording');
    } catch (error) {
      console.error('Failed to start voice capture:', error);
      stopVoiceCapture();
      setVoiceQuestStatus('idle');
      setVoiceQuestWarning(
        error instanceof Error ? error.message : 'Unable to access the microphone.'
      );
    }
  };

  const openVoiceQuest = () => {
    if (!hasUnlockedTestnetPage) {
      setVoiceQuestWarning('Sign in with your SPK Wallet first.');
      return;
    }

    if (!hasMicrophone) {
      setVoiceQuestWarning('No microphone detected. Connect a microphone and try again.');
      return;
    }

    if (voiceQuestRemainingToday <= 0) {
      setVoiceQuestWarning('You have already used all 5 daily voice recordings.');
      return;
    }

    setVoiceQuestOpen(true);
    setVoiceQuestStatus('legal');
    setVoiceQuestWarning(null);
    setVoiceQuestTranscript('');
    setVoiceQuestBlob(null);
    setVoiceQuestMimeType('audio/webm');
    setVoiceQuestLegalAccepted(false);
    setVoiceQuestCountdown(null);
    setVoiceQuestExpectedText('');
    setVoiceQuestResolvedLanguageCode(requestedVoiceQuestLanguageCode);
    setVoiceQuestSentenceToken(null);
    setVoiceQuestClaimToken(null);
    voiceChunksRef.current = [];
    voiceQuestCancelledRef.current = false;
  };

  useEffect(() => {
    if (!mobileVoiceQuestRequested || !isMobileViewport) {
      return;
    }

    if (mobileWalletSessionToken && normalizedMobileVoiceQuestWallet) {
      return;
    }

    if (canClaimSpkWalletQuest) {
      return;
    }

    if (mobileVoiceQuestPromptedRef.current) {
      return;
    }

    mobileVoiceQuestPromptedRef.current = true;
    setQuestClaimWarning(
      normalizedMobileVoiceQuestWallet
        ? `Connect the same SPK Wallet as desktop: ${shortenAddress(normalizedMobileVoiceQuestWallet)}.`
        : 'Connect your SPK Wallet to continue the voice quest.'
    );
    void open({ view: 'Connect' });
  }, [
    canClaimSpkWalletQuest,
    isMobileViewport,
    mobileWalletSessionToken,
    mobileVoiceQuestRequested,
    normalizedMobileVoiceQuestWallet,
    open,
  ]);

  useEffect(() => {
    if (!mobileVoiceQuestRequested || !normalizedMobileVoiceQuestWallet || !address) {
      return;
    }

    if (normalizedConnectedAddress === normalizedMobileVoiceQuestWallet) {
      setQuestClaimWarning((currentWarning) =>
        currentWarning?.includes('same SPK Wallet as desktop') ? null : currentWarning
      );
      return;
    }

    setQuestClaimWarning(
      `Connect the same SPK Wallet as desktop: ${shortenAddress(normalizedMobileVoiceQuestWallet)}.`
    );
  }, [
    address,
    mobileVoiceQuestRequested,
    normalizedConnectedAddress,
    normalizedMobileVoiceQuestWallet,
  ]);

  useEffect(() => {
    if (!mobileVoiceQuestRequested || !isMobileViewport || mobileVoiceQuestOpenedRef.current) {
      return;
    }

    if (!hasUnlockedTestnetPage || !activeQuestWalletAddress) {
      return;
    }

    if (
      address &&
      normalizedMobileVoiceQuestWallet &&
      normalizedConnectedAddress !== normalizedMobileVoiceQuestWallet
    ) {
      setQuestClaimWarning(
        `Connect the same SPK Wallet as desktop: ${shortenAddress(normalizedMobileVoiceQuestWallet)}.`
      );
      return;
    }

    mobileVoiceQuestOpenedRef.current = true;
    openVoiceQuest();
  }, [
    activeQuestWalletAddress,
    address,
    hasUnlockedTestnetPage,
    isMobileViewport,
    mobileVoiceQuestRequested,
    normalizedConnectedAddress,
    normalizedMobileVoiceQuestWallet,
  ]);

  useEffect(() => {
    if (!(address && canClaimSpkWalletQuest && walletVerifiedForSession && walletSessionToken)) {
      return;
    }

    let disposed = false;

    const pollDesktopVoiceQuestSign = async () => {
      try {
        const response = await fetch(
          `/api/testnet/voice-quest-desktop-sign?address=${encodeURIComponent(
            address
          )}&sessionToken=${encodeURIComponent(walletSessionToken)}`,
          {
            method: 'GET',
            cache: 'no-store',
          }
        );

        const payload = (await response.json()) as VoiceQuestDesktopSignResponse | undefined;

        if (!response.ok || payload?.ok !== true || !payload.pending || !payload.claimToken) {
          return;
        }

        const requestId = payload.requestId?.trim() || '';

        if (!requestId || desktopVoiceQuestRequestHandledRef.current === requestId) {
          return;
        }

        setVoiceQuestOpen(true);
        setVoiceQuestWarning(null);
        const expectedText = payload.expectedText?.trim() || '';
        const claimToken = payload.claimToken.trim();
        desktopVoiceQuestRequestHandledRef.current = requestId;
        setVoiceQuestExpectedText(expectedText);
        setVoiceQuestClaimToken(claimToken);
        setVoiceQuestStatus('signing');
        void claimVerifiedVoiceQuest({ claimToken, expectedText });
      } catch (error) {
        console.error('Failed to load pending desktop voice quest signature:', error);
      }
    };

    void pollDesktopVoiceQuestSign();
    const intervalId = window.setInterval(() => {
      if (!disposed) {
        void pollDesktopVoiceQuestSign();
      }
    }, 2500);

    return () => {
      disposed = true;
      window.clearInterval(intervalId);
    };
  }, [
    address,
    canClaimSpkWalletQuest,
    walletSessionToken,
    walletVerifiedForSession,
  ]);

  useEffect(() => {
    if (
      !(
        voiceQuestOpen &&
        voiceQuestStatus === 'awaiting_desktop_signature' &&
        activeQuestWalletAddress &&
        mobileWalletSessionToken
      )
    ) {
      return;
    }

    let disposed = false;

    const pollDesktopVoiceQuestCompletion = async () => {
      try {
        const response = await fetch(
          `/api/testnet/voice-quest-desktop-sign?address=${encodeURIComponent(
            activeQuestWalletAddress
          )}&sessionToken=${encodeURIComponent(mobileWalletSessionToken)}`,
          {
            method: 'GET',
            cache: 'no-store',
          }
        );

        const payload = (await response.json()) as VoiceQuestDesktopSignResponse | undefined;

        if (!response.ok || payload?.ok !== true || !payload.claimed || disposed) {
          return;
        }

        setPendingDesktopVoiceQuestRequestId(null);
        setVoiceQuestStatus('success');
        autoCloseTimeoutRef.current = window.setTimeout(() => {
          void resetVoiceQuestForNextAttempt();
        }, 1400);
      } catch (error) {
        console.error('Failed to check desktop voice quest completion:', error);
      }
    };

    void pollDesktopVoiceQuestCompletion();
    const intervalId = window.setInterval(() => {
      if (!disposed) {
        void pollDesktopVoiceQuestCompletion();
      }
    }, 2500);

    return () => {
      disposed = true;
      window.clearInterval(intervalId);
    };
  }, [
    activeQuestWalletAddress,
    mobileWalletSessionToken,
    voiceQuestOpen,
    voiceQuestStatus,
  ]);

  const stopVoiceRecording = () => {
    if (voiceQuestStatus !== 'recording') {
      return;
    }

    const finalTranscript =
      speechRecognitionFinalTranscriptRef.current.trim() || voiceQuestTranscript.trim();

    voiceQuestCancelledRef.current = false;
    speechRecognitionStoppingRef.current = true;
    voiceRecognitionActiveRef.current = false;

    if (speechRecognitionRestartTimeoutRef.current !== null) {
      window.clearTimeout(speechRecognitionRestartTimeoutRef.current);
      speechRecognitionRestartTimeoutRef.current = null;
    }

    speechRecognitionRef.current?.stop();
    speechRecognitionRef.current = null;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setVoiceQuestTranscript(finalTranscript);
    setVoiceQuestStatus('verifying');
    void verifyVoiceQuestRecording(finalTranscript);
  };

  useEffect(() => {
    if (
      voiceQuestStatus !== 'recording' ||
      !normalizedExpectedWords.length ||
      matchedWordCount !== normalizedExpectedWords.length ||
      voiceQuestAutoStopTriggeredRef.current
    ) {
      return;
    }

    voiceQuestAutoStopTriggeredRef.current = true;
    stopVoiceRecording();
  }, [matchedWordCount, normalizedExpectedWords.length, voiceQuestStatus]);

  const beginVoiceQuestCountdown = async () => {
    if (!activeQuestWalletAddress || !hasUnlockedTestnetPage) {
      setVoiceQuestWarning('Sign in with your SPK Wallet first.');
      return;
    }

    if (!voiceQuestLegalAccepted) {
      setVoiceQuestWarning('Confirm the privacy policy before starting.');
      return;
    }

    setVoiceQuestWarning(null);

    try {
      await fetchVoiceQuestSession(activeQuestWalletAddress);
      setVoiceQuestTranscript('');
      setVoiceQuestBlob(null);
      setVoiceQuestMimeType('audio/webm');
      voiceQuestAutoStopTriggeredRef.current = false;
      setVoiceQuestStatus('countdown');
      setVoiceQuestCountdown(3);
      voiceChunksRef.current = [];

      const tick = (value: number) => {
        setVoiceQuestCountdown(value);

        if (value === 0) {
          setVoiceQuestCountdown(null);
          void startVoiceRecording();
          return;
        }

        countdownTimeoutRef.current = window.setTimeout(() => {
          tick(value - 1);
        }, 850);
      };

      tick(3);
    } catch (error) {
      setVoiceQuestWarning(
        error instanceof Error ? error.message : 'Unable to start the voice quest.'
      );
      setVoiceQuestStatus('legal');
    }
  };

  const verifyVoiceQuestRecording = async (transcriptOverride?: string) => {
    if (!activeQuestWalletAddress || !hasUnlockedTestnetPage) {
      setVoiceQuestWarning('Sign in with your SPK Wallet first.');
      setVoiceQuestStatus('legal');
      return;
    }

    if (!voiceQuestLegalAccepted) {
      setVoiceQuestWarning('Confirm the privacy policy before verifying.');
      setVoiceQuestStatus('legal');
      return;
    }

    if (!voiceQuestSentenceToken) {
      setVoiceQuestWarning('Your generated sentence expired. Start again.');
      setVoiceQuestStatus('legal');
      return;
    }

    setVoiceQuestStatus('verifying');
    setVoiceQuestWarning(null);

    try {
      const transcriptToVerify = transcriptOverride?.trim() || voiceQuestTranscript.trim();

      if (!transcriptToVerify) {
        throw new Error('No speech was captured. Please try again.');
      }

      const response = await fetch('/api/testnet/voice-quest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'verify',
          walletAddress: activeQuestWalletAddress,
          transcript: transcriptToVerify,
          sentenceToken: voiceQuestSentenceToken,
          languageCode: voiceQuestResolvedLanguageCode,
          legalAccepted: voiceQuestLegalAccepted,
        }),
      });

      const payload = (await response.json()) as VoiceQuestVerifyResponse | undefined;

      if (!response.ok || payload?.ok !== true) {
        throw new Error(payload?.error || 'Unable to verify the voice recording.');
      }

      await wait(5000);

      setVoiceQuestClaimToken(payload.claimToken?.trim() || null);
      setVoiceQuestExpectedText(payload.expectedText?.trim() || voiceQuestExpectedText);
      setVoiceQuestResolvedLanguageCode(
        payload.languageCode?.trim() || voiceQuestResolvedLanguageCode
      );

      if (shouldSignVoiceQuestOnDesktop && mobileWalletSessionToken) {
        const desktopSignResponse = await fetch('/api/testnet/voice-quest-desktop-sign', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            walletAddress: activeQuestWalletAddress,
            claimToken: payload.claimToken?.trim() || '',
            sessionToken: mobileWalletSessionToken,
            expectedText: payload.expectedText?.trim() || voiceQuestExpectedText,
          }),
        });

        const desktopSignPayload =
          (await desktopSignResponse.json()) as VoiceQuestDesktopSignResponse | undefined;

        if (!desktopSignResponse.ok || desktopSignPayload?.ok !== true) {
          throw new Error(
            desktopSignPayload?.error || 'Unable to hand off the signature request to desktop.'
          );
        }

        setPendingDesktopVoiceQuestRequestId(desktopSignPayload.requestId?.trim() || null);
        setVoiceQuestStatus('awaiting_desktop_signature');
        return;
      }

      setVoiceQuestStatus('verified');
    } catch (error) {
      setVoiceQuestWarning(
        error instanceof Error ? error.message : 'Unable to verify the voice recording.'
      );
      setVoiceQuestStatus('legal');
    }
  };

  const claimVerifiedVoiceQuest = async (overrides?: {
    claimToken?: string;
    expectedText?: string;
  }) => {
    if (!activeQuestWalletAddress || !hasUnlockedTestnetPage) {
      setVoiceQuestWarning('Sign in with your SPK Wallet first.');
      return;
    }

    const claimToken = overrides?.claimToken?.trim() || voiceQuestClaimToken;
    const expectedText = overrides?.expectedText?.trim() || voiceQuestExpectedText;

    if (!claimToken) {
      setVoiceQuestWarning('Verify your recording first.');
      return;
    }

    setVoiceQuestStatus('signing');
    setVoiceQuestWarning(null);

    try {
      const signature =
        address && canClaimSpkWalletQuest
          ? await signMessageAsync({
              message: getDailyVoiceQuestOwnershipMessage(
                activeQuestWalletAddress,
                expectedText
              ),
            })
          : undefined;

      const audioBase64 = voiceQuestBlob
        ? btoa(
            Array.from(new Uint8Array(await voiceQuestBlob.arrayBuffer()))
              .map((value) => String.fromCharCode(value))
              .join('')
          )
        : '';

      const response = await fetch('/api/testnet/voice-quest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'claim',
          walletAddress: activeQuestWalletAddress,
          signature,
          claimToken,
          sessionToken: !signature ? mobileWalletSessionToken : undefined,
          audioBase64,
          audioMimeType: voiceQuestBlob ? voiceQuestMimeType : '',
        }),
      });

      const payload = (await response.json()) as VoiceQuestClaimResponse | undefined;

      if (!response.ok || payload?.ok !== true) {
        throw new Error(payload?.error || 'Unable to submit the voice quest.');
      }

      setWalletPoints((currentPoints) =>
        typeof payload.points === 'number' ? payload.points : currentPoints
      );
      setVoiceQuestCompletedToday(
        typeof payload.completedToday === 'number'
          ? payload.completedToday
          : voiceQuestCompletedToday
      );
      setVoiceQuestRemainingToday(
        typeof payload.remainingToday === 'number'
          ? payload.remainingToday
          : voiceQuestRemainingToday
      );
      setPendingDesktopVoiceQuestRequestId(null);
      setVoiceQuestStatus('success');
      autoCloseTimeoutRef.current = window.setTimeout(() => {
        void resetVoiceQuestForNextAttempt();
      }, 1400);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to submit the voice quest.';

      if (pendingDesktopVoiceQuestRequestId) {
        desktopVoiceQuestRequestHandledRef.current = null;
      }

      setVoiceQuestWarning(
        message.toLowerCase().includes('user rejected')
          ? 'Signature request was cancelled.'
          : message
      );
      setVoiceQuestStatus(
        pendingDesktopVoiceQuestRequestId ? 'awaiting_desktop_signature' : 'verified'
      );
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#080203] text-white selection:bg-brand-red selection:text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(170,24,24,0.42),_transparent_34%),radial-gradient(circle_at_80%_22%,_rgba(255,112,112,0.12),_transparent_22%),radial-gradient(circle_at_bottom_right,_rgba(120,12,12,0.36),_transparent_30%),linear-gradient(180deg,_rgba(24,4,4,0.96),_rgba(6,2,2,1))]" />
        <div className="absolute top-[12%] left-[8%] h-72 w-72 rounded-full bg-[#a31414]/20 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[6%] h-80 w-80 rounded-full bg-[#6e0d0d]/20 blur-[140px]" />
        <div className="absolute left-0 right-0 top-[120px] h-px bg-[linear-gradient(90deg,transparent,rgba(255,80,80,0.4),transparent)]" />
      </div>

      <nav className="relative z-10 border-b border-white/5 bg-black/30 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="red-glow flex h-9 w-9 items-center justify-center rounded-lg bg-brand-red sm:h-10 sm:w-10">
              <Zap className="h-5 w-5 fill-current text-white sm:h-6 sm:w-6" />
            </div>
            <span className="font-display text-xl font-bold tracking-tighter sm:text-2xl">
              SPEAKER<span className="text-brand-red">AI</span>
            </span>
          </div>

          <Link
            href="/"
            prefetch
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.24em] transition-all hover:bg-white/10 sm:px-4 sm:text-xs sm:tracking-wider"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>
        </div>
      </nav>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-20">
        <section className="mb-10 text-center sm:mb-12 lg:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="mb-4 text-[10px] font-black uppercase tracking-[0.35em] text-[#ff7c7c] sm:mb-5 sm:text-[11px] sm:tracking-[0.45em]">
              Testnet
            </p>
            <h1 className="mb-4 font-display text-4xl font-black leading-[0.92] tracking-tight sm:mb-6 sm:text-5xl lg:text-8xl">
              SPEAKERAI <span className="text-brand-red">TESTNET</span>
            </h1>
            <p className="mx-auto max-w-xl text-sm text-white/60 sm:max-w-2xl sm:text-lg lg:text-xl">
              The future of SpeakerAI Protocol starts here.
            </p>
          </motion.div>
        </section>

        <section className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative overflow-hidden rounded-[28px] border border-[#7a1c1c]/50 bg-[linear-gradient(180deg,rgba(99,12,12,0.5),rgba(20,4,4,0.88))] p-4 shadow-[0_20px_70px_rgba(80,0,0,0.35)] sm:rounded-[36px] sm:p-6 lg:rounded-[42px] lg:p-12 lg:shadow-[0_30px_120px_rgba(80,0,0,0.45)]"
          >
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),transparent_38%,rgba(255,90,90,0.08))]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(8,1,1,0.52)_58%,rgba(4,0,0,0.82)_100%)]" />

            <div className="relative flex min-h-[360px] flex-col items-center justify-center rounded-[22px] border border-white/10 bg-black/35 px-4 py-6 text-center sm:min-h-[420px] sm:rounded-[32px] sm:px-6">
              <div className="mb-4 rounded-full border border-[#ff7c7c]/20 bg-[#6d0e0e]/30 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.28em] text-[#ffb0b0] sm:mb-6 sm:px-4 sm:py-2 sm:text-[10px] sm:tracking-[0.4em]">
                Testnet
              </div>
              <h2 className="mb-3 font-display text-3xl font-black tracking-tight text-white sm:mb-4 sm:text-4xl lg:text-6xl">
                SP points
              </h2>
              <p className="max-w-xl text-sm leading-relaxed text-white/65 sm:max-w-2xl sm:text-base lg:text-lg">
                SP points are the keypoints of the SpeakerAI Protocol Testnet — Earn SP Points by using the SpeakerAI Testnet
              </p>
              <div className="mt-6 flex w-full flex-col items-center gap-4 sm:mt-8 sm:gap-6">
                {isConnected && address && isConnectedWithSpkWallet && !hasUnlockedTestnetPage ? (
                  <>
                    <div className="flex w-full flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-semibold text-white/85 sm:w-auto sm:gap-3 sm:px-5 sm:text-sm">
                      <Wallet className="h-4 w-4 text-brand-red-glow" />
                      {shortenAddress(address)}
                      <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-emerald-200">
                        SPK Wallet
                      </span>
                    </div>
                    <div className="w-full max-w-2xl rounded-[22px] border border-white/10 bg-white/[0.04] p-4 text-left sm:rounded-[28px] sm:p-6">
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 sm:h-11 sm:w-11 sm:rounded-2xl">
                          <Wallet className="h-4 w-4 text-brand-red-glow sm:h-5 sm:w-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.32em] text-white/35">
                            Access
                          </p>
                          <p className="text-base font-bold text-white sm:text-lg">Sign in with your SPK Wallet</p>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-5 text-center sm:px-5 sm:py-6">
                        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/40">
                          Required each time
                        </p>
                        <p className="mt-3 font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
                          Sign with your SPK Wallet
                        </p>
                        <p className="mx-auto mt-3 max-w-xl text-xs leading-relaxed text-white/55 sm:text-sm">
                          Sign to open your testnet dashboard. Your wallet can earn +{spkWalletQuestPoints} SP the first time it completes this step.
                        </p>
                        <div className="mt-6 flex flex-col items-center gap-3">
                          <button
                            type="button"
                            onClick={() => void claimSpkWalletQuest()}
                            disabled={questClaimStatus === 'claiming'}
                            className="w-full rounded-2xl bg-brand-red px-4 py-3.5 text-xs font-black uppercase tracking-[0.22em] text-white transition-all hover:bg-brand-red-glow disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-6 sm:py-4 sm:text-sm sm:tracking-[0.28em]"
                          >
                            {questClaimStatus === 'claiming' ? 'Waiting for Signature...' : 'Sign Wallet to Continue'}
                          </button>
                          <p className="text-xs text-white/45">
                            Your dashboard opens right after you sign.
                          </p>
                        </div>
                        {questClaimWarning ? (
                          <p className="mt-4 text-sm text-[#ffb0b0]">{questClaimWarning}</p>
                        ) : null}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => disconnect()}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-xs font-black uppercase tracking-[0.24em] text-white/75 transition-all hover:bg-white/10 hover:text-white sm:w-auto sm:tracking-[0.28em]"
                    >
                      Disconnect
                    </button>
                  </>
                ) : isConnected && address && isConnectedWithSpkWallet ? (
                  <>
                    <div className="flex w-full flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-semibold text-white/85 sm:w-auto sm:gap-3 sm:px-5 sm:text-sm">
                      <Wallet className="h-4 w-4 text-brand-red-glow" />
                      {shortenAddress(address)}
                      <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-emerald-200">
                        SPK Wallet
                      </span>
                    </div>
                    <div className="grid w-full gap-4 text-left lg:grid-cols-2">
                      <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4 sm:rounded-[28px] sm:p-6">
                        <div className="mb-4 flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 sm:h-11 sm:w-11 sm:rounded-2xl">
                            <Sparkles className="h-4 w-4 text-brand-red-glow sm:h-5 sm:w-5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-white/35">
                              Your Wallet SP points Balance
                            </p>
                            <p className="text-base font-bold text-white sm:text-lg">SP points</p>
                          </div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-5 sm:px-5 sm:py-6">
                          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/40">
                            SP Balance
                          </p>
                          <div className="mt-3 flex items-end gap-2">
                            <p className="font-display text-4xl font-black tracking-tight text-white sm:text-5xl">
                            {walletPointsLoading
                              ? 'Loading...'
                              : walletPoints !== null
                                ? formatPoints(walletPoints)
                                : '--'}
                            </p>
                            {!walletPointsLoading && walletPoints !== null ? (
                              <span className="pb-1 text-sm font-black uppercase tracking-[0.28em] text-brand-red-glow">
                                SP
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-3 max-w-md text-xs leading-relaxed text-white/55 sm:text-sm">
                            This is your current SP Points balance for your connected SPK Wallet.
Earn more points by completing quests and interacting with the protocol.
                          </p>
                          {walletPointsWarning ? (
                            <p className="mt-3 text-sm text-[#ffb0b0]">{walletPointsWarning}</p>
                          ) : null}
                        </div>
                      </div>

                      <div className="relative overflow-hidden rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-4 sm:rounded-[28px] sm:p-6">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,120,120,0.08),transparent_45%)]" />
                        <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" />
                        <div className="relative mb-4 flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 sm:h-11 sm:w-11 sm:rounded-2xl">
                            <Wallet className="h-4 w-4 text-brand-red-glow sm:h-5 sm:w-5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-white/35">
                              Testnet
                            </p>
                            <p className="text-base font-bold text-white sm:text-lg">Quests</p>
                          </div>
                        </div>
                        <div className="relative space-y-3 rounded-2xl border border-white/10 bg-black/35 p-4">
                          <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-left sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-white">Verify SPK Wallet ownership</p>
                              <p className="mt-1 text-xs leading-relaxed text-white/50">
                                Sign in with your SPK Wallet to continue. This reward is available once per wallet.
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                              <span className="rounded-full border border-[#ff7c7c]/20 bg-[#6d0e0e]/30 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-[#ffb0b0]">
                                +{spkWalletQuestPoints} SP
                              </span>
                              <span
                                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] ${
                                  hasCompletedSpkWalletQuest
                                    ? 'border border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
                                    : 'border border-white/10 bg-white/5 text-white/55'
                                }`}
                              >
                                {hasCompletedSpkWalletQuest ? (
                                  <>
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Completed
                                  </>
                                ) : questClaimStatus === 'claiming' ? (
                                  'Verifying'
                                ) : (
                                  'Verify ownership'
                                )}
                              </span>
                            </div>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-white">Complete daily voice record</p>
                                <p className="mt-1 text-xs leading-relaxed text-white/50">
                                  Read the sentence, record your mic, verify the exact words, and earn +2 SP per successful record. Limited to 5 times per day.
                                </p>
                                <p className="mt-2 text-[11px] font-semibold text-white/45">
                                  Completed today: {voiceQuestCompletedToday} / {DAILY_VOICE_RECORD_QUEST_DAILY_LIMIT}
                                </p>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                                <span className="rounded-full border border-[#ff7c7c]/20 bg-[#6d0e0e]/30 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-[#ffb0b0]">
                                  +{voiceQuestPoints} SP
                                </span>
                                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-white/60">
                                  {voiceQuestRemainingToday} left today
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={openVoiceQuest}
                              disabled={voiceQuestRemainingToday <= 0}
                              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-red px-4 py-3 text-xs font-black uppercase tracking-[0.24em] text-white transition-all hover:bg-brand-red-glow disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:tracking-[0.28em]"
                            >
                              <Mic className="h-4 w-4" />
                              Record Voice
                            </button>
                          </div>
                          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-4">
                            <p className="text-sm font-bold text-white/80">Voice rewards update live</p>
                            <p className="mt-1 text-xs leading-relaxed text-white/45">
                              After a verified recording, the overlay closes automatically and your SP balance updates here.
                            </p>
                          </div>
                        </div>
                        <p className="relative mt-4 max-w-md text-xs leading-relaxed text-white/50 sm:text-sm">
                          You can earn SP points in the wallet for every confirmed transaction.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => disconnect()}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-xs font-black uppercase tracking-[0.24em] text-white/75 transition-all hover:bg-white/10 hover:text-white sm:w-auto sm:tracking-[0.28em]"
                    >
                      Disconnect
                    </button>
                  </>
                ) : hasUnlockedTestnetPage && activeQuestWalletAddress ? (
                  <div className="grid w-full max-w-3xl gap-4 text-left">
                    <div className="flex w-full flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-semibold text-white/85 sm:w-auto sm:gap-3 sm:px-5 sm:text-sm">
                      <Smartphone className="h-4 w-4 text-brand-red-glow" />
                      {shortenAddress(activeQuestWalletAddress)}
                      <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-emerald-200">
                        Mobile Session
                      </span>
                    </div>
                    <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4 sm:rounded-[28px] sm:p-6">
                      <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-5 sm:px-5 sm:py-6">
                        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/40">
                          Desktop Authenticated
                        </p>
                        <p className="mt-3 font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
                          Continue voice quest on mobile
                        </p>
                        <p className="mt-3 max-w-xl text-xs leading-relaxed text-white/55 sm:text-sm">
                          This phone is using the session from your desktop QR scan. No wallet reconnect is required here.
                        </p>
                        <button
                          type="button"
                          onClick={openVoiceQuest}
                          disabled={voiceQuestRemainingToday <= 0}
                          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-red px-4 py-3 text-xs font-black uppercase tracking-[0.24em] text-white transition-all hover:bg-brand-red-glow disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:tracking-[0.28em]"
                        >
                          <Mic className="h-4 w-4" />
                          Record Voice
                        </button>
                      </div>
                    </div>
                  </div>
                ) : status === 'reconnecting' || isReconnecting ? (
                  <div className="w-full max-w-2xl rounded-[22px] border border-white/10 bg-white/[0.04] p-4 text-left sm:rounded-[28px] sm:p-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 sm:h-11 sm:w-11 sm:rounded-2xl">
                        <LoaderCircle className="h-4 w-4 animate-spin text-brand-red-glow sm:h-5 sm:w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.32em] text-white/35">
                          Restoring Session
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-white/60">
                          Reconnecting your SPK Wallet after refresh.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : isConnected && address ? (
                  <>
                    <div className="flex items-center gap-3 rounded-2xl border border-[#ff7c7c]/20 bg-[#4a0a0a]/40 px-5 py-3 text-sm font-semibold text-[#ffd0d0]">
                      <Wallet className="h-4 w-4 text-brand-red-glow" />
                      {shortenAddress(address)}
                    </div>
                    <p className="max-w-md text-sm text-[#ffb0b0]">
                      This page only allows SPK Wallet. Disconnect your current wallet and use SPK Wallet instead.
                    </p>
                    <button
                      type="button"
                      onClick={() => disconnect()}
                      className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-xs font-black uppercase tracking-[0.28em] text-white/75 transition-all hover:bg-white/10 hover:text-white"
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => void open({ view: 'Connect' })}
                      disabled={!spkConnector}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-brand-red px-6 py-4 text-sm font-black uppercase tracking-[0.28em] text-white transition-all hover:bg-brand-red-glow disabled:opacity-70"
                    >
                      Connect Wallet
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <p className="text-sm text-white/50">
                      
                    </p>
                    {!spkConnector ? (
                      <p className="max-w-md text-sm text-[#ffb0b0]">
                        SPK Wallet is not detected in this browser yet. Install or enable it, then refresh this page.
                      </p>
                    ) : null}
                  </>
                )}

                {!hasMicrophone ? (
                  <div className="w-full max-w-2xl rounded-[22px] border border-[#ff7c7c]/20 bg-[#4a0a0a]/35 px-4 py-4 text-left sm:px-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#ffb0b0]">
                      Microphone Required
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-[#ffd6d6]">
                      No microphone is detected on this device. Connect one before using the voice quest.
                    </p>
                  </div>
                ) : null}

                {shouldShowMobileOpenPanel && !voiceQuestOpen ? (
                  <div className="w-full max-w-2xl rounded-[22px] border border-white/10 bg-white/[0.04] p-4 sm:p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-left">
                        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/35">
                          Open On Mobile
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-white/55">
                          Scan this QR code on your phone to open the testnet page there.
                        </p>
                      </div>
                      <a
                        href={mobileOpenUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-[0.24em] text-white/75 transition-all hover:bg-white/10 hover:text-white"
                      >
                        Open On Mobile
                      </a>
                    </div>
                    <div className="mt-4 flex justify-center rounded-[20px] border border-white/10 bg-black/20 p-4">
                      <img
                        src={mobileQrImageUrl}
                        alt="QR code to open the testnet page on mobile"
                        className="h-40 w-40 rounded-xl border border-white/10 bg-white p-2"
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </motion.div>
        </section>

        <footer className="mx-auto mt-20 max-w-7xl border-t border-white/5 px-6 pt-20 lg:px-8">
          <div className="mb-20 grid grid-cols-1 gap-16 lg:grid-cols-[1fr_2fr]">
            <div>
              <div className="mb-8 flex items-center gap-3">
                <div className="red-glow flex h-10 w-10 items-center justify-center rounded-xl bg-brand-red">
                  <Zap className="h-5 w-5 fill-current text-white" />
                </div>
                <span className="font-display text-2xl font-black uppercase tracking-tighter">
                  SPEAKER<span className="text-brand-red">AI</span>
                </span>
              </div>
              <p className="mb-8 max-w-sm text-lg leading-relaxed text-white/40">
                A decentralized voice and audio protocol where AI intelligence meets on-chain transparency.
              </p>
              <div className="flex items-center gap-6">
                <a href={SOCIAL_LINKS.x} target="_blank" rel="noopener noreferrer" className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 transition-all hover:bg-brand-red/20 hover:text-brand-red-glow">
                  <XLogo className="h-5 w-5" />
                </a>
                <a href={SOCIAL_LINKS.discord} target="_blank" rel="noopener noreferrer" className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 transition-all hover:bg-brand-red/20 hover:text-brand-red-glow">
                  <DiscordLogo className="h-6 w-6" />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
              <div className="flex flex-col gap-4">
                <span className="mb-2 text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Protocol</span>
                <Link href="/documentation" className="text-sm font-bold text-white/60 transition-colors hover:text-brand-red">Documentation</Link>
                <Link href="/allocation" className="text-sm font-bold text-white/60 transition-colors hover:text-brand-red">Allocation</Link>
                <Link href="/testnet" className="text-sm font-bold text-white/60 transition-colors hover:text-brand-red">Testnet</Link>
                <a href={SOCIAL_LINKS.website} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-white/60 transition-colors hover:text-brand-red">Website</a>
              </div>
              <div className="flex flex-col gap-4">
                <span className="mb-2 text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Legal</span>
                <Link href="/terms-of-service" className="text-sm font-bold text-white/60 transition-colors hover:text-brand-red">Terms of Service</Link>
                <Link href="/privacy-policy" className="text-sm font-bold text-white/60 transition-colors hover:text-brand-red">Privacy Policy</Link>
                <Link href="/cookie-policy" className="text-sm font-bold text-white/60 transition-colors hover:text-brand-red">Cookie Policy</Link>
              </div>
              <div className="flex flex-col gap-3">
                <span className="mb-2 text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Pool</span>
                <div className="flex items-center gap-2">
                  <span className="font-display text-3xl font-black tracking-tight text-brand-red-glow">
                    {TESTNET_AIRDROP_POOL.toLocaleString()}
                  </span>
                  <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-black uppercase leading-none tracking-[0.28em] text-white/45">
                    SPKR
                  </span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.35em] text-white/35">
                  Testnet Airdrop Pool
                </span>
                <span className="text-xs text-white/35">
                  From the Liquidity &amp; Ecosystem pool
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-6 border-t border-white/5 pb-12 pt-12 opacity-30 sm:flex-row">
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">SpeakerAI Protocol © 2026</span>
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Built for the future of voice</span>
          </div>
        </footer>
      </main>

      {voiceQuestOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex min-h-screen items-center justify-center overflow-y-auto bg-[#050102]/90 px-3 py-4 backdrop-blur-xl sm:px-4 sm:py-6"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(170,24,24,0.34),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(255,110,110,0.12),transparent_28%)]" />
          <div className="relative w-full max-w-[880px] overflow-hidden rounded-[28px] border border-[#7a1c1c]/50 bg-[linear-gradient(180deg,rgba(99,12,12,0.4),rgba(18,4,4,0.94))] shadow-[0_30px_120px_rgba(80,0,0,0.45)] sm:rounded-[36px]">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),transparent_40%,rgba(255,90,90,0.06))]" />
            <div className="relative p-4 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-red/15 text-brand-red-glow">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/35">
                      SpeakerAI
                    </p>
                    <p className="text-sm font-bold text-white">Voice Quest</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeVoiceQuestModal}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/70 transition-all hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.28em] text-white/35">
                    Left Today
                  </span>
                  <span className="font-display text-3xl font-black tracking-tight text-white">
                    {voiceQuestRemainingToday}
                  </span>
                </div>
                <span className="rounded-full border border-[#ff7c7c]/20 bg-[#6d0e0e]/30 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-[#ffb0b0]">
                  Earn +{voiceQuestPoints} SP
                </span>
              </div>

              {shouldShowVoiceQuestMobileQr ? (
                <div className="mb-4 rounded-[24px] border border-white/10 bg-black/25 p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/35">
                        Continue On Mobile
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-white/65">
                        Scan to open the voice quest on your phone and connect the same SPK Wallet
                        {address ? ` ${shortenAddress(address)}` : ''}.
                      </p>
                    </div>
                    <a
                      href={mobileOpenUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-[0.24em] text-white/75 transition-all hover:bg-white/10 hover:text-white"
                    >
                      Open On Mobile
                    </a>
                  </div>
                  <div className="mt-4 flex justify-center rounded-[20px] border border-white/10 bg-black/20 p-4">
                    <img
                      src={mobileQrImageUrl}
                      alt="QR code to open the voice quest on mobile with the same wallet"
                      className="h-40 w-40 rounded-xl border border-white/10 bg-white p-2"
                    />
                  </div>
                </div>
              ) : null}

              {voiceQuestStatus === 'legal' ? (
                <div className="rounded-[24px] border border-white/10 bg-black/25 p-4 sm:p-5">
                  <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/75">
                          <input
                            type="checkbox"
                            checked={voiceQuestLegalAccepted}
                            onChange={(event) => setVoiceQuestLegalAccepted(event.target.checked)}
                            className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent accent-brand-red"
                          />
                          <span>
                            I read the{' '}
                            <Link href="/privacy-policy" target="_blank" className="font-bold text-[#ff9b9b] hover:text-white">
                              privacy policy
                            </Link>{' '}
                            and agree to submit my recorded voice.
                          </span>
                  </label>
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="sm:max-w-[14rem]">
                        <label className="block text-[10px] font-black uppercase tracking-[0.28em] text-white/35">
                          Reading Language
                        </label>
                        <p className="mt-2 text-xs leading-relaxed text-white/45">
                          Choose the language for the prompt and the live speech detector.
                        </p>
                      </div>
                      <div className="relative min-w-0 w-full sm:max-w-[19rem]">
                        {shouldUseNativeVoiceLanguageSelector ? (
                          <div className="rounded-[22px] border border-[#7a1c1c]/35 bg-[linear-gradient(180deg,rgba(46,8,8,0.9),rgba(16,5,5,0.92))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                            <div className="flex items-center justify-between gap-3">
                              <label className="block text-[10px] font-black uppercase tracking-[0.24em] text-white/35">
                                Selected
                              </label>
                              <span className="rounded-full border border-[#ff8f8f]/20 bg-[#6d0e0e]/30 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-[#ffb0b0]">
                                Mobile
                              </span>
                            </div>
                            <div className="relative mt-3 overflow-hidden rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]">
                              <select
                                value={voiceQuestLanguageCode}
                                onChange={(event) => setVoiceQuestLanguageCode(event.target.value)}
                                className="w-full appearance-none bg-transparent px-4 py-3.5 pr-12 text-sm font-semibold leading-tight text-white outline-none transition-all"
                              >
                                {VOICE_QUEST_LANGUAGE_OPTIONS.map((option) => (
                                  <option
                                    key={option.value}
                                    value={option.value}
                                    className="bg-[#120404]"
                                  >
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                              <div className="pointer-events-none absolute inset-y-0 right-0 flex w-11 items-center justify-center border-l border-white/10 bg-white/[0.04]">
                                <ChevronRight className="h-4 w-4 rotate-90 text-white/55" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                setVoiceQuestLanguageMenuOpen((currentValue) => !currentValue)
                              }
                              className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] px-4 py-3 text-left transition-all hover:border-[#ff8f8f]/30 hover:bg-white/[0.08]"
                            >
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/35">
                                  Selected
                                </p>
                                <p className="mt-1 text-sm font-semibold text-white">
                                  {selectedVoiceQuestLanguage.label}
                                </p>
                              </div>
                              <ChevronRight
                                className={`h-4 w-4 text-white/50 transition-transform duration-200 ${
                                  voiceQuestLanguageMenuOpen ? 'rotate-90' : ''
                                }`}
                              />
                            </button>

                            {voiceQuestLanguageMenuOpen ? (
                              <div className="absolute left-0 right-0 top-[calc(100%+0.6rem)] z-20 overflow-hidden rounded-[20px] border border-[#6a1b1b]/50 bg-[linear-gradient(180deg,rgba(27,7,7,0.98),rgba(12,5,5,0.98))] shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:rounded-[20px]">
                                <div className="border-b border-white/10 px-4 py-3">
                                  <div className="flex items-center justify-between gap-3">
                                    <div>
                                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/35">
                                        Available Languages
                                      </p>
                                      <p className="mt-1 text-xs text-white/45 sm:hidden">
                                        Choose one option and continue the quest.
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setVoiceQuestLanguageMenuOpen(false)}
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/55"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                                <div className="max-h-[18rem] overflow-y-auto p-2 sm:max-h-64">
                                  {VOICE_QUEST_LANGUAGE_OPTIONS.map((option) => {
                                    const isSelected = option.value === voiceQuestLanguageCode;

                                    return (
                                      <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => {
                                          setVoiceQuestLanguageCode(option.value);
                                          setVoiceQuestLanguageMenuOpen(false);
                                        }}
                                        className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-sm transition-all ${
                                          isSelected
                                            ? 'bg-[#4a0a0a] text-white'
                                            : 'text-white/72 hover:bg-white/[0.06] hover:text-white'
                                        }`}
                                      >
                                        <span className="font-semibold">{option.label}</span>
                                        {isSelected ? (
                                          <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                                        ) : null}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : null}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {!isMobileViewport && audioInputDevices.length > 1 ? (
                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <label className="block text-[10px] font-black uppercase tracking-[0.28em] text-white/35">
                        Microphone
                      </label>
                      <select
                        value={selectedAudioInputId}
                        onChange={(event) => setSelectedAudioInputId(event.target.value)}
                        className="mt-3 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition-all focus:border-[#ff8f8f]/60"
                      >
                        {audioInputDevices.map((device) => (
                          <option key={device.deviceId} value={device.deviceId} className="bg-[#120404]">
                            {device.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void beginVoiceQuestCountdown()}
                    disabled={!voiceQuestLegalAccepted || voiceQuestRemainingToday <= 0}
                    className="mt-4 inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-brand-red px-5 py-4 text-sm font-black uppercase tracking-[0.28em] text-white transition-all hover:bg-brand-red-glow disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Mic className="h-4 w-4" />
                    Start
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.28em] text-white/35">
                      Read
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-white/60">
                      {voiceQuestStatus === 'countdown'
                        ? 'Starting'
                        : voiceQuestStatus === 'recording'
                          ? 'Recording'
                          : voiceQuestStatus === 'verifying'
                            ? 'Verifying'
                            : voiceQuestStatus === 'awaiting_desktop_signature'
                              ? 'Desktop Sign'
                            : voiceQuestStatus === 'verified'
                              ? 'Verified'
                              : voiceQuestStatus === 'signing'
                                ? 'Signing'
                                : voiceQuestStatus === 'success'
                                  ? 'Confirmed'
                                  : 'Ready'}
                    </span>
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-black/55 p-3 sm:p-5">
                    <div className="rounded-[20px] bg-[linear-gradient(180deg,#050505,#090909)] p-3 sm:p-5">
                      {voiceQuestStatus === 'countdown' && voiceQuestCountdown !== null ? (
                        <div className="flex min-h-[220px] items-center justify-center sm:min-h-[320px]">
                          <p
                            className={`font-display text-6xl font-black tracking-tight sm:text-8xl ${
                              voiceQuestCountdown === 3
                                ? 'text-brand-red'
                                : voiceQuestCountdown === 2
                                  ? 'text-yellow-200'
                                  : 'text-green-400'
                            }`}
                          >
                            {voiceQuestCountdown}
                          </p>
                        </div>
                      ) : voiceQuestStatus === 'verifying' ? (
                        <div className="flex min-h-[220px] flex-col items-center justify-center gap-5 text-white sm:min-h-[320px]">
                          <LoaderCircle className="h-8 w-8 animate-spin text-brand-red-glow sm:h-10 sm:w-10" />
                          <p className="font-display text-3xl font-black tracking-tight sm:text-4xl">Verifying</p>
                          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/50">
                            Preparing reward check
                          </p>
                        </div>
                      ) : voiceQuestStatus === 'awaiting_desktop_signature' ? (
                        <div className="flex min-h-[220px] flex-col items-center justify-center gap-5 text-white sm:min-h-[320px]">
                          <LoaderCircle className="h-8 w-8 animate-spin text-brand-red-glow sm:h-10 sm:w-10" />
                          <p className="font-display text-2xl font-black tracking-tight text-center sm:text-4xl">
                            Waiting For Desktop Signature
                          </p>
                          <p className="max-w-md text-center text-sm leading-relaxed text-white/60">
                            Your recording is verified. Open the signed-in desktop session to approve the reward.
                          </p>
                        </div>
                      ) : voiceQuestStatus === 'signing' ? (
                        <div className="flex min-h-[220px] flex-col items-center justify-center gap-5 text-white sm:min-h-[320px]">
                          <LoaderCircle className="h-8 w-8 animate-spin text-brand-red-glow sm:h-10 sm:w-10" />
                          <p className="font-display text-3xl font-black tracking-tight sm:text-4xl">Sign Wallet</p>
                        </div>
                      ) : voiceQuestStatus === 'verified' ? (
                        <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 sm:min-h-[320px] sm:gap-6">
                          <p className="font-display text-3xl font-black tracking-tight text-white sm:text-4xl">
                            Sign Wallet
                          </p>
                          <button
                            type="button"
                            onClick={() => void claimVerifiedVoiceQuest()}
                            className="inline-flex items-center justify-center gap-3 rounded-2xl bg-brand-red px-6 py-4 text-sm font-black uppercase tracking-[0.28em] text-white transition-all hover:bg-brand-red-glow"
                          >
                            <ShieldCheck className="h-4 w-4" />
                            Sign Wallet
                          </button>
                        </div>
                      ) : voiceQuestStatus === 'success' ? (
                        <div className="flex min-h-[220px] items-center justify-center sm:min-h-[320px]">
                          <p className="font-display text-4xl font-black tracking-tight text-white sm:text-5xl">Done</p>
                        </div>
                      ) : (
                        <div className="grid gap-3 sm:gap-4">
                          <div className="rounded-[20px] border border-[#451010] bg-black px-3 py-4 sm:px-6 sm:py-6">
                            <div className="mb-3 flex flex-col gap-2 text-left sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/35">
                                  Read Prompt
                                </p>
                                <p className="mt-1 text-xs text-white/45">
                                  Speak clearly and keep the words in order.
                                </p>
                              </div>
                              <span className="inline-flex w-fit rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-white/55">
                                {voiceQuestResolvedLanguageCode}
                              </span>
                            </div>
                            <p className="text-left text-[1.45rem] font-semibold leading-[1.7] tracking-[0.01em] text-white sm:text-[2.35rem] sm:leading-[1.6]">
                              {displayExpectedWords.map((word, index, words) => {
                                const progressState = getWordProgressState(
                                  index,
                                  matchedWordCount,
                                voiceQuestStatus
                              );

                                return (
                                  <motion.span
                                    key={`${word}-${index}`}
                                    initial={{ opacity: 0, y: 14 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                      duration: 0.48,
                                      ease: [0.22, 1, 0.36, 1],
                                      delay: Math.min(index * 0.04, 0.5),
                                    }}
                                    className={`inline rounded-lg px-1 py-0.5 transition-all duration-300 sm:rounded-xl sm:px-2 sm:py-1 ${
                                      progressState === 'matched'
                                        ? 'bg-emerald-500 text-white shadow-[0_0_30px_rgba(16,185,129,0.35)]'
                                        : progressState === 'active'
                                          ? 'bg-[#2a0606] text-white ring-1 ring-[#ff8f8f]/70'
                                          : 'text-white'
                                    }`}
                                  >
                                    {word}
                                    {index < words.length - 1 && expectedTextUsesWhitespace
                                      ? ' '
                                      : ''}
                                  </motion.span>
                                );
                              })}
                            </p>
                          </div>

                          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
                            <div className="rounded-[20px] border border-white/10 bg-[#090909] px-4 py-4 text-left sm:px-5">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <span className="text-[10px] font-black uppercase tracking-[0.28em] text-white/35">
                                  Detector Hears
                                </span>
                                <span className="inline-flex w-fit rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-white/50">
                                  {voiceQuestResolvedLanguageCode}
                                </span>
                              </div>
                              <div className="mt-3 max-h-[112px] overflow-y-auto pr-1">
                                <div className="flex min-h-[68px] flex-wrap gap-2">
                                  {(visibleTranscriptWords.length
                                  ? visibleTranscriptWords
                                  : ['Waiting for speech...']
                                  ).map((word, index) => {
                                  const isPlaceholder = !visibleTranscriptWords.length;
                                  const absoluteIndex =
                                    visibleTranscriptWordStartIndex + index;
                                  const isCorrect =
                                    !isPlaceholder &&
                                    absoluteIndex < matchedWordCount &&
                                    normalizedExpectedWords[absoluteIndex] === word;
                                  const isCurrent =
                                    !isPlaceholder && absoluteIndex === matchedWordCount;
                                  const isAfterReset =
                                    !isPlaceholder &&
                                    absoluteIndex > matchedWordCount &&
                                    matchedWordCount === 0;

                                  return (
                                    <span
                                      key={`${word}-${index}`}
                                      className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-all ${
                                        isPlaceholder
                                          ? 'border border-white/10 bg-white/[0.04] text-white/35'
                                        : isCorrect
                                            ? 'border border-emerald-400/30 bg-emerald-500/15 text-emerald-300'
                                            : isCurrent
                                              ? 'border border-[#ff8f8f]/30 bg-[#3a0d0d] text-[#ffd5d5]'
                                              : isAfterReset
                                                ? 'border border-[#6a1b1b]/40 bg-[#1f0909] text-[#b78383]'
                                              : 'border border-white/10 bg-white/[0.04] text-white/55'
                                      }`}
                                    >
                                      {isCorrect ? (
                                        <span className="inline-flex items-center gap-1.5">
                                          <CheckCircle2 className="h-3.5 w-3.5" />
                                          <span>{word}</span>
                                        </span>
                                      ) : (
                                        word
                                      )}
                                    </span>
                                  );
                                })}
                                </div>
                              </div>
                              <p className="mt-3 text-xs leading-relaxed text-white/40">
                                The detector keeps the latest words visible and resets to the first prompt word after a wrong next word.
                              </p>
                            </div>

                            <div className="rounded-[20px] border border-[#163228] bg-[linear-gradient(180deg,rgba(7,26,20,0.96),rgba(6,16,13,0.96))] px-4 py-4 text-left sm:px-5">
                              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-300/60">
                                Next Word
                              </p>
                              <p className="mt-3 text-lg font-black uppercase tracking-[0.16em] text-emerald-300 break-words sm:text-xl">
                                {voiceQuestStatus === 'recording' && normalizedExpectedWords.length
                                  ? normalizedExpectedWords[matchedWordCount] ?? 'Complete'
                                  : 'Ready'}
                              </p>
                              <p className="mt-4 text-xs leading-relaxed text-white/45">
                                {voiceQuestStatus === 'recording'
                                  ? 'Follow the highlight and keep a steady pace.'
                                  : 'The detector preview updates after recording starts.'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {voiceQuestStatus === 'recording' ? (
                    <button
                      type="button"
                      onClick={stopVoiceRecording}
                      className="inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-brand-red px-5 py-4 text-sm font-black uppercase tracking-[0.28em] text-white transition-all hover:bg-brand-red-glow"
                    >
                      <Mic className="h-4 w-4" />
                      Stop Recording
                    </button>
                  ) : null}
                </div>
              )}

              {!voiceRecognitionSupported ? (
                <p className="mt-4 rounded-2xl border border-[#ff7c7c]/20 bg-[#4a0a0a]/40 px-4 py-3 text-sm text-[#ffb0b0]">
                  This browser does not expose speech recognition. Use a supported browser to run the voice quest.
                </p>
              ) : null}

              {voiceQuestWarning ? (
                <p className="mt-4 rounded-2xl border border-[#ff7c7c]/20 bg-[#4a0a0a]/40 px-4 py-3 text-sm text-[#ffb0b0]">
                  {voiceQuestWarning}
                </p>
              ) : null}
            </div>
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type SVGProps } from 'react';
import { motion } from 'motion/react';
import { AppKit } from '@web3modal/base';
import { ConnectorController, OptionsController } from '@web3modal/core';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useAccount, useConnections, useConnectors, useDisconnect, useSignMessage } from 'wagmi';
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
  sentenceToken?: string;
}

interface VoiceQuestVerifyResponse {
  error?: string;
  ok?: boolean;
  status?: string;
  claimToken?: string;
  expectedText?: string;
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
const normalizeSpeechText = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

const getMatchedWordCount = (expectedWords: string[], spokenWords: string[]) => {
  let count = 0;

  while (count < expectedWords.length && count < spokenWords.length) {
    if (expectedWords[count] !== spokenWords[count]) {
      break;
    }

    count += 1;
  }

  return count;
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
  const countdownTimeoutRef = useRef<number | null>(null);
  const autoCloseTimeoutRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
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
  const { address, isConnected } = useAccount();
  const { open } = useWeb3Modal();
  const connections = useConnections();
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
  const mobileVoiceQuestPromptedRef = useRef(false);
  const mobileVoiceQuestOpenedRef = useRef(false);
  const spkConnector = connectors.find((connector) =>
    matchesSpkWallet({
      id: connector.id,
      name: connector.name,
      rdns: connector.rdns,
    })
  );
  const activeConnector = connections[connections.length - 1]?.connector;
  const isConnectedWithSpkWallet = matchesSpkWallet({
    id: activeConnector?.id,
    name: activeConnector?.name,
    rdns: activeConnector?.rdns,
  });
  const canClaimSpkWalletQuest = Boolean(isConnected && address && isConnectedWithSpkWallet);
  const hasCompletedSpkWalletQuest = downloadSpkWalletQuestClaimed;
  const hasUnlockedTestnetPage = Boolean(canClaimSpkWalletQuest && walletVerifiedForSession);
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
    .split(' ')
    .filter(Boolean);
  const normalizedTranscriptWords = normalizeSpeechText(voiceQuestTranscript)
    .split(' ')
    .filter(Boolean);
  const matchedWordCount = getMatchedWordCount(
    normalizedExpectedWords,
    normalizedTranscriptWords
  );
  const hasPerfectTranscript =
    normalizeSpeechText(voiceQuestTranscript) === normalizeSpeechText(voiceQuestExpectedText);

  const stopVoiceCapture = () => {
    voiceQuestCancelledRef.current = true;

    if (countdownTimeoutRef.current !== null) {
      window.clearTimeout(countdownTimeoutRef.current);
      countdownTimeoutRef.current = null;
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
    setVoiceQuestSentenceToken(null);
    setVoiceQuestClaimToken(null);
    voiceChunksRef.current = [];
  };

  const fetchVoiceQuestSession = async (
    walletAddress: string,
    signal?: AbortSignal
  ) => {
    const response = await fetch(
      `/api/testnet/voice-quest?address=${encodeURIComponent(walletAddress)}`,
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
    setVoiceQuestSentenceToken(payload.sentenceToken?.trim() || null);

    return payload;
  };

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
          }
        | undefined;

      if (!response.ok || payload?.ok !== true) {
        throw new Error(payload?.error || 'Unable to claim the testnet quest reward.');
      }

      setWalletVerifiedForSession(true);
      setDownloadSpkWalletQuestClaimed(true);
      setQuestClaimStatus('claimed');
      setWalletPoints((currentPoints) =>
        typeof payload?.points === 'number' ? payload.points : currentPoints
      );
      setWalletPointsWarning(null);
      setQuestClaimWarning(
        payload?.alreadyClaimed
          ? 'Your wallet is connected. This reward has already been claimed, so your SP balance stays the same.'
          : null
      );
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
      setWalletPoints(null);
      setWalletPointsLoading(false);
      setWalletPointsWarning(null);
      setDownloadSpkWalletQuestClaimed(false);
      setWalletVerifiedForSession(false);
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
        setDownloadSpkWalletQuestClaimed(false);
        setWalletVerifiedForSession(false);
        setQuestClaimStatus('idle');

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
  }, [address, isConnected, isConnectedWithSpkWallet]);

  useEffect(() => {
    if (!(address && canClaimSpkWalletQuest)) {
      return;
    }

    const abortController = new AbortController();

    void fetchVoiceQuestSession(address, abortController.signal).catch((error) => {
      if (!abortController.signal.aborted) {
        console.error('Failed to load voice quest status:', error);
      }
    });

    return () => {
      abortController.abort();
    };
  }, [address, canClaimSpkWalletQuest]);

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
    }

    setMobileOpenUrl(mobileUrl.toString());
  }, [address, voiceQuestOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const wantsVoiceQuest = searchParams.get('voiceQuest') === '1';
    const walletFromUrl = searchParams.get('wallet')?.trim() ?? '';

    if (!wantsVoiceQuest) {
      return;
    }

    setMobileVoiceQuestRequested(true);
    setMobileVoiceQuestWallet(walletFromUrl);
  }, []);

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
    setVoiceQuestMimeType('audio/webm');
    voiceChunksRef.current = [];
    voiceQuestCancelledRef.current = false;

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: selectedAudioInputId
          ? {
              deviceId: { exact: selectedAudioInputId },
            }
          : true,
      });
      mediaStreamRef.current = mediaStream;

      const RecorderCtor =
        MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? new MediaRecorder(mediaStream, { mimeType: 'audio/webm;codecs=opus' })
          : new MediaRecorder(mediaStream);

      mediaRecorderRef.current = RecorderCtor;
      setVoiceQuestMimeType(RecorderCtor.mimeType || 'audio/webm');

      RecorderCtor.ondataavailable = (event) => {
        if (event.data.size > 0) {
          voiceChunksRef.current.push(event.data);
        }
      };

      RecorderCtor.onstop = () => {
        if (voiceQuestCancelledRef.current) {
          return;
        }

        setVoiceQuestBlob(
          voiceChunksRef.current.length
            ? new Blob(voiceChunksRef.current, {
                type: RecorderCtor.mimeType || 'audio/webm',
              })
            : null
        );
        setVoiceQuestStatus('verifying');
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        void verifyVoiceQuestRecording();
      };

      const SpeechRecognitionCtor =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognitionCtor) {
        throw new Error('Speech recognition is not available in this browser.');
      }

      const recognition = new SpeechRecognitionCtor();
      speechRecognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.onresult = (event) => {
        const nextTranscript = Array.from({ length: event.results.length })
          .map((_, index) => event.results[index]?.[0]?.transcript ?? '')
          .join(' ')
          .trim();

        setVoiceQuestTranscript(nextTranscript);
      };
      recognition.onerror = (event) => {
        setVoiceQuestWarning(`Voice recognition error: ${event.error}.`);
      };
      recognition.onend = () => {
        if (mediaRecorderRef.current?.state === 'recording') {
          try {
            recognition.start();
          } catch {
            // Avoid a noisy loop if the browser refuses an immediate restart.
          }
        }
      };

      setVoiceQuestStatus('recording');
      RecorderCtor.start();
      recognition.start();
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
    setVoiceQuestSentenceToken(null);
    setVoiceQuestClaimToken(null);
    voiceChunksRef.current = [];
    voiceQuestCancelledRef.current = false;
  };

  useEffect(() => {
    if (!mobileVoiceQuestRequested || !isMobileViewport) {
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

    if (!(address && canClaimSpkWalletQuest && walletVerifiedForSession)) {
      return;
    }

    if (
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
    address,
    canClaimSpkWalletQuest,
    isMobileViewport,
    mobileVoiceQuestRequested,
    normalizedConnectedAddress,
    normalizedMobileVoiceQuestWallet,
    walletVerifiedForSession,
  ]);

  const stopVoiceRecording = () => {
    if (voiceQuestStatus !== 'recording') {
      return;
    }

    voiceQuestCancelledRef.current = false;
    speechRecognitionRef.current?.stop();
    speechRecognitionRef.current = null;

    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const beginVoiceQuestCountdown = async () => {
    if (!(address && hasUnlockedTestnetPage)) {
      setVoiceQuestWarning('Sign in with your SPK Wallet first.');
      return;
    }

    if (!voiceQuestLegalAccepted) {
      setVoiceQuestWarning('Confirm the privacy policy before starting.');
      return;
    }

    setVoiceQuestWarning(null);

    try {
      await fetchVoiceQuestSession(address);
      setVoiceQuestTranscript('');
      setVoiceQuestBlob(null);
      setVoiceQuestMimeType('audio/webm');
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

  const verifyVoiceQuestRecording = async () => {
    if (!(address && hasUnlockedTestnetPage)) {
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
      const response = await fetch('/api/testnet/voice-quest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'verify',
          walletAddress: address,
          transcript: voiceQuestTranscript,
          sentenceToken: voiceQuestSentenceToken,
          legalAccepted: voiceQuestLegalAccepted,
        }),
      });

      const payload = (await response.json()) as VoiceQuestVerifyResponse | undefined;

      if (!response.ok || payload?.ok !== true) {
        throw new Error(payload?.error || 'Unable to verify the voice recording.');
      }

      setVoiceQuestClaimToken(payload.claimToken?.trim() || null);
      setVoiceQuestExpectedText(payload.expectedText?.trim() || voiceQuestExpectedText);
      setVoiceQuestStatus('verified');
    } catch (error) {
      setVoiceQuestWarning(
        error instanceof Error ? error.message : 'Unable to verify the voice recording.'
      );
      setVoiceQuestStatus('legal');
    }
  };

  const claimVerifiedVoiceQuest = async () => {
    if (!(address && hasUnlockedTestnetPage)) {
      setVoiceQuestWarning('Sign in with your SPK Wallet first.');
      return;
    }

    if (!voiceQuestBlob || !voiceQuestClaimToken) {
      setVoiceQuestWarning('Verify your recording first.');
      return;
    }

    setVoiceQuestStatus('signing');
    setVoiceQuestWarning(null);

    try {
      const signature = await signMessageAsync({
        message: getDailyVoiceQuestOwnershipMessage(address, voiceQuestExpectedText),
      });

      const audioBuffer = await voiceQuestBlob.arrayBuffer();
      const audioBase64 = btoa(
        Array.from(new Uint8Array(audioBuffer))
          .map((value) => String.fromCharCode(value))
          .join('')
      );

      const response = await fetch('/api/testnet/voice-quest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'claim',
          walletAddress: address,
          signature,
          claimToken: voiceQuestClaimToken,
          audioBase64,
          audioMimeType: voiceQuestMimeType,
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
      setVoiceQuestStatus('success');
      autoCloseTimeoutRef.current = window.setTimeout(() => {
        closeVoiceQuestModal();
      }, 1400);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to submit the voice quest.';

      setVoiceQuestWarning(
        message.toLowerCase().includes('user rejected')
          ? 'Signature request was cancelled.'
          : message
      );
      setVoiceQuestStatus('verified');
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
                                  Read the sentence, record your mic, verify the exact words, and sign with your SPK Wallet. Limited to 5 times per day.
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
          <div className="relative w-full max-w-[760px] overflow-hidden rounded-[28px] border border-[#7a1c1c]/50 bg-[linear-gradient(180deg,rgba(99,12,12,0.4),rgba(18,4,4,0.94))] shadow-[0_30px_120px_rgba(80,0,0,0.45)] sm:rounded-[36px]">
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
                    Daily Limit
                  </span>
                  <span className="font-display text-3xl font-black tracking-tight text-white">
                    {voiceQuestRemainingToday}
                  </span>
                </div>
                <span className="rounded-full border border-[#ff7c7c]/20 bg-[#6d0e0e]/30 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-[#ffb0b0]">
                  +{voiceQuestPoints} SP
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
                            : voiceQuestStatus === 'verified'
                              ? 'Verified'
                              : voiceQuestStatus === 'signing'
                                ? 'Signing'
                                : voiceQuestStatus === 'success'
                                  ? 'Confirmed'
                                  : 'Ready'}
                    </span>
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-black/55 p-4 sm:p-5">
                    <div className="flex aspect-[16/10] min-h-[180px] items-center justify-center rounded-[20px] bg-black px-4 text-center sm:aspect-[21/9] sm:min-h-[240px] sm:px-8">
                      {voiceQuestStatus === 'countdown' && voiceQuestCountdown !== null ? (
                        <p
                          className={`font-display text-6xl font-black tracking-tight sm:text-8xl ${
                            voiceQuestCountdown === 3
                              ? 'text-brand-red'
                              : voiceQuestCountdown === 2
                                ? 'text-yellow-300'
                                : 'text-green-400'
                          }`}
                        >
                          {voiceQuestCountdown}
                        </p>
                      ) : voiceQuestStatus === 'verifying' ? (
                        <div className="flex flex-col items-center gap-5 text-white">
                          <LoaderCircle className="h-8 w-8 animate-spin text-brand-red-glow sm:h-10 sm:w-10" />
                          <p className="font-display text-3xl font-black tracking-tight sm:text-4xl">Verifying</p>
                        </div>
                      ) : voiceQuestStatus === 'signing' ? (
                        <div className="flex flex-col items-center gap-5 text-white">
                          <LoaderCircle className="h-8 w-8 animate-spin text-brand-red-glow sm:h-10 sm:w-10" />
                          <p className="font-display text-3xl font-black tracking-tight sm:text-4xl">Sign Wallet</p>
                        </div>
                      ) : voiceQuestStatus === 'verified' ? (
                        <div className="flex flex-col items-center gap-4 sm:gap-6">
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
                        <p className="font-display text-4xl font-black tracking-tight text-white sm:text-5xl">Done</p>
                      ) : (
                        <p className="max-w-[32rem] text-lg font-semibold leading-[1.85] tracking-[0.01em] text-white sm:text-[30px] sm:leading-[1.9]">
                          {voiceQuestExpectedText.split(' ').map((word, index) => {
                            const isMatched = index < matchedWordCount;
                            const isActive =
                              index === matchedWordCount && voiceQuestStatus === 'recording';

                            return (
                              <span
                                key={`${word}-${index}`}
                                className={`inline rounded-lg px-1.5 py-1 transition-all duration-300 sm:rounded-xl sm:px-2 ${
                                  isMatched
                                    ? 'bg-brand-red text-white shadow-[0_0_30px_rgba(180,35,35,0.35)]'
                                    : isActive
                                      ? 'bg-[#2a0606] text-white ring-1 ring-[#ff8f8f]/70'
                                      : 'text-white'
                                }`}
                              >
                                {word}
                                {index < voiceQuestExpectedText.split(' ').length - 1 ? ' ' : ''}
                              </span>
                            );
                          })}
                        </p>
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

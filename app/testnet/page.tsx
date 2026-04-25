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
  Sparkles,
  Wallet,
  Zap,
} from 'lucide-react';
import {
  DOWNLOAD_SPK_WALLET_QUEST_ID,
  DOWNLOAD_SPK_WALLET_QUEST_REWARD_POINTS,
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
  const autoClaimAttemptedRef = useRef<string | null>(null);
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

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#080203] text-white selection:bg-brand-red selection:text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(170,24,24,0.42),_transparent_34%),radial-gradient(circle_at_80%_22%,_rgba(255,112,112,0.12),_transparent_22%),radial-gradient(circle_at_bottom_right,_rgba(120,12,12,0.36),_transparent_30%),linear-gradient(180deg,_rgba(24,4,4,0.96),_rgba(6,2,2,1))]" />
        <div className="absolute top-[12%] left-[8%] h-72 w-72 rounded-full bg-[#a31414]/20 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[6%] h-80 w-80 rounded-full bg-[#6e0d0d]/20 blur-[140px]" />
        <div className="absolute left-0 right-0 top-[120px] h-px bg-[linear-gradient(90deg,transparent,rgba(255,80,80,0.4),transparent)]" />
      </div>

      <nav className="relative z-10 border-b border-white/5 bg-black/30 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="red-glow flex h-10 w-10 items-center justify-center rounded-lg bg-brand-red">
              <Zap className="h-6 w-6 fill-current text-white" />
            </div>
            <span className="font-display text-2xl font-bold tracking-tighter">
              SPEAKER<span className="text-brand-red">AI</span>
            </span>
          </div>

          <Link
            href="/"
            prefetch
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
        </div>
      </nav>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
        <section className="mb-12 text-center lg:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="mb-5 text-[11px] font-black uppercase tracking-[0.45em] text-[#ff7c7c]">
              Testnet
            </p>
            <h1 className="mb-6 font-display text-5xl font-black leading-[0.9] tracking-tight lg:text-8xl">
              SPEAKERAI <span className="text-brand-red">TESTNET</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-white/60 lg:text-xl">
              The future of SpeakerAI Protocol starts here.
            </p>
          </motion.div>
        </section>

        <section className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative overflow-hidden rounded-[42px] border border-[#7a1c1c]/50 bg-[linear-gradient(180deg,rgba(99,12,12,0.5),rgba(20,4,4,0.88))] p-8 shadow-[0_30px_120px_rgba(80,0,0,0.45)] lg:p-12"
          >
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),transparent_38%,rgba(255,90,90,0.08))]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(8,1,1,0.52)_58%,rgba(4,0,0,0.82)_100%)]" />

            <div className="relative flex min-h-[420px] flex-col items-center justify-center rounded-[32px] border border-white/10 bg-black/35 px-6 text-center">
              <div className="mb-6 rounded-full border border-[#ff7c7c]/20 bg-[#6d0e0e]/30 px-4 py-2 text-[10px] font-black uppercase tracking-[0.4em] text-[#ffb0b0]">
                Testnet
              </div>
              <h2 className="mb-4 font-display text-4xl font-black tracking-tight text-white lg:text-6xl">
                SP points
              </h2>
              <p className="max-w-2xl text-base leading-relaxed text-white/65 lg:text-lg">
                SP points are the keypoints of the SpeakerAI Protocol Testnet — Earn SP Points by using the SpeakerAI Testnet
              </p>
              <div className="mt-8 flex w-full flex-col items-center gap-6">
                {isConnected && address && isConnectedWithSpkWallet && !hasUnlockedTestnetPage ? (
                  <>
                    <div className="flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white/85">
                      <Wallet className="h-4 w-4 text-brand-red-glow" />
                      {shortenAddress(address)}
                      <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-emerald-200">
                        SPK Wallet
                      </span>
                    </div>
                    <div className="w-full max-w-2xl rounded-[28px] border border-white/10 bg-white/[0.04] p-6 text-left">
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                          <Wallet className="h-5 w-5 text-brand-red-glow" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.32em] text-white/35">
                            Access
                          </p>
                          <p className="text-lg font-bold text-white">Sign in with your SPK Wallet</p>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/30 px-5 py-6 text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/40">
                          Required each time
                        </p>
                        <p className="mt-3 font-display text-3xl font-black tracking-tight text-white">
                          Sign with your SPK Wallet
                        </p>
                        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/55">
                          Sign to open your testnet dashboard. Your wallet can earn +{spkWalletQuestPoints} SP the first time it completes this step.
                        </p>
                        <div className="mt-6 flex flex-col items-center gap-3">
                          <button
                            type="button"
                            onClick={() => void claimSpkWalletQuest()}
                            disabled={questClaimStatus === 'claiming'}
                            className="rounded-2xl bg-brand-red px-6 py-4 text-sm font-black uppercase tracking-[0.28em] text-white transition-all hover:bg-brand-red-glow disabled:cursor-not-allowed disabled:opacity-60"
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
                      className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-xs font-black uppercase tracking-[0.28em] text-white/75 transition-all hover:bg-white/10 hover:text-white"
                    >
                      Disconnect
                    </button>
                  </>
                ) : isConnected && address && isConnectedWithSpkWallet ? (
                  <>
                    <div className="flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white/85">
                      <Wallet className="h-4 w-4 text-brand-red-glow" />
                      {shortenAddress(address)}
                      <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-emerald-200">
                        SPK Wallet
                      </span>
                    </div>
                    <div className="grid w-full gap-4 text-left lg:grid-cols-2">
                      <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
                        <div className="mb-4 flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                            <Sparkles className="h-5 w-5 text-brand-red-glow" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-white/35">
                              Your Wallet SP points Balance
                            </p>
                            <p className="text-lg font-bold text-white">SP points</p>
                          </div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/30 px-5 py-6">
                          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/40">
                            SP Balance
                          </p>
                          <div className="mt-3 flex items-end gap-2">
                            <p className="font-display text-5xl font-black tracking-tight text-white">
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
                          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/55">
                            This is your current SP Points balance for your connected SPK Wallet.
Earn more points by completing quests and interacting with the protocol.
                          </p>
                          {walletPointsWarning ? (
                            <p className="mt-3 text-sm text-[#ffb0b0]">{walletPointsWarning}</p>
                          ) : null}
                        </div>
                      </div>

                      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-6">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,120,120,0.08),transparent_45%)]" />
                        <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" />
                        <div className="relative mb-4 flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                            <Wallet className="h-5 w-5 text-brand-red-glow" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-white/35">
                              Testnet
                            </p>
                            <p className="text-lg font-bold text-white">Quests</p>
                          </div>
                        </div>
                        <div className="relative space-y-3 rounded-2xl border border-white/10 bg-black/35 p-4">
                          <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-left">
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-white">Verify SPK Wallet ownership</p>
                              <p className="mt-1 text-xs leading-relaxed text-white/50">
                                Sign in with your SPK Wallet to continue. This reward is available once per wallet.
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
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
                          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-4">
                            <p className="text-sm font-bold text-white/80">More quests coming soon</p>
                            <p className="mt-1 text-xs leading-relaxed text-white/45">
                              New testnet quests and SP rewards will be added here soon.
                            </p>
                          </div>
                        </div>
                        <p className="relative mt-4 max-w-md text-sm leading-relaxed text-white/50">
                          You can earn SP points in the wallet for every confirmed transaction.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => disconnect()}
                      className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-xs font-black uppercase tracking-[0.28em] text-white/75 transition-all hover:bg-white/10 hover:text-white"
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
    </div>
  );
}

'use client';

import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAccount, useAccountEffect, useChainId, useDisconnect } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { createPublicClient, http, isAddress } from 'viem';
import { bsc } from 'viem/chains';
import {
  AirdropData,
  getInitialAirdropState,
  normalizeAddress,
  useAllocationState,
} from '@/components/AllocationStateProvider';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Copy,
  ExternalLink,
  LoaderCircle,
  RefreshCcw,
  ShieldCheck,
  Wallet,
  XCircle,
  Zap,
} from 'lucide-react';

const BSC_CHAIN_ID = 56;
const TOTAL_SUPPLY = 100000000;
const AIRDROP_POOL = 15000000;
const MIN_TX_ELIGIBLE = 10;
const MAX_TX_FOR_CAP = 10000;
const MAX_USER_CAP = 50000;
const SNAPSHOT_TIMESTAMP = BigInt(Math.floor(Date.UTC(2026, 2, 1, 0, 0, 0) / 1000));
const SNAPSHOT_LABEL = 'Before March 1, 2026';
const ALLOCATION_STORAGE_KEY = 'speakerai-allocation';
const ALLOCATION_TASK_STORAGE_KEY = 'speakerai-allocation-task-unlock';
const X_HANDLE = 'SpeakerAI_BNB';
const X_FOLLOW_URL = `https://x.com/intent/follow?screen_name=${X_HANDLE}`;
const X_REPOST_URL =
  'https://x.com/SpeakerAI_BNB/status/2041803442121748936?s=20';

const SOCIAL_LINKS = {
  website: 'https://www.speakerai.org',
  x: 'https://x.com/SpeakerProtocol',
  discord: 'https://discord.gg/tyAE9eeE8c',
} as const;

function XLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M18.9 2H22l-6.77 7.74L23 22h-6.1l-4.78-6.6L6.35 22H3.24l7.24-8.28L1 2h6.26l4.32 5.97L18.9 2Zm-1.07 18h1.72L6.33 3.9H4.48L17.83 20Z" />
    </svg>
  );
}

function DiscordLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M20.32 4.37A19.79 19.79 0 0 0 15.43 3c-.21.37-.45.86-.62 1.25a18.35 18.35 0 0 0-5.62 0A12.6 12.6 0 0 0 8.56 3a19.66 19.66 0 0 0-4.9 1.38C.57 9.02-.26 13.54.16 18c2.05 1.52 4.03 2.44 5.98 3.05.48-.66.91-1.36 1.28-2.09-.7-.27-1.36-.6-1.99-.98.17-.12.33-.25.49-.38 3.84 1.8 8 1.8 11.8 0 .17.14.33.27.5.38-.63.39-1.3.72-2 .99.37.73.8 1.43 1.28 2.09 1.95-.61 3.93-1.53 5.98-3.05.5-5.16-.85-9.64-3.16-13.63ZM8.85 15.27c-1.15 0-2.1-1.06-2.1-2.35 0-1.3.93-2.36 2.1-2.36 1.18 0 2.12 1.07 2.1 2.36 0 1.29-.93 2.35-2.1 2.35Zm6.3 0c-1.16 0-2.1-1.06-2.1-2.35 0-1.3.93-2.36 2.1-2.36 1.18 0 2.12 1.07 2.1 2.36 0 1.29-.93 2.35-2.1 2.35Z" />
    </svg>
  );
}

const publicClient = createPublicClient({
  chain: bsc,
  transport: http(),
});

let snapshotBlockPromise: Promise<bigint> | null = null;

const shortenAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

interface PersistedAirdropData {
  version: 1;
  address: string;
  txCount: number;
  isEligible: boolean;
  allocation: number;
}

interface PersistedTaskUnlockStatus {
  version: 1;
  unlocked: boolean;
}

interface AllocationSnapshot {
  txCount: number;
  isEligible: boolean;
  allocation: number;
}

type TaskStatus = 'idle' | 'opening' | 'verifying' | 'done';

const loadPersistedAirdrop = (walletAddress: string): AirdropData | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(ALLOCATION_STORAGE_KEY);

    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue) as Partial<PersistedAirdropData>;

    if (
      parsedValue.version !== 1 ||
      typeof parsedValue.address !== 'string' ||
      typeof parsedValue.txCount !== 'number' ||
      typeof parsedValue.isEligible !== 'boolean' ||
      typeof parsedValue.allocation !== 'number'
    ) {
      return null;
    }

    if (normalizeAddress(parsedValue.address) !== normalizeAddress(walletAddress)) {
      return null;
    }

    return {
      txCount: parsedValue.txCount,
      isEligible: parsedValue.isEligible,
      allocation: parsedValue.allocation,
      loading: false,
      error: null,
    };
  } catch (error) {
    console.error('Unable to restore saved allocation state:', error);
    return null;
  }
};

const loadTaskUnlockStatus = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const rawValue = window.localStorage.getItem(ALLOCATION_TASK_STORAGE_KEY);

    if (!rawValue) {
      return false;
    }

    const parsedValue = JSON.parse(rawValue) as Partial<PersistedTaskUnlockStatus>;

    if (
      parsedValue.version !== 1 ||
      typeof parsedValue.unlocked !== 'boolean'
    ) {
      return false;
    }

    return parsedValue.unlocked;
  } catch (error) {
    console.error('Unable to restore allocation task unlock status:', error);
    return false;
  }
};

const persistTaskUnlockStatus = (unlocked: boolean) => {
  if (typeof window === 'undefined') {
    return;
  }

  const payload: PersistedTaskUnlockStatus = {
    version: 1,
    unlocked,
  };

  window.localStorage.setItem(ALLOCATION_TASK_STORAGE_KEY, JSON.stringify(payload));
};

const persistAirdrop = (walletAddress: string, airdrop: Omit<AirdropData, 'loading' | 'error'>) => {
  if (typeof window === 'undefined') {
    return;
  }

  const payload: PersistedAirdropData = {
    version: 1,
    address: walletAddress,
    txCount: airdrop.txCount,
    isEligible: airdrop.isEligible,
    allocation: airdrop.allocation,
  };

  window.localStorage.setItem(ALLOCATION_STORAGE_KEY, JSON.stringify(payload));
};

const saveAllocationCheck = async (walletAddress: string, airdrop: AllocationSnapshot) => {
  try {
    const response = await fetch('/api/allocation-checks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address: walletAddress,
        txCount: airdrop.txCount,
        isEligible: airdrop.isEligible,
        allocation: airdrop.allocation,
      }),
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
  } catch (error) {
    console.error('Unable to sync allocation check to Supabase:', error);
  }
};

const getSnapshotBlockNumber = async () => {
  if (snapshotBlockPromise) {
    return snapshotBlockPromise;
  }

  snapshotBlockPromise = (async () => {
    const latestBlock = await publicClient.getBlock();
    let low = BigInt(0);
    let high = latestBlock.number;
    let best = BigInt(0);

    while (low <= high) {
      const mid = (low + high) / BigInt(2);
      const block = await publicClient.getBlock({ blockNumber: mid });

      if (block.timestamp <= SNAPSHOT_TIMESTAMP) {
        best = mid;
        low = mid + BigInt(1);
      } else {
        high = mid - BigInt(1);
      }
    }

    return best;
  })();

  return snapshotBlockPromise;
};

export default function SpeakerAIDashboard() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { open } = useWeb3Modal();
  const { airdrops, setAirdrop: storeAirdrop } = useAllocationState();

  const [copySuccess, setCopySuccess] = useState(false);
  const [pastedAddressInput, setPastedAddressInput] = useState('');
  const [pastedAddress, setPastedAddress] = useState<string | null>(null);
  const [addressInputError, setAddressInputError] = useState<string | null>(null);
  const [taskUnlocked, setTaskUnlocked] = useState(false);
  const [taskGateReady, setTaskGateReady] = useState(false);
  const [followTaskDone, setFollowTaskDone] = useState(false);
  const [repostTaskDone, setRepostTaskDone] = useState(false);
  const [followTaskStatus, setFollowTaskStatus] = useState<TaskStatus>('idle');
  const [repostTaskStatus, setRepostTaskStatus] = useState<TaskStatus>('idle');
  const followTaskTimersRef = useRef<number[]>([]);
  const repostTaskTimersRef = useRef<number[]>([]);
  const calculationRequestRef = useRef(0);
  const selectedAddress = pastedAddress ?? address ?? null;
  const isUsingPastedAddress = Boolean(pastedAddress);
  const airdrop = selectedAddress
    ? (airdrops[normalizeAddress(selectedAddress)] ?? getInitialAirdropState())
    : getInitialAirdropState();
  const shouldShowTaskGate =
    Boolean(selectedAddress) &&
    !taskUnlocked &&
    taskGateReady &&
    !airdrop.loading &&
    !airdrop.error;
  const visibleAirdrop =
    Boolean(selectedAddress) &&
    !taskUnlocked &&
    !taskGateReady &&
    !airdrop.error
      ? { ...airdrop, loading: true, error: null }
      : airdrop;

  const connectWallet = () => open({ view: 'Connect' });
  const disconnectWallet = () => disconnect();

  const copyToClipboard = () => {
    if (!selectedAddress) return;
    navigator.clipboard.writeText(selectedAddress);
    setCopySuccess(true);
    window.setTimeout(() => setCopySuccess(false), 2000);
  };

  const submitPastedAddress = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextAddress = pastedAddressInput.trim();

    if (!isAddress(nextAddress)) {
      setAddressInputError('Enter a valid BNB Smart Chain wallet address.');
      return;
    }

    setAddressInputError(null);
    setCopySuccess(false);
    setPastedAddress(nextAddress);
  };

  const clearPastedAddress = () => {
    setPastedAddress(null);
    setPastedAddressInput('');
    setAddressInputError(null);
    setCopySuccess(false);
  };

  const clearTaskTimers = (task: 'follow' | 'repost') => {
    const timerRef =
      task === 'follow' ? followTaskTimersRef : repostTaskTimersRef;

    timerRef.current.forEach((timerId) => window.clearTimeout(timerId));
    timerRef.current = [];
  };

  const openTaskLink = (url: string, task: 'follow' | 'repost') => {
    clearTaskTimers(task);

    if (task === 'follow') {
      setFollowTaskStatus('opening');
    } else {
      setRepostTaskStatus('opening');
    }

    window.open(url, '_blank', 'noopener,noreferrer');

    const timerRef =
      task === 'follow' ? followTaskTimersRef : repostTaskTimersRef;

    const openingTimeoutId = window.setTimeout(() => {
      if (task === 'follow') {
        setFollowTaskStatus('verifying');
      } else {
        setRepostTaskStatus('verifying');
      }
    }, 600);

    const completeTimeoutId = window.setTimeout(() => {
      if (task === 'follow') {
        setFollowTaskDone(true);
        setFollowTaskStatus('done');
      } else {
        setRepostTaskDone(true);
        setRepostTaskStatus('done');
      }
    }, 1800);

    timerRef.current = [openingTimeoutId, completeTimeoutId];
  };

  const unlockAllocation = () => {
    if (!followTaskDone || !repostTaskDone) {
      return;
    }

    setTaskUnlocked(true);
    persistTaskUnlockStatus(true);
  };

  const calculateAllocation = async (walletAddress: string) => {
    const requestId = calculationRequestRef.current + 1;
    calculationRequestRef.current = requestId;
    storeAirdrop(walletAddress, {
      ...airdrops[normalizeAddress(walletAddress)],
      ...getInitialAirdropState(),
      loading: true,
      error: null,
    });

    try {
      const snapshotBlockNumber = await getSnapshotBlockNumber();
      const [countBigInt] = await Promise.all([
        publicClient.getTransactionCount({
          address: walletAddress as `0x${string}`,
          blockNumber: snapshotBlockNumber,
        }),
        new Promise(resolve => window.setTimeout(resolve, 5000)),
      ]);

      const txCount = Number(countBigInt);
      const isEligible = txCount >= MIN_TX_ELIGIBLE;
      const normalizedScore = Math.min(txCount / MAX_TX_FOR_CAP, 1);
      const allocation = isEligible ? Math.floor(normalizedScore * MAX_USER_CAP) : 0;

      if (calculationRequestRef.current !== requestId) {
        return;
      }

      const nextAirdrop = {
        txCount,
        isEligible,
        allocation,
        loading: false,
        error: null,
      };

      persistAirdrop(walletAddress, nextAirdrop);
      storeAirdrop(walletAddress, nextAirdrop);
      void saveAllocationCheck(walletAddress, nextAirdrop);
      setTaskGateReady(true);
    } catch (error) {
      if (calculationRequestRef.current !== requestId) {
        return;
      }

      console.error('Allocation calculation error:', error);
      storeAirdrop(walletAddress, {
        ...airdrops[normalizeAddress(walletAddress)],
        ...getInitialAirdropState(),
        loading: false,
        error: 'Unable to calculate your snapshot allocation right now. Please try again.',
      });
    }
  };

  useEffect(() => {
    setTaskUnlocked(loadTaskUnlockStatus());
  }, []);

  useEffect(() => {
    if (!selectedAddress) {
      setFollowTaskDone(false);
      setRepostTaskDone(false);
      setTaskGateReady(false);
      setFollowTaskStatus('idle');
      setRepostTaskStatus('idle');
      return;
    }

    if (taskUnlocked) {
      setFollowTaskDone(true);
      setRepostTaskDone(true);
      setTaskGateReady(true);
      setFollowTaskStatus('done');
      setRepostTaskStatus('done');
      return;
    }

    setFollowTaskDone(false);
    setRepostTaskDone(false);
    setTaskGateReady(false);
    setFollowTaskStatus('idle');
    setRepostTaskStatus('idle');
  }, [selectedAddress, taskUnlocked]);

  useEffect(() => {
    return () => {
      clearTaskTimers('follow');
      clearTaskTimers('repost');
    };
  }, []);

  useEffect(() => {
    if (!selectedAddress) {
      return;
    }

    setCopySuccess(false);
    const cachedAirdrop = airdrops[normalizeAddress(selectedAddress)];

    if (cachedAirdrop) {
      if (!cachedAirdrop.loading) {
        setTaskGateReady(true);
      }
      return;
    }

    const persistedAirdrop = loadPersistedAirdrop(selectedAddress);

    if (persistedAirdrop) {
      storeAirdrop(selectedAddress, persistedAirdrop);
      void saveAllocationCheck(selectedAddress, persistedAirdrop);
      setTaskGateReady(true);
      return;
    }

    void calculateAllocation(selectedAddress);
  }, [selectedAddress, airdrops, taskUnlocked]);

  useAccountEffect({
    onDisconnect() {
      calculationRequestRef.current += 1;
      setCopySuccess(false);
    },
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-brand-red selection:text-white overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-red/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[0%] w-[40%] h-[40%] bg-brand-red/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] bg-brand-red/5 blur-[80px] rounded-full" />
      </div>

      <nav className="relative z-10 border-b border-white/5 bg-black/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-brand-red rounded-lg flex items-center justify-center red-glow">
              <Zap className="text-white w-6 h-6 fill-current" />
            </div>
            <span className="text-2xl font-display font-bold tracking-tighter">
              SPEAKER<span className="text-brand-red">AI</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              prefetch
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Home
            </Link>
            {isConnected ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Connected</span>
                  <span className="text-xs font-mono text-white/80">{shortenAddress(address!)}</span>
                </div>
                <button
                  onClick={disconnectWallet}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-medium transition-all"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="px-6 py-2.5 bg-brand-red hover:bg-brand-red-glow text-white rounded-full text-sm font-bold transition-all red-glow flex items-center gap-2"
              >
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <section className="text-center mb-16 lg:mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl lg:text-8xl font-display font-black tracking-tight mb-6 leading-[0.9]">
              YOUR ON-CHAIN <br />
              <span className="text-brand-red">ACTIVITY. </span> YOUR <br />
              REWARD.
            </h1>
            <p className="text-white/60 text-lg lg:text-xl max-w-2xl mx-auto mb-10">
              Check your allocation on SpeakerAI based on your onchain-activity on
              the BNB Smart Chain ecosystem.
            </p>

            {!selectedAddress && (
              <div className="max-w-2xl mx-auto">
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-5">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={connectWallet}
                    className="px-10 py-4 bg-brand-red hover:bg-brand-red-glow text-white rounded-full text-lg font-black transition-all red-glow-strong flex items-center gap-3 justify-center"
                  >
                    CONNECT WALLET
                    <ChevronRight className="w-6 h-6" />
                  </motion.button>
                </div>

                <div className="flex items-center gap-4 text-white/25 text-[10px] font-black uppercase tracking-[0.35em] mb-5">
                  <div className="h-px flex-1 bg-white/10" />
                  Or paste wallet address
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                <form onSubmit={submitPastedAddress} className="glass-card rounded-[30px] border border-white/10 p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={pastedAddressInput}
                      onChange={(event) => {
                        setPastedAddressInput(event.target.value);
                        if (addressInputError) {
                          setAddressInputError(null);
                        }
                      }}
                      placeholder="Paste wallet address 0x..."
                      className="flex-1 rounded-2xl border border-white/10 bg-black/35 px-4 py-4 text-sm sm:text-base text-white outline-none transition-colors placeholder:text-white/20 focus:border-brand-red/35"
                    />
                    <button
                      type="submit"
                      className="px-6 py-4 bg-white text-black hover:bg-brand-red hover:text-white rounded-2xl text-sm font-black transition-all"
                    >
                      CHECK
                    </button>
                  </div>
                  {addressInputError ? (
                    <p className="mt-3 text-sm text-red-300">{addressInputError}</p>
                  ) : (
                    <p className="mt-3 text-sm text-white/40">
                      No wallet connection needed. Paste any BNB Smart Chain address to preview its allocation.
                    </p>
                  )}
                </form>
              </div>
            )}
          </motion.div>
        </section>

        <AnimatePresence mode="wait">
          {selectedAddress ? (
            shouldShowTaskGate ? (
              <motion.div
                key="task-gate"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-4xl mx-auto"
              >
                <div className="glass-card p-8 sm:p-10 lg:p-12 rounded-[40px] border border-brand-red/20">
                  <div className="flex flex-col lg:flex-row gap-8 lg:items-start lg:justify-between">
                    <div className="max-w-2xl">
                      <p className="text-[10px] text-brand-red-glow uppercase tracking-[0.35em] font-black mb-4">
                        Required Task
                      </p>
                      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black tracking-tight mb-5 leading-[0.95]">
                        Follow and repost on X before revealing your allocation
                      </h2>
                      <p className="text-white/60 text-base sm:text-lg leading-relaxed">
                        Complete both steps below, then unlock your SpeakerAI allocation for{' '}
                        <span className="text-white font-mono">{shortenAddress(selectedAddress)}</span>.
                      </p>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 min-w-[220px]">
                      <span className="text-[10px] text-white/40 uppercase tracking-[0.35em] font-bold block mb-2">
                        Wallet
                      </span>
                      <span className="text-lg font-mono font-bold text-white">
                        {shortenAddress(selectedAddress)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-10">
                    <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
                      <div className="flex items-center justify-between gap-4 mb-5">
                        <div>
                          <p className="text-[10px] text-white/35 uppercase tracking-[0.35em] font-black mb-2">
                            Step 1
                          </p>
                          <h3 className="text-2xl font-display font-black tracking-tight">
                            Follow @{X_HANDLE}
                          </h3>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.25em] border ${
                          followTaskDone
                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                            : 'bg-white/5 text-white/40 border-white/10'
                        }`}>
                          {followTaskDone ? 'Done' : 'Pending'}
                        </div>
                      </div>
                      <p className="text-white/55 text-sm leading-relaxed mb-6">
                        Follow the official SpeakerAI X account to continue with the allocation reveal.
                      </p>
                      <button
                        type="button"
                        onClick={() => openTaskLink(X_FOLLOW_URL, 'follow')}
                        disabled={followTaskStatus === 'opening' || followTaskStatus === 'verifying' || followTaskStatus === 'done'}
                        className="w-full rounded-2xl bg-white text-black hover:bg-brand-red hover:text-white px-5 py-4 text-sm font-black uppercase tracking-[0.25em] transition-all flex items-center justify-center gap-3"
                      >
                        {followTaskStatus === 'opening' || followTaskStatus === 'verifying' ? (
                          <>
                            <LoaderCircle className="w-4 h-4 animate-spin" />
                            {followTaskStatus === 'verifying' ? 'Verifying now' : 'Opening X'}
                          </>
                        ) : followTaskStatus === 'done' ? (
                          'Task Completed'
                        ) : (
                          <>
                            Follow on X
                            <ExternalLink className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>

                    <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
                      <div className="flex items-center justify-between gap-4 mb-5">
                        <div>
                          <p className="text-[10px] text-white/35 uppercase tracking-[0.35em] font-black mb-2">
                            Step 2
                          </p>
                          <h3 className="text-2xl font-display font-black tracking-tight">
                            Repost the campaign
                          </h3>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.25em] border ${
                          repostTaskDone
                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                            : 'bg-white/5 text-white/40 border-white/10'
                        }`}>
                          {repostTaskDone ? 'Done' : 'Pending'}
                        </div>
                      </div>
                      <p className="text-white/55 text-sm leading-relaxed mb-6">
                        Repost the SpeakerAI campaign on X, then unlock your allocation below.
                      </p>
                      <button
                        type="button"
                        onClick={() => openTaskLink(X_REPOST_URL, 'repost')}
                        disabled={repostTaskStatus === 'opening' || repostTaskStatus === 'verifying' || repostTaskStatus === 'done'}
                        className="w-full rounded-2xl bg-white/5 border border-white/10 hover:bg-brand-red hover:border-brand-red hover:text-white px-5 py-4 text-sm font-black uppercase tracking-[0.25em] transition-all flex items-center justify-center gap-3"
                      >
                        {repostTaskStatus === 'opening' || repostTaskStatus === 'verifying' ? (
                          <>
                            <LoaderCircle className="w-4 h-4 animate-spin" />
                            {repostTaskStatus === 'verifying' ? 'Verifying now' : 'Opening X'}
                          </>
                        ) : repostTaskStatus === 'done' ? (
                          'Task Completed'
                        ) : (
                          <>
                            Repost on X
                            <ExternalLink className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="mt-8 rounded-[28px] border border-brand-red/20 bg-brand-red/10 p-6 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
                    <div>
                      <p className="text-[10px] text-brand-red-glow uppercase tracking-[0.35em] font-black mb-2">
                        Unlock Allocation
                      </p>
                      <p className="text-white/60 text-sm">
                        The allocation view appears after both tasks are marked complete.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={unlockAllocation}
                      disabled={!followTaskDone || !repostTaskDone}
                      className="rounded-2xl bg-brand-red hover:bg-brand-red-glow disabled:bg-brand-red/30 disabled:text-white/40 px-6 py-4 text-sm font-black uppercase tracking-[0.25em] transition-all"
                    >
                      Reveal Allocation
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              <div className="glass-card p-8 lg:p-10 rounded-3xl flex flex-col justify-between relative overflow-hidden lg:col-span-2 min-h-[460px]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,0,0,0.22),transparent_38%)]" />
                {!visibleAirdrop.loading && visibleAirdrop.isEligible && (
                  <div className="absolute top-0 right-0 w-48 h-48 bg-brand-red/20 blur-[90px] -mr-16 -mt-16" />
                )}

                <div className="relative">
                  <div className="flex items-center justify-between mb-8">
                    <div className="p-4 bg-brand-red/20 rounded-3xl red-glow">
                      <Wallet className="text-brand-red w-8 h-8" />
                    </div>
                    <div
                      className={`px-4 py-2 text-[10px] font-bold rounded-full border uppercase tracking-[0.25em] ${
                        !visibleAirdrop.loading && visibleAirdrop.isEligible
                          ? 'bg-brand-red/10 text-brand-red border-brand-red/20 red-glow'
                          : 'bg-white/5 text-white/40 border-white/10'
                      }`}
                    >
                      {visibleAirdrop.loading ? 'Processing' : visibleAirdrop.isEligible ? 'Eligible' : 'Not Eligible'}
                    </div>
                  </div>

                  {visibleAirdrop.loading ? (
                    <>
                      <p className="text-[10px] text-white/40 uppercase tracking-[0.35em] font-bold mb-4">Allocation</p>
                      <div className="w-20 h-20 rounded-full border border-brand-red/30 bg-brand-red/10 flex items-center justify-center mb-8 red-glow-strong">
                        <LoaderCircle className="w-10 h-10 text-brand-red animate-spin" />
                      </div>
                      <div className="text-4xl lg:text-6xl font-display font-black mb-4">Calculating Allocation</div>
                      <p className="text-base text-white/60 max-w-2xl">
                        Reviewing your BNB Smart Chain activity snapshot before March 1, 2026 and preparing your estimated SPKR allocation.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-[10px] text-white/40 uppercase tracking-[0.35em] font-bold mb-4">Total Allocation</p>
                      <div className="flex items-baseline gap-3 mb-4">
                        <span className={`text-7xl lg:text-8xl font-display font-black ${visibleAirdrop.isEligible ? 'text-white' : 'text-white/20'}`}>
                          {visibleAirdrop.allocation.toLocaleString()}
                        </span>
                        <span className="text-brand-red font-bold text-xl lg:text-2xl">SPKR</span>
                      </div>
                      {visibleAirdrop.isEligible ? (
                        <p className="text-base text-white/60 max-w-2xl">
                          Your wallet qualified in the snapshot and is eligible for this estimated SPKR allocation.
                        </p>
                      ) : (
                        <p className="text-base text-white/60 max-w-2xl">
                          Must have at least 10 transactions on the BNB Network before March 1, 2026.
                        </p>
                      )}
                    </>
                  )}
                </div>

                <div className="relative mt-10">
                  <button
                    disabled
                    className="w-full py-5 rounded-2xl font-black text-sm bg-brand-red/40 text-white/40 border border-brand-red/20 cursor-not-allowed"
                  >
                    CLAIM AIRDROP
                  </button>
                  <div className="absolute inset-0 rounded-2xl bg-black/55 backdrop-blur-[2px] flex items-center justify-center">
                    <span className="px-4 py-2 rounded-full bg-white/10 border border-white/10 text-[11px] font-black uppercase tracking-[0.3em] text-white/80">
                      soon...
                    </span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1 flex flex-col gap-6">
                <div className="glass-card p-8 rounded-3xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-8">
                    <div className="p-3 bg-brand-red/20 rounded-2xl">
                      <ShieldCheck className="text-brand-red w-6 h-6" />
                    </div>
                    <div
                      className={`px-3 py-1 text-[10px] font-bold rounded-full border uppercase tracking-wider ${
                        isUsingPastedAddress
                          ? 'bg-brand-red/10 text-brand-red border-brand-red/20'
                          : 'bg-green-500/10 text-green-500 border border-green-500/20'
                      }`}
                    >
                      {isUsingPastedAddress ? 'Wallet Pasted' : 'Wallet Connected'}
                    </div>
                    </div>
                    <h3 className="text-white/40 text-xs font-bold uppercase tracking-widest mb-2">Wallet Address</h3>
                    <div className="flex items-center gap-2 mb-6">
                      <span className="text-2xl font-mono font-bold">{shortenAddress(selectedAddress)}</span>
                      <button onClick={copyToClipboard} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                        {copySuccess ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4 text-white/40" />
                        )}
                      </button>
                    </div>
                    <form onSubmit={submitPastedAddress} className="space-y-3">
                      <label className="block">
                        <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold block mb-2">
                          Paste Another Wallet
                        </span>
                        <input
                          type="text"
                          value={pastedAddressInput}
                          onChange={(event) => {
                            setPastedAddressInput(event.target.value);
                            if (addressInputError) {
                              setAddressInputError(null);
                            }
                          }}
                          placeholder="0x..."
                          className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/20 focus:border-brand-red/35"
                        />
                      </label>
                      <div className="flex gap-3">
                        <button
                          type="submit"
                          className="flex-1 rounded-2xl bg-white text-black hover:bg-brand-red hover:text-white px-4 py-3 text-xs font-black uppercase tracking-[0.25em] transition-all"
                        >
                          Check
                        </button>
                        {isUsingPastedAddress ? (
                          <button
                            type="button"
                            onClick={clearPastedAddress}
                            className="rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-3 text-xs font-black uppercase tracking-[0.25em] transition-all"
                          >
                            Use Connected
                          </button>
                        ) : null}
                      </div>
                      {addressInputError ? (
                        <p className="text-xs text-red-300">{addressInputError}</p>
                      ) : null}
                    </form>

                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                      <span className="text-sm text-white/60">{isUsingPastedAddress ? 'Lookup Mode' : 'Network'}</span>
                      <span className="text-sm font-bold flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            isUsingPastedAddress
                              ? 'bg-brand-red'
                              : chainId === BSC_CHAIN_ID
                                ? 'bg-yellow-500 animate-pulse'
                                : 'bg-brand-red'
                          }`}
                        />
                        {isUsingPastedAddress
                          ? 'Manual Address Check'
                          : chainId === BSC_CHAIN_ID
                            ? 'BNB Smart Chain'
                            : 'Switch to BNB Smart Chain'}
                      </span>
                    </div>
                    <a
                      href={`https://bscscan.com/address/${selectedAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex justify-between items-center p-4 hover:bg-white/5 rounded-2xl border border-white/5 transition-colors group"
                    >
                      <span className="text-sm text-white/60">View on Explorer</span>
                      <ExternalLink className="w-4 h-4 text-white/40 group-hover:text-brand-red transition-colors" />
                    </a>
                  </div>
                </div>

                <div className="glass-card p-8 rounded-3xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-8">
                      <div className="p-3 bg-brand-red/20 rounded-2xl">
                        <Zap className="text-brand-red w-6 h-6 fill-current" />
                      </div>
                      <button
                        onClick={() => selectedAddress && calculateAllocation(selectedAddress)}
                        disabled={visibleAirdrop.loading}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <RefreshCcw className={`w-4 h-4 text-white/40 ${visibleAirdrop.loading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                    <h3 className="text-white/40 text-xs font-bold uppercase tracking-widest mb-2">Snapshot Activity</h3>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-6xl font-display font-black text-brand-red">{visibleAirdrop.loading ? '...' : visibleAirdrop.txCount}</span>
                      <span className="text-white/40 font-bold">TXS</span>
                    </div>
                    <p className="text-sm text-white/60">
                      Counted only from wallet activity before March 1, 2026.
                    </p>
                  </div>

                  <div className="mt-8 space-y-4">
                    <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                      <span className="text-sm text-white/60">Eligibility</span>
                      <span className="text-sm font-bold">{MIN_TX_ELIGIBLE} TX minimum</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                      <span className="text-white/40">Progress</span>
                      <span className="text-brand-red">
                        {Math.min(Math.round((visibleAirdrop.txCount / MIN_TX_ELIGIBLE) * 100), 100)}%
                      </span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((visibleAirdrop.txCount / MIN_TX_ELIGIBLE) * 100, 100)}%` }}
                        className="h-full bg-brand-red red-glow"
                      />
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold block mb-2">
                        Snapshot
                      </span>
                      <p className="text-sm text-white/60">{SNAPSHOT_LABEL}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            )
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-4xl mx-auto"
            >
              <div className="glass-card p-12 rounded-[40px] text-center border-dashed border-white/10">
                <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-8">
                  <Wallet className="text-white/20 w-10 h-10" />
                </div>
                <h2 className="text-3xl font-display font-bold mb-4">Connect or paste a wallet to see SPKR allocation</h2>
                <p className="text-white/40 mb-10 max-w-md mx-auto">
                  Connect your wallet for one-click lookup, or paste any BNB Smart Chain wallet address to check it manually.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

{/* Footer */}
        <footer className="max-w-7xl mx-auto px-6 lg:px-8 pt-20 border-t border-white/5">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-16 mb-20">
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-brand-red rounded-xl flex items-center justify-center red-glow">
                  <Zap className="text-white w-5 h-5 fill-current" />
                </div>
                <span className="text-2xl font-display font-black tracking-tighter uppercase">
                  SPEAKER<span className="text-brand-red">AI</span>
                </span>
              </div>
              <p className="text-white/40 text-lg leading-relaxed max-w-sm mb-8">
                A decentralized voice and audio protocol where AI intelligence meets on-chain transparency.
              </p>
              <div className="flex items-center gap-6">
                <a href={SOCIAL_LINKS.x} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-brand-red/20 hover:text-brand-red-glow transition-all">
                  <XLogo className="w-5 h-5" />
                </a>
                <a href={SOCIAL_LINKS.discord} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-brand-red/20 hover:text-brand-red-glow transition-all">
                  <DiscordLogo className="w-6 h-6" />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-10">
              <div className="flex flex-col gap-4">
                <span className="text-[10px] text-white/30 uppercase tracking-[0.4em] font-black mb-2">Protocol</span>
                <Link href="/documentation" className="text-sm font-bold text-white/60 hover:text-brand-red transition-colors">Documentation</Link>
                <Link href="/allocation" className="text-sm font-bold text-white/60 hover:text-brand-red transition-colors">Allocation</Link>
                <Link href="/whitelist" className="text-sm font-bold text-white/60 hover:text-brand-red transition-colors">Whitelist</Link>
                <a href={SOCIAL_LINKS.website} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-white/60 hover:text-brand-red transition-colors">Website</a>
              </div>
              <div className="flex flex-col gap-4">
                <span className="text-[10px] text-white/30 uppercase tracking-[0.4em] font-black mb-2">Legal</span>
                <Link href="/terms-of-service" className="text-sm font-bold text-white/60 hover:text-brand-red transition-colors">Terms of Service</Link>
                <Link href="/privacy-policy" className="text-sm font-bold text-white/60 hover:text-brand-red transition-colors">Privacy Policy</Link>
                <Link href="/cookie-policy" className="text-sm font-bold text-white/60 hover:text-brand-red transition-colors">Cookie Policy</Link>
              </div>
              <div className="flex flex-col gap-4">
                <span className="text-[10px] text-white/30 uppercase tracking-[0.4em] font-black mb-2">Supply</span>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-display font-black text-brand-red-glow leading-none">{AIRDROP_POOL.toLocaleString()}</span>
                    <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-black tracking-[0.28em] text-white/45 uppercase leading-none">
                      SPKR
                    </span>
                  </div>
                  <span className="text-[9px] text-white/30 font-black tracking-widest mt-1">AIRDROP POOL</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-display font-black text-white leading-none">{TOTAL_SUPPLY.toLocaleString()}</span>
                    <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-black tracking-[0.28em] text-white/45 uppercase leading-none">
                      SPKR
                    </span>
                  </div>
                  <span className="text-[9px] text-white/30 font-black tracking-widest mt-1">TOTAL SUPPLY</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pb-12 flex flex-col sm:flex-row justify-between items-center gap-6 opacity-30 border-t border-white/5 pt-12">
            <span className="text-[10px] font-black tracking-[0.4em] uppercase">SpeakerAI Protocol © 2026</span>
            <span className="text-[10px] font-black tracking-[0.4em] uppercase">Built for the future of voice</span>
          </div>
        </footer>
      </main>

      <AnimatePresence>
        {airdrop.error && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-4 bg-red-500/10 border border-red-500/20 backdrop-blur-xl rounded-2xl flex items-center gap-3"
          >
            <XCircle className="text-red-500 w-5 h-5" />
            <span className="text-sm font-medium text-red-200">{airdrop.error}</span>
            <button
              onClick={() => selectedAddress && storeAirdrop(selectedAddress, { ...airdrop, error: null })}
              className="ml-4 text-xs font-bold text-white/40 hover:text-white"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

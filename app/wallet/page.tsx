'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type FormEvent, type SVGProps } from 'react';
import { AppKit } from '@web3modal/base';
import { ConnectorController, OptionsController } from '@web3modal/core';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { formatUnits, isAddress, parseEther } from 'viem';
import {
  useAccount,
  useBalance,
  useConnectors,
  useDisconnect,
  useSendTransaction,
  useWaitForTransactionReceipt,
} from 'wagmi';
import {
  Activity,
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Copy,
  ExternalLink,
  Globe,
  LoaderCircle,
  LogOut,
  RefreshCcw,
  Send,
  Wallet,
  Zap,
} from 'lucide-react';

const TOTAL_SUPPLY = 100000000;
const AIRDROP_POOL = 15000000;
const ACCOUNT_STORAGE_KEY = 'speakerai:wallet:accounts:v2';
const ACTIVITY_STORAGE_KEY = 'speakerai:wallet:activity:v1';
const SPK_WALLET_CONNECTOR_IDS = ['cfhicbdppkipecleloppbdmakjocgnoi']
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

const SOCIAL_LINKS = {
  website: 'https://www.speakerai.org',
  x: 'https://x.com/SpeakerProtocol',
  discord: 'https://discord.gg/tyAE9eeE8c',
} as const;

type WalletTab = 'overview' | 'send' | 'receive' | 'activity' | 'accounts';

type StoredAccount = {
  address: string;
  label: string;
  lastSeen: string;
};

type StoredActivity = {
  hash: string;
  from: string;
  to: string;
  amount: string;
  symbol: string;
  status: 'submitted' | 'confirmed';
  createdAt: string;
};

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

const shortenAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

const matchesSpkWallet = (
  value: { id?: string; name?: string; rdns?: string | readonly string[] } | null | undefined
) => {
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

const hasSpkWalletConnector = (
  items:
    | Array<{
        id?: string;
        name?: string;
        rdns?: string | readonly string[];
        info?: { rdns?: string | readonly string[] };
      }>
    | readonly {
        id?: string;
        name?: string;
        rdns?: string | readonly string[];
        info?: { rdns?: string | readonly string[] };
      }[]
    | null
    | undefined
) =>
  Boolean(
    items?.some((item) =>
      matchesSpkWallet({
        id: item.id,
        name: item.name,
        rdns: item.rdns ?? item.info?.rdns,
      })
    )
  );

const formatTokenAmount = (value?: string, maximumFractionDigits = 6) => {
  if (!value) {
    return '--';
  }

  const parsedValue = Number(value);
  if (!Number.isFinite(parsedValue)) {
    return value;
  }

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(parsedValue);
};

const loadStoredAccounts = () => {
  if (typeof window === 'undefined') {
    return [] as StoredAccount[];
  }

  try {
    const rawValue = window.localStorage.getItem(ACCOUNT_STORAGE_KEY);
    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);
    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.filter(
      (item): item is StoredAccount =>
        Boolean(
          item &&
            typeof item.address === 'string' &&
            typeof item.label === 'string' &&
            typeof item.lastSeen === 'string'
        )
    );
  } catch {
    return [];
  }
};

const persistStoredAccounts = (accounts: StoredAccount[]) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(accounts));
};

const loadStoredActivity = () => {
  if (typeof window === 'undefined') {
    return [] as StoredActivity[];
  }

  try {
    const rawValue = window.localStorage.getItem(ACTIVITY_STORAGE_KEY);
    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);
    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.filter(
      (item): item is StoredActivity =>
        Boolean(
          item &&
            typeof item.hash === 'string' &&
            typeof item.from === 'string' &&
            typeof item.to === 'string' &&
            typeof item.amount === 'string' &&
            typeof item.symbol === 'string' &&
            typeof item.status === 'string' &&
            typeof item.createdAt === 'string'
        )
    );
  } catch {
    return [];
  }
};

const persistStoredActivity = (activity: StoredActivity[]) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(activity));
};

const getAccountLabel = (index: number) => (index === 0 ? 'Main Account' : `Account ${index + 1}`);

export default function WalletPage() {
  const { address, connector, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { open } = useWeb3Modal();
  const connectors = useConnectors();
  const { data: balance, refetch: refetchBalance } = useBalance({
    address,
    query: {
      enabled: Boolean(address),
    },
  });
  const { sendTransactionAsync, isPending: isSending } = useSendTransaction();

  const [activeTab, setActiveTab] = useState<WalletTab>('overview');
  const [copyState, setCopyState] = useState<'idle' | 'address' | 'account' | 'hash'>('idle');
  const [sendTo, setSendTo] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendStatus, setSendStatus] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [lastSentHash, setLastSentHash] = useState<`0x${string}` | undefined>(undefined);
  const [storedAccounts, setStoredAccounts] = useState<StoredAccount[]>([]);
  const [storedActivity, setStoredActivity] = useState<StoredActivity[]>([]);
  const [hasDetectedSpkWallet, setHasDetectedSpkWallet] = useState(false);
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

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: lastSentHash,
  });

  const spkConnector = connectors.find((item) =>
    matchesSpkWallet({
      id: item.id,
      name: item.name,
      rdns: item.rdns,
    })
  );
  const spkWalletAvailable = Boolean(spkConnector) || hasDetectedSpkWallet;

  const isConnectedWithSpkWallet = matchesSpkWallet({
    id: connector?.id,
    name: connector?.name,
    rdns: connector?.rdns,
  });

  const shouldShowWalletDashboard = Boolean(isConnected && address && isConnectedWithSpkWallet);
  const connectedAddress = address ?? '';
  const balanceFormatted = balance ? formatUnits(balance.value, balance.decimals) : undefined;
  const addressExplorerUrl = address ? `https://bscscan.com/address/${address}` : '';
  const latestActivity = storedActivity[0] ?? null;
  const displayedAccounts = useMemo(() => {
    if (!address) {
      return storedAccounts;
    }

    const currentAddressLower = address.toLowerCase();
    const existingCurrentAccount = storedAccounts.find(
      (item) => item.address.toLowerCase() === currentAddressLower
    );

    const currentAccount: StoredAccount = existingCurrentAccount ?? {
      address,
      label: getAccountLabel(0),
      lastSeen: new Date().toISOString(),
    };

    return [
      currentAccount,
      ...storedAccounts.filter((item) => item.address.toLowerCase() !== currentAddressLower),
    ].slice(0, 6);
  }, [address, storedAccounts]);

  useEffect(() => {
    setStoredAccounts(loadStoredAccounts());
    setStoredActivity(loadStoredActivity());
  }, []);

  useEffect(() => {
    const syncDetectedSpkWallet = () => {
      setHasDetectedSpkWallet(
        hasSpkWalletConnector(connectors) ||
          hasSpkWalletConnector(ConnectorController.state.connectors) ||
          hasSpkWalletConnector(ConnectorController.state.unMergedConnectors)
      );
    };

    syncDetectedSpkWallet();

    const unsubscribeConnectors = ConnectorController.subscribeKey('connectors', () => {
      syncDetectedSpkWallet();
    });

    return () => {
      unsubscribeConnectors();
    };
  }, [connectors]);

  useEffect(() => {
    if (!address) {
      return;
    }

    setStoredAccounts((currentAccounts) => {
      const currentAddressLower = address.toLowerCase();
      const existingIndex = currentAccounts.findIndex(
        (item) => item.address.toLowerCase() === currentAddressLower
      );

      const currentAccount =
        existingIndex >= 0
          ? {
              ...currentAccounts[existingIndex],
              lastSeen: new Date().toISOString(),
            }
          : {
              address,
              label: getAccountLabel(0),
              lastSeen: new Date().toISOString(),
            };

      const nextAccounts = [
        currentAccount,
        ...currentAccounts.filter((item) => item.address.toLowerCase() !== currentAddressLower),
      ]
        .map((item, index) => ({
          ...item,
          label: item.label?.trim() || getAccountLabel(index),
        }))
        .slice(0, 6);

      persistStoredAccounts(nextAccounts);
      return nextAccounts;
    });
  }, [address]);

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
        (item) =>
          !matchesSpkWallet({
            id: item.id,
            name: item.name,
            rdns: item.info?.rdns,
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

      const spkUnmergedConnectors = ConnectorController.state.unMergedConnectors.filter((item) =>
        matchesSpkWallet({
          id: item.id,
          name: item.name,
          rdns: item.info?.rdns,
        })
      );

      ConnectorController.state.unMergedConnectors = spkUnmergedConnectors;
      ConnectorController.state.connectors =
        ConnectorController.mergeMultiChainConnectors(spkUnmergedConnectors);
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

  useEffect(() => {
    if (!isConfirmed || !lastSentHash) {
      return;
    }

    setSendStatus('Transfer confirmed.');
    setStoredActivity((currentActivity) => {
      const nextActivity: StoredActivity[] = currentActivity.map((item) =>
        item.hash === lastSentHash ? { ...item, status: 'confirmed' } : item
      );
      persistStoredActivity(nextActivity);
      return nextActivity;
    });
    void refetchBalance();
  }, [isConfirmed, lastSentHash, refetchBalance]);

  const copyText = async (value: string, mode: 'address' | 'account' | 'hash') => {
    await navigator.clipboard.writeText(value);
    setCopyState(mode);
    window.setTimeout(() => setCopyState('idle'), 1600);
  };

  const connectWallet = () => {
    setSendStatus(null);
    setSendError(null);
    void open({ view: 'Connect' });
  };

  const handleSend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSendStatus(null);
    setSendError(null);

    if (!address || !isConnected || !isConnectedWithSpkWallet) {
      setSendError('Connect your SPK wallet first.');
      return;
    }

    const trimmedRecipient = sendTo.trim();
    const trimmedAmount = sendAmount.trim();

    if (!isAddress(trimmedRecipient)) {
      setSendError('Enter a valid wallet address.');
      return;
    }

    if (!trimmedAmount || Number(trimmedAmount) <= 0) {
      setSendError('Enter an amount greater than zero.');
      return;
    }

    try {
      setSendStatus('Confirm in wallet...');
      const hash = await sendTransactionAsync({
        to: trimmedRecipient as `0x${string}`,
        value: parseEther(trimmedAmount),
      });

      setLastSentHash(hash);
      setSendStatus('Transaction submitted.');
      setActiveTab('activity');

      setStoredActivity((currentActivity) => {
        const nextActivity: StoredActivity[] = [
          {
            hash,
            from: address,
            to: trimmedRecipient,
            amount: trimmedAmount,
            symbol: balance?.symbol ?? 'BNB',
            status: 'submitted' as const,
            createdAt: new Date().toISOString(),
          },
          ...currentActivity.filter((item) => item.hash !== hash),
        ].slice(0, 12);

        persistStoredActivity(nextActivity);
        return nextActivity;
      });
    } catch (error) {
      const nextError =
        error instanceof Error ? error.message : 'Transaction failed. Please try again.';
      setSendStatus(null);
      setSendError(nextError);
    }
  };

  const walletTabs: Array<{ id: WalletTab; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'send', label: 'Send' },
    { id: 'receive', label: 'Receive' },
    { id: 'activity', label: 'Activity' },
    { id: 'accounts', label: 'Accounts' },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0a0a0a] text-white selection:bg-brand-red selection:text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute left-[-10%] top-[-10%] h-[40%] w-[40%] rounded-full bg-brand-red/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-brand-red/10 blur-[120px]" />
        <div className="absolute right-[10%] top-[20%] h-[20%] w-[20%] rounded-full bg-brand-red/5 blur-[80px]" />
      </div>

      <nav className="relative z-10 border-b border-white/5 bg-black/40 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-red red-glow">
              <Zap className="h-6 w-6 fill-current text-white" />
            </div>
            <span className="font-display text-2xl font-bold tracking-tighter">
              SPEAKER<span className="text-brand-red">AI</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              prefetch
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
            {shouldShowWalletDashboard ? (
              <button
                type="button"
                onClick={() => disconnect()}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all hover:bg-white/10"
              >
                <LogOut className="h-4 w-4" />
                Disconnect
              </button>
            ) : null}
          </div>
        </div>
      </nav>

      {!shouldShowWalletDashboard ? (
        <main className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
          <div className="w-full max-w-3xl">
            <div className="glass-card rounded-[40px] border border-white/10 p-8 text-center sm:p-10 lg:p-14">
              <p className="mb-4 text-[10px] font-black uppercase tracking-[0.4em] text-brand-red-glow">
                Wallet
              </p>
              <h1 className="mx-auto max-w-[11ch] font-display text-5xl font-black leading-[0.9] tracking-tight sm:text-6xl lg:text-7xl">
                Connect SPK Wallet
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-white/65 sm:text-lg">
                Use SPK Wallet to access your balance, transfers, and wallet activity.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <button
                  type="button"
                  onClick={connectWallet}
                  disabled={!spkWalletAvailable}
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-brand-red px-8 py-4 text-sm font-black uppercase tracking-[0.24em] text-white transition-all hover:bg-brand-red-glow disabled:cursor-not-allowed disabled:opacity-70 red-glow"
                >
                  <Wallet className="h-4 w-4" />
                  Connect SPK Wallet
                </button>
              </div>

              {!spkWalletAvailable ? (
                <p className="mx-auto mt-5 max-w-xl rounded-2xl border border-[#ff7c7c]/20 bg-[#4a0a0a]/40 px-4 py-3 text-sm text-[#ffb0b0]">
                  SPK Wallet is not detected in this browser. Install or enable it, then refresh the page.
                </p>
              ) : null}

              {isConnected && !isConnectedWithSpkWallet ? (
                <div className="mx-auto mt-5 max-w-xl rounded-2xl border border-[#ff7c7c]/20 bg-[#4a0a0a]/40 p-4 text-sm text-[#ffb0b0]">
                  <p>This page only works with SPK Wallet. Disconnect the current wallet and reconnect with SPK Wallet.</p>
                  <button
                    type="button"
                    onClick={() => disconnect()}
                    className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-white transition-all hover:bg-white/10"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Disconnect Current Wallet
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </main>
      ) : (
        <main className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
          <section className="mb-10 grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="glass-card rounded-[36px] border border-white/10 p-8 lg:p-12">
              <p className="mb-4 text-[10px] font-black uppercase tracking-[0.4em] text-brand-red-glow">
                Wallet
              </p>
              <h1 className="max-w-[10ch] font-display text-5xl font-black leading-[0.9] tracking-tight sm:text-6xl lg:text-7xl">
                Your SPK wallet.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/65 sm:text-lg">
                Manage your balance, transfers, and account.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {walletTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`rounded-full px-5 py-3 text-xs font-black uppercase tracking-[0.24em] transition-all ${
                      activeTab === tab.id
                        ? 'bg-brand-red text-white red-glow'
                        : 'border border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-[36px] border border-white/10 p-8 lg:p-10">
              <div className="mb-8 flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-brand-red/20 red-glow">
                  <Wallet className="h-7 w-7 text-brand-red" />
                </div>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-emerald-300">
                  SPK Connected
                </span>
              </div>

              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/35">
                Whole Balance
              </p>
              <div className="mt-4 flex items-end gap-3">
                <span className="font-display text-5xl font-black tracking-tight sm:text-6xl">
                  {formatTokenAmount(balanceFormatted)}
                </span>
                <span className="pb-2 text-lg font-black text-brand-red">
                  {balance?.symbol ?? 'BNB'}
                </span>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/35">
                    Active Account
                  </p>
                  <p className="mt-3 text-lg font-black text-white">{shortenAddress(connectedAddress)}</p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/35">
                    Connector
                  </p>
                  <p className="mt-3 text-lg font-black text-white">{connector?.name ?? 'SPK Wallet'}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              {(activeTab === 'overview' || activeTab === 'receive') && (
                <div className="glass-card rounded-[32px] border border-white/10 p-7 sm:p-8">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/35">
                        Receive
                      </p>
                      <h2 className="mt-2 font-display text-3xl font-black tracking-tight">Wallet Address</h2>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-red/20">
                      <ArrowDownLeft className="h-6 w-6 text-brand-red" />
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-brand-red/20 bg-brand-red/10 p-5">
                    <p className="break-all font-mono text-sm leading-7 text-white/85">{connectedAddress}</p>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => void copyText(connectedAddress, 'address')}
                      className="inline-flex items-center justify-center gap-3 rounded-2xl bg-white px-5 py-4 text-sm font-black uppercase tracking-[0.24em] text-black transition-all hover:bg-brand-red hover:text-white"
                    >
                      <Copy className="h-4 w-4" />
                      {copyState === 'address' ? 'Copied' : 'Copy Address'}
                    </button>
                    <a
                      href={addressExplorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-black uppercase tracking-[0.24em] text-white transition-all hover:bg-white/10"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open Explorer
                    </a>
                  </div>

                  <p className="mt-4 text-sm leading-7 text-white/55">
                    Use this address to receive funds.
                  </p>
                </div>
              )}

              {(activeTab === 'overview' || activeTab === 'activity') && (
                <div className="glass-card rounded-[32px] border border-white/10 p-7 sm:p-8">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/35">
                        Activity
                      </p>
                      <h2 className="mt-2 font-display text-3xl font-black tracking-tight">Recent Activity</h2>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-red/20">
                      <Activity className="h-6 w-6 text-brand-red" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {storedActivity.length ? (
                      storedActivity.map((item) => (
                        <div
                          key={item.hash}
                          className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/35">
                                {item.status === 'confirmed' ? 'Confirmed Transfer' : 'Pending Transfer'}
                              </p>
                              <p className="mt-2 text-lg font-black text-white">
                                {formatTokenAmount(item.amount)} {item.symbol}
                              </p>
                              <p className="mt-2 text-sm text-white/55">
                                To {shortenAddress(item.to)}
                              </p>
                            </div>
                            <span
                              className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] ${
                                item.status === 'confirmed'
                                  ? 'border border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
                                  : 'border border-amber-300/20 bg-amber-300/10 text-amber-200'
                              }`}
                            >
                              {item.status}
                            </span>
                          </div>
                          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                            <button
                              type="button"
                              onClick={() => void copyText(item.hash, 'hash')}
                              className="inline-flex items-center gap-2 text-sm font-bold text-white/70 transition-colors hover:text-white"
                            >
                              <Copy className="h-4 w-4" />
                              {copyState === 'hash' ? 'Hash Copied' : 'Copy Hash'}
                            </button>
                            <a
                              href={`https://bscscan.com/tx/${item.hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-sm font-bold text-brand-red-glow transition-colors hover:text-white"
                            >
                              <ExternalLink className="h-4 w-4" />
                              View Transaction
                            </a>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-[22px] border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-sm text-white/45">
                        No recent activity.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {(activeTab === 'overview' || activeTab === 'send') && (
                <div className="glass-card rounded-[32px] border border-white/10 p-7 sm:p-8">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/35">
                        Send
                      </p>
                      <h2 className="mt-2 font-display text-3xl font-black tracking-tight">Transfer Funds</h2>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-red/20">
                      <ArrowUpRight className="h-6 w-6 text-brand-red" />
                    </div>
                  </div>

                  <form onSubmit={handleSend} className="space-y-4">
                    <label className="block">
                      <span className="text-[10px] font-black uppercase tracking-[0.28em] text-white/35">
                        Recipient Address
                      </span>
                      <input
                        type="text"
                        value={sendTo}
                        onChange={(event) => setSendTo(event.target.value)}
                        placeholder="0x..."
                        className="mt-3 w-full rounded-[22px] border border-white/10 bg-black/35 px-4 py-4 text-sm text-white outline-none transition-all placeholder:text-white/20 focus:border-brand-red/40"
                      />
                    </label>

                    <label className="block">
                      <span className="text-[10px] font-black uppercase tracking-[0.28em] text-white/35">
                        Amount
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.000001"
                        value={sendAmount}
                        onChange={(event) => setSendAmount(event.target.value)}
                        placeholder="0.0"
                        className="mt-3 w-full rounded-[22px] border border-white/10 bg-black/35 px-4 py-4 text-sm text-white outline-none transition-all placeholder:text-white/20 focus:border-brand-red/40"
                      />
                    </label>

                    <button
                      type="submit"
                      disabled={isSending || isConfirming}
                      className="inline-flex w-full items-center justify-center gap-3 rounded-[22px] bg-brand-red px-5 py-4 text-sm font-black uppercase tracking-[0.28em] text-white transition-all hover:bg-brand-red-glow disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {isSending || isConfirming ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      {isSending ? 'Confirm In Wallet' : isConfirming ? 'Confirming' : 'Send Now'}
                    </button>
                  </form>

                  {sendStatus ? (
                    <p className="mt-4 rounded-2xl border border-emerald-400/15 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
                      {sendStatus}
                    </p>
                  ) : null}

                  {sendError ? (
                    <p className="mt-4 rounded-2xl border border-[#ff7c7c]/20 bg-[#4a0a0a]/40 px-4 py-3 text-sm text-[#ffb0b0]">
                      {sendError}
                    </p>
                  ) : null}
                </div>
              )}

              {(activeTab === 'overview' || activeTab === 'accounts') && (
                <div className="glass-card rounded-[32px] border border-white/10 p-7 sm:p-8">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/35">
                        Accounts
                      </p>
                      <h2 className="mt-2 font-display text-3xl font-black tracking-tight">Recent Accounts</h2>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-red/20">
                      <Wallet className="h-6 w-6 text-brand-red" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {displayedAccounts.map((item) => (
                      <div
                        key={item.address}
                        className="flex items-center justify-between gap-4 rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-4"
                      >
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/35">
                            {item.label}
                          </p>
                          <p className="mt-2 font-mono text-sm text-white/85">{item.address}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void copyText(item.address, 'account')}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-all hover:bg-white/10"
                        >
                          {copyState === 'account' ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(activeTab === 'overview' || activeTab === 'send') && (
                <div className="glass-card rounded-[32px] border border-white/10 p-7 sm:p-8">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/35">
                        Status
                      </p>
                      <h2 className="mt-2 font-display text-3xl font-black tracking-tight">Wallet Info</h2>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-red/20">
                      <Globe className="h-6 w-6 text-brand-red" />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-5">
                      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/35">
                        Network
                      </p>
                      <p className="mt-2 text-base font-black text-white">BNB Smart Chain</p>
                    </div>
                    <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-5">
                      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/35">
                        Wallet
                      </p>
                      <p className="mt-2 text-base font-black text-white">SPK Wallet Only</p>
                    </div>
                    <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-5">
                      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/35">
                        Asset View
                      </p>
                      <p className="mt-2 text-base font-black text-white">
                        {formatTokenAmount(balanceFormatted, 4)} {balance?.symbol ?? 'BNB'}
                      </p>
                    </div>
                    <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-5">
                      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/35">
                        Latest Status
                      </p>
                      <p className="mt-2 text-base font-black text-white">
                        {latestActivity
                          ? latestActivity.status === 'confirmed'
                            ? 'Confirmed'
                            : 'Pending'
                          : 'Ready'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void refetchBalance()}
                    className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-white transition-all hover:bg-white/10"
                  >
                    <RefreshCcw className="h-4 w-4" />
                    Refresh Balance
                  </button>
                </div>
              )}
            </div>
          </section>

          <footer className="max-w-7xl px-6 pt-20 lg:px-8">
            <div className="mb-20 grid grid-cols-1 gap-16 lg:grid-cols-[1fr_2fr]">
              <div>
                <div className="mb-8 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-red red-glow">
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
                  <a
                    href={SOCIAL_LINKS.x}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 transition-all hover:bg-brand-red/20 hover:text-brand-red-glow"
                  >
                    <XLogo className="h-5 w-5" />
                  </a>
                  <a
                    href={SOCIAL_LINKS.discord}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 transition-all hover:bg-brand-red/20 hover:text-brand-red-glow"
                  >
                    <DiscordLogo className="h-6 w-6" />
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
                <div className="flex flex-col gap-4">
                  <span className="mb-2 text-[10px] font-black uppercase tracking-[0.4em] text-white/30">
                    Protocol
                  </span>
                  <Link href="/documentation" className="text-sm font-bold text-white/60 transition-colors hover:text-brand-red">
                    Documentation
                  </Link>
                  <Link href="/allocation" className="text-sm font-bold text-white/60 transition-colors hover:text-brand-red">
                    Allocation
                  </Link>
                  <Link href="/wallet" className="text-sm font-bold text-white/60 transition-colors hover:text-brand-red">
                    Wallet
                  </Link>
                  <Link href="/testnet" className="text-sm font-bold text-white/60 transition-colors hover:text-brand-red">
                    Testnet
                  </Link>
                  <a
                    href={SOCIAL_LINKS.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-bold text-white/60 transition-colors hover:text-brand-red"
                  >
                    Website
                  </a>
                </div>
                <div className="flex flex-col gap-4">
                  <span className="mb-2 text-[10px] font-black uppercase tracking-[0.4em] text-white/30">
                    Wallet
                  </span>
                  <span className="text-sm font-bold text-white/60">Connect Gate</span>
                  <span className="text-sm font-bold text-white/60">Send</span>
                  <span className="text-sm font-bold text-white/60">Receive</span>
                  <span className="text-sm font-bold text-white/60">Activity</span>
                </div>
                <div className="flex flex-col gap-4">
                  <span className="mb-2 text-[10px] font-black uppercase tracking-[0.4em] text-white/30">
                    Legal
                  </span>
                  <Link href="/terms-of-service" className="text-sm font-bold text-white/60 transition-colors hover:text-brand-red">
                    Terms of Service
                  </Link>
                  <Link href="/privacy-policy" className="text-sm font-bold text-white/60 transition-colors hover:text-brand-red">
                    Privacy Policy
                  </Link>
                  <Link href="/cookie-policy" className="text-sm font-bold text-white/60 transition-colors hover:text-brand-red">
                    Cookie Policy
                  </Link>
                </div>
                <div className="flex flex-col gap-4">
                  <span className="mb-2 text-[10px] font-black uppercase tracking-[0.4em] text-white/30">
                    Supply
                  </span>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-display font-black leading-none text-brand-red-glow">
                        {AIRDROP_POOL.toLocaleString()}
                      </span>
                      <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-black uppercase leading-none tracking-[0.28em] text-white/45">
                        SPKR
                      </span>
                    </div>
                    <span className="mt-1 text-[9px] font-black tracking-widest text-white/30">AIRDROP POOL</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-display font-black leading-none text-white">
                        {TOTAL_SUPPLY.toLocaleString()}
                      </span>
                      <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-black uppercase leading-none tracking-[0.28em] text-white/45">
                        SPKR
                      </span>
                    </div>
                    <span className="mt-1 text-[9px] font-black tracking-widest text-white/30">TOTAL SUPPLY</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-between gap-6 border-t border-white/5 pb-12 pt-12 opacity-30 sm:flex-row">
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">SpeakerAI Protocol © 2026</span>
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">Built for the future of voice</span>
            </div>
          </footer>
        </main>
      )}
    </div>
  );
}

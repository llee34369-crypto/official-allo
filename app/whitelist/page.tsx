'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useAccount, useDisconnect, useSignMessage } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  LoaderCircle,
  Wallet,
  Zap,
} from 'lucide-react';

import { getWhitelistConfirmationMessage } from '@/lib/whitelist-message';

type SubmissionState = 'idle' | 'loading' | 'success' | 'error';

const TESTNET_AIRDROP_POOL = 10000000;
const WHITELIST_SUBMITTED_WALLET_KEY = 'speakerai-testnet-whitelist-wallet';

const SOCIAL_LINKS = {
  website: 'https://www.speakerai.org',
  x: 'https://x.com/SpeakerAI_BNB',
  discord: 'https://discord.gg/tyAE9eeE8c',
} as const;

const shortenAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

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

function getFriendlyErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return 'Unable to submit whitelist entry.';
  }

  const normalizedMessage = error.message.toLowerCase();

  if (
    normalizedMessage.includes('user rejected') ||
    normalizedMessage.includes('user denied') ||
    normalizedMessage.includes('rejected the request')
  ) {
    return 'User rejected.';
  }

  return error.message;
}

export default function WhitelistPage() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { open } = useWeb3Modal();
  const { signMessageAsync } = useSignMessage();

  const [submissionState, setSubmissionState] = useState<SubmissionState>('idle');
  const [message, setMessage] = useState('');
  const [submittedWallet, setSubmittedWallet] = useState<string | null>(null);

  const connectWallet = () => open({ view: 'Connect' });
  const disconnectWallet = () => disconnect();
  const hasSubmittedOnThisBrowser = Boolean(submittedWallet);

  useEffect(() => {
    const storedWallet = window.localStorage.getItem(WHITELIST_SUBMITTED_WALLET_KEY);

    if (!storedWallet) {
      return;
    }

    setSubmittedWallet(storedWallet);
    setSubmissionState('success');
    setMessage(`This wallet address is already submitted ${storedWallet}.`);
  }, []);

  useEffect(() => {
    if (!message || submissionState === 'loading') {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setMessage('');
    }, 4000);

    return () => window.clearTimeout(timeoutId);
  }, [message, submissionState]);

  const submitWhitelist = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (submittedWallet) {
      setSubmissionState('success');
      setMessage(`This wallet address is already submitted ${submittedWallet}.`);
      return;
    }

    if (!isConnected || !address) {
      setSubmissionState('error');
      setMessage('Connect your wallet before submitting to the whitelist.');
      return;
    }

    setSubmissionState('loading');
    setMessage('');

    try {
      const signature = await signMessageAsync({
        message: getWhitelistConfirmationMessage(address),
      });

      const response = await fetch('/api/whitelist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: address,
          signature,
        }),
      });

      const result = (await response.json()) as {
        error?: string;
        status?: 'registered' | 'already_registered';
      };

      if (!response.ok) {
        throw new Error(result.error || 'Unable to submit whitelist entry.');
      }

      const confirmedWallet = address.toLowerCase();

      window.localStorage.setItem(
        WHITELIST_SUBMITTED_WALLET_KEY,
        confirmedWallet
      );
      setSubmittedWallet(confirmedWallet);
      setSubmissionState('success');
      setMessage(
        result.status === 'already_registered'
          ? 'That wallet is already on the whitelist.'
          : 'Wallet added to the testnet whitelist.'
      );
    } catch (error) {
      setSubmissionState('error');
      setMessage(getFriendlyErrorMessage(error));
    }
  };

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

          <Link
            href="/"
            prefetch
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Home
          </Link>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <section className="text-center mb-12 lg:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-[11px] text-brand-red-glow uppercase tracking-[0.45em] font-black mb-5">
              Testnet Whitelist
            </p>
            <h1 className="text-5xl lg:text-8xl font-display font-black tracking-tight mb-6 leading-[0.9]">
              JOIN THE <span className="text-brand-red">SPEAKERAI</span> TESTNET WHITELIST
            </h1>
            <p className="text-white/60 text-lg lg:text-xl max-w-2xl mx-auto">
              Submit your wallet to get whitelisted in the coming SpeakerAI Testnet.
            </p>
          </motion.div>
        </section>

        <div className="max-w-3xl mx-auto">
          <section className="glass-card rounded-[40px] p-8 lg:p-10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-brand-red/15 rounded-3xl flex items-center justify-center red-glow">
                  <Wallet className="w-8 h-8 text-brand-red-glow" />
                </div>
                <div>
                  <p className="text-[10px] text-white/35 uppercase tracking-[0.35em] font-black mb-2">
                    Whitelist Form
                  </p>
                  <h2 className="text-3xl font-display font-black tracking-tight">
                    Connect your wallet
                  </h2>
                </div>
              </div>
              {isConnected ? (
                <span className="px-3 py-1 bg-green-500/10 text-green-400 text-[10px] font-bold rounded-full border border-green-500/20 uppercase tracking-wider">
                  Wallet Connected
                </span>
              ) : null}
            </div>

            <form onSubmit={submitWhitelist} className="space-y-5">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <span className="text-[10px] text-white/40 uppercase tracking-[0.35em] font-black block">
                    Connected Wallet
                  </span>
                  {isConnected && address ? (
                    <button
                      type="button"
                      onClick={disconnectWallet}
                      className="rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] transition-all"
                    >
                      Disconnect
                    </button>
                  ) : null}

                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-lg sm:text-2xl font-mono font-bold text-white">
                      {isConnected && address ? shortenAddress(address) : 'No wallet connected'}
                    </div>
                    {isConnected && address ? (
                      <div className="mt-2 text-xs text-white/40 font-mono break-all">
                        {address}
                      </div>
                    ) : null}
                  </div>
                  {isConnected ? (
                    <span className="shrink-0 px-3 py-1 bg-green-500/10 text-green-400 text-[10px] font-bold rounded-full border border-green-500/20 uppercase tracking-wider">
                      Connected
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {isConnected ? (
                  <button
                    type="submit"
                    disabled={
                      submissionState === 'loading' ||
                      hasSubmittedOnThisBrowser ||
                      !address
                    }
                    className="px-6 py-4 bg-brand-red hover:bg-brand-red-glow text-white rounded-2xl text-sm font-black uppercase tracking-[0.28em] transition-all disabled:opacity-60"
                  >
                    {submissionState === 'loading' ? (
                      <span className="flex items-center justify-center gap-2">
                        <LoaderCircle className="w-4 h-4 animate-spin" />
                        Confirming
                      </span>
                    ) : hasSubmittedOnThisBrowser ? (
                      'Whitelisted'
                    ) : (
                      'Confirm Wallet & Join'
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={connectWallet}
                    className="px-6 py-4 bg-white text-black hover:bg-brand-red hover:text-white rounded-2xl text-sm font-black uppercase tracking-[0.28em] transition-all flex items-center justify-center gap-2"
                  >
                    Connect Wallet
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              <p className="text-sm text-white/45">
                You will be asked to sign a wallet message to confirm this address is yours before it gets whitelisted.
              </p>
            </form>

            {message ? (
              <div
                className={`mt-6 rounded-2xl border px-5 py-4 text-sm ${
                  submissionState === 'success'
                    ? 'border-green-500/20 bg-green-500/10 text-green-200'
                    : 'border-red-500/20 bg-red-500/10 text-red-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>{message}</span>
                </div>
              </div>
            ) : null}
          </section>
        </div>

        <footer className="max-w-7xl mx-auto px-6 lg:px-8 pt-20 border-t border-white/5 mt-20">
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

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-10">
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
              <div className="flex flex-col gap-3">
                <span className="text-[10px] text-white/30 uppercase tracking-[0.4em] font-black mb-2">Pool</span>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-display font-black text-brand-red-glow tracking-tight">
                    {TESTNET_AIRDROP_POOL.toLocaleString()}
                  </span>
                  <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-black tracking-[0.28em] text-white/45 uppercase leading-none">
                    SPKR
                  </span>
                </div>
                <span className="text-[10px] text-white/35 font-black tracking-[0.35em] uppercase">
                  Testnet Airdrop Pool
                </span>
                <span className="text-xs text-white/35">
                  From the Liquidity &amp; Ecosystem pool
                </span>
              </div>
            </div>
          </div>

          <div className="pb-12 flex flex-col sm:flex-row justify-between items-center gap-6 opacity-30 border-t border-white/5 pt-12">
            <span className="text-[10px] font-black tracking-[0.4em] uppercase">SpeakerAI Protocol © 2026</span>
            <span className="text-[10px] font-black tracking-[0.4em] uppercase">Built for the future of voice</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

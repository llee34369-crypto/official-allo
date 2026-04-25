'use client';

import Link from 'next/link';
import { useEffect, useRef, type SVGProps } from 'react';
import { motion } from 'motion/react';
import { AppKit } from '@web3modal/base';
import { ConnectorController, OptionsController } from '@web3modal/core';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useAccount, useConnections, useConnectors, useDisconnect } from 'wagmi';
import { ArrowLeft, ChevronRight, Wallet, Zap } from 'lucide-react';

const TESTNET_AIRDROP_POOL = 10000000;

const SOCIAL_LINKS = {
  website: 'https://www.speakerai.org',
  x: 'https://x.com/SpeakerProtocol',
  discord: 'https://discord.gg/tyAE9eeE8c',
} as const;

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
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(170,24,24,0.38),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(120,12,12,0.32),_transparent_32%),linear-gradient(180deg,_rgba(24,4,4,0.96),_rgba(6,2,2,1))]" />
        <div className="absolute top-[12%] left-[8%] h-72 w-72 rounded-full bg-[#a31414]/20 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[6%] h-80 w-80 rounded-full bg-[#6e0d0d]/20 blur-[140px]" />
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
                Coming soon...
              </h2>
              <p className="max-w-2xl text-base leading-relaxed text-white/65 lg:text-lg">
                Testnet will open soon.
              </p>
              <div className="mt-8 flex flex-col items-center gap-4">
                {isConnected && address && isConnectedWithSpkWallet ? (
                  <>
                    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white/85">
                      <Wallet className="h-4 w-4 text-brand-red-glow" />
                      {shortenAddress(address)}
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
                      This button opens the official WalletConnect modal with SPK Wallet only on this page.
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

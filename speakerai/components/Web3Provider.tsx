'use client';

import React, { ReactNode } from 'react';
import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react';
import { WagmiProvider } from 'wagmi';
import { bsc } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AllocationStateProvider } from '@/components/AllocationStateProvider';

// 1. Get projectId at https://cloud.walletconnect.com
// NOTE: You MUST set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID in your environment variables
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID';

// 2. Create wagmiConfig
const metadata = {
  name: 'SpeakerAI Protocol',
  description: 'official website for checking your allocation for SpeakerAI tokens',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://www.speakerai.org',
  icons: ['/icon.png']
};

const chains = [bsc] as const;
const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  auth: {
    email: true,
    socials: ['google', 'x', 'github', 'discord', 'apple'],
    showWallets: true, // Optional - show wallet options
    walletFeatures: true // Optional - show wallet features
  }
});

if (typeof window !== 'undefined') {
  const speakerAiWindow = window as typeof window & {
    __speakerAiWeb3ModalInitialized?: boolean;
  };

  if (!speakerAiWindow.__speakerAiWeb3ModalInitialized) {
    createWeb3Modal({
      wagmiConfig: config,
      projectId,
      enableAnalytics: true,
      enableOnramp: true,
      themeMode: 'dark',
      themeVariables: {
        '--w3m-accent': '#ff0000',
        '--w3m-color-mix': '#ff0000',
        '--w3m-color-mix-strength': 10
      }
    });

    speakerAiWindow.__speakerAiWeb3ModalInitialized = true;
  }
}

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <AllocationStateProvider>{children}</AllocationStateProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

'use client';

import React, { createContext, ReactNode, useContext, useState } from 'react';

export interface AirdropData {
  txCount: number;
  isEligible: boolean;
  allocation: number;
  loading: boolean;
  error: string | null;
}

interface AllocationStateContextValue {
  airdrops: Record<string, AirdropData>;
  setAirdrop: (address: string, airdrop: AirdropData) => void;
  clearAirdrop: (address?: string) => void;
}

const AllocationStateContext = createContext<AllocationStateContextValue | null>(null);

export const getInitialAirdropState = (): AirdropData => ({
  txCount: 0,
  isEligible: false,
  allocation: 0,
  loading: false,
  error: null,
});

export const normalizeAddress = (address: string) => address.toLowerCase();

export function AllocationStateProvider({ children }: { children: ReactNode }) {
  const [airdrops, setAirdrops] = useState<Record<string, AirdropData>>({});

  const setAirdrop = (address: string, airdrop: AirdropData) => {
    const normalizedAddress = normalizeAddress(address);
    setAirdrops((current) => ({
      ...current,
      [normalizedAddress]: airdrop,
    }));
  };

  const clearAirdrop = (address?: string) => {
    if (!address) {
      setAirdrops({});
      return;
    }

    const normalizedAddress = normalizeAddress(address);
    setAirdrops((current) => {
      const nextState = { ...current };
      delete nextState[normalizedAddress];
      return nextState;
    });
  };

  return (
    <AllocationStateContext.Provider value={{ airdrops, setAirdrop, clearAirdrop }}>
      {children}
    </AllocationStateContext.Provider>
  );
}

export function useAllocationState() {
  const context = useContext(AllocationStateContext);

  if (!context) {
    throw new Error('useAllocationState must be used within AllocationStateProvider');
  }

  return context;
}

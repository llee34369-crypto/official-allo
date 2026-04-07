export const BSC_CHAIN_ID = 56;
export const TOTAL_SUPPLY = 100000000;
export const AIRDROP_POOL = 15000000;
export const MIN_TX_ELIGIBLE = 10;
export const MAX_TX_FOR_CAP = 10000;
export const MAX_USER_CAP = 50000;
export const SNAPSHOT_TIMESTAMP = Math.floor(
  Date.UTC(2026, 2, 1, 0, 0, 0) / 1000
);
export const SNAPSHOT_LABEL = 'Before March 1, 2026';

export function calculateAllocationFromTxCount(txCount: number) {
  const isEligible = txCount >= MIN_TX_ELIGIBLE;
  const normalizedScore = Math.min(txCount / MAX_TX_FOR_CAP, 1);
  const allocation = isEligible
    ? Math.floor(normalizedScore * MAX_USER_CAP)
    : 0;

  return {
    txCount,
    isEligible,
    allocation,
  };
}

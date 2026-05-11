import {
  arbitrum,
  avalanche,
  base,
  bsc,
  celo,
  fantom,
  gnosis,
  linea,
  mainnet,
  mantle,
  mode,
  opBNB,
  optimism,
  polygon,
  polygonZkEvm,
  scroll,
  sei,
  zksync,
  zora,
} from 'wagmi/chains';

export const walletChains = [
  mainnet,
  bsc,
  polygon,
  arbitrum,
  optimism,
  base,
  avalanche,
  opBNB,
  scroll,
  linea,
  zksync,
  polygonZkEvm,
  mantle,
  mode,
  celo,
  gnosis,
  fantom,
  sei,
  zora,
] as const;

export const defaultWalletChainId = bsc.id;

export type SupportedWalletChain = (typeof walletChains)[number];

export function getWalletChain(chainId: number | undefined | null) {
  return walletChains.find((chain) => chain.id === chainId) ?? walletChains[1];
}

export function getAddressExplorerUrl(chainId: number | undefined | null, address: string) {
  const chain = getWalletChain(chainId);
  return `${chain.blockExplorers?.default.url ?? 'https://bscscan.com'}/address/${address}`;
}

export function getTransactionExplorerUrl(chainId: number | undefined | null, hash: string) {
  const chain = getWalletChain(chainId);
  return `${chain.blockExplorers?.default.url ?? 'https://bscscan.com'}/tx/${hash}`;
}

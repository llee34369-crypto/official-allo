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

const walletNetworkLogoUrls: Record<number, string> = {
  1: 'https://cdn.simpleicons.org/ethereum/627EEA',
  56: 'https://cdn.simpleicons.org/binance/F3BA2F',
  137: 'https://cdn.simpleicons.org/polygon/8247E5',
  42161: 'https://cdn.simpleicons.org/arbitrum/28A0F0',
  10: 'https://cdn.simpleicons.org/optimism/FF0420',
  8453: 'https://cdn.simpleicons.org/base/0052FF',
  43114: 'https://cdn.simpleicons.org/avast/EA4E43',
  204: 'https://cryptologos.cc/logos/bnb-bnb-logo.png?v=040',
  534352: 'https://cdn.simpleicons.org/scroll/F9C66B',
  59144: 'https://cdn.simpleicons.org/linea/61DFFF',
  324: 'https://cdn.simpleicons.org/zksync/8C8DFC',
  1101: 'https://cdn.simpleicons.org/polygon/8247E5',
  5000: 'https://cdn.simpleicons.org/mantle/FFFFFF',
  34443: 'https://cdn.simpleicons.org/mode/DAFF00',
  42220: 'https://cdn.simpleicons.org/celo/35D07F',
  100: 'https://cdn.simpleicons.org/gnometerminal/00A6C4',
  250: 'https://cdn.simpleicons.org/fantom/1969FF',
  1329: 'https://cdn.simpleicons.org/sei/FF6B6B',
  7777777: 'https://cdn.simpleicons.org/zora/7A4CFF',
};

export function getWalletChain(chainId: number | undefined | null) {
  return walletChains.find((chain) => chain.id === chainId) ?? walletChains[1];
}

export function getWalletNetworkLogoUrl(chainId: number | undefined | null) {
  if (!chainId) {
    return walletNetworkLogoUrls[defaultWalletChainId];
  }

  return walletNetworkLogoUrls[chainId] ?? walletNetworkLogoUrls[defaultWalletChainId];
}

export function getAddressExplorerUrl(chainId: number | undefined | null, address: string) {
  const chain = getWalletChain(chainId);
  return `${chain.blockExplorers?.default.url ?? 'https://bscscan.com'}/address/${address}`;
}

export function getTransactionExplorerUrl(chainId: number | undefined | null, hash: string) {
  const chain = getWalletChain(chainId);
  return `${chain.blockExplorers?.default.url ?? 'https://bscscan.com'}/tx/${hash}`;
}

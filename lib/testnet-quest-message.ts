export const DOWNLOAD_SPK_WALLET_QUEST_ID = 'download_spk_wallet';
export const DOWNLOAD_SPK_WALLET_QUEST_REWARD_POINTS = 5;

export function getTestnetQuestOwnershipMessage(walletAddress: string) {
  const normalizedWalletAddress = walletAddress.trim().toLowerCase();

  return [
    'SpeakerAI Testnet Quest Verification',
    '',
    `Quest: ${DOWNLOAD_SPK_WALLET_QUEST_ID}`,
    `Wallet: ${normalizedWalletAddress}`,
    `Reward: ${DOWNLOAD_SPK_WALLET_QUEST_REWARD_POINTS} SP`,
    '',
    'Sign this message to confirm ownership of this SPK Wallet and claim the testnet quest reward.',
  ].join('\n');
}

export const DOWNLOAD_SPK_WALLET_QUEST_ID = 'download_spk_wallet';
export const DOWNLOAD_SPK_WALLET_QUEST_REWARD_POINTS = 5;
export const DAILY_VOICE_RECORD_QUEST_ID = 'complete_daily_voice_record';
export const DAILY_VOICE_RECORD_QUEST_REWARD_POINTS = 2;
export const DAILY_VOICE_RECORD_QUEST_DAILY_LIMIT = 5;

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

export function getDailyVoiceQuestOwnershipMessage(
  walletAddress: string,
  expectedText: string
) {
  const normalizedWalletAddress = walletAddress.trim().toLowerCase();
  const normalizedExpectedText = expectedText.trim();

  return [
    'SpeakerAI Daily Voice Quest Verification',
    '',
    `Quest: ${DAILY_VOICE_RECORD_QUEST_ID}`,
    `Wallet: ${normalizedWalletAddress}`,
    `Reward: ${DAILY_VOICE_RECORD_QUEST_REWARD_POINTS} SP`,
    `Daily limit: ${DAILY_VOICE_RECORD_QUEST_DAILY_LIMIT}`,
    '',
    `Expected text: ${normalizedExpectedText}`,
    '',
    'Sign this message to confirm ownership of this SPK Wallet and submit the verified daily voice recording.',
  ].join('\n');
}

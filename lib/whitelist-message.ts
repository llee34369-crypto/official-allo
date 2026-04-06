export function getWhitelistConfirmationMessage(walletAddress: string) {
  return [
    'SpeakerAI Testnet Whitelist',
    '',
    'Confirm wallet ownership for whitelist submission.',
    `Wallet: ${walletAddress.toLowerCase()}`,
  ].join('\n');
}

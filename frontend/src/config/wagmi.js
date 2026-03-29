import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, sepolia, polygon, polygonAmoy } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'VoteChain',
  projectId: 'YOUR_PROJECT_ID', // Get from https://cloud.walletconnect.com
  chains: [mainnet, sepolia, polygon, polygonAmoy],
  ssr: false,
});

import { clusterApiUrl } from '@solana/web3.js';
import dotenv from 'dotenv';

import { ArbBot, SwapToken } from './client';

dotenv.config({
  path: '.env',
});

const defaultConfig = {
  solanaEndpoint: clusterApiUrl('mainnet-beta'),
  jupiter: 'https://quote-api.jup.ag/v6',
};

export async function startBot() {
  if (!process.env.SECRET_KEY) {
    throw new Error('SECRET_KEY environment variable not set');
  }

  const bot = new ArbBot({
    solanaEndpoint: process.env.SOLANA_ENDPOINT ?? defaultConfig.solanaEndpoint,
    metisEndpoint: defaultConfig.jupiter,
    secretKey: process.env.SECRET_KEY ?? '',
    initialInputToken: SwapToken.SOL,
    initialInputAmount: 2000000,
    firstTradePrice: 1.0,
  });

  await bot.init();
}

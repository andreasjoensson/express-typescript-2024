import axios from 'axios';

type PriceStats = {
  priceChange: number;
  marketcap: number;
  price: number;
  volume: number;
};

export async function getPriceStats(tokenId: string): Promise<PriceStats | undefined> {
  try {
    const response = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${tokenId}`);
    const stats = response.data.pairs;
    if (stats !== undefined) {
      const pair = stats[0];
      return { priceChange: pair.priceChange.h24, price: pair.priceUsd, marketcap: pair.fdv, volume: pair.volume.h24 };
    } else {
      return undefined;
    }
  } catch (error) {
    console.error('Error fetching stats:', error);
    return undefined;
  }
}

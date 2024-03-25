import CoinModel, { ICoin } from '../../models/coin.model';

// Function to find a coin by ID
export async function findCoinById(coinId: string): Promise<ICoin | null> {
  return CoinModel.findById(coinId);
}

import CoinModel, { ICoin } from '../../models/coin.model';

// Function to create a new coin
export async function createCoin(name: string, image: string): Promise<ICoin> {
  const newCoin = new CoinModel({
    name,
    image,
  });
  return newCoin.save();
}

// Function to retrieve all coins
export async function getAllCoins(): Promise<ICoin[]> {
  return CoinModel.find();
}

// Function to find a coin by user ID
export async function findCoinByUserId(userId: string): Promise<ICoin[] | null> {
  return CoinModel.find({ user: userId });
}

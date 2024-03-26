import axios from 'axios';
import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';

export interface SolanaData {
  sol: number;
  solPrice?: number;
}

export const getSolBalance = async (walletAddress: string): Promise<SolanaData> => {
  try {
    const connection = new Connection('https://api.mainnet-beta.solana.com');
    const publicKey = new PublicKey(walletAddress);
    const balance = await connection.getBalance(publicKey);

    const price = await getSolPrice('So11111111111111111111111111111111111111112'); // Fetch SOL price

    return {
      sol: balance / LAMPORTS_PER_SOL,
      solPrice: price,
    };
  } catch (error) {
    console.error('Error fetching SOL balance:', error);
    return { sol: 0 };
  }
};

export async function getSolPrice(tokenId: string): Promise<number | undefined> {
  try {
    const response = await axios.get(`https://price.jup.ag/v4/price?ids=${tokenId}`);
    console.log('response:', response.data);
    const price = response.data.data[tokenId]?.price;
    if (price !== undefined) {
      return price;
    } else {
      return undefined;
    }
  } catch (error) {
    console.error('Error fetching token price:', error);
    return undefined;
  }
}

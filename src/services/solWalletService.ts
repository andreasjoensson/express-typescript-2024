import axios from 'axios';
import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { BalanceModel } from '@/models/balance.model';
import { findCoinByUserId } from '@/api/coin/coin.service';

export interface SolanaData {
  sol: number;
  solPrice?: number;
}

// Define your cron job function
export const fetchSolBalance = async () => {
  try {
    const walletAddress = 'DDwKvwge3xGxVLrVhe9Zd5KZPMzt77Aqgn7KyQ6NX2Tq';
    const solData = await getSolBalance(walletAddress);

    const coins = await findCoinByUserId('6601e3aa89ba1f3fcb27da31');
    let solBalance = solData.sol;

    if (coins) {
      await Promise.all(
        coins.map(async (coin) => {
          if (coin) {
            const solBalanceByPrice = await getSolBalanceByCurrentPrice(coin.ca);
            if (solBalanceByPrice) {
              let solBalanceNew = solBalanceByPrice / 1000000;
              if (solBalanceByPrice !== undefined) {
                console.log('sol balance before:', solBalance);
                solBalance += solBalanceNew;
                console.log('sol balance after:', solBalance);
              }
            }
          }
        })
      );
    }

    // Check if solPrice is defined before using it
    if (solData.solPrice !== undefined) {
      // Save balance data to MongoDB
      const balanceDocument = new BalanceModel({
        walletAddress: walletAddress,
        solBalance: solBalance,
        user: '6601e3aa89ba1f3fcb27da31',
        solPrice: solData.solPrice * solBalance,
      });

      await balanceDocument.save();
    } else {
      console.error('Error fetching SOL balance: solPrice is undefined');
    }
  } catch (error) {
    console.error('Error fetching SOL balance:', error);
  }
};

// Function to retrieve the latest 20 days of SOL balances
export async function getLatestSOLBalances(): Promise<any[]> {
  try {
    // Get the current date
    const currentDate = new Date();

    // Calculate the date 20 days ago
    const twentyDaysAgo = new Date();
    twentyDaysAgo.setDate(currentDate.getDate() - 20);

    // Query MongoDB for balances within the last 20 days
    const balances = await BalanceModel.find({
      timestamp: { $gte: twentyDaysAgo, $lte: currentDate },
    })
      .sort({ timestamp: 1 })
      .limit(20);

    // Return the array of balances
    return balances.map((balance, i) => ({
      date: balance.timestamp.getTime() / 1000, // Convert timestamp to Unix timestamp
      dailyVolumeUSD: balance.solPrice, // Assuming the SOL balance is stored in the field solBalance
      totalLiquidityUSD: balance.solPrice, // Assuming the SOL balance is stored in the field solBalance
      name: '0' + i,
    }));
  } catch (error) {
    console.error('Error fetching latest SOL balances:', error);
    return [];
  }
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

export async function getSolBalanceByCurrentPrice(tokenId: string): Promise<number | undefined> {
  try {
    const response = await axios.get(
      `https://quote-api.jup.ag/v6/quote?inputMint=${encodeURIComponent(tokenId)}&outputMint=So11111111111111111111111111111111111111112&amount=100000000&slippageBps=50`
    );
    const price = response.data.outAmount;
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

import { Connection, PublicKey } from '@solana/web3.js';

// Initialize connection to Solana RPC endpoint
const connection = new Connection('https://api.mainnet-beta.solana.com');

// Function to fetch recent transactions for a Solana wallet
export const fetchTransactions = async (walletAddress: string): Promise<string | null> => {
  try {
    // Convert wallet address to PublicKey
    const publicKey = new PublicKey(walletAddress);

    // Fetch recent transactions for the wallet
    const transactions = await connection.getConfirmedSignaturesForAddress2(publicKey, {
      limit: 10,
    });

    for (const transaction of transactions) {
      const transactionSol = await connection.getTransaction(transaction.signature);

      const tokenBalances = transactionSol?.meta?.postTokenBalances;
      console.log('Transaction:', tokenBalances);

      const newToken = true;
      if (newToken && tokenBalances && tokenBalances.length > 0) {
        console.log('Token:', tokenBalances[0]);
        const token = tokenBalances[0].mint;
        return token;
      }
    }

    // If no token is found in any transaction
    return null;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return null;
  }
};

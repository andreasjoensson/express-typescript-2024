import express, { Request, Response, Router } from 'express';

import { getTransactionsByUserId } from '../transactions/transaction.service';
import { findCoinByUserId } from '../coin/coin.service';
import { getSolBalance } from '@/services/solWalletService';
import { fetchHistoryPrice, getPriceStats } from '@/services/priceService';

export const dashboardRouter: Router = (() => {
  const router = express.Router();

  // GET endpoint to retrieve all transactions
  router.get('/', async (req: Request, res: Response) => {
    try {
      let transactions = await getTransactionsByUserId('6601e3aa89ba1f3fcb27da31');
      let transactionsWithAmount = [] as any[];

      if (transactions) {
        await Promise.all(
          transactions.map(async (transaction, i) => {
            const priceAtThatTime = await fetchHistoryPrice(transaction.date.toString(), transaction.coin.ca);
            if (priceAtThatTime && transaction.buyAmount) {
              const amount = {
                balance: transaction.buyAmount,
                usdBalance: Math.ceil(((transaction.buyAmount * priceAtThatTime) / 1000000) * 10) / 10,
              };
              if (amount) {
                const modifiedTransaction = {
                  ...transaction.toObject(),
                  id: i,
                  symbol: transaction.coin.symbol,
                  ca: transaction.coin.ca,
                  amount,
                };
                transactionsWithAmount.push(modifiedTransaction);
                return modifiedTransaction;
              }
            }
          })
        );
      }

      let coins = await findCoinByUserId('6601e3aa89ba1f3fcb27da31');
      let coinsWithPriceStats = [] as any[];

      if (coins) {
        await Promise.all(
          coins.map(async (coin, i) => {
            const priceStats = await getPriceStats(coin.ca);
            if (priceStats) {
              const usdBalanceMillions = Math.ceil(((coin.amount * priceStats.price) / 1000000) * 10) / 10; // Round to 1 decimal place
              const modifiedCoin = {
                ...coin.toObject(),
                id: i,
                ...priceStats,
                usdBalance: usdBalanceMillions.toFixed(1),
                info: { name: coin.name, symbol: coin.symbol, image: coin.image },
              }; // Create a new object with priceStats added
              coinsWithPriceStats.push(modifiedCoin); // Push the modified coin to the array
              return modifiedCoin; // Return the modified coin
            }
          })
        );
      }

      console.log('Modified coins:', coins); // Log modified coins
      const balance = await getSolBalance('DDwKvwge3xGxVLrVhe9Zd5KZPMzt77Aqgn7KyQ6NX2Tq');
      res.status(200).json({ transactions: transactionsWithAmount, coins: coinsWithPriceStats, balance });
    } catch (error) {
      res.status(500).json({ message: error });
    }
  });

  return router;
})();

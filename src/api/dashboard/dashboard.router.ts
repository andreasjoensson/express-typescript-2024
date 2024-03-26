import express, { Request, Response, Router } from 'express';

import { getTransactionsByUserId } from '../transactions/transaction.service';
import { findCoinByUserId } from '../coin/coin.service';
import { getSolBalance } from '@/services/solWalletService';
import { getPriceStats } from '@/services/priceService';

export const dashboardRouter: Router = (() => {
  const router = express.Router();

  // GET endpoint to retrieve all transactions
  router.get('/', async (req: Request, res: Response) => {
    try {
      const transactions = await getTransactionsByUserId('6601e3aa89ba1f3fcb27da31');
      let coins = await findCoinByUserId('6601e3aa89ba1f3fcb27da31');
      let coinsWithPriceStats = [] as any[];

      if (coins) {
        await Promise.all(
          coins.map(async (coin, i) => {
            const priceStats = await getPriceStats(coin.ca);
            const modifiedCoin = {
              ...coin.toObject(),
              id: i,
              ...priceStats,
              info: { name: coin.name, symbol: coin.symbol, image: coin.image },
            }; // Create a new object with priceStats added
            coinsWithPriceStats.push(modifiedCoin); // Push the modified coin to the array
            return modifiedCoin; // Return the modified coin
          })
        );
      }

      console.log('Modified coins:', coins); // Log modified coins
      const balance = await getSolBalance('DDwKvwge3xGxVLrVhe9Zd5KZPMzt77Aqgn7KyQ6NX2Tq');
      res.status(200).json({ transactions, coins: coinsWithPriceStats, balance });
    } catch (error) {
      res.status(500).json({ message: error });
    }
  });

  return router;
})();

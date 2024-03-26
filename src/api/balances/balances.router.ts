import { getLatestSOLBalances } from '@/services/solWalletService';
import express, { Request, Response, Router } from 'express';

export const balancesRouter: Router = (() => {
  const router = express.Router();

  // GET endpoint to retrieve all coins
  router.get('/', async (req: Request, res: Response) => {
    try {
      const balances = await getLatestSOLBalances();
      res.status(200).json(balances);
    } catch (error) {
      res.status(500).json({ message: error });
    }
  });

  return router;
})();

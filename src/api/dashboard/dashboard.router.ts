import express, { Request, Response, Router } from 'express';

import { getTransactionsByUserId } from '../transactions/transaction.service';

export const dashboardRouter: Router = (() => {
  const router = express.Router();

  // GET endpoint to retrieve all transactions
  router.get('/', async (req: Request, res: Response) => {
    try {
      const transactions = await getTransactionsByUserId('fsd');
      res.status(200).json(transactions);
    } catch (error) {
      res.status(500).json({ message: error });
    }
  });

  return router;
})();

import express, { Request, Response, Router } from 'express';

import { createTransaction, getAllTransactions, getTransactionsByUserId } from './transaction.service';

export const transactionsRouter: Router = (() => {
  const router = express.Router();

  // POST endpoint to create a new transaction
  router.post('/', async (req: Request, res: Response) => {
    try {
      const transactionData = req.body;
      const newTransaction = await createTransaction(transactionData);
      res.status(201).json(newTransaction);
    } catch (error) {
      res.status(400).json({ message: error });
    }
  });

  // GET endpoint to retrieve all transactions
  router.get('/', async (req: Request, res: Response) => {
    try {
      const transactions = await getAllTransactions();
      res.status(200).json(transactions);
    } catch (error) {
      res.status(500).json({ message: error });
    }
  });

  // GET endpoint to retrieve all transactions for a specific user
  router.get('/:userId', async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;
      const transactions = await getTransactionsByUserId(userId);
      res.status(200).json(transactions);
    } catch (error) {
      res.status(500).json({ message: error });
    }
  });

  return router;
})();

import express, { Request, Response } from 'express';

import { createCoin, getAllCoins } from './coin.service';

const coinRouter = express.Router();

// POST endpoint to create a new coin
coinRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { name, image } = req.body;
    const newCoin = await createCoin(name, image);
    res.status(201).json(newCoin);
  } catch (error) {
    res.status(400).json({ message: error });
  }
});

// GET endpoint to retrieve all coins
coinRouter.get('/', async (req: Request, res: Response) => {
  try {
    const coins = await getAllCoins();
    res.status(200).json(coins);
  } catch (error) {
    res.status(500).json({ message: error });
  }
});

export default coinRouter;

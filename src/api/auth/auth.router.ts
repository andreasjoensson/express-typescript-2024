import express, { Request, Response, Router } from 'express';
import jwt from 'jsonwebtoken'; // Import JWT library

import { createUser, loginUser } from './auth.service';

export const authRouter: Router = (() => {
  const router = express.Router();

  router.post('/sign-up', async (req: Request, res: Response) => {
    try {
      console.log('req.body:', req.body);

      const { username, email, password, wallet, name } = req.body;
      const newUser = await createUser(username, name, wallet, email, password);
      res.status(201).json(newUser);
    } catch (error) {
      console.log('Error creating user:', error);
      res.status(400).json({ message: error });
    }
  });

  // POST endpoint to login a user
  router.post('/sign-in', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const user = await loginUser(email, password);

      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Generate JWT token with user's data
      const token = jwt.sign({ userId: user._id, email: user.email }, 'your-secret-key', { expiresIn: '1h' });

      console.log('user:', user);

      // Return user data and token in response
      res.status(200).json({ user, token });
    } catch (error) {
      res.status(401).json({ message: error });
    }
  });

  return router;
})();

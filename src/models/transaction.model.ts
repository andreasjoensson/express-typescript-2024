import mongoose, { Document, Schema } from 'mongoose';

import { ICoin } from './coin.model';
import { IUser } from './user.model';

type TransactionType = 'buy' | 'sell' | 'topup';

// Define interface for the transaction document
export interface ITransaction extends Document {
  transactionId: string;
  date: Date;
  user: IUser['_id'];
  coin: ICoin['_id'];
  type: TransactionType;
  amount: number;
  status: string;
  buyAmount?: number;
  sellAmount?: number;
  buyPrice?: number;
  sellPrice?: number;
}

// Define schema for the transaction model
const TransactionSchema: Schema = new Schema({
  transactionId: { type: String, required: true },
  type: { type: String, enum: ['buy', 'sell', 'topup'], required: true },
  date: { type: Date, required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  coin: { type: Schema.Types.ObjectId, ref: 'Coin', required: true },
  buyAmount: { type: Number, required: false },
  sellAmount: { type: Number, required: false },
  buyPrice: { type: Number, required: false },
  sellPrice: { type: Number, required: false },
  amount: { type: Number, required: true },
  status: { type: String, required: true },
});

// Define and export the transaction model
const TransactionModel = mongoose.model<ITransaction>('Transaction', TransactionSchema);

export default TransactionModel;

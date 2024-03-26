import mongoose, { Document, Schema } from 'mongoose';

import { ITransaction } from './transaction.model';
import { IUser } from './user.model';

// Define interface for the coin document
export interface ICoin extends Document {
  name: string;
  ca: string;
  user: IUser['_id'];
  transactions: ITransaction['_id'][];
  image: string;
  amount: number;
  symbol: string;
  priceStats?: {
    price: number;
    priceChange: number;
    marketcap: number;
    volume: number;
  };
}

// Define schema for the coin model
const CoinSchema: Schema = new Schema({
  name: { type: String, required: true },
  symbol: { type: String, required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  transactions: [{ type: Schema.Types.ObjectId, ref: 'Transaction' }],
  ca: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  amount: { type: Number, required: true, default: 0 },
});

// Define and export the coin model
const CoinModel = mongoose.model<ICoin>('Coin', CoinSchema);

export default CoinModel;

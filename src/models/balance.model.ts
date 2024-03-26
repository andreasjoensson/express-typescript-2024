import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './user.model';

// Define the interface for the balance document
interface Balance extends Document {
  walletAddress: string;
  user: IUser['_id'];
  solBalance: number;
  solPrice: number;
  timestamp: Date;
}

// Define the schema for the balance document
const balanceSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  walletAddress: { type: String, required: true },
  solBalance: { type: Number, required: true },
  solPrice: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
});

// Define and export the Balance model
export const BalanceModel = mongoose.model<Balance>('Balance', balanceSchema);

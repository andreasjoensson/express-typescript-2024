import mongoose, { Document, Schema } from 'mongoose';

// Define interface for the user document
export interface IUser extends Document {
  username: string;
  name: string;
  email: string;
  password: string;
  wallet: string;
}

// Define schema for the user model
const UserSchema: Schema = new Schema({
  username: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  wallet: { type: String, required: true },
});

// Define and export the user model
const UserModel = mongoose.model<IUser>('User', UserSchema);

export default UserModel;

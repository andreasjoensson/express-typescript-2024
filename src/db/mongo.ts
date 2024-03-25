import { connect } from 'mongoose';
const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/trading';

export async function runMongoDB() {
  try {
    return await connect(uri);
  } catch (error) {
    console.error(error);
  }
}

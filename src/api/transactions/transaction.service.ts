import TransactionModel, { ITransaction } from '../../models/transaction.model';

// Function to create a new transaction
export async function createTransaction(transactionData: Partial<ITransaction>): Promise<ITransaction> {
  const newTransaction = new TransactionModel(transactionData);
  return newTransaction.save();
}

// Function to retrieve all transactions
export async function getAllTransactions(): Promise<ITransaction[]> {
  return TransactionModel.find();
}

export async function getTransactionsByUserId(userId: string): Promise<ITransaction[]> {
  return TransactionModel.find({ user: userId }).populate('coin');
}

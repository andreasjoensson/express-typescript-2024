import TransactionModel, { ITransaction } from '../../models/transaction.model';

// Function to find a transaction by ID
export async function findTransactionById(transactionId: string): Promise<ITransaction | null> {
  return TransactionModel.findById(transactionId);
}

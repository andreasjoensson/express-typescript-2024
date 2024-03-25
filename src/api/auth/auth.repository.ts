import UserModel, { IUser } from '../../models/user.model';

// Function to find a user by email
export async function findUserByEmail(email: string): Promise<IUser | null> {
  return UserModel.findOne({ email });
}

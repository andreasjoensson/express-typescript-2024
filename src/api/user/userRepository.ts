import UserModel, { IUser } from '../../models/user.model';

export const userRepository = {
  findAllAsync: async (): Promise<IUser[]> => {
    return UserModel.find();
  },

  findByIdAsync: async (id: number): Promise<IUser | null> => {
    return UserModel.findById(id);
  },
};

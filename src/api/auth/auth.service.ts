import bcrypt from 'bcrypt';

import UserModel, { IUser } from '../../models/user.model';

// Function to create a new user
export async function createUser(
  username: string,
  name: string,
  wallet: string,
  email: string,
  password: string
): Promise<IUser | null> {
  try {
    // Check if the user with the given email already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      throw new Error('User with this email already exists.');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user document
    const newUser = new UserModel({
      username,
      email,
      password: hashedPassword,
      wallet,
      name,
    });

    // Save the new user document to the database
    const savedUser = await newUser.save();
    return savedUser;
  } catch (error) {
    // Handle errors
    console.error('Error creating user:', error);
    return null;
  }
}

// Function to authenticate user login
export async function loginUser(email: string, password: string): Promise<IUser | null> {
  try {
    // Find the user by email
    const user = await UserModel.findOne({ email });
    if (!user) {
      throw new Error('User not found.');
    }

    // Check if the password matches
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new Error('Incorrect password.');
    }

    return user;
  } catch (error) {
    // Handle errors
    console.error('Error logging in user:', error);
    return null;
  }
}

import type { Models } from 'appwrite';

export interface AppUser extends Models.Document {
  userId: string;
  email?: string;
  isAdmin: boolean;
}

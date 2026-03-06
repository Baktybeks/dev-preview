import type { Models } from 'appwrite';

export interface Category extends Models.Document {
  name: string;
  slug: string;
  description?: string;
  order?: number;
}

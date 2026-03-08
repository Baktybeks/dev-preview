import type { Models } from 'appwrite';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Question extends Models.Document {
  title: string;
  answer: string;
  difficulty: Difficulty;
  categoryId: string;
}

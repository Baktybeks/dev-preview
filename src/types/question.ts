import type { Models } from 'appwrite';

export type Difficulty = 'junior' | 'middle' | 'senior';

export interface Question extends Models.Document {
  title: string;
  answer: string;
  difficulty: Difficulty;
  categoryId: string;
}

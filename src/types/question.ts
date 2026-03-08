import type { Models } from 'appwrite';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Question extends Models.Document {
  title: string;
  answer: string;
  difficulty: Difficulty;
  categoryId: string;
  /** Метки/теги для фильтрации и поиска (например: js, closures, react) */
  tags?: string[];
}

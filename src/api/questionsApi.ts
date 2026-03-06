import { Query } from 'appwrite';
import { appwriteDatabases, appwriteDatabaseId } from './appwriteClient';
import type { Category } from '../types/category';
import type { Question } from '../types/question';
import { getCollectionId } from '../constants/appwriteConfig';

export async function getCategories(): Promise<{
  total: number;
  documents: Category[];
}> {
  const collectionId = getCollectionId('categories');

  const res = await appwriteDatabases.listDocuments<Category>(
    appwriteDatabaseId,
    collectionId,
    [Query.orderAsc('order')],
  );

  // eslint-disable-next-line no-console
  console.log('📡 getCategories result:', res);

  return { total: res.total, documents: res.documents };
}

export async function getQuestionsByCategory(
  categoryId: string,
): Promise<{ total: number; documents: Question[] }> {
  const collectionId = getCollectionId('questions');

  const res = await appwriteDatabases.listDocuments<Question>(
    appwriteDatabaseId,
    collectionId,
    [Query.equal('categoryId', categoryId)],
  );

  // eslint-disable-next-line no-console
  console.log('📡 getQuestionsByCategory result:', res);

  return { total: res.total, documents: res.documents };
}


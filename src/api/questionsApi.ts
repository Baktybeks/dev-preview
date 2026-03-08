import { Query } from 'appwrite';
import type { Models } from 'appwrite';
import { appwriteTablesDB, appwriteDatabaseId } from './appwriteClient';
import type { Category } from '../types/category';
import type { Question } from '../types/question';
import { getTableId } from '../constants/appwriteConfig';

export async function getCategories(): Promise<{
  total: number;
  documents: Category[];
}> {
  const tableId = getTableId('categories');

  const res = await appwriteTablesDB.listRows<Models.Row & Category>({
    databaseId: appwriteDatabaseId,
    tableId,
    queries: [Query.orderAsc('order')],
  });

  // eslint-disable-next-line no-console
  console.log('📡 getCategories result:', res);

  return { total: res.total, documents: res.rows };
}

export async function getQuestionsByCategory(
  categoryId: string,
): Promise<{ total: number; documents: Question[] }> {
  const tableId = getTableId('questions');

  const res = await appwriteTablesDB.listRows<Models.Row & Question>({
    databaseId: appwriteDatabaseId,
    tableId,
    queries: [Query.equal('categoryId', categoryId)],
  });

  // eslint-disable-next-line no-console
  console.log('📡 getQuestionsByCategory result:', res);

  return { total: res.total, documents: res.rows };
}

export async function getQuestionsByIds(
  questionIds: string[],
): Promise<Question[]> {
  if (questionIds.length === 0) return [];
  const tableId = getTableId('questions');
  const res = await appwriteTablesDB.listRows<Models.Row & Question>({
    databaseId: appwriteDatabaseId,
    tableId,
    queries: [Query.equal('$id', questionIds)],
  });
  return res.rows;
}

export async function getTotalQuestionsCount(): Promise<number> {
  const tableId = getTableId('questions');
  const res = await appwriteTablesDB.listRows({
    databaseId: appwriteDatabaseId,
    tableId,
    queries: [Query.limit(1)],
  });
  return res.total;
}

/** Количество вопросов в категории (только total, без загрузки строк). */
export async function getQuestionCountByCategory(
  categoryId: string,
): Promise<number> {
  const tableId = getTableId('questions');
  const res = await appwriteTablesDB.listRows({
    databaseId: appwriteDatabaseId,
    tableId,
    queries: [Query.equal('categoryId', categoryId), Query.limit(1)],
  });
  return res.total;
}


import { ID, Query } from 'appwrite';
import type { Models } from 'appwrite';
import { appwriteTablesDB, appwriteDatabaseId } from './appwriteClient';
import { getTableId } from '../constants/appwriteConfig';

export type QuestionStatus = 'know' | 'dont_know' | 'unanswered';

const STATUS_COLLECTION = 'user_question_status';
const FAVORITES_COLLECTION = 'favorites';

/** Карта questionId → статус для текущего пользователя */
export async function getQuestionStatuses(
  userId: string,
): Promise<Record<string, QuestionStatus>> {
  const tableId = getTableId(STATUS_COLLECTION);
  const res = await appwriteTablesDB.listRows<
    Models.Row & { questionId: string; status: QuestionStatus }
  >({
    databaseId: appwriteDatabaseId,
    tableId,
    queries: [Query.equal('userId', userId), Query.limit(500)],
  });
  const map: Record<string, QuestionStatus> = {};
  for (const row of res.rows) {
    map[row.questionId] = row.status;
  }
  return map;
}

/** Установить статус вопроса (знаю / не знаю). */
export async function setQuestionStatus(
  userId: string,
  questionId: string,
  status: QuestionStatus,
): Promise<void> {
  const tableId = getTableId(STATUS_COLLECTION);
  const existing = await appwriteTablesDB.listRows({
    databaseId: appwriteDatabaseId,
    tableId,
    queries: [
      Query.equal('userId', userId),
      Query.equal('questionId', questionId),
      Query.limit(1),
    ],
  });
  if (existing.rows.length > 0) {
    await appwriteTablesDB.updateRow({
      databaseId: appwriteDatabaseId,
      tableId,
      rowId: existing.rows[0].$id,
      data: { status },
    });
  } else {
    await appwriteTablesDB.createRow({
      databaseId: appwriteDatabaseId,
      tableId,
      rowId: ID.unique(),
      data: { userId, questionId, status },
    });
  }
}

/** Список questionId в избранном у пользователя */
export async function getFavoriteQuestionIds(
  userId: string,
): Promise<string[]> {
  const tableId = getTableId(FAVORITES_COLLECTION);
  const res = await appwriteTablesDB.listRows<
    Models.Row & { questionId: string }
  >({
    databaseId: appwriteDatabaseId,
    tableId,
    queries: [Query.equal('userId', userId), Query.limit(500)],
  });
  return res.rows.map((row) => row.questionId);
}

/** Добавить вопрос в избранное */
export async function addFavorite(
  userId: string,
  questionId: string,
): Promise<void> {
  const tableId = getTableId(FAVORITES_COLLECTION);
  const existing = await appwriteTablesDB.listRows({
    databaseId: appwriteDatabaseId,
    tableId,
    queries: [
      Query.equal('userId', userId),
      Query.equal('questionId', questionId),
      Query.limit(1),
    ],
  });
  if (existing.rows.length > 0) return;
  await appwriteTablesDB.createRow({
    databaseId: appwriteDatabaseId,
    tableId,
    rowId: ID.unique(),
    data: { userId, questionId },
  });
}

/** Убрать вопрос из избранного */
export async function removeFavorite(
  userId: string,
  questionId: string,
): Promise<void> {
  const tableId = getTableId(FAVORITES_COLLECTION);
  const existing = await appwriteTablesDB.listRows({
    databaseId: appwriteDatabaseId,
    tableId,
    queries: [
      Query.equal('userId', userId),
      Query.equal('questionId', questionId),
      Query.limit(1),
    ],
  });
  if (existing.rows.length === 0) return;
  await appwriteTablesDB.deleteRow({
    databaseId: appwriteDatabaseId,
    tableId,
    rowId: existing.rows[0].$id,
  });
}

import { ID, Query } from 'appwrite';
import type { Models } from 'appwrite';
import { appwriteDatabases, appwriteDatabaseId } from './appwriteClient';
import { getCollectionId } from '../constants/appwriteConfig';

export type QuestionStatus = 'know' | 'dont_know' | 'unanswered';

const STATUS_COLLECTION = 'user_question_status';
const FAVORITES_COLLECTION = 'favorites';

/** Карта questionId → статус для текущего пользователя */
export async function getQuestionStatuses(
  userId: string,
): Promise<Record<string, QuestionStatus>> {
  const collectionId = getCollectionId(STATUS_COLLECTION);
  const res = await appwriteDatabases.listDocuments<
    Models.Document & { questionId: string; status: QuestionStatus }
  >(
    appwriteDatabaseId,
    collectionId,
    [Query.equal('userId', userId), Query.limit(500)],
  );
  const map: Record<string, QuestionStatus> = {};
  for (const doc of res.documents) {
    map[doc.questionId] = doc.status;
  }
  return map;
}

/** Установить статус вопроса (знаю / не знаю). */
export async function setQuestionStatus(
  userId: string,
  questionId: string,
  status: QuestionStatus,
): Promise<void> {
  const collectionId = getCollectionId(STATUS_COLLECTION);
  const existing = await appwriteDatabases.listDocuments(
    appwriteDatabaseId,
    collectionId,
    [
      Query.equal('userId', userId),
      Query.equal('questionId', questionId),
      Query.limit(1),
    ],
  );
  if (existing.documents.length > 0) {
    await appwriteDatabases.updateDocument(
      appwriteDatabaseId,
      collectionId,
      existing.documents[0].$id,
      { status },
    );
  } else {
    await appwriteDatabases.createDocument(
      appwriteDatabaseId,
      collectionId,
      ID.unique(),
      { userId, questionId, status },
    );
  }
}

/** Список questionId в избранном у пользователя */
export async function getFavoriteQuestionIds(
  userId: string,
): Promise<string[]> {
  const collectionId = getCollectionId(FAVORITES_COLLECTION);
  const res = await appwriteDatabases.listDocuments<
    Models.Document & { questionId: string }
  >(
    appwriteDatabaseId,
    collectionId,
    [Query.equal('userId', userId), Query.limit(500)],
  );
  return res.documents.map((d) => d.questionId);
}

/** Добавить вопрос в избранное */
export async function addFavorite(
  userId: string,
  questionId: string,
): Promise<void> {
  const collectionId = getCollectionId(FAVORITES_COLLECTION);
  const existing = await appwriteDatabases.listDocuments(
    appwriteDatabaseId,
    collectionId,
    [
      Query.equal('userId', userId),
      Query.equal('questionId', questionId),
      Query.limit(1),
    ],
  );
  if (existing.documents.length > 0) return;
  await appwriteDatabases.createDocument(
    appwriteDatabaseId,
    collectionId,
    ID.unique(),
    { userId, questionId },
  );
}

/** Убрать вопрос из избранного */
export async function removeFavorite(
  userId: string,
  questionId: string,
): Promise<void> {
  const collectionId = getCollectionId(FAVORITES_COLLECTION);
  const existing = await appwriteDatabases.listDocuments(
    appwriteDatabaseId,
    collectionId,
    [
      Query.equal('userId', userId),
      Query.equal('questionId', questionId),
      Query.limit(1),
    ],
  );
  if (existing.documents.length === 0) return;
  await appwriteDatabases.deleteDocument(
    appwriteDatabaseId,
    collectionId,
    existing.documents[0].$id,
  );
}

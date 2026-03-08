import { ID, Query } from 'appwrite';
import type { Models } from 'appwrite';
import { appwriteTablesDB, appwriteDatabaseId } from './appwriteClient';
import { getTableId } from '../constants/appwriteConfig';
import type { Question } from '../types/question';
import type { Category } from '../types/category';

const QUESTIONS_TABLE = 'questions';
const CATEGORIES_TABLE = 'categories';
const USERS_TABLE = 'users';
const STATUS_TABLE = 'user_question_status';
const FAVORITES_TABLE = 'favorites';

const MAX_LIMIT = 500;

/** Размер страницы для списка вопросов в админке (infinite scroll) */
export const ADMIN_QUESTIONS_PAGE_SIZE = 10;

/** Общее количество пользователей */
export async function getTotalUsersCount(): Promise<number> {
  const res = await appwriteTablesDB.listRows({
    databaseId: appwriteDatabaseId,
    tableId: getTableId(USERS_TABLE),
    queries: [Query.limit(1)],
  });
  return res.total;
}

export type UserRow = Models.Row & { userId: string; email?: string; isAdmin: boolean };

/** Список всех пользователей (userId, isAdmin, $createdAt) */
export async function listUsers(): Promise<UserRow[]> {
  const res = await appwriteTablesDB.listRows<UserRow>({
    databaseId: appwriteDatabaseId,
    tableId: getTableId(USERS_TABLE),
    queries: [Query.limit(MAX_LIMIT), Query.orderDesc('$createdAt')],
  });
  return res.rows;
}

export type UserWithStats = UserRow & { knowCount: number; favoriteCount: number };

/** Список пользователей с количеством «знаю» и избранного */
export async function listUsersWithStats(): Promise<UserWithStats[]> {
  const [usersRes, statusRes, favRes] = await Promise.all([
    appwriteTablesDB.listRows<UserRow>({
      databaseId: appwriteDatabaseId,
      tableId: getTableId(USERS_TABLE),
      queries: [Query.limit(MAX_LIMIT), Query.orderDesc('$createdAt')],
    }),
    appwriteTablesDB.listRows<Models.Row & { userId: string; status: string }>({
      databaseId: appwriteDatabaseId,
      tableId: getTableId(STATUS_TABLE),
      queries: [Query.equal('status', 'know'), Query.limit(5000)],
    }),
    appwriteTablesDB.listRows<Models.Row & { userId: string }>({
      databaseId: appwriteDatabaseId,
      tableId: getTableId(FAVORITES_TABLE),
      queries: [Query.limit(5000)],
    }),
  ]);
  const knowByUser: Record<string, number> = {};
  for (const r of statusRes.rows) {
    knowByUser[r.userId] = (knowByUser[r.userId] ?? 0) + 1;
  }
  const favByUser: Record<string, number> = {};
  for (const r of favRes.rows) {
    favByUser[r.userId] = (favByUser[r.userId] ?? 0) + 1;
  }
  return usersRes.rows.map((u) => ({
    ...u,
    knowCount: knowByUser[u.userId] ?? 0,
    favoriteCount: favByUser[u.userId] ?? 0,
  }));
}

/** Назначить роль admin пользователю */
export async function setUserAdmin(
  userRowId: string,
  isAdmin: boolean,
): Promise<void> {
  await appwriteTablesDB.updateRow({
    databaseId: appwriteDatabaseId,
    tableId: getTableId(USERS_TABLE),
    rowId: userRowId,
    data: { isAdmin },
  });
}

/** Список всех вопросов с пагинацией */
export async function listAllQuestions(offset = 0, limit = 100): Promise<{
  total: number;
  documents: (Models.Row & Question)[];
}> {
  const tableId = getTableId(QUESTIONS_TABLE);
  const res = await appwriteTablesDB.listRows<Models.Row & Question>({
    databaseId: appwriteDatabaseId,
    tableId,
    queries: [Query.offset(offset), Query.limit(limit), Query.orderDesc('$createdAt')],
  });
  return { total: res.total, documents: res.rows };
}

/** Поиск/фильтр вопросов (поиск по title на клиенте при необходимости) */
export async function searchQuestions(params: {
  query?: string;
  categoryId?: string;
  difficulty?: string;
  offset?: number;
  limit?: number;
}): Promise<{ total: number; documents: (Models.Row & Question)[] }> {
  const { query, categoryId, difficulty, offset = 0, limit = 100 } = params;
  const tableId = getTableId(QUESTIONS_TABLE);
  const q = query?.trim().toLowerCase();
  if (!q) {
    const queries: string[] = [
      Query.offset(offset),
      Query.limit(limit),
      Query.orderDesc('$createdAt'),
    ];
    if (categoryId) queries.push(Query.equal('categoryId', categoryId));
    if (difficulty) queries.push(Query.equal('difficulty', difficulty));
    const res = await appwriteTablesDB.listRows<Models.Row & Question>({
      databaseId: appwriteDatabaseId,
      tableId,
      queries,
    });
    return { total: res.total, documents: res.rows };
  }
  const queries: string[] = [
    Query.offset(0),
    Query.limit(MAX_LIMIT),
    Query.orderDesc('$createdAt'),
  ];
  if (categoryId) queries.push(Query.equal('categoryId', categoryId));
  if (difficulty) queries.push(Query.equal('difficulty', difficulty));
  const res = await appwriteTablesDB.listRows<Models.Row & Question>({
    databaseId: appwriteDatabaseId,
    tableId,
    queries,
  });
  const rows = res.rows.filter(
    (r) =>
      r.title.toLowerCase().includes(q) || r.answer.toLowerCase().includes(q),
  );
  const total = rows.length;
  const paginated = rows.slice(offset, offset + limit);
  return { total, documents: paginated };
}

/** Создать вопрос */
export async function createQuestion(data: {
  title: string;
  answer: string;
  difficulty: Question['difficulty'];
  categoryId: string;
  tags?: string[];
}): Promise<Models.Row & Question> {
  const tableId = getTableId(QUESTIONS_TABLE);
  const payload: Pick<Question, 'title' | 'answer' | 'difficulty' | 'categoryId'> & { tags?: string[] } = {
    title: data.title,
    answer: data.answer,
    difficulty: data.difficulty,
    categoryId: data.categoryId,
  };
  if (data.tags?.length) payload.tags = data.tags;
  const res = await appwriteTablesDB.createRow<Models.Row & Question>({
    databaseId: appwriteDatabaseId,
    tableId,
    rowId: ID.unique(),
    data: payload as never,
  });
  return res as Models.Row & Question;
}

/** Обновить вопрос */
export async function updateQuestion(
  questionId: string,
  data: Partial<Pick<Question, 'title' | 'answer' | 'difficulty' | 'categoryId' | 'tags'>>,
): Promise<void> {
  await appwriteTablesDB.updateRow({
    databaseId: appwriteDatabaseId,
    tableId: getTableId(QUESTIONS_TABLE),
    rowId: questionId,
    data,
  });
}

/** Удалить вопрос */
export async function deleteQuestion(questionId: string): Promise<void> {
  await appwriteTablesDB.deleteRow({
    databaseId: appwriteDatabaseId,
    tableId: getTableId(QUESTIONS_TABLE),
    rowId: questionId,
  });
}

const DIFFICULTY_ALIASES: Record<string, Question['difficulty']> = {
  junior: 'easy',
  easy: 'easy',
  middle: 'medium',
  medium: 'medium',
  senior: 'hard',
  hard: 'hard',
};

/** Импорт вопросов (массовое создание). category/categorySlug по имени или slug ищется в categories. */
export async function importQuestions(
  items: Array<{
    question?: string;
    title?: string;
    answer: string;
    category?: string;
    categorySlug?: string;
    tags?: string[];
    difficulty?: string;
  }>,
  categoryIdMap: Record<string, string>,
): Promise<{ created: number; errors: string[] }> {
  const tableId = getTableId(QUESTIONS_TABLE);
  const errors: string[] = [];
  let created = 0;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const categoryKey = item.category ?? item.categorySlug ?? '';
    const catId = categoryIdMap[categoryKey] ?? categoryKey;
    if (!catId) {
      errors.push(`Строка ${i + 1}: категория "${categoryKey}" не найдена`);
      continue;
    }
    const rawDifficulty = (item.difficulty ?? 'medium').toLowerCase();
    const difficulty = DIFFICULTY_ALIASES[rawDifficulty] ?? (rawDifficulty as Question['difficulty']);
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      errors.push(`Строка ${i + 1}: неверная сложность "${item.difficulty}" (ожидается: easy/medium/hard)`);
      continue;
    }
    const title = item.title ?? item.question ?? '';
    if (!title.trim()) {
      errors.push(`Строка ${i + 1}: отсутствует поле title или question`);
      continue;
    }
    try {
      const data: Record<string, unknown> = {
        title: title.trim(),
        answer: item.answer,
        categoryId: catId,
        difficulty,
      };
      if (item.tags?.length) data.tags = item.tags;
      await appwriteTablesDB.createRow({
        databaseId: appwriteDatabaseId,
        tableId,
        rowId: ID.unique(),
        data,
      });
      created++;
    } catch (e) {
      errors.push(`Строка ${i + 1}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return { created, errors };
}

/** Все категории для маппинга имени → id */
export async function getCategoriesForAdmin(): Promise<Category[]> {
  const res = await appwriteTablesDB.listRows<Models.Row & Category>({
    databaseId: appwriteDatabaseId,
    tableId: getTableId(CATEGORIES_TABLE),
    queries: [Query.orderAsc('order')],
  });
  return res.rows;
}

/** Статистика: топ вопросов по "знаю" и по избранному. Считаем на клиенте из всех строк. */
export async function getStats(): Promise<{
  totalUsers: number;
  totalQuestions: number;
  topByKnow: Array<{ questionId: string; count: number }>;
  topByFavorites: Array<{ questionId: string; count: number }>;
  activityByDay: Array<{ date: string; count: number }>;
}> {
  const [usersRes, questionsRes, statusRes, favRes] = await Promise.all([
    appwriteTablesDB.listRows({
      databaseId: appwriteDatabaseId,
      tableId: getTableId(USERS_TABLE),
      queries: [Query.limit(1)],
    }),
    appwriteTablesDB.listRows({
      databaseId: appwriteDatabaseId,
      tableId: getTableId(QUESTIONS_TABLE),
      queries: [Query.limit(1)],
    }),
    appwriteTablesDB.listRows<
      Models.Row & { questionId: string; status: string; userId: string }
    >({
      databaseId: appwriteDatabaseId,
      tableId: getTableId(STATUS_TABLE),
      queries: [Query.equal('status', 'know'), Query.limit(5000)],
    }),
    appwriteTablesDB.listRows<Models.Row & { questionId: string }>({
      databaseId: appwriteDatabaseId,
      tableId: getTableId(FAVORITES_TABLE),
      queries: [Query.limit(5000)],
    }),
  ]);

  const knowByQuestion: Record<string, number> = {};
  for (const row of statusRes.rows) {
    knowByQuestion[row.questionId] = (knowByQuestion[row.questionId] ?? 0) + 1;
  }
  const favByQuestion: Record<string, number> = {};
  for (const row of favRes.rows) {
    favByQuestion[row.questionId] = (favByQuestion[row.questionId] ?? 0) + 1;
  }

  const topByKnow = Object.entries(knowByQuestion)
    .map(([questionId, count]) => ({ questionId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  const topByFavorites = Object.entries(favByQuestion)
    .map(([questionId, count]) => ({ questionId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const activityByDay: Record<string, number> = {};
  const addDate = (iso: string) => {
    const d = iso.slice(0, 10);
    activityByDay[d] = (activityByDay[d] ?? 0) + 1;
  };
  for (const row of statusRes.rows) {
    if (row.$createdAt) addDate(row.$createdAt);
  }
  for (const row of favRes.rows) {
    if (row.$createdAt) addDate(row.$createdAt);
  }
  const activityByDayArr = Object.entries(activityByDay)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30);

  return {
    totalUsers: usersRes.total,
    totalQuestions: questionsRes.total,
    topByKnow,
    topByFavorites,
    activityByDay: activityByDayArr,
  };
}

import { ID, Query } from 'appwrite';
import type { Models } from 'appwrite';
import { appwriteAccount, appwriteTablesDB, appwriteDatabaseId } from '@api/appwriteClient';
import { getTableId } from '../constants/appwriteConfig';
import type { AppUser } from '../types/user';

export async function register(email: string, password: string, name?: string) {
  return appwriteAccount.create({ userId: ID.unique(), email, password, name });
}

export async function login(email: string, password: string) {
  return appwriteAccount.createEmailPasswordSession({ email, password });
}

export async function logout() {
  return appwriteAccount.deleteSession({ sessionId: 'current' });
}

export async function getCurrentUser() {
  return appwriteAccount.get();
}

/**
 * Создаёт строку в таблице users, если её ещё нет. Первый пользователь в БД получает isAdmin: true.
 */
export async function ensureUserProfile(userId: string): Promise<void> {
  const tableId = getTableId('users');
  const existing = await appwriteTablesDB.listRows({
    databaseId: appwriteDatabaseId,
    tableId,
    queries: [Query.equal('userId', userId), Query.limit(1)],
  });
  if (existing.total > 0) return;

  const allUsers = await appwriteTablesDB.listRows({
    databaseId: appwriteDatabaseId,
    tableId,
    queries: [Query.limit(1)],
  });
  const isAdmin = allUsers.total === 0;

  await appwriteTablesDB.createRow({
    databaseId: appwriteDatabaseId,
    tableId,
    rowId: ID.unique(),
    data: { userId, isAdmin },
  });
}

/** Возвращает профиль пользователя из БД (userId, isAdmin) или null. */
export async function getUserProfile(userId: string): Promise<AppUser | null> {
  const tableId = getTableId('users');
  const res = await appwriteTablesDB.listRows<Models.Row & AppUser>({
    databaseId: appwriteDatabaseId,
    tableId,
    queries: [Query.equal('userId', userId), Query.limit(1)],
  });
  return res.rows[0] ?? null;
}


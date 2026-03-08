import { ID, Query } from 'appwrite';
import { appwriteAccount, appwriteDatabases, appwriteDatabaseId } from '@api/appwriteClient';
import { getCollectionId } from '../constants/appwriteConfig';
import type { AppUser } from '../types/user';

export async function register(email: string, password: string, name?: string) {
  return appwriteAccount.create(ID.unique(), email, password, name);
}

export async function login(email: string, password: string) {
  return appwriteAccount.createEmailPasswordSession(email, password);
}

export async function logout() {
  return appwriteAccount.deleteSession('current');
}

export async function getCurrentUser() {
  return appwriteAccount.get();
}

/**
 * Создаёт документ в коллекции users, если его ещё нет. Первый пользователь в БД получает isAdmin: true.
 */
export async function ensureUserProfile(userId: string): Promise<void> {
  const collectionId = getCollectionId('users');
  const existing = await appwriteDatabases.listDocuments(
    appwriteDatabaseId,
    collectionId,
    [Query.equal('userId', userId)],
    1,
  );
  if (existing.total > 0) return;

  const allUsers = await appwriteDatabases.listDocuments(
    appwriteDatabaseId,
    collectionId,
    [],
    1,
  );
  const isAdmin = allUsers.total === 0;

  await appwriteDatabases.createDocument(
    appwriteDatabaseId,
    collectionId,
    ID.unique(),
    { userId, isAdmin },
  );
}

/** Возвращает профиль пользователя из БД (userId, isAdmin) или null. */
export async function getUserProfile(userId: string): Promise<AppUser | null> {
  const collectionId = getCollectionId('users');
  const res = await appwriteDatabases.listDocuments<AppUser>(
    appwriteDatabaseId,
    collectionId,
    [Query.equal('userId', userId)],
    1,
  );
  return res.documents[0] ?? null;
}


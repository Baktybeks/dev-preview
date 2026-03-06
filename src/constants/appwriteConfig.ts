export const appwriteConfig = {
  endpoint:
    import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
  projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID || '',
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID || '',
  collections: {
    categories:
      import.meta.env.VITE_APPWRITE_CATEGORIES_COLLECTION_ID || 'categories',
    questions:
      import.meta.env.VITE_APPWRITE_QUESTIONS_COLLECTION_ID || 'questions',
  },
} as const;

export type CollectionName = keyof typeof appwriteConfig.collections;

const requiredEnvVars = [
  'VITE_APPWRITE_ENDPOINT',
  'VITE_APPWRITE_PROJECT_ID',
  'VITE_APPWRITE_DATABASE_ID',
  'VITE_APPWRITE_CATEGORIES_COLLECTION_ID',
  'VITE_APPWRITE_QUESTIONS_COLLECTION_ID',
] as const;

const missingEnvVars = requiredEnvVars.filter(
  (envVar) => !import.meta.env[envVar],
);

if (missingEnvVars.length > 0) {
  // eslint-disable-next-line no-console
  console.warn(
    `⚠️ Отсутствуют необходимые переменные окружения Appwrite: ${missingEnvVars.join(
      ', ',
    )}`,
  );
}

export const getCollectionId = (collectionName: CollectionName): string => {
  const id = appwriteConfig.collections[collectionName];
  if (!id) {
    throw new Error(
      `ID коллекции ${collectionName} не найден в конфигурации Appwrite`,
    );
  }
  return id;
};


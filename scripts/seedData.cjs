// scripts/seedData.cjs (FrontPrep)
// Заполняет коллекции categories и questions данными из JSON
const { Client, Databases, ID } = require('node-appwrite');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const appwriteConfig = {
  endpoint:
    process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
  projectId: process.env.VITE_APPWRITE_PROJECT_ID || '',
  databaseId: process.env.VITE_APPWRITE_DATABASE_ID || '',
  collections: {
    categories:
      process.env.VITE_APPWRITE_CATEGORIES_COLLECTION_ID || 'categories',
    questions:
      process.env.VITE_APPWRITE_QUESTIONS_COLLECTION_ID || 'questions',
  },
};

const client = new Client()
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const checkEnvironment = () => {
  const required = [
    'VITE_APPWRITE_ENDPOINT',
    'VITE_APPWRITE_PROJECT_ID',
    'VITE_APPWRITE_DATABASE_ID',
    'VITE_APPWRITE_CATEGORIES_COLLECTION_ID',
    'VITE_APPWRITE_QUESTIONS_COLLECTION_ID',
    'APPWRITE_API_KEY',
  ];

  const missing = required.filter((env) => !process.env[env]);

  if (missing.length > 0) {
    console.error('❌ Отсутствуют переменные окружения для сидинга:');
    missing.forEach((env) => console.error(`  - ${env}`));
    process.exit(1);
  }

  console.log('✅ Все переменные окружения для сидинга найдены');
};

const loadJson = (filePath) => {
  const absPath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`JSON-файл не найден: ${absPath}`);
  }
  const raw = fs.readFileSync(absPath, 'utf-8');
  return JSON.parse(raw);
};

const seedCategories = async (databaseId, collectionId, categories) => {
  console.log('\n📂 Сидинг категорий...');
  const mapSlugToId = {};

  for (const category of categories) {
    try {
      const documentId = category.id || ID.unique();
      const payload = {
        name: category.name,
        slug: category.slug,
        description: category.description ?? '',
        order: category.order ?? 0,
      };

      const created = await databases.createDocument(
        databaseId,
        collectionId,
        documentId,
        payload,
      );

      mapSlugToId[created.slug] = created.$id;
      console.log(`  ✅ Категория: ${created.name} (${created.slug})`);
    } catch (error) {
      console.error(
        `  ❌ Ошибка при создании категории "${category.slug}":`,
        error.message,
      );
    }
  }

  return mapSlugToId;
};

const seedQuestions = async (
  databaseId,
  collectionId,
  questions,
  categorySlugToId,
) => {
  console.log('\n❓ Сидинг вопросов...');

  for (const question of questions) {
    try {
      const documentId = question.id || ID.unique();

      let categoryId = question.categoryId;
      if (!categoryId && question.categorySlug) {
        categoryId = categorySlugToId[question.categorySlug];
      }

      if (!categoryId) {
        console.warn(
          `  ⚠️ Пропущен вопрос "${question.title}" — не удалось найти categoryId`,
        );
        continue;
      }

      const payload = {
        title: question.title,
        answer: question.answer ?? '',
        difficulty: question.difficulty ?? 'junior',
        categoryId,
      };

      await databases.createDocument(
        databaseId,
        collectionId,
        documentId,
        payload,
      );

      console.log(`  ✅ Вопрос: ${question.title}`);
    } catch (error) {
      console.error(
        `  ❌ Ошибка при создании вопроса "${question.title}":`,
        error.message,
      );
    }
  }
};

const main = async () => {
  console.log('🌱 FrontPrep - сидинг данных из JSON\n');
  checkEnvironment();

  const jsonPath = process.argv[2] || 'scripts/seed/frontprep-seed.json';

  console.log(`📄 Используем JSON-файл: ${jsonPath}`);
  const data = loadJson(jsonPath);

  const databaseId = appwriteConfig.databaseId;
  const categoriesCollectionId = appwriteConfig.collections.categories;
  const questionsCollectionId = appwriteConfig.collections.questions;

  const slugToIdMap = await seedCategories(
    databaseId,
    categoriesCollectionId,
    data.categories || [],
  );

  await seedQuestions(
    databaseId,
    questionsCollectionId,
    data.questions || [],
    slugToIdMap,
  );

  console.log('\n✅ Сидинг завершён');
};

if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Ошибка сидинга:', error);
    process.exit(1);
  });
}


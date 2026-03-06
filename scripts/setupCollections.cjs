// scripts/setupCollections.cjs (FrontPrep)
const { Client, Databases, Permission, Role } = require('node-appwrite');
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

// Схемы коллекций под домен FrontPrep
const COLLECTION_SCHEMAS = {
  categories: {
    name: { type: 'string', required: true, size: 255 },
    slug: { type: 'string', required: true, size: 255 },
    description: { type: 'string', required: false, size: 1000 },
    order: { type: 'integer', required: false, min: 0 },
  },

  questions: {
    title: { type: 'string', required: true, size: 1000 },
    answer: { type: 'string', required: true, size: 10000 },
    difficulty: {
      type: 'enum',
      required: true,
      elements: ['junior', 'middle', 'senior'],
    },
    categoryId: { type: 'string', required: true, size: 36 },
  },
};

const COLLECTION_INDEXES = {
  categories: [
    { key: 'slug', type: 'unique' },
    { key: 'order', type: 'key' },
  ],
  questions: [
    { key: 'categoryId', type: 'key' },
    { key: 'difficulty', type: 'key' },
  ],
};

const client = new Client();
client
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const createAttribute = async (databaseId, collectionId, key, schema) => {
  try {
    const attributeType = schema.type;
    let isRequired = schema.required || false;
    let defaultValue = schema.default;

    if (isRequired && defaultValue !== null && defaultValue !== undefined) {
      console.log(
        `    ⚠️ Исправление ${key}: required=true с default значением -> required=false`,
      );
      isRequired = false;
    }

    switch (attributeType) {
      case 'string':
        return await databases.createStringAttribute({
          databaseId,
          collectionId,
          key,
          size: schema.size || 255,
          required: isRequired,
          default: defaultValue ?? undefined,
          array: schema.array || false,
        });

      case 'email':
        return await databases.createEmailAttribute({
          databaseId,
          collectionId,
          key,
          required: isRequired,
          default: defaultValue ?? undefined,
          array: schema.array || false,
        });

      case 'enum':
        return await databases.createEnumAttribute({
          databaseId,
          collectionId,
          key,
          elements: schema.elements,
          required: isRequired,
          default: defaultValue ?? undefined,
          array: schema.array || false,
        });

      case 'boolean':
        return await databases.createBooleanAttribute({
          databaseId,
          collectionId,
          key,
          required: isRequired,
          default:
            defaultValue !== null && defaultValue !== undefined
              ? defaultValue
              : undefined,
          array: schema.array || false,
        });

      case 'datetime':
        return await databases.createDatetimeAttribute({
          databaseId,
          collectionId,
          key,
          required: isRequired,
          default: defaultValue ?? undefined,
          array: schema.array || false,
        });

      case 'integer':
        return await databases.createIntegerAttribute({
          databaseId,
          collectionId,
          key,
          required: isRequired,
          min: schema.min ?? undefined,
          max: schema.max ?? undefined,
          default: defaultValue ?? undefined,
          array: schema.array || false,
        });

      case 'url':
        return await databases.createUrlAttribute({
          databaseId,
          collectionId,
          key,
          required: isRequired,
          default: defaultValue ?? undefined,
          array: schema.array || false,
        });

      default:
        throw new Error(`Неподдерживаемый тип атрибута: ${attributeType}`);
    }
  } catch (error) {
    console.error(`Ошибка создания атрибута ${key}:`, error.message);
    throw error;
  }
};

const createIndex = async (databaseId, collectionId, indexConfig) => {
  try {
    return await databases.createIndex({
      databaseId,
      collectionId,
      key: indexConfig.key,
      type: indexConfig.type,
      attributes: indexConfig.attributes || [indexConfig.key],
      orders: indexConfig.orders || ['ASC'],
    });
  } catch (error) {
    console.error(`Ошибка создания индекса ${indexConfig.key}:`, error.message);
    throw error;
  }
};

const setupCollections = async () => {
  try {
    console.log('🚀 Начинаем создание коллекций FrontPrep...');
    console.log(
      '📋 Всего коллекций для создания:',
      Object.keys(COLLECTION_SCHEMAS).length,
    );

    const databaseId = appwriteConfig.databaseId;

    if (!databaseId) {
      throw new Error('Database ID не найден! Проверьте переменные окружения.');
    }

    for (const [collectionName, schema] of Object.entries(COLLECTION_SCHEMAS)) {
      console.log(`\n📁 Создание коллекции: ${collectionName}`);

      try {
        const collectionId = appwriteConfig.collections[collectionName];

        await databases.createCollection({
          databaseId,
          collectionId,
          name: collectionName,
          permissions: [
            // Публичное чтение, запись/обновление/удаление только для авторизованных
            Permission.read(Role.any()),
            Permission.create(Role.users()),
            Permission.update(Role.users()),
            Permission.delete(Role.users()),
          ],
          documentSecurity: true,
        });

        console.log(
          `  ✅ Коллекция ${collectionName} создана (ID: ${collectionId})`,
        );

        console.log('  📝 Добавление атрибутов...');
        let attributeCount = 0;

        for (const [attributeKey, attributeSchema] of Object.entries(schema)) {
          try {
            await createAttribute(
              databaseId,
              collectionId,
              attributeKey,
              attributeSchema,
            );
            attributeCount++;
            console.log(`    ✅ ${attributeKey} (${attributeSchema.type})`);
            await new Promise((resolve) => setTimeout(resolve, 500));
          } catch (error) {
            console.error(`    ❌ ${attributeKey}: ${error.message}`);
          }
        }

        console.log(
          `  📊 Создано атрибутов: ${attributeCount}/${
            Object.keys(schema).length
          }`,
        );

        if (COLLECTION_INDEXES[collectionName]) {
          console.log('  🔍 Создание индексов...');
          let indexCount = 0;

          for (const indexConfig of COLLECTION_INDEXES[collectionName]) {
            try {
              await createIndex(databaseId, collectionId, indexConfig);
              indexCount++;
              console.log(`    ✅ Индекс: ${indexConfig.key}`);
              await new Promise((resolve) => setTimeout(resolve, 500));
            } catch (error) {
              console.error(
                `    ❌ Индекс ${indexConfig.key}: ${error.message}`,
              );
            }
          }

          console.log(
            `  📈 Создано индексов: ${indexCount}/${
              COLLECTION_INDEXES[collectionName].length
            }`,
          );
        }
      } catch (error) {
        console.error(
          `❌ Ошибка создания коллекции ${collectionName}:`,
          error.message,
        );
      }
    }

    console.log('\n🎉 Настройка коллекций FrontPrep завершена!');
    console.log('🔗 Откройте консоль Appwrite для проверки результата.');
  } catch (error) {
    console.error('💥 Общая ошибка:', error.message);
    console.log('\n🔍 Проверьте:');
    console.log('- Переменные окружения в .env.local');
    console.log('- Права доступа API ключа');
    console.log('- Подключение к интернету');
  }
};

const resetCollections = async () => {
  try {
    console.log('🗑️ Удаление существующих коллекций FrontPrep...');

    const databaseId = appwriteConfig.databaseId;
    let deletedCount = 0;

    for (const [collectionName] of Object.entries(COLLECTION_SCHEMAS)) {
      try {
        const collectionId = appwriteConfig.collections[collectionName];
        await databases.deleteCollection({ databaseId, collectionId });
        deletedCount++;
        console.log(`✅ ${collectionName} удалена`);
      } catch (error) {
        console.log(`⚠️ ${collectionName} не найдена или уже удалена`);
      }
    }

    console.log(`🧹 Удалено коллекций: ${deletedCount}`);
  } catch (error) {
    console.error('Ошибка при удалении коллекций:', error.message);
  }
};

const deleteAttribute = async () => {
  const databaseId = appwriteConfig.databaseId;
  const collectionId = appwriteConfig.collections.questions;
  const attributeId = 'legacyField';

  try {
    await databases.deleteAttribute({
      databaseId,
      collectionId,
      key: attributeId,
    });
    console.log(`✅ Атрибут "${attributeId}" успешно удалён`);
  } catch (error) {
    console.error(
      `❌ Ошибка при удалении атрибута "${attributeId}":`,
      error.message,
    );
  }
};

const checkEnvironment = () => {
  const required = [
    'VITE_APPWRITE_ENDPOINT',
    'VITE_APPWRITE_PROJECT_ID',
    'VITE_APPWRITE_DATABASE_ID',
    'APPWRITE_API_KEY',
  ];

  const missing = required.filter((env) => !process.env[env]);

  if (missing.length > 0) {
    console.error('❌ Отсутствуют переменные окружения:');
    missing.forEach((env) => console.error(`  - ${env}`));
    console.log('\n💡 Создайте файл .env.local с необходимыми переменными');
    process.exit(1);
  }

  console.log('✅ Все переменные окружения найдены');
};

const main = async () => {
  console.log('🔧 FrontPrep - Настройка базы данных\n');

  checkEnvironment();

  const command = process.argv[2];

  switch (command) {
    case 'setup':
      await setupCollections();
      break;
    case 'reset':
      await resetCollections();
      break;
    case 'deleteAttribute':
      await deleteAttribute();
      break;
    case 'reset-setup':
      await resetCollections();
      console.log('\n⏳ Ожидание 3 секунды перед созданием...');
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await setupCollections();
      break;
    default:
      console.log('📖 Использование:');
      console.log(
        '  node scripts/setupCollections.cjs setup        - Создать коллекции',
      );
      console.log(
        '  node scripts/setupCollections.cjs reset        - Удалить коллекции',
      );
      console.log(
        '  node scripts/setupCollections.cjs reset-setup  - Пересоздать коллекции',
      );
      break;
  }
};

if (require.main === module) {
  main().catch(console.error);
}


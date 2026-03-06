// scripts/testConnection.cjs (FrontPrep)
const { Client, Databases } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const testConnection = async () => {
  try {
    console.log('🔍 FrontPrep: тест подключения к Appwrite...\n');

    const client = new Client();
    client
      .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
      .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);

    console.log('📡 Проверка подключения...');
    const databasesList = await databases.list();
    console.log('✅ Подключение успешно!');
    console.log(`📊 Найдено баз данных: ${databasesList.total}`);

    const targetDb = databasesList.databases.find(
      (db) => db.$id === process.env.VITE_APPWRITE_DATABASE_ID,
    );

    if (targetDb) {
      console.log(`✅ База данных найдена: "${targetDb.name}" (${targetDb.$id})`);

      const collections = await databases.listCollections(targetDb.$id);
      console.log(`📋 Коллекций в базе: ${collections.total}`);

      if (collections.total > 0) {
        console.log('\n📚 Список коллекций:');
        collections.collections.forEach((collection) => {
          console.log(`  - ${collection.name} (${collection.$id})`);
        });
      }
    } else {
      console.log('⚠️ База данных не найдена!');
      console.log('💡 Убедитесь, что VITE_APPWRITE_DATABASE_ID корректен');
    }

    console.log('\n🎉 Тест завершен успешно!');
  } catch (error) {
    console.error('❌ Ошибка подключения:', error.message);
    console.log('\n🔍 Возможные причины:');
    console.log('- Неверный API ключ');
    console.log('- Неверный Project ID');
    console.log('- Недостаточно прав у API ключа');
    console.log('- Проблемы с сетью');

    console.log('\n📝 Проверьте переменные окружения:');
    console.log(`  APPWRITE_ENDPOINT: ${process.env.VITE_APPWRITE_ENDPOINT}`);
    console.log(`  PROJECT_ID: ${process.env.VITE_APPWRITE_PROJECT_ID}`);
    console.log(`  DATABASE_ID: ${process.env.VITE_APPWRITE_DATABASE_ID}`);
    console.log(
      `  API_KEY: ${process.env.APPWRITE_API_KEY ? '***скрыт***' : 'НЕ ЗАДАН'}`,
    );
  }
};

testConnection();


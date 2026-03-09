## Appwrite DB schema (Tables)

Ниже — логическая схема основных таблиц Appwrite, которые используются приложением.  
Точные ID таблиц настраиваются в `src/constants/appwriteConfig.ts` и `scripts/setupCollections.cjs`.

---

## Таблица `users`

**Назначение**: профиль пользователя и его роль.

- `userId: string` — ID пользователя из Appwrite Auth (`user.$id`), **уникальный**.
- `email?: string` — последняя известная почта (для отображения в админке).
- `isAdmin: boolean` — роль администратора.
- Стандартные поля Appwrite:
  - `$id`, `$createdAt`, `$updatedAt`.

**Индексы (рекомендуется)**:
- уникальный индекс по `userId`;
- индекс по `isAdmin` (для выборок админов).

---

## Таблица `categories`

**Назначение**: разделы/темы вопросов.

- `name: string` — человекочитаемое название (например, `JavaScript Core`).
- `slug: string` — машиночитаемый идентификатор (например, `javascript-core`), **уникален**.
- `order: number` — порядок сортировки в списке.

**Индексы**:
- уникальный индекс по `slug`;
- индекс по `order`.

---

## Таблица `questions`

**Назначение**: вопросы для собеседований.

- `title: string` — текст вопроса.
- `answer: string` — подробный ответ/объяснение (markdown‑friendly текст).
- `categoryId: string` — ссылка на запись в `categories.$id`.
- `difficulty: 'easy' | 'medium' | 'hard'` — сложность.
- `tags?: string[]` — массив тегов (строки).

**Индексы**:
- индекс по `categoryId` (фильтрация по категории).
- индекс по `difficulty`.
- опционально — фуллтекстовый индекс по `title`/`answer` (если поддерживается и потребуется перенос поиска на сервер).

---

## Таблица `user_question_status`

**Назначение**: прогресс пользователя по вопросам.

- `userId: string` — `users.userId`.
- `questionId: string` — `questions.$id`.
- `status: string` — удобный для фронта статус (например, `new`, `in_progress`, `done`, `again` и т.п. — см. реализацию в `progressApi`).

**Индексы**:
- составной индекс `(userId, questionId)` — должен быть **уникальным**;
- индекс по `userId` (для выборок всех статусов пользователя).

---

## Таблица `favorites`

**Назначение**: избранные вопросы пользователя.

- `userId: string` — `users.userId`.
- `questionId: string` — `questions.$id`.

**Индексы**:
- составной индекс `(userId, questionId)` — **уникальный**;
- индекс по `userId`.

---

## Связи (логические)

- `users (1) — (N) user_question_status` по `userId`.
- `users (1) — (N) favorites` по `userId`.
- `categories (1) — (N) questions` по `categoryId`.
- `questions (1) — (N) user_question_status` по `questionId`.
- `questions (1) — (N) favorites` по `questionId`.

Appwrite не поддерживает foreign keys как в классических SQL‑БД, поэтому:
- ссылочная целостность обеспечивается приложением и скриптами миграции;
- при удалении категорий/вопросов рекомендуется использовать soft‑delete или каскадные чистки через вспомогательные скрипты.

---

## Скрипты и конфигурация

- **`scripts/setupCollections.cjs`**
  - Создание БД/таблиц/атрибутов/индексов.
  - Поддержка сценариев: `setup`, `reset`, `deleteAttribute`, `reset-setup` и др.

- **`scripts/seedData.cjs`**
  - Первичное наполнение (`categories`, `questions`, базовые пользователи/статусы при необходимости).

- **`src/constants/appwriteConfig.ts`**
  - ID базы (`appwriteDatabaseId`);
  - функции `getTableId(name: 'users' | 'categories' | 'questions' | 'user_question_status' | 'favorites')`.

При изменении схемы:
1. Обновите `setupCollections.cjs` (атрибуты, индексы).
2. Обновите типы в `src/types/*`.
3. Обновите API‑слой в `src/api/*`.
4. При необходимости мигрируйте данные (отдельный скрипт).


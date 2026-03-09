## API overview

В качестве backend‑платформы используется **Appwrite** (Tables).  
Фронтенд общается с ним только через слой `src/api/*`, поэтому внешняя «API‑спецификация» = набор этих функций.

Ниже — высокоуровневое описание основных модулей.

---

## Auth API (`src/api/authApi.ts`)

- **`getCurrentUser(): Promise<Models.User | null>`**
  - Получает текущего пользователя из Appwrite (Session API).

- **`ensureUserProfile(userId: string, email?: string): Promise<void>`**
  - Создаёт профиль пользователя в таблице `users`, если его ещё нет.
  - Первый пользователь в БД получает `isAdmin: true`.

- **`getUserProfile(userId: string): Promise<AppUser | null>`**
  - Возвращает профиль (`userId`, `isAdmin`, опционально `email`).

- **`logout(): Promise<void>`**
  - Завершает текущую сессию.

---

## Questions API (`src/api/questionsApi.ts`)

- **`getCategories(): Promise<{ total: number; documents: Category[] }>`**
  - Таблица: `categories`.
  - Сортировка по полю `order` по возрастанию.

- **`getQuestionsByCategory(categoryId, offset?, limit?): Promise<{ total; documents: Question[] }>`**
  - Таблица: `questions`.
  - Фильтр `categoryId`, оффсет + лимит.
  - Используется для пользовательского списка вопросов с infinite scroll.

- **`getQuestionsByIds(ids: string[]): Promise<Question[]>`**
  - Таблица: `questions`.
  - Фильтр `Query.equal('$id', ids)`.

---

## Progress API (`src/api/progressApi.ts`)

Таблицы: `user_question_status`, `favorites`.

- **Статусы вопросов**
  - `getQuestionStatuses(userId): Promise<Record<QuestionId, Status>>`
  - `setQuestionStatus(userId, questionId, status): Promise<void>`

- **Избранное**
  - `getFavoriteQuestionIds(userId): Promise<string[]>`
  - `addFavorite(userId, questionId): Promise<void>`
  - `removeFavorite(userId, questionId): Promise<void>`

---

## Admin API (`src/api/adminApi.ts`)

Таблицы: `questions`, `categories`, `users`, `user_question_status`, `favorites`.

### Статистика

- **`getTotalUsersCount(): Promise<number>`**
- **`getTotalQuestionsCount(): Promise<number>`**
- **`getUserProgressSummary(userId): Promise<{ answeredCount; favoriteCount }>`**
- **`getStats(): Promise<...>`**
  - Агрегированная статистика для `AdminDashboardScreen`.

### Пользователи

- **`listUsers(): Promise<UserRow[]>`**
  - Список всех пользователей с `isAdmin`, `createdAt`.

- **`listUsersWithStats(): Promise<...[]>`**
  - Пользователи + агрегированная статистика по прогрессу/избранному.

- **`setUserAdmin(rowId: string, isAdmin: boolean): Promise<void>`**
  - Обновляет поле `isAdmin` в таблице `users`.

### Вопросы (админ)

- **`searchQuestions(params): Promise<{ total; documents: Question[] }>`**
  - Фильтры: `query?` (поиск по title/answer), `categoryId?`, `difficulty?`, `offset?`, `limit?`.
  - При отсутствии `query` используется серверная пагинация (offset + limit).

- **CRUD**
  - `createQuestion(data): Promise<Question>`
  - `updateQuestion(id, data): Promise<Question>`
  - `deleteQuestion(id): Promise<void>`

### Импорт вопросов

- **`importQuestions(items, categoryIdMap): Promise<{ created: number; errors: string[] }>`**
  - Вход: массив объектов с полями:
    - `title?` или `question?` — текст вопроса;
    - `answer` — ответ;
    - `category?` / `categorySlug?` — маппятся через `categoryIdMap`;
    - `tags?: string[]`;
    - `difficulty?: string` (`easy` / `medium` / `hard` + алиасы `junior`/`middle`/`senior`).
  - На каждый элемент:
    - проверка категории;
    - нормализация сложности;
    - валидация обязательных полей;
    - создание записи в таблице `questions`.
  - Результат: количество успешно созданных и массив строк‑ошибок.

---

## Error handling & конвенции

- Функции API:
  - обычно пробрасывают исключения дальше (обрабатываются в компонентах или React Query);
  - возвращают типизированные данные (см. `src/types/*`).
- React Query:
  - `queryKey` всегда содержит достаточно контекста (`['questions', categoryId]`, `['adminQuestions', search, categoryFilter, difficultyFilter]` и т.д.);
  - **после мутаций** (`createQuestion`, `updateQuestion`, `deleteQuestion`, `importQuestions`, `setUserAdmin`) всегда выполняется `invalidateQueries(...)`.


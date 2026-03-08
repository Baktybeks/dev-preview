/**
 * В SPA (Vite + React Router) защита маршрутов /admin выполняется на клиенте:
 * см. компонент AdminGuard (src/components/admin/AdminGuard.tsx).
 *
 * AdminGuard:
 * - Проверяет наличие сессии Appwrite (user из authStore).
 * - Проверяет роль через профиль в БД (profile.isAdmin из таблицы users).
 * - При отсутствии сессии или роли admin — редирект на /?error=forbidden.
 * - Защищает все маршруты /admin/* (вложенные роты рендерятся через Outlet).
 *
 * Серверный middleware для проверки сессии/роли в этом проекте не используется:
 * сессия хранится в Appwrite (localStorage/cookies на стороне клиента).
 */

export {};

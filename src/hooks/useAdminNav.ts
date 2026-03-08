import { useAuthStore } from '@store/authStore';

/**
 * Определяет, показывать ли в навигации ссылку «Админка» вместо «Профиль».
 * Если пользователь авторизован и его роль admin — показываем «Админка» (ссылка на /admin).
 */
export function useAdminNav(): {
  tabLabel: 'Админка' | 'Профиль';
  tabTo: '/admin' | '/profile';
} {
  const { user, profile } = useAuthStore();
  const isAdmin = Boolean(profile?.isAdmin);

  if (user && isAdmin) {
    return { tabLabel: 'Админка', tabTo: '/admin' };
  }
  return { tabLabel: 'Профиль', tabTo: '/profile' };
}

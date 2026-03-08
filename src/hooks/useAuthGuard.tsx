import { useState, useCallback } from 'react';
import { useAuthStore } from '@store/authStore';
import { AuthGuardModal } from '@components/auth/AuthGuardModal';

/**
 * Хук для действий, требующих авторизации (избранное, «знаю»/«не знаю»).
 * Если пользователь не авторизован — показывается модалка с предложением войти.
 * Если авторизован — выполняется переданная функция.
 */
export function useAuthGuard() {
  const { user } = useAuthStore();
  const [showModal, setShowModal] = useState(false);

  const requireAuth = useCallback(
    (action: () => void | Promise<void>) => {
      if (!user) {
        setShowModal(true);
        return;
      }
      void Promise.resolve(action()).catch(() => {});
    },
    [user],
  );

  const modal = showModal ? (
    <AuthGuardModal onClose={() => setShowModal(false)} />
  ) : null;

  return { requireAuth, isAuthenticated: !!user, modal, userId: user?.$id ?? null };
}

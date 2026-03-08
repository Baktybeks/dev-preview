import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@store/authStore';

/**
 * Защита маршрутов /admin: проверка сессии Appwrite и роли (profile.isAdmin).
 * При отсутствии сессии или роли admin — редирект на /?error=forbidden.
 */
export const AdminGuard: React.FC = () => {
  const { user, profile, isChecked } = useAuthStore();
  const location = useLocation();

  if (!isChecked) {
    return (
      <div className="content-section" style={{ padding: '24px 16px', textAlign: 'center' }}>
        Загрузка…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/?error=forbidden" replace state={{ from: location }} />;
  }

  if (!profile?.isAdmin) {
    return <Navigate to="/?error=forbidden" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@store/authStore';

type ProtectedRouteProps = {
  children: React.ReactNode;
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isChecked, isLoading, loadUser } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (!isChecked && !isLoading) {
      loadUser();
    }
  }, [isChecked, isLoading, loadUser]);

  if (!isChecked || isLoading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
        Загрузка...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

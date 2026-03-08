import React, { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { BottomTabLayout } from '@components/layout/BottomTabLayout';
import { AdminGuard } from '@components/admin/AdminGuard';
import { AdminLayout } from '@components/admin/AdminLayout';
import { useAuthStore } from '@store/authStore';

const HomeScreen = lazy(() =>
  import('@screens/Home/HomeScreen').then((m) => ({ default: m.HomeScreen })),
);
const LoginScreen = lazy(() =>
  import('@screens/Auth/LoginScreen').then((m) => ({ default: m.LoginScreen })),
);
const RegisterScreen = lazy(() =>
  import('@screens/Auth/RegisterScreen').then((m) => ({ default: m.RegisterScreen })),
);
const CategoriesScreen = lazy(() =>
  import('@screens/Categories/CategoriesScreen').then((m) => ({ default: m.CategoriesScreen })),
);
const QuestionsScreen = lazy(() =>
  import('@screens/Questions/QuestionsScreen').then((m) => ({ default: m.QuestionsScreen })),
);
const ProfileScreen = lazy(() =>
  import('@screens/Profile/ProfileScreen').then((m) => ({ default: m.ProfileScreen })),
);
const ProgressScreen = lazy(() =>
  import('@screens/Progress/ProgressScreen').then((m) => ({ default: m.ProgressScreen })),
);
const AdminDashboardScreen = lazy(() =>
  import('@screens/Admin/AdminDashboardScreen').then((m) => ({ default: m.AdminDashboardScreen })),
);
const AdminQuestionsScreen = lazy(() =>
  import('@screens/Admin/AdminQuestionsScreen').then((m) => ({ default: m.AdminQuestionsScreen })),
);
const AdminUsersScreen = lazy(() =>
  import('@screens/Admin/AdminUsersScreen').then((m) => ({ default: m.AdminUsersScreen })),
);

export const App: React.FC = () => {
  const { loadUser, isChecked } = useAuthStore();

  useEffect(() => {
    if (!isChecked) loadUser();
  }, [isChecked, loadUser]);

  return (
    <Suspense fallback={<div style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>Загрузка…</div>}>
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterScreen />} />
        <Route element={<BottomTabLayout />}>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/categories" element={<CategoriesScreen />} />
          <Route path="/categories/:id/questions" element={<QuestionsScreen />} />
          <Route path="/progress" element={<ProgressScreen />} />
          <Route path="/favorites" element={<Navigate to="/progress" replace />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="/admin" element={<AdminGuard />}>
            <Route element={<AdminLayout />}>
              <Route index element={<AdminDashboardScreen />} />
              <Route path="questions" element={<AdminQuestionsScreen />} />
              <Route path="users" element={<AdminUsersScreen />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default App;


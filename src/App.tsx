import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { HomeScreen } from '@screens/Home/HomeScreen';
import { LoginScreen } from '@screens/Auth/LoginScreen';
import { RegisterScreen } from '@screens/Auth/RegisterScreen';
import { CategoriesScreen } from '@screens/Categories/CategoriesScreen';
import { QuestionsScreen } from '@screens/Questions/QuestionsScreen';
import { ProfileScreen } from '@screens/Profile/ProfileScreen';
import { BottomTabLayout } from '@components/layout/BottomTabLayout';

export const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/register" element={<RegisterScreen />} />

      <Route element={<BottomTabLayout />}>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/categories" element={<CategoriesScreen />} />
        <Route path="/categories/:id/questions" element={<QuestionsScreen />} />
        <Route path="/profile" element={<ProfileScreen />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;


import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAdminNav } from '@hooks/useAdminNav';

import './BottomTabLayout.css';

export const BottomTabLayout: React.FC = () => {
  const { tabLabel, tabTo } = useAdminNav();

  return (
    <div className="app-shell">
      <main className="app-content">
        <Outlet />
      </main>
      <nav className="bottom-tabs">
        <NavLink to="/" end className="tab-link">
          Главная
        </NavLink>
        <NavLink to="/categories" className="tab-link">
          Категории
        </NavLink>
        <NavLink to="/progress" className="tab-link">
          Прогресс
        </NavLink>
        <NavLink
          to={tabTo}
          end={tabTo === '/profile'}
          className={({ isActive }) => 'tab-link' + (isActive ? ' active' : '')}
        >
          {tabLabel}
        </NavLink>
      </nav>
    </div>
  );
};


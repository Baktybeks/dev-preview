import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

import './BottomTabLayout.css';

export const BottomTabLayout: React.FC = () => {
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
        <NavLink to="/profile" className="tab-link">
          Профиль
        </NavLink>
      </nav>
    </div>
  );
};


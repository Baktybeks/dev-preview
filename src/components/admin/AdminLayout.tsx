import React from 'react';
import { Outlet, Link, NavLink } from 'react-router-dom';

const layoutStyle: React.CSSProperties = {
  padding: '24px 16px',
  maxWidth: '900px',
  margin: '0 auto',
};

const headerStyle: React.CSSProperties = {
  marginBottom: '16px',
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  flexWrap: 'wrap',
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '24px',
  fontWeight: 600,
};

const backLinkStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#93c5fd',
  textDecoration: 'none',
};

const navStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  marginBottom: '24px',
  flexWrap: 'wrap',
};

const navLinkBase: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: '8px',
  fontSize: '14px',
  color: '#94a3b8',
  textDecoration: 'none',
  border: '1px solid rgba(148, 163, 184, 0.3)',
};

const navLinkActive: React.CSSProperties = {
  ...navLinkBase,
  color: '#93c5fd',
  borderColor: 'rgba(59, 130, 246, 0.5)',
};

export const AdminLayout: React.FC = () => {
  return (
    <div className="content-section--wide" style={layoutStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>Админ-панель</h1>
        <Link to="/profile" style={backLinkStyle}>
          ← В профиль
        </Link>
      </header>
      <nav style={navStyle}>
        <NavLink
          to="/admin"
          end
          style={({ isActive }) => (isActive ? navLinkActive : navLinkBase)}
        >
          Дашборд
        </NavLink>
        <NavLink
          to="/admin/questions"
          style={({ isActive }) => (isActive ? navLinkActive : navLinkBase)}
        >
          Вопросы
        </NavLink>
        <NavLink
          to="/admin/users"
          style={({ isActive }) => (isActive ? navLinkActive : navLinkBase)}
        >
          Пользователи
        </NavLink>
      </nav>
      <Outlet />
    </div>
  );
};

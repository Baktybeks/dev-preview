import React from 'react';
import { Link } from 'react-router-dom';

export const HomeScreen: React.FC = () => {
  return (
    <div style={{ padding: '16px' }}>
      <h1 style={{ marginBottom: '8px' }}>FrontPrep</h1>
      <p style={{ color: '#94a3b8', marginBottom: '24px' }}>
        Вопросы по фронтенду для подготовки к собеседованиям.
      </p>
      <Link
        to="/categories"
        style={{
          display: 'inline-block',
          padding: '14px 24px',
          borderRadius: '12px',
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          color: '#93c5fd',
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        Перейти к категориям →
      </Link>
    </div>
  );
};

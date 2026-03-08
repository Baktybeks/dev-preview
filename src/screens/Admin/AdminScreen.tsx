import React from 'react';

const cardStyle: React.CSSProperties = {
  padding: '20px',
  borderRadius: '12px',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  backgroundColor: 'rgba(30, 41, 59, 0.8)',
  marginBottom: '16px',
};

export const AdminScreen: React.FC = () => {
  return (
    <div>
      <div style={cardStyle}>
        <h2 style={{ margin: '0 0 8px', fontSize: '18px' }}>Добро пожаловать в админ-панель</h2>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>
          Здесь можно управлять контентом и настройками приложения.
        </p>
      </div>
    </div>
  );
};

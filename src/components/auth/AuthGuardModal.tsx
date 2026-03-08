import React from 'react';
import { Link } from 'react-router-dom';

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0,0,0,0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '16px',
};

const modalStyle: React.CSSProperties = {
  backgroundColor: 'rgba(30, 41, 59, 0.98)',
  borderRadius: '16px',
  padding: '24px',
  maxWidth: '340px',
  width: '100%',
  border: '1px solid rgba(148, 163, 184, 0.2)',
};

const linkStyle: React.CSSProperties = {
  display: 'inline-block',
  marginTop: '12px',
  padding: '12px 20px',
  borderRadius: '10px',
  backgroundColor: 'rgba(59, 130, 246, 0.2)',
  color: '#93c5fd',
  textDecoration: 'none',
  fontSize: '15px',
  fontWeight: 500,
  marginRight: '8px',
};

type AuthGuardModalProps = {
  onClose: () => void;
};

export const AuthGuardModal: React.FC<AuthGuardModalProps> = ({ onClose }) => {
  return (
    <div
      style={overlayStyle}
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-guard-title"
    >
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h2
          id="auth-guard-title"
          style={{ margin: '0 0 8px', fontSize: '18px' }}
        >
          Войдите в аккаунт
        </h2>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>
          Чтобы отмечать вопросы как изученные и добавлять в избранное,
          войдите или зарегистрируйтесь.
        </p>
        <div style={{ marginTop: '20px' }}>
          <Link to="/login" style={linkStyle} onClick={onClose}>
            Войти
          </Link>
          <Link to="/register" style={linkStyle} onClick={onClose}>
            Регистрация
          </Link>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            marginTop: '16px',
            padding: '8px 0',
            background: 'none',
            border: 'none',
            color: '#64748b',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          Закрыть
        </button>
      </div>
    </div>
  );
};

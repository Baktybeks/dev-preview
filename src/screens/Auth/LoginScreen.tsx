import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { login, ensureUserProfile } from '@api/authApi';
import { useAuthStore } from '@store/authStore';

const formStyle: React.CSSProperties = {
  padding: '24px 16px',
  maxWidth: '400px',
  margin: '0 auto',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  marginBottom: '12px',
  borderRadius: '10px',
  border: '1px solid rgba(148, 163, 184, 0.3)',
  backgroundColor: 'rgba(30, 41, 59, 0.8)',
  color: '#e2e8f0',
  fontSize: '16px',
  boxSizing: 'border-box',
};

const buttonStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px',
  marginTop: '8px',
  borderRadius: '10px',
  border: 'none',
  backgroundColor: '#3b82f6',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 600,
  cursor: 'pointer',
};

const linkStyle: React.CSSProperties = {
  color: '#93c5fd',
  textDecoration: 'none',
  fontSize: '14px',
  marginTop: '16px',
  display: 'inline-block',
};

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loadUser } = useAuthStore();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/';

  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, from, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      await loadUser();
      const { user: currentUser } = useAuthStore.getState();
      if (currentUser?.$id) await ensureUserProfile(currentUser.$id);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={formStyle}>
      <h1 style={{ marginBottom: '8px', fontSize: '24px' }}>Вход</h1>
      <p style={{ color: '#94a3b8', marginBottom: '24px', fontSize: '14px' }}>
        Войдите в аккаунт FrontPrep
      </p>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
          required
          autoComplete="email"
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
          required
          autoComplete="current-password"
        />
        {error && (
          <p style={{ color: '#f87171', fontSize: '14px', marginBottom: '12px' }}>{error}</p>
        )}
        <button type="submit" style={buttonStyle} disabled={loading}>
          {loading ? 'Вход...' : 'Войти'}
        </button>
      </form>

      <Link to="/register" style={linkStyle}>
        Нет аккаунта? Зарегистрироваться
      </Link>
    </div>
  );
};

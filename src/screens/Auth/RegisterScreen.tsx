import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register, ensureUserProfile } from '@api/authApi';
import { useAuthStore } from '@store/authStore';

const formStyle: React.CSSProperties = {
  padding: '24px 16px',
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

export const RegisterScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, loadUser } = useAuthStore();

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email.trim(), password, name.trim() || undefined);
      await loadUser();
      const { user } = useAuthStore.getState();
      if (user?.$id) await ensureUserProfile(user.$id, email.trim());
      await loadUser();
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={formStyle}>
      <h1 style={{ marginBottom: '8px', fontSize: '24px' }}>Регистрация</h1>
      <p style={{ color: '#94a3b8', marginBottom: '24px', fontSize: '14px' }}>
        Создайте аккаунт FrontPrep
      </p>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Имя (необязательно)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={inputStyle}
          autoComplete="name"
        />
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
          placeholder="Пароль (минимум 8 символов)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
          required
          minLength={8}
          autoComplete="new-password"
        />
        {error && (
          <p style={{ color: '#f87171', fontSize: '14px', marginBottom: '12px' }}>{error}</p>
        )}
        <button type="submit" style={buttonStyle} disabled={loading}>
          {loading ? 'Регистрация...' : 'Зарегистрироваться'}
        </button>
      </form>

      <Link to="/login" style={linkStyle}>
        Уже есть аккаунт? Войти
      </Link>
    </div>
  );
};

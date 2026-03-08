import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@store/authStore';
import { getQuestionStatuses } from '@api/progressApi';
import { getFavoriteQuestionIds } from '@api/progressApi';
import { getTotalQuestionsCount } from '@api/questionsApi';

const sectionStyle: React.CSSProperties = {
  padding: '24px 16px',
};

const cardStyle: React.CSSProperties = {
  padding: '20px',
  borderRadius: '12px',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  backgroundColor: 'rgba(30, 41, 59, 0.8)',
  marginBottom: '20px',
};

const buttonStyle: React.CSSProperties = {
  padding: '12px 20px',
  borderRadius: '10px',
  border: '1px solid rgba(248, 113, 113, 0.5)',
  backgroundColor: 'transparent',
  color: '#f87171',
  fontSize: '15px',
  cursor: 'pointer',
  marginTop: '16px',
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
};

export const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
  };

  if (!user) {
    return (
      <div className="content-section" style={sectionStyle}>
        <h1 style={{ marginBottom: '20px', fontSize: '24px' }}>Профиль</h1>
        <div style={cardStyle}>
          <p style={{ margin: '0 0 16px', color: '#94a3b8' }}>
            Войдите, чтобы сохранять прогресс по вопросам и избранное.
          </p>
          <Link to="/login" style={linkStyle}>
            Войти
          </Link>
          <Link
            to="/register"
            style={{ ...linkStyle, marginLeft: '12px' }}
          >
            Зарегистрироваться
          </Link>
        </div>
      </div>
    );
  }

  const { data: statusMap = {} } = useQuery({
    queryKey: ['questionStatuses', user.$id],
    queryFn: () => getQuestionStatuses(user.$id),
    enabled: !!user?.$id,
  });
  const { data: favoriteIds = [] } = useQuery({
    queryKey: ['favoriteIds', user.$id],
    queryFn: () => getFavoriteQuestionIds(user.$id),
    enabled: !!user?.$id,
  });
  const { data: totalQuestions = 0 } = useQuery({
    queryKey: ['totalQuestionsCount'],
    queryFn: getTotalQuestionsCount,
  });

  const statuses = Object.values(statusMap);
  const knowCount = statuses.filter((s) => s === 'know').length;
  const dontKnowCount = statuses.filter((s) => s === 'dont_know').length;
  const progressPercent =
    totalQuestions > 0 ? Math.round((knowCount / totalQuestions) * 100) : 0;

  return (
    <div style={sectionStyle}>
      <h1 style={{ marginBottom: '20px', fontSize: '24px' }}>Профиль</h1>

      {/* Статистика */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 12px', fontSize: '16px' }}>Прогресс</h3>
        <div
          style={{
            height: '10px',
            borderRadius: '5px',
            backgroundColor: 'rgba(148, 163, 184, 0.2)',
            overflow: 'hidden',
            marginBottom: '12px',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progressPercent}%`,
              backgroundColor: '#22c55e',
              borderRadius: '5px',
              transition: 'width 0.2s ease',
            }}
          />
        </div>
        <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8' }}>
          Изучено: <strong style={{ color: '#86efac' }}>{knowCount}</strong> из{' '}
          <strong>{totalQuestions}</strong> вопросов ({progressPercent}%)
        </p>
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
          Не знаю: {dontKnowCount} · В избранном: {favoriteIds.length}
        </p>
        <Link
          to="/progress"
          style={{
            ...linkStyle,
            marginTop: '12px',
            display: 'inline-block',
          }}
        >
          Перейти к прогрессу →
        </Link>
      </div>

      <div style={cardStyle}>
        <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#64748b' }}>Email</p>
        <p style={{ margin: 0, fontSize: '16px', color: '#e2e8f0' }}>{user.email}</p>
        {user.name && (
          <>
            <p style={{ margin: '12px 0 4px', fontSize: '13px', color: '#64748b' }}>Имя</p>
            <p style={{ margin: 0, fontSize: '16px', color: '#e2e8f0' }}>{user.name}</p>
          </>
        )}
        <button type="button" onClick={handleLogout} style={buttonStyle}>
          Выйти
        </button>
      </div>
    </div>
  );
};

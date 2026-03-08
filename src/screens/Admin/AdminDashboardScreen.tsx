import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getStats } from '@api/adminApi';
import { getQuestionsByIds } from '@api/questionsApi';

const cardStyle: React.CSSProperties = {
  padding: '20px',
  borderRadius: '12px',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  backgroundColor: 'rgba(30, 41, 59, 0.8)',
  marginBottom: '16px',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
  gap: '16px',
  marginBottom: '24px',
};

const chartBarStyle = (height: number, max: number): React.CSSProperties => ({
  height: max > 0 ? `${Math.max(4, (height / max) * 80)}px` : '4px',
  minWidth: '12px',
  backgroundColor: '#3b82f6',
  borderRadius: '4px',
});

export const AdminDashboardScreen: React.FC = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: getStats,
  });

  const knowIds = stats?.topByKnow.slice(0, 5).map((t) => t.questionId) ?? [];
  const favIds = stats?.topByFavorites.slice(0, 5).map((t) => t.questionId) ?? [];

  const { data: knowQuestions = [] } = useQuery({
    queryKey: ['questionsByIds', knowIds],
    queryFn: () => getQuestionsByIds(knowIds),
    enabled: knowIds.length > 0,
  });
  const { data: favQuestions = [] } = useQuery({
    queryKey: ['questionsByIds', favIds],
    queryFn: () => getQuestionsByIds(favIds),
    enabled: favIds.length > 0,
  });

  if (isLoading || !stats) {
    return (
      <div style={cardStyle}>
        <p style={{ margin: 0, color: '#94a3b8' }}>Загрузка статистики…</p>
      </div>
    );
  }

  const knowMap = Object.fromEntries(knowQuestions.map((q) => [q.$id, q.title]));
  const favMap = Object.fromEntries(favQuestions.map((q) => [q.$id, q.title]));
  const maxActivity = Math.max(1, ...stats.activityByDay.map((d) => d.count));

  return (
    <div>
      <h2 style={{ margin: '0 0 16px', fontSize: '18px' }}>Дашборд (статистика)</h2>

      <div style={gridStyle}>
        <div style={cardStyle}>
          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>
            Пользователей
          </div>
          <div style={{ fontSize: '24px', fontWeight: 600 }}>{stats.totalUsers}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>
            Вопросов на платформе
          </div>
          <div style={{ fontSize: '24px', fontWeight: 600 }}>{stats.totalQuestions}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 12px', fontSize: '14px', color: '#94a3b8' }}>
            Топ вопросов по «знаю»
          </h3>
          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#cbd5e1' }}>
            {stats.topByKnow.slice(0, 5).map((t) => (
              <li key={t.questionId} style={{ marginBottom: '4px' }}>
                {knowMap[t.questionId] ?? t.questionId} — <strong>{t.count}</strong>
              </li>
            ))}
            {stats.topByKnow.length === 0 && <li>Нет данных</li>}
          </ul>
        </div>
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 12px', fontSize: '14px', color: '#94a3b8' }}>
            Топ по избранному
          </h3>
          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#cbd5e1' }}>
            {stats.topByFavorites.slice(0, 5).map((t) => (
              <li key={t.questionId} style={{ marginBottom: '4px' }}>
                {favMap[t.questionId] ?? t.questionId} — <strong>{t.count}</strong>
              </li>
            ))}
            {stats.topByFavorites.length === 0 && <li>Нет данных</li>}
          </ul>
        </div>
      </div>

      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 12px', fontSize: '14px', color: '#94a3b8' }}>
          Активность (по дням)
        </h3>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '4px',
            height: '100px',
            overflowX: 'auto',
          }}
        >
          {stats.activityByDay.map((d) => (
            <div
              key={d.date}
              title={`${d.date}: ${d.count}`}
              style={chartBarStyle(d.count, maxActivity)}
            />
          ))}
          {stats.activityByDay.length === 0 && (
            <span style={{ fontSize: '13px', color: '#64748b' }}>Нет данных за период</span>
          )}
        </div>
      </div>
    </div>
  );
};

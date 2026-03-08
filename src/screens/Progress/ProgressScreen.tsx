import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCategories, getQuestionsByIds } from '../../api/questionsApi';
import {
  getFavoriteQuestionIds,
  getQuestionStatuses,
  setQuestionStatus,
  addFavorite,
  removeFavorite,
  type QuestionStatus,
} from '../../api/progressApi';
import { useAuthGuard } from '@hooks/useAuthGuard';
import type { Question } from '../../types/question';

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: 'Легко',
  medium: 'Средне',
  hard: 'Сложно',
};

const btnStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid rgba(148, 163, 184, 0.3)',
  background: 'transparent',
  color: '#94a3b8',
  fontSize: '13px',
  cursor: 'pointer',
};

type Section = 'favorites' | 'know' | 'dont_know';

export const ProgressScreen: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>(null);
  const [section, setSection] = useState<Section>('favorites');
  const queryClient = useQueryClient();
  const { requireAuth, modal, userId } = useAuthGuard();

  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });
  const categories = catData?.documents ?? [];

  const { data: favoriteIds = [] } = useQuery({
    queryKey: ['favoriteIds', userId],
    queryFn: () => getFavoriteQuestionIds(userId!),
    enabled: !!userId,
  });

  const { data: statusMap = {} } = useQuery({
    queryKey: ['questionStatuses', userId],
    queryFn: () => getQuestionStatuses(userId!),
    enabled: !!userId,
  });

  const knowIds = useMemo(
    () => Object.keys(statusMap).filter((id) => statusMap[id] === 'know'),
    [statusMap],
  );
  const dontKnowIds = useMemo(
    () => Object.keys(statusMap).filter((id) => statusMap[id] === 'dont_know'),
    [statusMap],
  );

  const { data: favoriteQuestions = [] } = useQuery({
    queryKey: ['questionsByIds', favoriteIds],
    queryFn: () => getQuestionsByIds(favoriteIds),
    enabled: !!userId && favoriteIds.length > 0,
  });

  const { data: knowQuestions = [] } = useQuery({
    queryKey: ['questionsByIds', knowIds],
    queryFn: () => getQuestionsByIds(knowIds),
    enabled: knowIds.length > 0,
  });

  const { data: dontKnowQuestions = [] } = useQuery({
    queryKey: ['questionsByIds', dontKnowIds],
    queryFn: () => getQuestionsByIds(dontKnowIds),
    enabled: dontKnowIds.length > 0,
  });

  const setStatusMutation = useMutation({
    mutationFn: ({
      questionId,
      status,
    }: { questionId: string; status: QuestionStatus }) =>
      setQuestionStatus(userId!, questionId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questionStatuses', userId] });
    },
  });

  const addFavoriteMutation = useMutation({
    mutationFn: (questionId: string) => addFavorite(userId!, questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favoriteIds', userId] });
      queryClient.invalidateQueries({ queryKey: ['questionsByIds'] });
    },
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: (questionId: string) => removeFavorite(userId!, questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favoriteIds', userId] });
      queryClient.invalidateQueries({ queryKey: ['questionsByIds'] });
    },
  });

  const getCategoryName = (categoryId: string) =>
    categories.find((c) => c.$id === categoryId)?.name ?? '';
  const getCategoryOrder = (categoryId: string) =>
    categories.findIndex((c) => c.$id === categoryId);

  const statusOrder = (s?: QuestionStatus) =>
    s === 'dont_know' ? 0 : s === 'know' ? 1 : 2;

  const groupByCategory = (list: Question[]) => {
    const sorted = [...list].sort(
      (a, b) => statusOrder(statusMap[a.$id]) - statusOrder(statusMap[b.$id]),
    );
    const byCategory = sorted.reduce(
      (acc, q) => {
        const id = q.categoryId;
        if (!acc[id]) acc[id] = [];
        acc[id].push(q);
        return acc;
      },
      {} as Record<string, Question[]>,
    );
    return Object.keys(byCategory).sort(
      (a, b) => getCategoryOrder(a) - getCategoryOrder(b),
    ).map((cid) => ({ categoryId: cid, questions: byCategory[cid] }));
  };

  const handleSetStatus = (questionId: string, status: QuestionStatus) => {
    const current = statusMap[questionId];
    const next = current === status ? 'unanswered' : status;
    requireAuth(() => setStatusMutation.mutate({ questionId, status: next }));
  };

  const handleToggleFavorite = (questionId: string) => {
    requireAuth(() => {
      if (favoriteIds.includes(questionId)) {
        removeFavoriteMutation.mutate(questionId);
      } else {
        addFavoriteMutation.mutate(questionId);
      }
    });
  };

  const handleRemoveFavorite = (questionId: string) => {
    requireAuth(() => removeFavoriteMutation.mutate(questionId));
  };

  if (!userId) {
    return (
      <div style={{ padding: '24px 16px', maxWidth: '400px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '16px', fontSize: '24px' }}>Прогресс</h1>
        <div
          style={{
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            backgroundColor: 'rgba(30, 41, 59, 0.8)',
          }}
        >
          <p style={{ margin: 0, color: '#94a3b8' }}>
            Войдите, чтобы видеть избранное и прогресс по вопросам (знаю / не знаю).
          </p>
          <Link
            to="/login"
            style={{
              display: 'inline-block',
              marginTop: '16px',
              padding: '12px 20px',
              borderRadius: '10px',
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              color: '#93c5fd',
              textDecoration: 'none',
              fontSize: '15px',
            }}
          >
            Войти
          </Link>
        </div>
      </div>
    );
  }

  const sectionBtn = (key: Section, label: string) => (
    <button
      type="button"
      onClick={() => setSection(key)}
      style={{
        padding: '10px 16px',
        borderRadius: '10px',
        border: '1px solid rgba(148, 163, 184, 0.3)',
        background: section === key ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
        color: section === key ? '#93c5fd' : '#94a3b8',
        fontSize: '14px',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );

  const currentQuestions =
    section === 'favorites'
      ? favoriteQuestions
      : section === 'know'
        ? knowQuestions
        : dontKnowQuestions;
  const groups = groupByCategory(currentQuestions);

  const emptyMessage =
    section === 'favorites'
      ? 'Пока нет вопросов в избранном. Добавляйте их на странице категорий (☆ В избранное).'
      : section === 'know'
        ? 'Нет вопросов, отмеченных как «Знаю».'
        : 'Нет вопросов, отмеченных как «Не знаю».';

  return (
    <div style={{ padding: '16px', maxWidth: '600px', margin: '0 auto' }}>
      {modal}
      <h1 style={{ marginBottom: '16px', fontSize: '24px' }}>Прогресс</h1>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {sectionBtn('favorites', 'Избранное')}
        {sectionBtn('know', '✓ Знаю')}
        {sectionBtn('dont_know', '✗ Не знаю')}
      </div>
      {currentQuestions.length === 0 ? (
        <p style={{ color: '#94a3b8' }}>{emptyMessage}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {groups.map(({ categoryId: cid, questions: qList }) => (
            <div key={cid}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: '16px',
                    color: '#94a3b8',
                    fontWeight: 600,
                  }}
                >
                  {getCategoryName(cid)}
                </h2>
                <Link
                  to={`/categories/${cid}/questions`}
                  style={{
                    fontSize: '13px',
                    color: '#93c5fd',
                    textDecoration: 'none',
                  }}
                >
                  В категорию →
                </Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {qList.map((q) => (
                  <ProgressItem
                    key={q.$id}
                    question={q}
                    categoryName={getCategoryName(q.categoryId)}
                    isOpen={openId === q.$id}
                    onToggle={() => setOpenId(openId === q.$id ? null : q.$id)}
                    status={statusMap[q.$id]}
                    isFavorite={favoriteIds.includes(q.$id)}
                    onSetStatus={(status) => handleSetStatus(q.$id, status)}
                    onToggleFavorite={() => handleToggleFavorite(q.$id)}
                    onRemoveFavorite={() => handleRemoveFavorite(q.$id)}
                    showRemoveFavorite={section === 'favorites'}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface ProgressItemProps {
  question: Question;
  categoryName: string;
  isOpen: boolean;
  onToggle: () => void;
  status?: QuestionStatus;
  isFavorite: boolean;
  onSetStatus: (status: QuestionStatus) => void;
  onToggleFavorite: () => void;
  onRemoveFavorite: () => void;
  showRemoveFavorite: boolean;
}

const ProgressItem: React.FC<ProgressItemProps> = ({
  question,
  categoryName,
  isOpen,
  onToggle,
  status,
  isFavorite,
  onSetStatus,
  onToggleFavorite,
  onRemoveFavorite,
  showRemoveFavorite,
}) => (
  <div
    style={{
      borderRadius: '12px',
      border: '1px solid rgba(148, 163, 184, 0.2)',
      backgroundColor: 'rgba(30, 41, 59, 0.8)',
      overflow: 'hidden',
    }}
  >
    <button
      type="button"
      onClick={onToggle}
      style={{
        width: '100%',
        padding: '14px 16px',
        textAlign: 'left',
        border: 'none',
        background: 'transparent',
        color: '#e2e8f0',
        fontSize: '15px',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      <span style={{ flex: 1 }}>{question.title}</span>
      <span style={{ fontSize: '12px', color: '#64748b', flexShrink: 0 }}>
        {categoryName}
      </span>
      <span style={{ fontSize: '11px', color: '#64748b' }}>
        {DIFFICULTY_LABEL[question.difficulty] || question.difficulty}
      </span>
      <span style={{ fontSize: '18px', color: '#94a3b8' }}>{isOpen ? '−' : '+'}</span>
    </button>
    {isOpen && (
      <div
        style={{
          padding: '0 16px 16px',
          borderTop: '1px solid rgba(148, 163, 184, 0.15)',
        }}
      >
        <div
          style={{
            paddingTop: '12px',
            fontSize: '14px',
            lineHeight: 1.6,
            color: '#cbd5e1',
            whiteSpace: 'pre-wrap',
          }}
        >
          {question.answer}
        </div>
        <div
          style={{
            marginTop: '14px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            alignItems: 'center',
          }}
        >
          <button
            type="button"
            style={{
              ...btnStyle,
              ...(status === 'know'
                ? {
                    background: 'rgba(34, 197, 94, 0.2)',
                    color: '#86efac',
                    borderColor: 'rgba(34, 197, 94, 0.4)',
                  }
                : {}),
            }}
            onClick={() => onSetStatus('know')}
          >
            ✓ Знаю
          </button>
          <button
            type="button"
            style={{
              ...btnStyle,
              ...(status === 'dont_know'
                ? {
                    background: 'rgba(239, 68, 68, 0.2)',
                    color: '#fca5a5',
                    borderColor: 'rgba(239, 68, 68, 0.4)',
                  }
                : {}),
            }}
            onClick={() => onSetStatus('dont_know')}
          >
            ✗ Не знаю
          </button>
          {showRemoveFavorite ? (
            <button
              type="button"
              style={{ ...btnStyle, color: '#f87171' }}
              onClick={onRemoveFavorite}
            >
              Убрать из избранного
            </button>
          ) : (
            <button
              type="button"
              style={{
                ...btnStyle,
                ...(isFavorite
                  ? { color: '#fbbf24', borderColor: 'rgba(251, 191, 36, 0.5)' }
                  : {}),
              }}
              onClick={onToggleFavorite}
              title={isFavorite ? 'В избранном' : 'В избранное'}
            >
              {isFavorite ? '★ В избранном' : '☆ В избранное'}
            </button>
          )}
        </div>
      </div>
    )}
  </div>
);

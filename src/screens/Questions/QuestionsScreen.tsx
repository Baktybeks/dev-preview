import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getQuestionsByCategory, getCategories, QUESTIONS_PAGE_SIZE } from '../../api/questionsApi';
import {
  getQuestionStatuses,
  getFavoriteQuestionIds,
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

export const QuestionsScreen: React.FC = () => {
  const { id: categoryId } = useParams<{ id: string }>();
  const [openId, setOpenId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { requireAuth, modal, userId } = useAuthGuard();

  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });
  const category = catData?.documents?.find((c) => c.$id === categoryId);

  const {
    data: infiniteData,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['questions', categoryId],
    queryFn: ({ pageParam = 0 }) =>
      getQuestionsByCategory(categoryId!, pageParam, QUESTIONS_PAGE_SIZE),
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((acc, p) => acc + p.documents.length, 0);
      return loaded < lastPage.total ? loaded : undefined;
    },
    initialPageParam: 0,
    enabled: !!categoryId,
  });

  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) fetchNextPage();
      },
      { rootMargin: '200px', threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const { data: statusMap = {} } = useQuery({
    queryKey: ['questionStatuses', userId],
    queryFn: () => getQuestionStatuses(userId!),
    enabled: !!userId,
  });

  const { data: favoriteIds = [] } = useQuery({
    queryKey: ['favoriteIds', userId],
    queryFn: () => getFavoriteQuestionIds(userId!),
    enabled: !!userId,
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
    },
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: (questionId: string) => removeFavorite(userId!, questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favoriteIds', userId] });
    },
  });

  const rawQuestions = infiniteData?.pages.flatMap((p) => p.documents) ?? [];
  const totalCount = infiniteData?.pages[0]?.total ?? 0;
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'know' | 'dont_know' | 'unanswered'
  >('all');

  const statusOrder = (s?: QuestionStatus) =>
    s === 'dont_know' ? 0 : s === 'know' ? 1 : 2;
  const sortedQuestions = [...rawQuestions].sort(
    (a, b) => statusOrder(statusMap[a.$id]) - statusOrder(statusMap[b.$id]),
  );
  const isUnanswered = (q: { $id: string }) => {
    const s = statusMap[q.$id];
    return s === undefined || s === 'unanswered';
  };
  const questions =
    statusFilter === 'all'
      ? sortedQuestions
      : statusFilter === 'unanswered'
        ? sortedQuestions.filter(isUnanswered)
        : sortedQuestions.filter((q) => statusMap[q.$id] === statusFilter);

  const countAll = sortedQuestions.length;
  const countKnow = sortedQuestions.filter((q) => statusMap[q.$id] === 'know').length;
  const countDontKnow = sortedQuestions.filter((q) => statusMap[q.$id] === 'dont_know').length;
  const countUnanswered = sortedQuestions.filter(isUnanswered).length;

  const handleSetStatus = (questionId: string, status: QuestionStatus) => {
    const current = statusMap[questionId];
    const next = current === status ? 'unanswered' : status;
    requireAuth(() => {
      setStatusMutation.mutate({ questionId, status: next });
    });
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

  if (isLoading) {
    return (
      <div style={{ padding: '16px' }}>
        <p>Загрузка...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '16px' }}>
        <p style={{ color: '#f87171' }}>
          Ошибка: {error instanceof Error ? error.message : 'Не удалось загрузить вопросы'}
        </p>
        <Link to="/categories" style={{ color: '#94a3b8' }}>← Категории</Link>
      </div>
    );
  }

  if (!categoryId) {
    return (
      <div style={{ padding: '16px' }}>
        <p>В этой категории пока нет вопросов.</p>
        <Link to="/categories" style={{ color: '#94a3b8' }}>← Категории</Link>
      </div>
    );
  }

  const hasNoQuestions = !isLoading && totalCount === 0;
  if (hasNoQuestions) {
    return (
      <div style={{ padding: '16px' }}>
        <p>В этой категории пока нет вопросов.</p>
        <Link to="/categories" style={{ color: '#94a3b8' }}>← Категории</Link>
      </div>
    );
  }

  const filterBtn = (
    key: 'all' | 'know' | 'dont_know' | 'unanswered',
    label: string,
    count: number,
  ) => (
    <button
      type="button"
      onClick={() => setStatusFilter(key)}
      style={{
        padding: '8px 14px',
        borderRadius: '8px',
        border: '1px solid rgba(148, 163, 184, 0.3)',
        background: statusFilter === key ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
        color: statusFilter === key ? '#93c5fd' : '#94a3b8',
        fontSize: '13px',
        cursor: 'pointer',
      }}
    >
      {label} ({count})
    </button>
  );

  return (
    <div style={{ padding: '16px'}}>
      {modal}
      <Link to="/categories" style={{ color: '#94a3b8', marginBottom: '16px', display: 'block' }}>
        ← Категории
      </Link>
      {category && (
        <h1 style={{ margin: '0 0 16px', fontSize: '20px' }}>
          {category.name}
        </h1>
      )}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {filterBtn('all', 'Все', countAll)}
        {filterBtn('know', '✓ Знаю', countKnow)}
        {filterBtn('dont_know', '✗ Не знаю', countDontKnow)}
        {filterBtn('unanswered', 'Не отмечено', countUnanswered)}
      </div>
      {questions.length === 0 ? (
        <p style={{ color: '#94a3b8' }}>
          Нет вопросов по выбранному фильтру.
        </p>
      ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {questions.map((q) => (
          <AccordionItem
            key={q.$id}
            question={q}
            isOpen={openId === q.$id}
            onToggle={() => setOpenId(openId === q.$id ? null : q.$id)}
            status={statusMap[q.$id]}
            isFavorite={favoriteIds.includes(q.$id)}
            onSetStatus={(status) => handleSetStatus(q.$id, status)}
            onToggleFavorite={() => handleToggleFavorite(q.$id)}
          />
        ))}
        <div ref={sentinelRef} style={{ minHeight: '24px', padding: '8px', textAlign: 'center' }}>
          {isFetchingNextPage && (
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>Загрузка…</span>
          )}
        </div>
      </div>
      )}
    </div>
  );
};

interface AccordionItemProps {
  question: Question;
  isOpen: boolean;
  onToggle: () => void;
  status?: QuestionStatus;
  isFavorite: boolean;
  onSetStatus: (status: QuestionStatus) => void;
  onToggleFavorite: () => void;
}

const btnStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid rgba(148, 163, 184, 0.3)',
  background: 'transparent',
  color: '#94a3b8',
  fontSize: '13px',
  cursor: 'pointer',
};

const AccordionItem: React.FC<AccordionItemProps> = ({
  question,
  isOpen,
  onToggle,
  status,
  isFavorite,
  onSetStatus,
  onToggleFavorite,
}) => {
  return (
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
        {question.tags?.length ? (
          <span
            style={{
              fontSize: '11px',
              color: '#64748b',
              flexShrink: 0,
            }}
          >
            {question.tags.slice(0, 3).join(', ')}
            {question.tags.length > 3 ? '…' : ''}
          </span>
        ) : null}
        <span
          style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            color: '#64748b',
            flexShrink: 0,
          }}
        >
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
                  ? { background: 'rgba(34, 197, 94, 0.2)', color: '#86efac', borderColor: 'rgba(34, 197, 94, 0.4)' }
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
                  ? { background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', borderColor: 'rgba(239, 68, 68, 0.4)' }
                  : {}),
              }}
              onClick={() => onSetStatus('dont_know')}
            >
              ✗ Не знаю
            </button>
            <button
              type="button"
              style={{
                ...btnStyle,
                ...(isFavorite
                  ? { color: '#fbbf24', borderColor: 'rgba(251, 191, 36, 0.5)' }
                  : {}),
              }}
              onClick={onToggleFavorite}
              title={isFavorite ? 'Убрать из избранного' : 'В избранное'}
            >
              {isFavorite ? '★ В избранном' : '☆ В избранное'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

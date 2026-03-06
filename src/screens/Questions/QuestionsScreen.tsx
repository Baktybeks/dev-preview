import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getQuestionsByCategory, getCategories } from '../../api/questionsApi';
import type { Question } from '../../types/question';

const DIFFICULTY_LABEL: Record<string, string> = {
  junior: 'Junior',
  middle: 'Middle',
  senior: 'Senior',
};

export const QuestionsScreen: React.FC = () => {
  const { id: categoryId } = useParams<{ id: string }>();
  const [openId, setOpenId] = useState<string | null>(null);

  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });
  const category = catData?.documents?.find((c) => c.$id === categoryId);

  const { data, isLoading, error } = useQuery({
    queryKey: ['questions', categoryId],
    queryFn: () => getQuestionsByCategory(categoryId!),
    enabled: !!categoryId,
  });

  const questions = data?.documents ?? [];

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

  if (!categoryId || questions.length === 0) {
    return (
      <div style={{ padding: '16px' }}>
        <p>В этой категории пока нет вопросов.</p>
        <Link to="/categories" style={{ color: '#94a3b8' }}>← Категории</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', maxWidth: '600px' }}>
      <Link to="/categories" style={{ color: '#94a3b8', marginBottom: '16px', display: 'block' }}>
        ← Категории
      </Link>
      {category && (
        <h1 style={{ margin: '0 0 16px', fontSize: '20px' }}>{category.name}</h1>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {questions.map((q) => (
          <AccordionItem
            key={q.$id}
            question={q}
            isOpen={openId === q.$id}
            onToggle={() => setOpenId(openId === q.$id ? null : q.$id)}
          />
        ))}
      </div>
    </div>
  );
};

interface AccordionItemProps {
  question: Question;
  isOpen: boolean;
  onToggle: () => void;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ question, isOpen, onToggle }) => {
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
        </div>
      )}
    </div>
  );
};

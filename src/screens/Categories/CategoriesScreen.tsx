import React from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { getCategories, getQuestionsByCategory } from '../../api/questionsApi';
import { CategoryCard } from '../../components/CategoryCard';

export const CategoriesScreen: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const categories = data?.documents ?? [];

  const countQueries = useQueries({
    queries: categories.map((cat) => ({
      queryKey: ['questions', 'count', cat.$id],
      queryFn: () => getQuestionsByCategory(cat.$id),
      enabled: categories.length > 0,
    })),
  });

  if (isLoading) {
    return (
      <div style={{ padding: '16px' }}>
        <h1>Категории</h1>
        <p>Загрузка...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '16px' }}>
        <h1>Категории</h1>
        <p style={{ color: '#f87171' }}>
          Ошибка: {error instanceof Error ? error.message : 'Не удалось загрузить категории'}
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px' }}>
      <h1 style={{ marginBottom: '16px' }}>Категории</h1>
      {categories.length === 0 ? (
        <p style={{ color: '#94a3b8' }}>
          Нет категорий. Запустите сидинг (npm run db:seed).
        </p>
      ) : (
        <div>
          {categories.map((cat, i) => (
            <CategoryCard
              key={cat.$id}
              category={cat}
              questionCount={countQueries[i]?.data?.total}
            />
          ))}
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCategories } from '../../api/questionsApi';
import { CategoryCard } from '../../components/CategoryCard';

export const CategoriesScreen: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
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

  const categories = data?.documents ?? [];

  return (
    <div style={{ padding: '16px' }}>
      <h1 style={{ marginBottom: '16px' }}>Категории</h1>
      {categories.length === 0 ? (
        <p style={{ color: '#94a3b8' }}>
          Нет категорий. Запустите сидинг (npm run db:seed:checklist).
        </p>
      ) : (
        <div>
          {categories.map((cat) => (
            <CategoryCard key={cat.$id} category={cat} />
          ))}
        </div>
      )}
    </div>
  );
};

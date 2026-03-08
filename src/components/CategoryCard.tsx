import React from 'react';
import { Link } from 'react-router-dom';
import type { Category } from '../types/category';

interface CategoryCardProps {
  category: Category;
  questionCount?: number;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category, questionCount }) => {
  return (
    <Link
      to={`/categories/${category.$id}/questions`}
      style={{
        display: 'block',
        padding: '16px',
        marginBottom: '12px',
        backgroundColor: 'rgba(30, 41, 59, 0.8)',
        borderRadius: '12px',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        color: 'inherit',
        textDecoration: 'none',
      }}
    >
      <h3 style={{ margin: '0 0 4px', fontSize: '18px' }}>
        {category.name}
        {questionCount !== undefined && (
          <span style={{ fontWeight: 400, color: '#64748b', fontSize: '15px' }}>
            {' '}
            ({questionCount})
          </span>
        )}
      </h3>
      {category.description && (
        <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8' }}>{category.description}</p>
      )}
    </Link>
  );
};

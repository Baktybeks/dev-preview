import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  searchQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  importQuestions,
  getCategoriesForAdmin,
  ADMIN_QUESTIONS_PAGE_SIZE,
} from '@api/adminApi';
import { getCategories } from '@api/questionsApi';
import type { Question } from '../../types/question';

const cardStyle: React.CSSProperties = {
  padding: '20px',
  borderRadius: '12px',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  backgroundColor: 'rgba(30, 41, 59, 0.8)',
  marginBottom: '16px',
};

const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid rgba(148, 163, 184, 0.3)',
  backgroundColor: 'rgba(15, 23, 42, 0.8)',
  color: '#e2e8f0',
  fontSize: '14px',
  width: '100%',
  boxSizing: 'border-box',
};

const btnStyle: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: '8px',
  border: '1px solid rgba(148, 163, 184, 0.3)',
  background: 'transparent',
  color: '#94a3b8',
  fontSize: '13px',
  cursor: 'pointer',
};

/** Шаблон структуры для импорта (проверка по нему) */
const JSON_TEMPLATE = `[
  {
    "title": string,
    "answer": string,
    "category": string,
    "categorySlug": string,
    "tags": [string],
    "difficulty": "easy | medium | hard"
  }
]`;

type FieldSchema =
  | { type: 'string'; nonEmpty?: boolean }
  | { type: 'string[]' }
  | { type: 'enum'; values: string[] };

/** Парсит шаблон и возвращает схему полей объекта (ключ → тип) или ошибку */
function parseTemplateSchema(
  template: string,
): { schema: Record<string, FieldSchema> } | { error: string } {
  const schema: Record<string, FieldSchema> = {};
  const objMatch = template.match(/\{\s*([\s\S]*?)\s*\}/);
  if (!objMatch) {
    return { error: 'В шаблоне должен быть один объект в формате { "key": type, ... }' };
  }
  const inner = objMatch[1];
  const lineRegex = /"([^"]+)"\s*:\s*("[^"]*"|[^,\n]+)/g;
  let m: RegExpExecArray | null;
  while ((m = lineRegex.exec(inner)) !== null) {
    const key = m[1].trim();
    let value = m[2].trim().replace(/,\s*$/, '');
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1).trim();
      if (value.includes('|')) {
        schema[key] = {
          type: 'enum',
          values: value.split('|').map((s) => s.trim().toLowerCase()),
        };
      } else {
        schema[key] = { type: 'string' };
      }
    } else if (value === '[string]' || value === 'string[]') {
      schema[key] = { type: 'string[]' };
    } else if (value === 'string') {
      schema[key] = { type: 'string' };
    } else {
      schema[key] = { type: 'string' };
    }
  }
  if (Object.keys(schema).length === 0) {
    return { error: 'В шаблоне не найдено полей вида "key": type' };
  }
  return { schema };
}

function validateImportAgainstSchema(
  parsed: unknown,
  schema: Record<string, FieldSchema>,
): string | null {
  if (!Array.isArray(parsed)) return 'Ожидается массив объектов';
  const keys = Object.keys(schema);
  for (let i = 0; i < parsed.length; i++) {
    const item = parsed[i];
    if (item === null || typeof item !== 'object' || Array.isArray(item)) {
      return `Запись ${i + 1}: ожидается объект`;
    }
    const obj = item as Record<string, unknown>;
    for (const key of keys) {
      const field = schema[key];
      const value = obj[key];
      if (field.type === 'string') {
        if (value === undefined || value === null) {
          return `Запись ${i + 1}: отсутствует поле "${key}"`;
        }
        if (typeof value !== 'string') {
          return `Запись ${i + 1}: поле "${key}" должно быть строкой`;
        }
        if (field.nonEmpty !== false && !value.trim()) {
          return `Запись ${i + 1}: поле "${key}" не должно быть пустым`;
        }
      } else if (field.type === 'string[]') {
        if (value === undefined || value === null) {
          return `Запись ${i + 1}: отсутствует поле "${key}"`;
        }
        if (!Array.isArray(value) || value.some((t: unknown) => typeof t !== 'string')) {
          return `Запись ${i + 1}: поле "${key}" должно быть массивом строк`;
        }
      } else if (field.type === 'enum') {
        if (value === undefined || value === null) {
          return `Запись ${i + 1}: отсутствует поле "${key}"`;
        }
        const s = String(value).toLowerCase();
        if (!field.values.includes(s)) {
          return `Запись ${i + 1}: поле "${key}" должно быть одним из: ${field.values.join(', ')}`;
        }
      }
    }
  }
  return null;
}

export const AdminQuestionsScreen: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [importJson, setImportJson] = useState('');
  const [importPreview, setImportPreview] = useState<Array<Record<string, unknown>> | null>(null);
  const [importError, setImportError] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [importAccordionOpen, setImportAccordionOpen] = useState(false);
  const [importTemplate, setImportTemplate] = useState(JSON_TEMPLATE);

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });
  const categories = categoriesData?.documents ?? [];

  const { data: adminCategories } = useQuery({
    queryKey: ['adminCategories'],
    queryFn: getCategoriesForAdmin,
  });
  const categoryNameToId = useMemo(() => {
    const m: Record<string, string> = {};
    for (const c of adminCategories ?? []) {
      m[c.name] = c.$id;
      m[c.slug] = c.$id;
    }
    return m;
  }, [adminCategories]);

  const {
    data: infiniteData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['adminQuestions', search, categoryFilter, difficultyFilter],
    queryFn: ({ pageParam = 0 }) =>
      searchQuestions({
        query: search || undefined,
        categoryId: categoryFilter || undefined,
        difficulty: difficultyFilter || undefined,
        offset: pageParam,
        limit: ADMIN_QUESTIONS_PAGE_SIZE,
      }),
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((acc, p) => acc + p.documents.length, 0);
      return loaded < lastPage.total ? loaded : undefined;
    },
    initialPageParam: 0,
  });

  const questions = infiniteData?.pages.flatMap((p) => p.documents) ?? [];
  const total = infiniteData?.pages[0]?.total ?? 0;

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

  const createMutation = useMutation({
    mutationFn: createQuestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminQuestions'] });
      setShowForm(false);
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateQuestion>[1] }) =>
      updateQuestion(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminQuestions'] });
      setEditingId(null);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteQuestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminQuestions'] });
      setDeletingId(null);
    },
  });
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => deleteQuestion(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminQuestions'] });
      setSelectedIds(new Set());
      setBulkDeleteConfirm(false);
    },
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    if (selectedIds.size === questions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(questions.map((q) => q.$id)));
    }
  };
  const importMutation = useMutation({
    mutationFn: (items: Parameters<typeof importQuestions>[0]) =>
      importQuestions(items, categoryNameToId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['adminQuestions'] });
      setImportJson('');
      setImportPreview(null);
      alert(`Импортировано: ${result.created}. Ошибки: ${result.errors.length}`);
    },
  });

  const handleImportParse = () => {
    setImportError('');
    setImportPreview(null);
    const parsedSchema = parseTemplateSchema(importTemplate);
    if ('error' in parsedSchema) {
      setImportError(`Шаблон: ${parsedSchema.error}`);
      return;
    }
    try {
      const parsed = JSON.parse(importJson) as unknown;
      const validationError = validateImportAgainstSchema(parsed, parsedSchema.schema);
      if (validationError) {
        setImportError(validationError);
        return;
      }
      setImportPreview(parsed as Record<string, unknown>[]);
    } catch (e) {
      setImportError(e instanceof Error ? e.message : 'Невалидный JSON');
    }
  };

  const categoryName = (id: string) => categories.find((c) => c.$id === id)?.name ?? id;

  return (
    <div>
      <h2 style={{ margin: '0 0 16px', fontSize: '18px' }}>Управление вопросами</h2>

      <div style={{ ...cardStyle, display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Поиск по тексту..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, maxWidth: '200px' }}
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{ ...inputStyle, maxWidth: '160px' }}
        >
          <option value="">Все категории</option>
          {categories.map((c) => (
            <option key={c.$id} value={c.$id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          style={{ ...inputStyle, maxWidth: '120px' }}
        >
          <option value="">Сложность</option>
          <option value="easy">Легко</option>
          <option value="medium">Средне</option>
          <option value="hard">Сложно</option>
        </select>
        <button type="button" style={btnStyle} onClick={() => setShowForm(true)}>
          + Добавить вопрос
        </button>
      </div>

      {showForm && (
        <QuestionForm
          categories={categories}
          onClose={() => setShowForm(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          isSubmitting={createMutation.isPending}
        />
      )}

      {editingId && (
        <EditQuestionModal
          question={questions.find((q) => q.$id === editingId)!}
          categories={categories}
          onClose={() => setEditingId(null)}
          onSave={(data) => updateMutation.mutate({ id: editingId, data })}
          isSubmitting={updateMutation.isPending}
        />
      )}

      {deletingId && (
        <ConfirmModal
          title="Удалить вопрос?"
          onConfirm={() => deleteMutation.mutate(deletingId)}
          onCancel={() => setDeletingId(null)}
        />
      )}

      <div style={cardStyle}>
        <button
          type="button"
          onClick={() => setImportAccordionOpen((o) => !o)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: 0,
            border: 'none',
            background: 'none',
            color: '#e2e8f0',
            fontSize: '14px',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <span style={{ fontWeight: 600 }}>Импорт из JSON</span>
          <span style={{ color: '#94a3b8', fontSize: '18px' }}>
            {importAccordionOpen ? '−' : '+'}
          </span>
        </button>
        {importAccordionOpen && (
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(148, 163, 184, 0.2)' }}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>
                  Шаблон
                </span>
                <button
                  type="button"
                  style={{ ...btnStyle, fontSize: '12px', padding: '4px 8px' }}
                  onClick={() => setImportTemplate(JSON_TEMPLATE)}
                >
                  Сбросить
                </button>
              </div>
              <textarea
                value={importTemplate}
                onChange={(e) => setImportTemplate(e.target.value)}
                rows={10}
                style={{
                  ...inputStyle,
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  resize: 'vertical',
                  minHeight: '120px',
                }}
                spellCheck={false}
              />
            </div>
            <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>
              Импорт из JSON
            </p>
            <textarea
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              placeholder="Вставьте JSON..."
              rows={6}
              style={{ ...inputStyle, marginBottom: '8px', fontFamily: 'monospace' }}
            />
            {importError && (
              <p style={{ margin: '0 0 8px', color: '#f87171', fontSize: '13px' }}>{importError}</p>
            )}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button type="button" style={btnStyle} onClick={handleImportParse}>
                Проверить и превью
              </button>
              {importPreview !== null && (
                <>
                  <span style={{ color: '#94a3b8', fontSize: '13px' }}>
                    Найдено записей: {importPreview.length}
                  </span>
                  <button
                    type="button"
                    style={{ ...btnStyle, color: '#22c55e' }}
                    onClick={() =>
                      importMutation.mutate(
                        importPreview as Array<{
                          question: string;
                          answer: string;
                          category: string;
                          tags?: string[];
                          difficulty?: string;
                        }>,
                      )
                    }
                    disabled={importMutation.isPending}
                  >
                    Импортировать
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <span style={{ color: '#94a3b8', fontSize: '13px' }}>Всего: {total}</span>
          {selectedIds.size > 0 && (
            <>
              <span style={{ color: '#94a3b8', fontSize: '13px' }}>
                Выбрано: {selectedIds.size}
              </span>
              <button
                type="button"
                style={{ ...btnStyle, color: '#f87171' }}
                onClick={() => setBulkDeleteConfirm(true)}
                disabled={bulkDeleteMutation.isPending}
              >
                Удалить выбранные
              </button>
              <button
                type="button"
                style={btnStyle}
                onClick={() => setSelectedIds(new Set())}
              >
                Снять выбор
              </button>
            </>
          )}
        </div>
        {bulkDeleteConfirm && (
          <div
            style={{
              marginBottom: '12px',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid rgba(248, 113, 113, 0.3)',
              backgroundColor: 'rgba(248, 113, 113, 0.1)',
            }}
          >
            <p style={{ margin: '0 0 8px', fontSize: '13px' }}>
              Удалить {selectedIds.size} вопросов?
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                style={{ ...btnStyle, color: '#f87171' }}
                onClick={() => bulkDeleteMutation.mutate([...selectedIds])}
                disabled={bulkDeleteMutation.isPending}
              >
                {bulkDeleteMutation.isPending ? 'Удаление…' : 'Да, удалить'}
              </button>
              <button
                type="button"
                style={btnStyle}
                onClick={() => setBulkDeleteConfirm(false)}
                disabled={bulkDeleteMutation.isPending}
              >
                Отмена
              </button>
            </div>
          </div>
        )}
        {isLoading ? (
          <p style={{ margin: 0, color: '#94a3b8' }}>Загрузка…</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.3)' }}>
                  <th style={{ width: '36px', padding: '8px', verticalAlign: 'middle' }}>
                    <input
                      type="checkbox"
                      checked={questions.length > 0 && selectedIds.size === questions.length}
                      onChange={toggleSelectAll}
                      title="Выбрать все на странице"
                    />
                  </th>
                  <th style={{ textAlign: 'left', padding: '8px', color: '#94a3b8' }}>Вопрос</th>
                  <th style={{ textAlign: 'left', padding: '8px', color: '#94a3b8' }}>Категория</th>
                  <th style={{ textAlign: 'left', padding: '8px', color: '#94a3b8' }}>Сложность</th>
                  <th style={{ textAlign: 'left', padding: '8px', color: '#94a3b8' }}>Теги</th>
                  <th style={{ padding: '8px' }} />
                </tr>
              </thead>
              <tbody>
                {questions.map((q) => (
                  <tr key={q.$id} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.15)' }}>
                    <td style={{ width: '36px', padding: '8px', verticalAlign: 'middle' }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(q.$id)}
                        onChange={() => toggleSelect(q.$id)}
                      />
                    </td>
                    <td style={{ padding: '8px', maxWidth: '300px' }} title={q.title}>
                      {q.title.slice(0, 60)}
                      {q.title.length > 60 ? '…' : ''}
                    </td>
                    <td style={{ padding: '8px' }}>{categoryName(q.categoryId)}</td>
                    <td style={{ padding: '8px' }}>{q.difficulty}</td>
                    <td style={{ padding: '8px', fontSize: '12px', color: '#94a3b8' }}>
                      {q.tags?.length ? q.tags.join(', ') : '—'}
                    </td>
                    <td style={{ padding: '8px', whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        style={btnStyle}
                        onClick={() => setEditingId(q.$id)}
                      >
                        Изменить
                      </button>
                      <button
                        type="button"
                        style={{ ...btnStyle, color: '#f87171', marginLeft: '4px' }}
                        onClick={() => setDeletingId(q.$id)}
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div ref={sentinelRef} style={{ height: 1, marginTop: 8 }} aria-hidden />
        {isFetchingNextPage && (
          <p style={{ margin: '8px 0 0', color: '#94a3b8', fontSize: '13px' }}>
            Загрузка…
          </p>
        )}
      </div>
    </div>
  );
};

function tagsFromInput(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function QuestionForm({
  categories,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  categories: Array<{ $id: string; name: string }>;
  onClose: () => void;
  onSubmit: (data: { title: string; answer: string; difficulty: Question['difficulty']; categoryId: string; tags?: string[] }) => void;
  isSubmitting: boolean;
}) {
  const [title, setTitle] = useState('');
  const [answer, setAnswer] = useState('');
  const [difficulty, setDifficulty] = useState<Question['difficulty']>('medium');
  const [categoryId, setCategoryId] = useState(categories[0]?.$id ?? '');
  const [tagsInput, setTagsInput] = useState('');

  return (
    <div style={cardStyle}>
      <h3 style={{ margin: '0 0 12px' }}>Добавить вопрос</h3>
      <input
        placeholder="Вопрос"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ ...inputStyle, marginBottom: '8px' }}
      />
      <textarea
        placeholder="Ответ"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        rows={4}
        style={{ ...inputStyle, marginBottom: '8px' }}
      />
      <input
        placeholder="Теги (через запятую)"
        value={tagsInput}
        onChange={(e) => setTagsInput(e.target.value)}
        style={{ ...inputStyle, marginBottom: '8px' }}
      />
      <select
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        style={{ ...inputStyle, marginBottom: '8px' }}
      >
        {categories.map((c) => (
          <option key={c.$id} value={c.$id}>
            {c.name}
          </option>
        ))}
      </select>
      <select
        value={difficulty}
        onChange={(e) => setDifficulty(e.target.value as Question['difficulty'])}
        style={{ ...inputStyle, marginBottom: '8px' }}
      >
        <option value="easy">Легко</option>
        <option value="medium">Средне</option>
        <option value="hard">Сложно</option>
      </select>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          style={btnStyle}
          onClick={() =>
            onSubmit({
              title,
              answer,
              difficulty,
              categoryId,
              tags: tagsFromInput(tagsInput),
            })
          }
          disabled={!title.trim() || !answer.trim() || isSubmitting}
        >
          Сохранить
        </button>
        <button type="button" style={btnStyle} onClick={onClose}>
          Отмена
        </button>
      </div>
    </div>
  );
}

function EditQuestionModal({
  question,
  categories,
  onClose,
  onSave,
  isSubmitting,
}: {
  question: Question & { $id: string };
  categories: Array<{ $id: string; name: string }>;
  onClose: () => void;
  onSave: (data: Partial<Pick<Question, 'title' | 'answer' | 'difficulty' | 'categoryId' | 'tags'>>) => void;
  isSubmitting: boolean;
}) {
  const [title, setTitle] = useState(question.title);
  const [answer, setAnswer] = useState(question.answer);
  const [difficulty, setDifficulty] = useState<Question['difficulty']>(question.difficulty);
  const [categoryId, setCategoryId] = useState(question.categoryId);
  const [tagsInput, setTagsInput] = useState((question.tags ?? []).join(', '));

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{ ...cardStyle, maxWidth: '480px', width: '100%', maxHeight: '90vh', overflow: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 12px' }}>Редактировать вопрос</h3>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ ...inputStyle, marginBottom: '8px' }}
        />
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={4}
          style={{ ...inputStyle, marginBottom: '8px' }}
        />
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          style={{ ...inputStyle, marginBottom: '8px' }}
        >
          {categories.map((c) => (
            <option key={c.$id} value={c.$id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as Question['difficulty'])}
          style={{ ...inputStyle, marginBottom: '8px' }}
        >
          <option value="easy">Легко</option>
          <option value="medium">Средне</option>
          <option value="hard">Сложно</option>
        </select>
        <input
          placeholder="Теги (через запятую)"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          style={{ ...inputStyle, marginBottom: '8px' }}
        />
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            style={btnStyle}
            onClick={() =>
              onSave({
                title,
                answer,
                difficulty,
                categoryId,
                tags: tagsFromInput(tagsInput),
              })
            }
            disabled={!title.trim() || !answer.trim() || isSubmitting}
          >
            Сохранить
          </button>
          <button type="button" style={btnStyle} onClick={onClose}>
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({
  title,
  onConfirm,
  onCancel,
}: {
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onCancel}
    >
      <div
        style={{ ...cardStyle, maxWidth: '320px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <p style={{ margin: '0 0 16px' }}>{title}</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" style={{ ...btnStyle, color: '#f87171' }} onClick={onConfirm}>
            Удалить
          </button>
          <button type="button" style={btnStyle} onClick={onCancel}>
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listUsersWithStats, setUserAdmin } from '@api/adminApi';

const cardStyle: React.CSSProperties = {
  padding: '20px',
  borderRadius: '12px',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  backgroundColor: 'rgba(30, 41, 59, 0.8)',
  marginBottom: '16px',
};

const btnStyle: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: '8px',
  border: '1px solid rgba(148, 163, 184, 0.3)',
  background: 'transparent',
  color: '#94a3b8',
  fontSize: '12px',
  cursor: 'pointer',
};

function formatDate(iso: string | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

export const AdminUsersScreen: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['adminUsersWithStats'],
    queryFn: listUsersWithStats,
  });
  console.log(users,'usersusersusersusers')

  const updateAdminMutation = useMutation({
    mutationFn: ({ rowId, isAdmin }: { rowId: string; isAdmin: boolean }) =>
      setUserAdmin(rowId, isAdmin),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsersWithStats'] });
    },
  });

  return (
    <div>
      <h2 style={{ margin: '0 0 16px', fontSize: '18px' }}>Управление пользователями</h2>
      <div style={cardStyle}>
        {isLoading ? (
          <p style={{ margin: 0, color: '#94a3b8' }}>Загрузка…</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.3)' }}>
                  <th style={{ textAlign: 'left', padding: '8px', color: '#94a3b8' }}>Email</th>
                  <th style={{ textAlign: 'left', padding: '8px', color: '#94a3b8' }}>
                    Дата регистрации
                  </th>
                  <th style={{ textAlign: 'left', padding: '8px', color: '#94a3b8' }}>Знаю</th>
                  <th style={{ textAlign: 'left', padding: '8px', color: '#94a3b8' }}>
                    В избранном
                  </th>
                  <th style={{ textAlign: 'left', padding: '8px', color: '#94a3b8' }}>Роль</th>
                  <th style={{ padding: '8px' }} />
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.$id} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.15)' }}>
                    <td style={{ padding: '8px' }}>
                      {u.email ?? (u.userId ? `${u.userId.slice(0, 8)}…` : '—')}
                    </td>
                    <td style={{ padding: '8px' }}>{formatDate(u.$createdAt)}</td>
                    <td style={{ padding: '8px' }}>{u.knowCount}</td>
                    <td style={{ padding: '8px' }}>{u.favoriteCount}</td>
                    <td style={{ padding: '8px' }}>{u.isAdmin ? 'admin' : '—'}</td>
                    <td style={{ padding: '8px' }}>
                      <button
                        type="button"
                        style={{
                          ...btnStyle,
                          color: u.isAdmin ? '#f87171' : '#22c55e',
                        }}
                        onClick={() =>
                          updateAdminMutation.mutate({
                            rowId: u.$id,
                            isAdmin: !u.isAdmin,
                          })
                        }
                        disabled={updateAdminMutation.isPending}
                      >
                        {u.isAdmin ? 'Убрать admin' : 'Сделать admin'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

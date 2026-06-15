'use client';

import { trpc } from '@/lib/trpc';
import { useWindowStore } from '@/store/windowStore';
import { Win98Window } from './Win98Window';

export function RecycleBinWindow() {
  const { closeWindow, setCurrentFormId, openWindow } = useWindowStore();
  const utils = trpc.useContext();

  const { data: deleted = [], isLoading } = trpc.forms.getDeleted.useQuery();

  const restore = trpc.forms.restore.useMutation({
    onSuccess: () => {
      utils.forms.getDeleted.invalidate();
      utils.forms.list.invalidate();
    },
  });

  const permanentDelete = trpc.forms.permanentDelete.useMutation({
    onSuccess: () => utils.forms.getDeleted.invalidate(),
  });

  return (
    <Win98Window name="recycleBin" title="🗑️ Recycle Bin" minWidth={350} minHeight={250}>
      <div className="window-body scrollable" style={{ flex: 1, padding: 8 }}>
        {isLoading && <p>Loading...</p>}
        {!isLoading && deleted.length === 0 && (
          <p style={{ padding: 16, textAlign: 'center', color: '#666' }}>
            Recycle Bin is empty.
          </p>
        )}
        {deleted.map((form) => (
          <div
            key={form.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '6px 8px',
              borderBottom: '1px solid #c0c0c0',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', fontSize: 12, textDecoration: 'line-through', color: '#666' }}>
                🗑️ {form.title}
              </div>
              <div style={{ fontSize: 10, color: '#888' }}>
                Deleted: {form.deletedAt ? new Date(form.deletedAt).toLocaleString() : 'Unknown'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                onClick={() => restore.mutate({ formId: form.id })}
                disabled={restore.isLoading}
                title="Restore form"
              >
                ♻️ Restore
              </button>
              <button
                onClick={() => {
                  if (confirm(`Permanently delete "${form.title}"? This cannot be undone.`)) {
                    permanentDelete.mutate({ formId: form.id });
                  }
                }}
                disabled={permanentDelete.isLoading}
                style={{ color: 'red' }}
                title="Delete permanently"
              >
                ✕ Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="status-bar">
        <p className="status-bar-field">
          {deleted.length} item{deleted.length !== 1 ? 's' : ''} in Recycle Bin
        </p>
      </div>
    </Win98Window>
  );
}

'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useWindowStore } from '@/store/windowStore';
import { Win98Window } from './Win98Window';

export function MyFormsWindow() {
  const { closeWindow, openWindow, setCurrentFormId } = useWindowStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const utils = trpc.useContext();
  const { data: forms, isLoading } = trpc.forms.list.useQuery();

  const createForm = trpc.forms.create.useMutation({
    onSuccess: (form) => {
      utils.forms.list.invalidate();
      setCurrentFormId(form.id);
      openWindow('formBuilder');
      setShowCreate(false);
      setNewTitle('');
      setNewDesc('');
    },
  });

  const softDelete = trpc.forms.softDelete.useMutation({
    onSuccess: () => utils.forms.list.invalidate(),
  });

  const openBuilder = (formId: string) => {
    setCurrentFormId(formId);
    openWindow('formBuilder');
  };

  return (
    <Win98Window name="myForms" title="📋 My Forms" minWidth={400} minHeight={300}>
      {/* Toolbar */}
      <div className="form-builder-toolbar">
        <button onClick={() => setShowCreate(true)}>➕ New Form</button>
        <button onClick={() => openWindow('recycleBin')}>🗑️ Recycle Bin</button>
      </div>

      {/* Create form dialog */}
      {showCreate && (
        <div className="dialog-overlay">
          <div className="window" style={{ width: 380 }}>
            <div className="title-bar">
              <div className="title-bar-text">➕ Create New Form</div>
              <div className="title-bar-controls">
                <button aria-label="Close" onClick={() => setShowCreate(false)} />
              </div>
            </div>
            <div className="window-body" style={{ padding: 16 }}>
              <div className="field-row-stacked" style={{ marginBottom: 8 }}>
                <label>Form Title *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  style={{ width: '100%' }}
                  autoFocus
                  placeholder="e.g. Contact Form"
                />
              </div>
              <div className="field-row-stacked" style={{ marginBottom: 12 }}>
                <label>Description</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  style={{ width: '100%' }}
                  placeholder="Optional description"
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button onClick={() => setShowCreate(false)}>Cancel</button>
                <button
                  onClick={() => newTitle.trim() && createForm.mutate({ title: newTitle.trim(), description: newDesc })}
                  disabled={createForm.isLoading || !newTitle.trim()}
                >
                  {createForm.isLoading ? 'Creating...' : 'Create & Open'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Forms list */}
      <div className="window-body scrollable" style={{ flex: 1, padding: 8 }}>
        {isLoading && <p style={{ padding: 8 }}>Loading forms...</p>}
        {!isLoading && (!forms || forms.length === 0) && (
          <div style={{ padding: 16, textAlign: 'center' }}>
            <p style={{ marginBottom: 8 }}>No forms yet.</p>
            <button onClick={() => setShowCreate(true)}>➕ Create your first form</button>
          </div>
        )}
        {forms?.map((form) => (
          <div
            key={form.id}
            className="my-form-item"
            onDoubleClick={() => openBuilder(form.id)}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', fontSize: 12 }}>📋 {form.title}</div>
              {form.description && (
                <div className="text-muted" style={{ fontSize: 11, color: '#666' }}>{form.description}</div>
              )}
              <div className="text-muted" style={{ fontSize: 10, color: '#888' }}>
                {new Date(form.createdAt).toLocaleDateString()}
                {form.shareToken && ' • 🔗 Shared'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => openBuilder(form.id)}>Open</button>
              <button
                onClick={() => softDelete.mutate({ formId: form.id })}
                title="Move to Recycle Bin"
              >
                🗑
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Status bar */}
      <div className="status-bar">
        <p className="status-bar-field">
          {forms?.length ?? 0} form{forms?.length !== 1 ? 's' : ''} | Double-click to open
        </p>
      </div>
    </Win98Window>
  );
}

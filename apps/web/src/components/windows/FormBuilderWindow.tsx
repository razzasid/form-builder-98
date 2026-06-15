'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useWindowStore } from '@/store/windowStore';
import { Win98Window } from './Win98Window';

type FieldType = 'text' | 'email' | 'number' | 'textarea' | 'dropdown' | 'checkbox' | 'radio';

interface FieldDraft {
  tempId: string;
  type: FieldType;
  label: string;
  placeholder: string;
  required: boolean;
  options: string; // comma-separated string for editing
  displayOrder: number;
}

function newField(order: number): FieldDraft {
  return {
    tempId: Math.random().toString(36).slice(2),
    type: 'text',
    label: `Field ${order + 1}`,
    placeholder: '',
    required: false,
    options: '',
    displayOrder: order,
  };
}

export function FormBuilderWindow() {
  const { closeWindow, openWindow, currentFormId } = useWindowStore();
  const utils = trpc.useContext();

  const { data: form } = trpc.forms.getById.useQuery(
    { formId: currentFormId! },
    { enabled: !!currentFormId }
  );

  const { data: savedFields } = trpc.fields.getByFormId.useQuery(
    { formId: currentFormId! },
    {
      enabled: !!currentFormId,
      onSuccess: (data) => {
        if (data.length > 0) {
          setFields(
            data.map((f) => ({
              tempId: f.id,
              type: f.type as FieldType,
              label: f.label,
              placeholder: f.placeholder || '',
              required: f.required,
              options: (f.options as string[] | null)?.join(', ') || '',
              displayOrder: f.displayOrder,
            }))
          );
        }
      },
    }
  );

  const [fields, setFields] = useState<FieldDraft[]>([]);
  const [saved, setSaved] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  const saveAll = trpc.fields.saveAll.useMutation({
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      utils.fields.getByFormId.invalidate({ formId: currentFormId! });
    },
  });

  const generateToken = trpc.forms.generateShareToken.useMutation({
    onSuccess: (data) => setShareUrl(data.url),
  });

  const addField = (type: FieldType) => {
    setFields((prev) => [...prev, { ...newField(prev.length), type }]);
  };

  const updateField = (tempId: string, patch: Partial<FieldDraft>) => {
    setFields((prev) => prev.map((f) => (f.tempId === tempId ? { ...f, ...patch } : f)));
  };

  const removeField = (tempId: string) => {
    setFields((prev) =>
      prev
        .filter((f) => f.tempId !== tempId)
        .map((f, i) => ({ ...f, displayOrder: i }))
    );
  };

  const moveField = (tempId: string, dir: -1 | 1) => {
    setFields((prev) => {
      const idx = prev.findIndex((f) => f.tempId === tempId);
      if (idx + dir < 0 || idx + dir >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[idx + dir]] = [next[idx + dir], next[idx]];
      return next.map((f, i) => ({ ...f, displayOrder: i }));
    });
  };

  const handleSave = () => {
    if (!currentFormId) return;
    saveAll.mutate({
      formId: currentFormId,
      fields: fields.map((f) => ({
        id: f.tempId.length === 36 ? f.tempId : undefined,
        type: f.type,
        label: f.label,
        placeholder: f.placeholder || undefined,
        required: f.required,
        options: f.options ? f.options.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
        displayOrder: f.displayOrder,
      })),
    });
  };

  const needsOptions = (type: FieldType) =>
    type === 'dropdown' || type === 'checkbox' || type === 'radio';

  return (
    <Win98Window name="formBuilder" title={`🔧 Form Builder — ${form?.title || '...'}`} minWidth={500} minHeight={350}>
      {/* Toolbar */}
      <div className="form-builder-toolbar">
        <button onClick={() => openWindow('myForms')}>📋 My Forms</button>
        <button onClick={handleSave} disabled={saveAll.isLoading}>
          {saveAll.isLoading ? '💾 Saving...' : saved ? '✅ Saved!' : '💾 Save'}
        </button>
        <button onClick={() => openWindow('formPreview')}>👁️ Preview</button>
        <button onClick={() => openWindow('submissions')}>📥 Submissions</button>
        <button onClick={() => openWindow('analytics')}>📊 Analytics</button>
        <button onClick={() => currentFormId && generateToken.mutate({ formId: currentFormId })}>
          🔗 Share
        </button>
      </div>

      {shareUrl && (
        <div style={{ padding: '4px 8px', background: '#ffffc0', borderBottom: '1px solid #808080', fontSize: 11 }}>
          📎 Share URL:{' '}
          <a href={shareUrl} target="_blank" rel="noreferrer" style={{ color: '#000080' }}>
            {shareUrl}
          </a>
          <button
            style={{ marginLeft: 8 }}
            onClick={() => navigator.clipboard.writeText(shareUrl)}
          >
            Copy
          </button>
        </div>
      )}

      {/* Add field buttons */}
      <div style={{ padding: '4px 8px', borderBottom: '1px solid #808080', display: 'flex', gap: 4, flexWrap: 'wrap', background: '#d4d0c8' }}>
        <span style={{ fontSize: 11, marginRight: 4, alignSelf: 'center' }}>Add:</span>
        {(['text', 'email', 'number', 'textarea', 'dropdown', 'checkbox', 'radio'] as FieldType[]).map((t) => (
          <button key={t} onClick={() => addField(t)} style={{ fontSize: 10 }}>
            +{t}
          </button>
        ))}
      </div>

      {/* Fields list */}
      <div className="window-body scrollable" style={{ flex: 1, padding: 8 }}>
        {fields.length === 0 && (
          <p style={{ textAlign: 'center', color: '#666', padding: 16 }}>
            No fields yet. Click the + buttons above to add fields.
          </p>
        )}
        {fields.map((field, idx) => (
          <div key={field.tempId} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 8, border: '2px solid', borderColor: '#808080 #ffffff #ffffff #808080', marginBottom: 8, background: '#f0f0f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span className="field-number">#{idx + 1}</span>
                <select
                  value={field.type}
                  onChange={(e) => updateField(field.tempId, { type: e.target.value as FieldType })}
                  style={{ width: 100 }}
                >
                  {(['text', 'email', 'number', 'textarea', 'dropdown', 'checkbox', 'radio'] as FieldType[]).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => moveField(field.tempId, -1)} disabled={idx === 0} style={{ padding: '2px 12px' }}>▲</button>
                <button onClick={() => moveField(field.tempId, 1)} disabled={idx === fields.length - 1} style={{ padding: '2px 12px' }}>▼</button>
                <button onClick={() => removeField(field.tempId)} style={{ padding: '2px 12px' }}>✕</button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, color: '#444' }}>Label</label>
                <input
                  type="text"
                  value={field.label}
                  onChange={(e) => updateField(field.tempId, { label: e.target.value })}
                  placeholder="Label"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, color: '#444' }}>Placeholder {needsOptions(field.type) ? '/ Options' : ''}</label>
                {needsOptions(field.type) ? (
                  <input
                    type="text"
                    value={field.options}
                    onChange={(e) => updateField(field.tempId, { options: e.target.value })}
                    placeholder="opt1, opt2, opt3"
                    style={{ width: '100%' }}
                  />
                ) : (
                  <input
                    type="text"
                    value={field.placeholder}
                    onChange={(e) => updateField(field.tempId, { placeholder: e.target.value })}
                    placeholder="Placeholder"
                    style={{ width: '100%' }}
                  />
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 60 }}>
                <label htmlFor={`req-${field.tempId}`} style={{ fontSize: 11, color: '#444' }}>Required</label>
                <div className="field-row" style={{ marginTop: 4 }}>
                  <input
                    id={`req-${field.tempId}`}
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => updateField(field.tempId, { required: e.target.checked })}
                  />
                  <label htmlFor={`req-${field.tempId}`}></label>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="status-bar">
        <p className="status-bar-field">{fields.length} field{fields.length !== 1 ? 's' : ''}</p>
      </div>
    </Win98Window>
  );
}

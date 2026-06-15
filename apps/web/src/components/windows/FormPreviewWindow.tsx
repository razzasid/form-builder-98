'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useWindowStore } from '@/store/windowStore';
import { Win98Window } from './Win98Window';

export function FormPreviewWindow() {
  const { closeWindow, currentFormId } = useWindowStore();
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const { data: form } = trpc.forms.getById.useQuery(
    { formId: currentFormId! },
    { enabled: !!currentFormId }
  );

  const { data: fields = [] } = trpc.fields.getByFormId.useQuery(
    { formId: currentFormId! },
    { enabled: !!currentFormId }
  );

  return (
    <Win98Window name="formPreview" title={`👁️ Preview — ${form?.title || '...'}`} minWidth={350} minHeight={300}>
      <div className="window-body scrollable" style={{ flex: 1, padding: 16 }}>
        <form style={{ maxWidth: 500, margin: '0 auto' }} onSubmit={(e) => { e.preventDefault(); alert('Preview form looks good!'); }}>
          <h3 style={{ marginBottom: 4 }}>{form?.title}</h3>
          {form?.description && (
            <p style={{ fontSize: 11, color: '#666', marginBottom: 16 }}>{form.description}</p>
          )}

          {fields.map((field) => (
            <div key={field.id} className="field-row-stacked" style={{ marginBottom: 12 }}>
              <label>
                {field.label}
                {field.required && <span style={{ color: 'red', marginLeft: 2 }}>*</span>}
              </label>

              {field.type === 'textarea' ? (
                <textarea
                  rows={3}
                  style={{ width: '100%' }}
                  placeholder={field.placeholder || ''}
                  value={answers[field.id] || ''}
                  onChange={(e) => setAnswers((p) => ({ ...p, [field.id]: e.target.value }))}
                  required={field.required}
                />
              ) : field.type === 'dropdown' ? (
                <select
                  style={{ width: '100%' }}
                  value={answers[field.id] || ''}
                  onChange={(e) => setAnswers((p) => ({ ...p, [field.id]: e.target.value }))}
                  required={field.required}
                >
                  <option value="">-- Select --</option>
                  {(field.options as string[] | null)?.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : field.type === 'radio' ? (
                <div>
                  {(field.options as string[] | null)?.map((opt) => (
                    <div key={opt} className="field-row">
                      <input type="radio" id={`prev-${field.id}-${opt}`} name={`prev-${field.id}`} value={opt} onChange={() => {}} required={field.required} />
                      <label htmlFor={`prev-${field.id}-${opt}`}>{opt}</label>
                    </div>
                  ))}
                </div>
              ) : field.type === 'checkbox' ? (
                <div>
                  {(field.options as string[] | null)?.map((opt) => (
                    <div key={opt} className="field-row">
                      <input type="checkbox" id={`prev-${field.id}-${opt}`} readOnly />
                      <label htmlFor={`prev-${field.id}-${opt}`}>{opt}</label>
                    </div>
                  ))}
                </div>
              ) : (
                <input
                  type={field.type === 'email' ? 'email' : field.type === 'number' ? 'number' : 'text'}
                  style={{ width: '100%' }}
                  placeholder={field.placeholder || ''}
                  value={answers[field.id] || ''}
                  onChange={(e) => setAnswers((p) => ({ ...p, [field.id]: e.target.value }))}
                  required={field.required}
                />
              )}
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="submit">Submit (Preview Only)</button>
          </div>
        </form>
      </div>

      <div className="status-bar">
        <p className="status-bar-field">Preview mode — submissions are not recorded here</p>
      </div>
    </Win98Window>
  );
}

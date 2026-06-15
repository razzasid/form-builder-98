'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';

export default function PublicFormPage({ params }: { params: { token: string } }) {
  const { data, isLoading, error } = trpc.forms.getByShareToken.useQuery({ token: params.token });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const submit = trpc.submissions.submit.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: (err) => setSubmitError(err.message),
  });

  const handleSubmit = () => {
    if (!data) return;
    setSubmitError('');

    // Check required fields
    const missing = data.fields
      .filter((f) => f.required && !answers[f.id]?.trim())
      .map((f) => f.label);

    if (missing.length > 0) {
      setSubmitError(`Required: ${missing.join(', ')}`);
      return;
    }

    submit.mutate({
      formId: data.id,
      answers: data.fields.map((f) => ({ fieldId: f.id, value: answers[f.id] || '' })),
    });
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#008080' }}>
        <div className="window" style={{ width: 300 }}>
          <div className="title-bar"><div className="title-bar-text">Loading...</div></div>
          <div className="window-body" style={{ padding: 16 }}>Please wait...</div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#008080' }}>
        <div className="window" style={{ width: 320 }}>
          <div className="title-bar" style={{ background: '#aa0000' }}>
            <div className="title-bar-text">❌ Form Not Found</div>
          </div>
          <div className="window-body" style={{ padding: 16 }}>
            <p>This form does not exist or has been removed.</p>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#008080' }}>
        <div className="window" style={{ width: 360 }}>
          <div className="title-bar">
            <div className="title-bar-text">✅ Thank You!</div>
          </div>
          <div className="window-body" style={{ padding: 24, textAlign: 'center' }}>
            <p style={{ fontSize: 16, marginBottom: 12 }}>🎉</p>
            <p style={{ marginBottom: 8, fontWeight: 'bold' }}>Your response has been recorded!</p>
            <p style={{ fontSize: 11, color: '#444' }}>You may now close this window.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#008080', padding: 20 }}>
      <form className="window" style={{ width: '100%', maxWidth: 560 }} onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <div className="title-bar">
          <div className="title-bar-text">📋 {data.title}</div>
        </div>
        <div className="window-body" style={{ padding: 16 }}>
          {data.description && (
            <p style={{ marginBottom: 16, color: '#444', fontSize: 12 }}>{data.description}</p>
          )}

          {data.fields.map((field) => (
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
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [field.id]: e.target.value }))}
                  required={field.required}
                />
              ) : field.type === 'dropdown' ? (
                <select
                  style={{ width: '100%' }}
                  value={answers[field.id] || ''}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [field.id]: e.target.value }))}
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
                      <input
                        type="radio"
                        id={`${field.id}-${opt}`}
                        name={field.id}
                        value={opt}
                        checked={answers[field.id] === opt}
                        onChange={() => setAnswers((prev) => ({ ...prev, [field.id]: opt }))}
                        required={field.required}
                      />
                      <label htmlFor={`${field.id}-${opt}`}>{opt}</label>
                    </div>
                  ))}
                </div>
              ) : field.type === 'checkbox' ? (
                <div>
                  {(field.options as string[] | null)?.map((opt) => {
                    const current = answers[field.id]?.split(',').map(v => v.trim()).filter(Boolean) || [];
                    const checked = current.includes(opt);
                    return (
                      <div key={opt} className="field-row">
                        <input
                          type="checkbox"
                          id={`${field.id}-${opt}`}
                          checked={checked}
                          onChange={() => {
                            const next = checked
                              ? current.filter((v) => v !== opt)
                              : [...current, opt];
                            setAnswers((prev) => ({ ...prev, [field.id]: next.join(', ') }));
                          }}
                        />
                        <label htmlFor={`${field.id}-${opt}`}>{opt}</label>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <input
                  type={field.type === 'email' ? 'email' : field.type === 'number' ? 'number' : 'text'}
                  style={{ width: '100%' }}
                  placeholder={field.placeholder || ''}
                  value={answers[field.id] || ''}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [field.id]: e.target.value }))}
                  required={field.required}
                />
              )}
            </div>
          ))}

          {submitError && (
            <p style={{ color: 'red', marginBottom: 8, fontSize: 11 }}>{submitError}</p>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="submit" disabled={submit.isLoading}>
              {submit.isLoading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

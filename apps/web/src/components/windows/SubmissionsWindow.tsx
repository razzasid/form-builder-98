'use client';

import { trpc } from '@/lib/trpc';
import { useWindowStore } from '@/store/windowStore';
import { Win98Window } from './Win98Window';

export function SubmissionsWindow() {
  const { closeWindow, currentFormId, openWindow } = useWindowStore();

  const { data: form } = trpc.forms.getById.useQuery(
    { formId: currentFormId! },
    { enabled: !!currentFormId }
  );

  const { data: fields = [] } = trpc.fields.getByFormId.useQuery(
    { formId: currentFormId! },
    { enabled: !!currentFormId }
  );

  const { data: submissions = [], isLoading } = trpc.submissions.list.useQuery(
    { formId: currentFormId! },
    { enabled: !!currentFormId }
  );

  return (
    <Win98Window name="submissions" title={`📥 Submissions — ${form?.title || '...'}`} minWidth={400} minHeight={250}>
      <div className="form-builder-toolbar">
        <button onClick={() => openWindow('formBuilder')}>🔧 Back to Builder</button>
      </div>
      <div className="window-body scrollable" style={{ flex: 1, padding: 8 }}>
        {isLoading && <p>Loading submissions...</p>}
        {!isLoading && submissions.length === 0 && (
          <p style={{ padding: 16, textAlign: 'center', color: '#666' }}>
            No submissions yet. Share your form to start collecting responses.
          </p>
        )}

        {submissions.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="submissions-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Submitted At</th>
                  {fields.map((f: any) => <th key={f.id}>{f.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub: any, idx: number) => (
                  <tr key={sub.id}>
                    <td>{idx + 1}</td>
                    <td>{new Date(sub.submittedAt).toLocaleString()}</td>
                    {fields.map((f: any) => {
                      const answer = sub.answers.find((a: any) => a.fieldId === f.id);
                      return <td key={f.id}>{answer?.value || '—'}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="status-bar">
        <p className="status-bar-field">{submissions.length} submission{submissions.length !== 1 ? 's' : ''} total</p>
      </div>
    </Win98Window>
  );
}

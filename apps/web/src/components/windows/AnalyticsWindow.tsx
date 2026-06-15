'use client';

import { trpc } from '@/lib/trpc';
import { useWindowStore } from '@/store/windowStore';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { Win98Window } from './Win98Window';

export function AnalyticsWindow() {
  const { closeWindow, currentFormId, openWindow } = useWindowStore();

  const { data: form } = trpc.forms.getById.useQuery(
    { formId: currentFormId! },
    { enabled: !!currentFormId }
  );

  const { data: analytics, isLoading } = trpc.submissions.getAnalytics.useQuery(
    { formId: currentFormId! },
    { enabled: !!currentFormId }
  );

  return (
    <Win98Window name="analytics" title={`📊 Analytics — ${form?.title || '...'}`} minWidth={500} minHeight={350}>
      <div className="form-builder-toolbar">
        <button onClick={() => openWindow('formBuilder')}>🔧 Back to Builder</button>
      </div>
      <div className="window-body scrollable" style={{ flex: 1, padding: 12 }}>
        {isLoading && <p>Loading analytics...</p>}

        {analytics && (
          <>
            {/* Summary */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div className="window" style={{ flex: 1, textAlign: 'center' }}>
                <div className="title-bar"><div className="title-bar-text">Total Submissions</div></div>
                <div className="window-body" style={{ padding: 8 }}>
                  <span style={{ fontSize: 24, fontWeight: 'bold' }}>{analytics.totalSubmissions}</span>
                </div>
              </div>
              <div className="window" style={{ flex: 1, textAlign: 'center' }}>
                <div className="title-bar"><div className="title-bar-text">Fields</div></div>
                <div className="window-body" style={{ padding: 8 }}>
                  <span style={{ fontSize: 24, fontWeight: 'bold' }}>{analytics.fieldAnalytics.length}</span>
                </div>
              </div>
            </div>

            {/* Submissions over time chart */}
            {analytics.chartData.length > 0 && (
              <div className="window" style={{ marginBottom: 16 }}>
                <div className="title-bar"><div className="title-bar-text">📈 Submissions Over Time</div></div>
                <div className="window-body" style={{ padding: 8, height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="#000080" strokeWidth={2} dot />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Per-field breakdown */}
            {analytics.fieldAnalytics.map((field) => (
              <div key={field.fieldId} className="window" style={{ marginBottom: 12 }}>
                <div className="title-bar">
                  <div className="title-bar-text">
                    {field.label} ({field.type})
                  </div>
                </div>
                <div className="window-body" style={{ padding: 8 }}>
                  <p style={{ fontSize: 11, marginBottom: 4 }}>
                    Answered: {field.filledAnswers} / {analytics.totalSubmissions}
                  </p>
                  {field.distribution.length > 0 && (
                    <div style={{ height: 120 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={field.distribution}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="label" tick={{ fontSize: 9 }} />
                          <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#000080" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {analytics.totalSubmissions === 0 && (
              <p style={{ textAlign: 'center', color: '#666', padding: 16 }}>
                No submissions yet. Share your form to start collecting data!
              </p>
            )}
          </>
        )}
      </div>

      <div className="status-bar">
        <p className="status-bar-field">
          {analytics?.totalSubmissions ?? 0} total submissions
        </p>
      </div>
    </Win98Window>
  );
}

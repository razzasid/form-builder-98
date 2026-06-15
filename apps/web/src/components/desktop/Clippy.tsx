'use client';

import { useState, useEffect } from 'react';
import { AuthUser } from '@/lib/auth';

const TIPS_LOGGED_IN = [
  'Need a form? Double-click My Forms to get started!',
  'You can share forms with a unique public link.',
  'Click Save in the Form Builder to preserve your fields.',
  'Check Analytics to see how your form is performing.',
  'The Recycle Bin holds deleted forms for safe recovery.',
];

const TIPS_LOGGED_OUT = [
  'Welcome! Double-click Login to get started.',
  'Register to start building your own forms!',
  'Create contact forms, surveys, registrations and more!',
  'Your forms can be shared with a public URL.',
];

interface Props {
  user: AuthUser | null;
}

export function Clippy({ user }: Props) {
  const [tipIndex, setTipIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const tips = user ? TIPS_LOGGED_IN : TIPS_LOGGED_OUT;

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((i) => (i + 1) % tips.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [tips.length]);

  return (
    <div className="clippy" onClick={() => setVisible((v) => !v)} title="Click to toggle tips">
      {visible && <div className="clippy-bubble">{tips[tipIndex]}</div>}
      <span style={{ fontSize: 32 }}>📎</span>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { AuthUser } from '@/lib/auth';
import { useWindowStore } from '@/store/windowStore';

const TIPS_LOGGED_IN = [
  'Click me to open the AI Form Assistant! 🤖',
  'Need a form? I can build one for you with AI!',
  'Describe any form and I\'ll create it instantly.',
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
  const { openWindow } = useWindowStore();
  const tips = user ? TIPS_LOGGED_IN : TIPS_LOGGED_OUT;

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((i) => (i + 1) % tips.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [tips.length]);

  const handleClick = () => {
    if (user) {
      openWindow('clippy');
    } else {
      setVisible((v) => !v);
    }
  };

  return (
    <div className="clippy" onClick={handleClick} title={user ? 'Open AI Form Assistant' : 'Click to toggle tips'}>
      {visible && <div className="clippy-bubble">{tips[tipIndex]}</div>}
      <span style={{ fontSize: 32 }}>📎</span>
    </div>
  );
}


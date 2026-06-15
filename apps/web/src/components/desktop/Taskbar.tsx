'use client';

import { useWindowStore, WindowName } from '@/store/windowStore';
import { useEffect, useState } from 'react';

const WINDOW_LABELS: Record<string, string> = {
  login: '🔑 Login',
  register: '📝 Register',
  myForms: '📋 My Forms',
  createForm: '➕ New Form',
  formBuilder: '🔧 Form Builder',
  formPreview: '👁️ Preview',
  submissions: '📥 Submissions',
  analytics: '📊 Analytics',
  recycleBin: '🗑️ Recycle Bin',
};

export function Taskbar() {
  const { windows, activeWindow, toggleMinimize, toggleStartMenu, user } = useWindowStore();
  const [time, setTime] = useState('');

  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  // Convert Map to array for rendering
  const openWindowEntries = Array.from(windows.entries());

  return (
    <div className="taskbar">
      <button
        className="button start-btn"
        onClick={(e) => { e.stopPropagation(); toggleStartMenu(); }}
      >
        🪟 Start
      </button>
      <div className="taskbar-separator" />
      <div className="taskbar-windows">
        {openWindowEntries.map(([name, ws]) => (
          <button
            key={name}
            className={`button taskbar-item ${activeWindow === name && !ws.isMinimized ? 'taskbar-item-active' : ''} ${ws.isMinimized ? 'taskbar-item-minimized' : ''}`}
            onClick={() => toggleMinimize(name as WindowName)}
          >
            {WINDOW_LABELS[name] || name}
          </button>
        ))}
      </div>
      <div className="taskbar-clock">
        {user ? `${user.name.split(' ')[0]}  ` : ''}
        {time}
      </div>
    </div>
  );
}

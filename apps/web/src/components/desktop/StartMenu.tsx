'use client';

import { useWindowStore } from '@/store/windowStore';
import { authStorage } from '@/lib/auth';

export function StartMenu() {
  const { startMenuOpen, closeStartMenu, openWindow, logout, user } = useWindowStore();

  if (!startMenuOpen) return null;

  const handleLogout = () => {
    authStorage.clear();
    logout();
    closeStartMenu();
  };

  return (
    <div className="start-menu" onClick={(e) => e.stopPropagation()}>
      <div className="start-menu-brand">Windows 98</div>
      <div className="start-menu-items">
        {user ? (
          <>
            <div className="start-menu-item" onClick={() => openWindow('myForms')}>
              📋 My Forms
            </div>
            <div className="start-menu-item" onClick={() => openWindow('recycleBin')}>
              🗑️ Recycle Bin
            </div>
            <div className="start-menu-item" onClick={() => openWindow('displayProperties')}>
              🖥️ Settings
            </div>
            <div className="start-menu-divider" />
            <div className="start-menu-item" onClick={handleLogout}>
              🚪 Log Off ({user.name.split(' ')[0]})
            </div>
          </>
        ) : (
          <>
            <div className="start-menu-item" onClick={() => openWindow('login')}>
              🔑 Login
            </div>
            <div className="start-menu-item" onClick={() => openWindow('register')}>
              📝 Register
            </div>
          </>
        )}
        <div className="start-menu-divider" />
        <div
          className="start-menu-item"
          onClick={() => { closeStartMenu(); window.close(); }}
        >
          ⏹️ Shut Down
        </div>
      </div>
    </div>
  );
}

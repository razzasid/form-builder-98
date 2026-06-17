'use client';

import { useWindowStore } from '@/store/windowStore';
import { DesktopIcon } from './DesktopIcon';
import { StartMenu } from './StartMenu';
import { Clippy } from './Clippy';
import { AuthUser } from '@/lib/auth';
import { getWallpaperStyle } from '@/lib/wallpaper';
import { useState } from 'react';
import { Bsod } from './Bsod';

interface Props {
  user: AuthUser | null;
}

export function Desktop({ user }: Props) {
  const { openWindow, closeStartMenu, wallpaper, autoArrangeIcons } = useWindowStore();
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
  const [isBsod, setIsBsod] = useState(false);

  const handleContextMenu = (e: React.MouseEvent) => {
    // Only show if clicking directly on the desktop background
    if ((e.target as HTMLElement).className.includes('desktop')) {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY });
    }
  };

  const closeContextMenu = () => {
    if (contextMenu) setContextMenu(null);
  };

  return (
    <div 
      className="desktop" 
      onClick={() => { closeStartMenu(); closeContextMenu(); }}
      onContextMenu={handleContextMenu}
      style={{
        ...getWallpaperStyle(wallpaper),
        backgroundSize: wallpaper === 'brick' ? '20px 20px' : (wallpaper === 'dotted' ? '4px 4px' : (wallpaper.startsWith('data:') ? 'cover' : 'auto')),
      }}
    >
      <div>
        {!user ? (
          <>
            <DesktopIcon id="login" defaultIndex={0} emoji="🔑" label="Login" onDoubleClick={() => openWindow('login')} />
            <DesktopIcon id="register" defaultIndex={1} emoji="📝" label="Register" onDoubleClick={() => openWindow('register')} />
            <DesktopIcon id="scaryShortcut" defaultIndex={2} emoji="💀" label="Scary Shortcut" onDoubleClick={() => setIsBsod(true)} />
          </>
        ) : (
          <>
            <DesktopIcon id="myForms" defaultIndex={0} emoji="📋" label="My Forms" onDoubleClick={() => openWindow('myForms')} />
            <DesktopIcon id="recycleBin" defaultIndex={1} emoji="🗑️" label="Recycle Bin" onDoubleClick={() => openWindow('recycleBin')} />
            <DesktopIcon id="notepad" defaultIndex={2} emoji="📝" label="Notepad" onDoubleClick={() => openWindow('notepad')} />
            <DesktopIcon id="displayProperties" defaultIndex={3} emoji="🖥️" label="Display" onDoubleClick={() => openWindow('displayProperties')} />
            <DesktopIcon id="analytics" defaultIndex={4} emoji="📊" label="Analytics" onDoubleClick={() => openWindow('analytics')} />
            <DesktopIcon id="scanDisk" defaultIndex={5} emoji="💾" label="ScanDisk" onDoubleClick={() => openWindow('scanDisk')} />
            <DesktopIcon id="musicPlayer" defaultIndex={6} emoji="🎵" label="Music Player" onDoubleClick={() => alert('♫ Now playing: Windows 98 startup jingle')} />
            <DesktopIcon id="scaryShortcut" defaultIndex={7} emoji="💀" label="Scary Shortcut" onDoubleClick={() => setIsBsod(true)} />
          </>
        )}
      </div>

      {isBsod && <Bsod onClose={() => setIsBsod(false)} />}

      <StartMenu />
      <Clippy user={user} />

      {contextMenu && (
        <div
          style={{
            position: 'absolute',
            left: contextMenu.x,
            top: contextMenu.y,
            background: '#c0c0c0',
            border: '2px solid',
            borderColor: '#ffffff #808080 #808080 #ffffff',
            boxShadow: '2px 2px 5px rgba(0,0,0,0.5)',
            zIndex: 9999,
            minWidth: 150,
            padding: 2,
            display: 'flex',
            flexDirection: 'column'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div 
            className="start-menu-item"
            style={{ padding: '4px 12px', cursor: 'pointer' }}
            onClick={() => {
              autoArrangeIcons();
              closeContextMenu();
            }}
          >
            Auto Arrange Icons
          </div>
          <div className="start-menu-divider" />
          <div 
            className="start-menu-item"
            style={{ padding: '4px 12px', cursor: 'pointer' }}
            onClick={() => {
              openWindow('displayProperties');
              closeContextMenu();
            }}
          >
            Properties
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useRef, useCallback, useEffect } from 'react';
import { useWindowStore, WindowName } from '@/store/windowStore';

interface Win98WindowProps {
  name: WindowName;
  title: string;
  children: React.ReactNode;
  /** Whether to show minimize/maximize buttons (dialogs like login/register don't need them) */
  isDialog?: boolean;
  /** Minimum width */
  minWidth?: number;
  /** Minimum height */
  minHeight?: number;
}

export function Win98Window({
  name,
  title,
  children,
  isDialog = false,
  minWidth = 200,
  minHeight = 150,
}: Win98WindowProps) {
  const {
    windows,
    activeWindow,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    restoreWindow,
    focusWindow,
    moveWindow,
    resizeWindow,
  } = useWindowStore();

  const ws = windows.get(name);
  const windowRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const isResizing = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0, startX: 0, startY: 0, dir: 'se' });

  if (!ws) return null;

  const isActive = activeWindow === name;

  // ── Drag handlers ───────────────────────────────────
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if (name === 'clippy') return;
    if (ws?.isMaximized) return;
    isDragging.current = true;
    dragOffset.current = {
      x: e.clientX - (ws?.x ?? 0),
      y: e.clientY - (ws?.y ?? 0),
    };
    document.body.style.userSelect = 'none';

    const handleDragMove = (ev: MouseEvent) => {
      if (!isDragging.current || !windowRef.current) return;
      const newX = ev.clientX - dragOffset.current.x;
      const newY = Math.max(0, ev.clientY - dragOffset.current.y); // prevent dragging above viewport
      windowRef.current.style.left = `${newX}px`;
      windowRef.current.style.top = `${newY}px`;
    };

    const handleDragEnd = (ev: MouseEvent) => {
      isDragging.current = false;
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);

      const newX = ev.clientX - dragOffset.current.x;
      const newY = Math.max(0, ev.clientY - dragOffset.current.y);
      moveWindow(name, newX, newY);
    };

    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
  }, [ws?.isMaximized, ws?.x, ws?.y, moveWindow, name]);

  // ── Resize handlers ─────────────────────────────────
  const handleResizeStart = useCallback((e: React.MouseEvent, dir: string) => {
    if (ws?.isMaximized) return;
    e.stopPropagation();
    e.preventDefault();
    isResizing.current = true;
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      w: ws?.width ?? 400,
      h: ws?.height ?? 300,
      startX: ws?.x ?? 0,
      startY: ws?.y ?? 0,
      dir,
    };
    document.body.style.userSelect = 'none';
    document.body.style.cursor = `${dir}-resize`;

    const handleResizeMove = (ev: MouseEvent) => {
      if (!isResizing.current || !windowRef.current) return;
      const { x: startMouseX, y: startMouseY, w: startW, h: startH, startX, startY, dir: currentDir } = resizeStart.current;
      const dx = ev.clientX - startMouseX;
      const dy = ev.clientY - startMouseY;

      let newW = startW;
      let newH = startH;
      let newX = startX;
      let newY = startY;

      if (currentDir.includes('e')) newW = startW + dx;
      if (currentDir.includes('s')) newH = startH + dy;
      if (currentDir.includes('w')) {
        newW = startW - dx;
        newX = startX + dx;
      }
      if (currentDir.includes('n')) {
        newH = startH - dy;
        newY = startY + dy;
      }

      if (newW < minWidth) {
        if (currentDir.includes('w')) newX -= (minWidth - newW);
        newW = minWidth;
      }
      if (newH < minHeight) {
        if (currentDir.includes('n')) newY -= (minHeight - newH);
        newH = minHeight;
      }

      windowRef.current.style.width = `${newW}px`;
      windowRef.current.style.height = `${newH}px`;
      windowRef.current.style.left = `${newX}px`;
      windowRef.current.style.top = `${newY}px`;
    };

    const handleResizeEnd = (ev: MouseEvent) => {
      isResizing.current = false;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);

      const { x: startMouseX, y: startMouseY, w: startW, h: startH, startX, startY, dir: currentDir } = resizeStart.current;
      const dx = ev.clientX - startMouseX;
      const dy = ev.clientY - startMouseY;

      let newW = startW;
      let newH = startH;
      let newX = startX;
      let newY = startY;

      if (currentDir.includes('e')) newW = startW + dx;
      if (currentDir.includes('s')) newH = startH + dy;
      if (currentDir.includes('w')) {
        newW = startW - dx;
        newX = startX + dx;
      }
      if (currentDir.includes('n')) {
        newH = startH - dy;
        newY = startY + dy;
      }

      if (newW < minWidth) {
        if (currentDir.includes('w')) newX -= (minWidth - newW);
        newW = minWidth;
      }
      if (newH < minHeight) {
        if (currentDir.includes('n')) newY -= (minHeight - newH);
        newH = minHeight;
      }

      resizeWindow(name, newW, newH);
      moveWindow(name, newX, newY);
    };

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  }, [ws?.isMaximized, ws?.width, ws?.height, ws?.x, ws?.y, resizeWindow, moveWindow, name, minWidth, minHeight]);

  // ── Double-click title bar to toggle maximize ──────
  const handleTitleDoubleClick = useCallback(() => {
    if (isDialog) return;
    if (ws?.isMaximized) {
      restoreWindow(name);
    } else {
      maximizeWindow(name);
    }
  }, [isDialog, ws?.isMaximized, restoreWindow, maximizeWindow, name]);

  const style: React.CSSProperties = ws.isMinimized
    ? { display: 'none' }
    : ws.isMaximized
    ? {
        position: 'fixed',
        left: 0,
        top: 0,
        width: '100vw',
        height: 'calc(100vh - 28px)',
        zIndex: ws.zIndex,
        display: 'flex',
        flexDirection: 'column',
      }
    : isDialog
    ? {
        position: 'fixed',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: ws.zIndex,
        display: 'flex',
        flexDirection: 'column',
        width: ws.width,
        maxHeight: 'calc(100vh - 60px)',
      }
    : name === 'clippy'
    ? {
        position: 'fixed',
        right: '70px',
        bottom: '60px',
        width: ws.width,
        height: ws.height,
        zIndex: ws.zIndex,
        display: 'flex',
        flexDirection: 'column',
      }
    : {
        position: 'fixed',
        left: ws.x,
        top: ws.y,
        width: ws.width,
        height: ws.height,
        zIndex: ws.zIndex,
        display: 'flex',
        flexDirection: 'column',
      };

  return (
    <>
      {/* Backdrop for dialogs */}
      {isDialog && (
        <div
          className="win98-dialog-backdrop"
          style={{ zIndex: ws.zIndex - 1 }}
          onClick={() => closeWindow(name)}
        />
      )}
      <div
        ref={windowRef}
        className={`window win98-window ${isActive ? 'win98-window-active' : 'win98-window-inactive'}`}
        style={style}
        onMouseDown={() => focusWindow(name)}
      >
        {/* Title bar */}
        <div
          className={`title-bar ${isActive ? '' : 'inactive'}`}
          onMouseDown={handleDragStart}
          onDoubleClick={handleTitleDoubleClick}
        >
          <div className="title-bar-text">{title}</div>
          <div className="title-bar-controls">
            {!isDialog && (
              <>
                <button
                  aria-label="Minimize"
                  onClick={(e) => { e.stopPropagation(); minimizeWindow(name); }}
                />
                <button
                  aria-label={ws.isMaximized ? 'Restore' : 'Maximize'}
                  onClick={(e) => {
                    e.stopPropagation();
                    ws.isMaximized ? restoreWindow(name) : maximizeWindow(name);
                  }}
                />
              </>
            )}
            <button
              aria-label="Close"
              onClick={(e) => { e.stopPropagation(); closeWindow(name); }}
            />
          </div>
        </div>

        {/* Window content */}
        <div className="win98-window-content">
          {children}
        </div>

        {/* Resize edges — only for non-maximized, non-dialog windows */}
        {!ws.isMaximized && !isDialog && name !== 'clippy' && (
          <>
            <div className="win98-resize-edge win98-resize-n" onMouseDown={(e) => handleResizeStart(e, 'n')} />
            <div className="win98-resize-edge win98-resize-s" onMouseDown={(e) => handleResizeStart(e, 's')} />
            <div className="win98-resize-edge win98-resize-e" onMouseDown={(e) => handleResizeStart(e, 'e')} />
            <div className="win98-resize-edge win98-resize-w" onMouseDown={(e) => handleResizeStart(e, 'w')} />
            <div className="win98-resize-edge win98-resize-nw" onMouseDown={(e) => handleResizeStart(e, 'nw')} />
            <div className="win98-resize-edge win98-resize-ne" onMouseDown={(e) => handleResizeStart(e, 'ne')} />
            <div className="win98-resize-edge win98-resize-sw" onMouseDown={(e) => handleResizeStart(e, 'sw')} />
            <div className="win98-resize-edge win98-resize-se" onMouseDown={(e) => handleResizeStart(e, 'se')} />
          </>
        )}
      </div>
    </>
  );
}

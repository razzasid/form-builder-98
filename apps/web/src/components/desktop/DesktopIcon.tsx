'use client';

import { useState, useEffect } from 'react';
import { useWindowStore } from '@/store/windowStore';

interface Props {
  id: string;
  defaultIndex: number;
  emoji: string;
  label: string;
  onDoubleClick: () => void;
}

export function DesktopIcon({ id, defaultIndex, emoji, label, onDoubleClick }: Props) {
  const [selected, setSelected] = useState(false);
  const { iconPositions, setIconPosition } = useWindowStore();
  
  const pos = iconPositions[id];
  
  // Strict Grid layout calculation (6 icons per column vertically)
  const CELL_W = 100;
  const CELL_H = 100;
  const ICONS_PER_COL = 6;
  
  const col = Math.floor(defaultIndex / ICONS_PER_COL);
  const row = defaultIndex % ICONS_PER_COL;

  const defaultX = col * CELL_W;
  const defaultY = row * CELL_H;

  const [localPos, setLocalPos] = useState({ x: pos?.x ?? defaultX, y: pos?.y ?? defaultY });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!isDragging) {
      setLocalPos({ x: pos?.x ?? defaultX, y: pos?.y ?? defaultY });
    }
  }, [pos, defaultX, defaultY, isDragging]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      let newX = e.clientX - dragOffset.x;
      let newY = e.clientY - dragOffset.y;
      
      // Clamp to screen bounds (looser bounds to allow edge touching)
      const maxX = window.innerWidth - 60; 
      const maxY = window.innerHeight - 28 - 70; 
      
      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));

      setLocalPos({ x: newX, y: newY });
    };

    const handleMouseUp = (e: MouseEvent) => {
      setIsDragging(false);
      let droppedX = e.clientX - dragOffset.x;
      let droppedY = e.clientY - dragOffset.y;
      
      // Calculate nearest grid column and row
      let targetCol = Math.round(droppedX / CELL_W);
      let targetRow = Math.round(droppedY / CELL_H);
      
      // Clamp to our strict grid
      const maxCol = Math.max(0, Math.floor((window.innerWidth - 60) / CELL_W));
      targetCol = Math.max(0, Math.min(targetCol, maxCol));
      
      // Strict 6 icons per column limit
      targetRow = Math.max(0, Math.min(targetRow, ICONS_PER_COL - 1));

      let finalX = targetCol * CELL_W;
      let finalY = targetRow * CELL_H;

      // Overlap detection to prevent icons stacking on top of each other
      let hasOverlap = true;
      let attempts = 0;
      
      while (hasOverlap && attempts < 50) {
        hasOverlap = false;
        const domIcons = document.querySelectorAll('.desktop-icon');
        
        for (let i = 0; i < domIcons.length; i++) {
          const el = domIcons[i] as HTMLElement;
          if (el.dataset.id === id) continue; // Skip ourselves
          
          const elLeft = parseInt(el.style.left || '0', 10);
          const elTop = parseInt(el.style.top || '0', 10);
          
          // Exact grid match detection
          if (Math.abs(finalX - elLeft) < 10 && Math.abs(finalY - elTop) < 10) {
            hasOverlap = true;
            // Shift down the column
            finalY += CELL_H;
            // Wrap to next column if we hit the 6-icon limit
            if (finalY >= ICONS_PER_COL * CELL_H) {
              finalY = 0;
              finalX += CELL_W;
              // Wrap back to start if we go off right edge
              const maxCols = Math.max(0, Math.floor((window.innerWidth - 60) / CELL_W));
              if (finalX > maxCols * CELL_W) {
                finalX = 0;
              }
            }
            break; 
          }
        }
        attempts++;
      }

      setIconPosition(id, finalX, finalY);
      setLocalPos({ x: finalX, y: finalY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, id, setIconPosition]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected(true);
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - localPos.x,
      y: e.clientY - localPos.y
    });
  };

  return (
    <div
      data-id={id}
      className={`desktop-icon ${selected ? 'selected' : ''}`}
      onMouseDown={handleMouseDown}
      onDoubleClick={(e) => { e.stopPropagation(); setSelected(false); onDoubleClick(); }}
      onBlur={() => setSelected(false)}
      tabIndex={0}
      style={{
        position: 'absolute',
        left: localPos.x,
        top: localPos.y,
        zIndex: selected || isDragging ? 50 : 10,
      }}
    >
      <span className="icon-emoji" role="img" aria-label={label}>{emoji}</span>
      <span>{label}</span>
    </div>
  );
}

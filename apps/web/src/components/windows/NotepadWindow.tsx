'use client';

import { useState, useRef, useEffect } from 'react';
import { useWindowStore } from '@/store/windowStore';
import { Win98Window } from './Win98Window';

export function NotepadWindow() {
  const { closeWindow } = useWindowStore();
  const [text, setText] = useState('');
  const [wordWrap, setWordWrap] = useState(true);
  const [activeMenu, setActiveMenu] = useState<'file' | 'edit' | 'format' | null>(null);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load state on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedText = localStorage.getItem('fb98_notepad_text') || '';
      const savedWrap = localStorage.getItem('fb98_notepad_wrap') !== 'false';
      setText(savedText);
      setWordWrap(savedWrap);
    }
  }, []);

  // Save state on change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fb98_notepad_text', text);
      localStorage.setItem('fb98_notepad_wrap', String(wordWrap));
    }
  }, [text, wordWrap]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    updateCursorPos(e.target);
  };

  const updateCursorPos = (target: HTMLTextAreaElement) => {
    const val = target.value;
    const selectionStart = target.selectionStart;
    const lines = val.substring(0, selectionStart).split('\n');
    setCursorPos({
      line: lines.length,
      col: lines[lines.length - 1].length + 1
    });
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => updateCursorPos(e.currentTarget);
  const handleClick = (e: React.MouseEvent<HTMLTextAreaElement>) => updateCursorPos(e.currentTarget);

  // Close menus if clicking outside
  useEffect(() => {
    const closeMenu = () => setActiveMenu(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  const menuStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    background: '#c0c0c0',
    border: '2px solid',
    borderColor: '#ffffff #808080 #808080 #ffffff',
    boxShadow: '2px 2px 5px rgba(0,0,0,0.5)',
    zIndex: 1000,
    minWidth: 120,
    display: 'flex',
    flexDirection: 'column',
    padding: 2,
  };

  const menuItemStyle = {
    padding: '2px 16px 2px 24px',
    cursor: 'pointer',
    position: 'relative' as const,
  };

  const handleMenuClick = (e: React.MouseEvent, menu: 'file' | 'edit' | 'format') => {
    e.stopPropagation();
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  const downloadFile = (filename: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.txt') ? filename : `${filename}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSave = () => {
    downloadFile('Untitled.txt');
    setActiveMenu(null);
  };

  const handleSaveAs = () => {
    const filename = window.prompt('Enter file name:', 'Untitled.txt');
    if (filename) {
      downloadFile(filename);
    }
    setActiveMenu(null);
  };

  return (
    <Win98Window name="notepad" title="📝 Untitled - Notepad" minWidth={350} minHeight={250}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#c0c0c0' }}>
        
        {/* Menu Bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid #808080', padding: '1px 0' }}>
          
          {/* File Menu */}
          <div style={{ position: 'relative' }}>
            <div 
              style={{ padding: '2px 6px', cursor: 'pointer', background: activeMenu === 'file' ? '#000080' : 'transparent', color: activeMenu === 'file' ? 'white' : 'black' }}
              onClick={(e) => handleMenuClick(e, 'file')}
            >
              <u>F</u>ile
            </div>
            {activeMenu === 'file' && (
              <div style={menuStyle}>
                <div className="start-menu-item" style={menuItemStyle} onClick={() => { setText(''); setActiveMenu(null); }}>New</div>
                <div className="start-menu-item" style={{ ...menuItemStyle, color: '#808080' }}>Open...</div>
                <div className="start-menu-item" style={menuItemStyle} onClick={handleSave}>Save</div>
                <div className="start-menu-item" style={menuItemStyle} onClick={handleSaveAs}>Save As...</div>
                <div style={{ height: 1, borderTop: '1px solid #808080', borderBottom: '1px solid #ffffff', margin: '2px 4px' }} />
                <div className="start-menu-item" style={menuItemStyle} onClick={() => closeWindow('notepad')}>Exit</div>
              </div>
            )}
          </div>

          {/* Edit Menu */}
          <div style={{ position: 'relative' }}>
            <div 
              style={{ padding: '2px 6px', cursor: 'pointer', background: activeMenu === 'edit' ? '#000080' : 'transparent', color: activeMenu === 'edit' ? 'white' : 'black' }}
              onClick={(e) => handleMenuClick(e, 'edit')}
            >
              <u>E</u>dit
            </div>
            {activeMenu === 'edit' && (
              <div style={menuStyle}>
                <div className="start-menu-item" style={{ ...menuItemStyle, color: '#808080' }}>Undo</div>
                <div style={{ height: 1, borderTop: '1px solid #808080', borderBottom: '1px solid #ffffff', margin: '2px 4px' }} />
                <div className="start-menu-item" style={{ ...menuItemStyle, color: '#808080' }}>Cut</div>
                <div className="start-menu-item" style={{ ...menuItemStyle, color: '#808080' }}>Copy</div>
                <div className="start-menu-item" style={{ ...menuItemStyle, color: '#808080' }}>Paste</div>
                <div style={{ height: 1, borderTop: '1px solid #808080', borderBottom: '1px solid #ffffff', margin: '2px 4px' }} />
                <div className="start-menu-item" style={menuItemStyle} onClick={() => { 
                  if (textareaRef.current) {
                    textareaRef.current.select();
                  }
                  setActiveMenu(null);
                }}>Select All</div>
              </div>
            )}
          </div>

          {/* Format Menu */}
          <div style={{ position: 'relative' }}>
            <div 
              style={{ padding: '2px 6px', cursor: 'pointer', background: activeMenu === 'format' ? '#000080' : 'transparent', color: activeMenu === 'format' ? 'white' : 'black' }}
              onClick={(e) => handleMenuClick(e, 'format')}
            >
              F<u>o</u>rmat
            </div>
            {activeMenu === 'format' && (
              <div style={menuStyle}>
                <div className="start-menu-item" style={menuItemStyle} onClick={() => { setWordWrap(!wordWrap); setActiveMenu(null); }}>
                  {wordWrap && <span style={{ position: 'absolute', left: 6 }}>✓</span>}
                  Word Wrap
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Text Area */}
        <div style={{ flex: 1, borderTop: '1px solid #ffffff', borderLeft: '1px solid #ffffff', background: 'white' }}>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyUp={handleKeyUp}
            onClick={handleClick}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              outline: 'none',
              resize: 'none',
              padding: '4px',
              fontFamily: 'Consolas, "Courier New", monospace',
              fontSize: 13,
              whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
              overflowWrap: wordWrap ? 'break-word' : 'normal',
              overflow: 'auto',
            }}
            spellCheck={false}
          />
        </div>

        {/* Status Bar */}
        <div style={{
          height: 22,
          borderTop: '1px solid #ffffff',
          borderBottom: '1px solid #808080',
          display: 'flex',
          alignItems: 'center',
          padding: '0 2px',
        }}>
          <div style={{
            flex: 1,
            border: '1px inset #fff',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 4,
            color: '#000'
          }}>
            Ln {cursorPos.line}, Col {cursorPos.col}
          </div>
        </div>

      </div>
    </Win98Window>
  );
}

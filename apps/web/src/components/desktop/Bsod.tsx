'use client';

import { useEffect } from 'react';

interface Props {
  onClose: () => void;
}

export function Bsod({ onClose }: Props) {
  useEffect(() => {
    const handleKeyDown = () => {
      onClose();
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#0000aa',
        color: '#ffffff',
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: '16px',
        padding: '50px',
        zIndex: 99999,
        lineHeight: '1.5',
      }}
    >
      <div style={{ marginBottom: '30px', fontWeight: 'bold' }}>
        Windows 98
      </div>

      <p style={{ whiteSpace: 'pre-wrap' }}>
        A fatal exception 0E has occurred at 0028:C0001E6F in VXD VMM(01) + 000016DE.{'\n'}
        The current application will be terminated.{'\n\n'}
        * Press any key to restart the system.{'\n'}
        * Press CTRL+ALT+D again to see the blue screen of death.{'\n'}
          (Just kidding, your forms are fine.){'\n\n'}
        FormsBuilder FAT32 Error: Segment: 0A28 | Page: 00F4 | Sector: 7B{'\n'}
        Microsoft Windows 98 [Version 4.10.1998]{'\n\n'}
        _
      </p>
    </div>
  );
}

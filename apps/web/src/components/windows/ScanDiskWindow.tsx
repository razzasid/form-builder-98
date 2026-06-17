'use client';

import { useState, useEffect, useRef } from 'react';
import { useWindowStore } from '@/store/windowStore';
import { Win98Window } from './Win98Window';

// Grid dimensions
const COLS = 24;
const ROWS = 10;
const TOTAL_CLUSTERS = COLS * ROWS;

type ClusterState = 'unread' | 'scanning' | 'file' | 'free' | 'bad';

const COLOR_MAP: Record<ClusterState, string> = {
  unread: '#c0c0c0', // Gray
  scanning: '#ffff00', // Yellow
  file: '#00ff00', // Green
  free: '#0000ff', // Blue
  bad: '#800080', // Purple
};

export function ScanDiskWindow() {
  const { closeWindow } = useWindowStore();
  const [scanning, setScanning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [clusters, setClusters] = useState<ClusterState[]>(
    Array(TOTAL_CLUSTERS).fill('unread')
  );
  const [statusText, setStatusText] = useState('Select Start to check the drive.');
  const [showResults, setShowResults] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopSound();
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, []);

  const startSound = () => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio('/win98-scan-sound.mp3');
        audioRef.current.loop = true;
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((err) => {
        console.warn('Audio play block prevented:', err);
      });
    } catch (err) {
      console.warn('Audio error:', err);
    }
  };

  const stopSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const handleStart = () => {
    if (scanning) return;

    setScanning(true);
    setCurrentIndex(0);
    setClusters(Array(TOTAL_CLUSTERS).fill('unread'));
    setStatusText('Checking cluster structures...');
    setShowResults(false);
    startSound();

    let index = 0;
    const intervalTime = 120; // ms per cluster scan

    scanIntervalRef.current = setInterval(() => {
      setClusters((prev) => {
        const next = [...prev];
        
        // Finalize previous cluster
        if (index > 0) {
          const rand = Math.random();
          if (rand < 0.01) {
            next[index - 1] = 'bad'; // 1% chance bad cluster (purple)
          } else if (rand < 0.4) {
            next[index - 1] = 'file'; // 39% files (green)
          } else {
            next[index - 1] = 'free'; // 60% free (blue)
          }
        }

        // Highlight current cluster as scanning
        if (index < TOTAL_CLUSTERS) {
          next[index] = 'scanning';
        }

        return next;
      });

      setCurrentIndex(index);

      if (index >= TOTAL_CLUSTERS) {
        // Scan finished!
        if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
        setScanning(false);
        stopSound();
        setStatusText('Scan complete.');
        setShowResults(true);
      } else {
        index++;
      }
    }, intervalTime);
  };

  const handleCancel = () => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    setScanning(false);
    stopSound();
    setCurrentIndex(-1);
    setClusters(Array(TOTAL_CLUSTERS).fill('unread'));
    setStatusText('Scan canceled by user.');
  };

  const percentComplete =
    currentIndex >= 0
      ? Math.min(100, Math.floor((currentIndex / TOTAL_CLUSTERS) * 100))
      : 0;

  return (
    <Win98Window name="scanDisk" title="ScanDisk - Forms Drive (C:)" minWidth={600} minHeight={420}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: 12, overflow: 'hidden', gap: 12 }}>
        
        {/* Header/Info section */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div 
            style={{ 
              width: 32, 
              height: 32, 
              fontSize: 24, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: '1px inset #808080',
              background: '#d4d0c8'
            }}
          >
            💾
          </div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: 12 }}>ScanDisk</div>
            <div style={{ color: '#555', fontSize: 10 }}>Forms Drive (C:)</div>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #808080', borderBottom: '1px solid #fff', margin: '0 -12px' }} />

        {/* Progress & status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 'bold' }}>{statusText}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Retro progress bar container */}
            <div 
              style={{ 
                flex: 1, 
                height: 20, 
                border: '2px inset #c0c0c0', 
                background: '#fff', 
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {percentComplete > 0 && (
                <div 
                  style={{ 
                    width: `${percentComplete}%`, 
                    height: '100%', 
                    background: '#000080' 
                  }} 
                />
              )}
            </div>
            <div style={{ fontSize: 10, width: 75, textAlign: 'right' }}>
              {percentComplete}% complete
            </div>
          </div>
        </div>

        {/* Cluster Grid Board */}
        <div 
          style={{ 
            flex: 1, 
            background: '#808080', 
            border: '2px inset #c0c0c0', 
            padding: 4, 
            display: 'grid',
            gridTemplateColumns: `repeat(${COLS}, 1fr)`,
            gridTemplateRows: `repeat(${ROWS}, 1fr)`,
            gap: 1,
            overflow: 'hidden',
            minHeight: 180
          }}
        >
          {clusters.map((state, i) => (
            <div
              key={i}
              style={{
                background: COLOR_MAP[state],
                border: state === 'unread' ? '1px outset #fff' : 'none',
                boxSizing: 'border-box'
              }}
              title={`Cluster ${i}: ${state}`}
            />
          ))}
        </div>

        {/* Legend & Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          {/* Legend */}
          <div style={{ display: 'flex', gap: 10, fontSize: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 10, height: 10, background: COLOR_MAP.unread, border: '1px outset #fff' }} />
              <span>Unread</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 10, height: 10, background: COLOR_MAP.file }} />
              <span>System/Data</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 10, height: 10, background: COLOR_MAP.free }} />
              <span>Free Space</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 10, height: 10, background: COLOR_MAP.bad }} />
              <span>Bad sector</span>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 6 }}>
            <button 
              className="button"
              onClick={handleStart}
              disabled={scanning}
              style={{ minWidth: 70, fontWeight: 'bold' }}
            >
              Start
            </button>
            <button 
              className="button"
              onClick={handleCancel}
              disabled={!scanning}
              style={{ minWidth: 70 }}
            >
              Cancel
            </button>
            <button 
              className="button"
              onClick={() => closeWindow('scanDisk')}
              style={{ minWidth: 70 }}
            >
              Close
            </button>
          </div>
        </div>

      </div>

      {/* Retro Results Pop-up dialog */}
      {showResults && (
        <div 
          className="dialog-overlay"
          style={{ zIndex: 20000 }}
        >
          <div 
            className="window"
            style={{ 
              width: 320, 
              background: '#c0c0c0', 
              border: '2px solid', 
              borderColor: '#ffffff #808080 #808080 #ffffff',
              boxShadow: '3px 3px 10px rgba(0,0,0,0.5)'
            }}
          >
            <div className="title-bar">
              <div className="title-bar-text">ScanDisk Results</div>
              <div className="title-bar-controls">
                <button aria-label="Close" onClick={() => setShowResults(false)} />
              </div>
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 32 }}>ℹ️</span>
                <div style={{ fontSize: 11, lineHeight: '1.4' }}>
                  ScanDisk did not find any errors on Drive C:.<br />
                  Forms Drive is in optimal working condition.
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button 
                  className="button"
                  onClick={() => setShowResults(false)}
                  style={{ minWidth: 60 }}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Win98Window>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { useWindowStore } from '@/store/windowStore';
import { Win98Window } from './Win98Window';

interface Track {
  id: string;
  name: string;
  fileName: string;
}

const TRACKS: Track[] = [
  {
    id: '1',
    name: 'Alphaville - Forever Young (Official Video HD)',
    fileName: 'Alphaville - Forever Young (Official Video HD).mp3',
  },
  {
    id: '2',
    name: 'Blue - One Love',
    fileName: 'Blue - One Love.mp3',
  },
  {
    id: '3',
    name: 'The Who - Baba O\'Riley (Shepperton Studios _ 1978)',
    fileName: 'The Who - Baba O\'Riley (Shepperton Studios _ 1978).mp3',
  },
  {
    id: '4',
    name: 'Toby Keith - Should\'ve Been A Cowboy (Official Music Video)',
    fileName: 'Toby Keith - Should\'ve Been A Cowboy (Official Music Video).mp3',
  },
];

export function MusicPlayerWindow() {
  const { closeWindow } = useWindowStore();
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentTrack = TRACKS[currentTrackIndex];

  // Set up audio source and properties
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;
    audio.src = `/${currentTrack.fileName}`;
    audio.volume = volume;
    audio.load();

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      handleNext();
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    if (isPlaying) {
      audio.play().catch((err) => console.log('Audio playback failed', err));
    }

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentTrackIndex]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch((err) => console.log('Audio play failed', err));
      setIsPlaying(true);
    }
  };

  const handleStop = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleNext = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
  };

  const handlePrev = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const seekTime = parseFloat(e.target.value);
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVolume = parseFloat(e.target.value);
    setVolume(nextVolume);
    if (audioRef.current) {
      audioRef.current.volume = nextVolume;
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <Win98Window name="musicPlayer" title="Music Player" minWidth={450} minHeight={320}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: 8, overflow: 'hidden', gap: 8 }}>
        
        {/* Track List */}
        <div 
          className="scrollable"
          style={{ 
            flex: 1, 
            background: '#ffffff', 
            border: '2px inset #c0c0c0', 
            padding: 4, 
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            minHeight: 150
          }}
        >
          {TRACKS.map((track, i) => {
            const isSelected = i === currentTrackIndex;
            return (
              <div
                key={track.id}
                onDoubleClick={() => {
                  if (i === currentTrackIndex) {
                    handlePlayPause();
                  } else {
                    setCurrentTrackIndex(i);
                    setIsPlaying(true);
                  }
                }}
                onClick={() => {
                  if (i !== currentTrackIndex) {
                    setCurrentTrackIndex(i);
                    setIsPlaying(false);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 6px',
                  cursor: 'pointer',
                  background: isSelected ? '#000080' : 'transparent',
                  color: isSelected ? '#ffffff' : '#000000',
                  fontSize: 11,
                  userSelect: 'none'
                }}
              >
                <span style={{ filter: isSelected ? 'invert(1)' : 'none', marginRight: 4 }}>♫</span>
                <span style={{ fontWeight: isSelected ? 'bold' : 'normal', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {track.name}
                </span>
              </div>
            );
          })}
        </div>

        {/* Duration Seek Slider */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, padding: '0 2px' }}>
            <span>{currentTrack.name}</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            style={{ width: '100%', cursor: 'pointer', margin: '4px 0' }}
          />
        </div>

        {/* Media control & volume bar */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            padding: 6, 
            background: '#c0c0c0', 
            border: '1px solid #808080',
            gap: 12
          }}
        >
          {/* Player controls */}
          <div style={{ display: 'flex', gap: 4 }}>
            <button 
              className="button"
              onClick={handlePrev}
              style={{ minWidth: 32, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Previous Track"
            >
              <span style={{ fontSize: 10, fontWeight: 'bold' }}>|◀</span>
            </button>
            <button 
              className="button"
              onClick={handlePlayPause}
              style={{ minWidth: 40, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <span style={{ fontSize: 10, fontWeight: 'bold', letterSpacing: 1 }}>❚❚</span>
              ) : (
                <span style={{ fontSize: 10, fontWeight: 'bold' }}>▶</span>
              )}
            </button>
            <button 
              className="button"
              onClick={handleStop}
              style={{ minWidth: 32, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Stop"
            >
              <span style={{ fontSize: 8, fontWeight: 'bold' }}>■</span>
            </button>
            <button 
              className="button"
              onClick={handleNext}
              style={{ minWidth: 32, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Next Track"
            >
              <span style={{ fontSize: 10, fontWeight: 'bold' }}>▶|</span>
            </button>
          </div>

          {/* Volume Control */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, maxWidth: 180 }}>
            <span style={{ fontSize: 14 }} title="Volume">🔊</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={handleVolumeChange}
              style={{ flex: 1, cursor: 'pointer' }}
            />
          </div>
        </div>

      </div>
    </Win98Window>
  );
}

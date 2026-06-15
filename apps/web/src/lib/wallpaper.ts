import React from 'react';

export const WALLPAPERS = [
  { id: 'teal', name: 'Teal (Default)' },
  { id: 'silver', name: 'Silver Cloud' },
  { id: 'forest', name: 'Forest' },
  { id: 'brick', name: 'Brick Wall' },
  { id: 'win98', name: 'Windows 98' },
  { id: 'black', name: 'Black Tile' },
  { id: 'dotted', name: 'Dotted Grid' },
];

export function getWallpaperStyle(wallpaper: string): React.CSSProperties {
  if (wallpaper.startsWith('data:image/')) {
    return {
      background: `url(${wallpaper}) center center / cover no-repeat`,
    };
  }

  switch (wallpaper) {
    case 'silver':
      return { background: 'linear-gradient(to bottom, #ffffff, #808080)' };
    case 'forest':
      return { background: '#1a4a1a' };
    case 'brick':
      return {
        backgroundColor: '#8b4513',
        backgroundImage: `linear-gradient(335deg, rgba(255,255,255,0.1) 10px, transparent 10px),
                          linear-gradient(155deg, rgba(255,255,255,0.1) 10px, transparent 10px),
                          linear-gradient(335deg, rgba(255,255,255,0.1) 10px, transparent 10px),
                          linear-gradient(155deg, rgba(255,255,255,0.1) 10px, transparent 10px)`,
        backgroundSize: '20px 20px',
        backgroundPosition: '0px 0px, 10px 10px, 10px 0px, 0px 10px',
      };
    case 'win98':
      // A simple representation if we don't have the logo
      return { background: '#008080' };
    case 'black':
      return { background: '#000000' };
    case 'dotted':
      return {
        backgroundColor: '#1a1a1a',
        backgroundImage: 'radial-gradient(#555555 1px, transparent 1px)',
        backgroundSize: '4px 4px',
      };
    case 'teal':
    default:
      return { background: '#008080' };
  }
}

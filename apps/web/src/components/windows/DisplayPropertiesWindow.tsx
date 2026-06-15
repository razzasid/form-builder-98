'use client';

import { useState, useRef } from 'react';
import { useWindowStore } from '@/store/windowStore';
import { Win98Window } from './Win98Window';
import { WALLPAPERS, getWallpaperStyle } from '@/lib/wallpaper';

export function DisplayPropertiesWindow() {
  const { wallpaper, setWallpaper } = useWindowStore();
  const [preview, setPreview] = useState(wallpaper);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleApply = () => {
    setWallpaper(preview);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  return (
    <Win98Window name="displayProperties" title="🖥️ Display Properties" minWidth={450} minHeight={400}>
      <div className="window-body" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        
        <div style={{ display: 'flex', gap: 16, flex: 1 }}>
          {/* Left Side: Wallpaper Selection */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <fieldset style={{ padding: 8, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <legend>Wallpaper</legend>
              <p style={{ marginBottom: 8 }}>Click a wallpaper to select it:</p>
              
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 8, 
                flex: 1, 
                alignContent: 'flex-start',
                overflowY: 'auto'
              }}>
                {WALLPAPERS.map((wp) => (
                  <div
                    key={wp.id}
                    onClick={() => setPreview(wp.id)}
                    style={{
                      width: 100,
                      height: 100,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      border: preview === wp.id ? '2px dotted #000' : '2px solid transparent',
                      padding: 4,
                      background: preview === wp.id ? '#000080' : 'transparent',
                      color: preview === wp.id ? '#fff' : '#000',
                    }}
                  >
                    <div style={{ width: 60, height: 45, border: '1px solid #000', marginBottom: 4, ...getWallpaperStyle(wp.id) }} />
                    <span style={{ fontSize: 10, textAlign: 'center' }}>{wp.name}</span>
                  </div>
                ))}

                {/* Custom Image Option */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: 100,
                    height: 100,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    border: preview.startsWith('data:') ? '2px dotted #000' : '2px solid transparent',
                    padding: 4,
                    background: preview.startsWith('data:') ? '#000080' : 'transparent',
                    color: preview.startsWith('data:') ? '#fff' : '#000',
                  }}
                >
                  <div style={{ width: 60, height: 45, border: '1px solid #000', marginBottom: 4, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 16 }}>🖼️</span>
                  </div>
                  <span style={{ fontSize: 10, textAlign: 'center' }}>Custom Image</span>
                </div>
              </div>

              <div style={{ marginTop: 8, alignSelf: 'flex-end' }}>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <button onClick={() => fileInputRef.current?.click()}>Browse...</button>
              </div>
            </fieldset>
          </div>

          {/* Right Side: Desktop Preview */}
          <div style={{ width: 160, display: 'flex', flexDirection: 'column' }}>
            <fieldset style={{ padding: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <legend>Display</legend>
              <div style={{ marginBottom: 4, fontSize: 11 }}>Desktop Preview</div>
              
              {/* Mini Monitor */}
              <div style={{
                width: 130,
                height: 100,
                border: '2px solid #808080',
                borderRightColor: '#ffffff',
                borderBottomColor: '#ffffff',
                padding: 4,
                background: '#c0c0c0'
              }}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  border: '1px solid #000',
                  position: 'relative',
                  ...getWallpaperStyle(preview)
                }}>
                  {/* Fake Mini Window */}
                  <div style={{
                    position: 'absolute',
                    top: '20%',
                    left: '20%',
                    width: '60%',
                    height: '50%',
                    background: '#c0c0c0',
                    border: '1px solid #fff',
                    borderRightColor: '#808080',
                    borderBottomColor: '#808080',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <div style={{ height: 10, background: '#000080', color: '#fff', fontSize: 6, display: 'flex', alignItems: 'center', paddingLeft: 2 }}>
                      Window
                    </div>
                  </div>
                </div>
              </div>
            </fieldset>
          </div>
        </div>

        {/* Bottom Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={handleApply}>Apply</button>
          <button onClick={() => { handleApply(); useWindowStore.getState().closeWindow('displayProperties'); }}>OK</button>
        </div>
      </div>
    </Win98Window>
  );
}

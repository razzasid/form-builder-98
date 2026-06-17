import { create } from 'zustand';
import { AuthUser } from '@/lib/auth';

export type WindowName = 'login' | 'register' | 'myForms' | 'createForm' |
                  'formBuilder' | 'formPreview' | 'submissions' |
                  'analytics' | 'recycleBin' | 'displayProperties' | 'notepad' | 'clippy' | 'scanDisk' | 'musicPlayer';

export interface WindowState {
  isMinimized: boolean;
  isMaximized: boolean;
  // Position & size (for normal/restored state)
  x: number;
  y: number;
  width: number;
  height: number;
  // Saved position before maximize
  prevX: number;
  prevY: number;
  prevWidth: number;
  prevHeight: number;
  zIndex: number;
}

// Default sizes for different window types
const WINDOW_DEFAULTS: Partial<Record<WindowName, { width: number; height: number }>> = {
  login: { width: 320, height: 300 },
  register: { width: 380, height: 420 },
  myForms: { width: 600, height: 450 },
  formBuilder: { width: 800, height: 550 },
  formPreview: { width: 550, height: 500 },
  submissions: { width: 700, height: 450 },
  analytics: { width: 750, height: 500 },
  recycleBin: { width: 550, height: 400 },
  displayProperties: { width: 450, height: 400 },
  notepad: { width: 600, height: 450 },
  clippy: { width: 420, height: 520 },
  scanDisk: { width: 680, height: 450 },
  musicPlayer: { width: 620, height: 380 },
};

let nextZIndex = 100;
let cascadeOffset = 0;

function createDefaultWindowState(name: WindowName): WindowState {
  const defaults = WINDOW_DEFAULTS[name] || { width: 600, height: 400 };
  // Cascade windows so they don't all stack on top of each other
  const offset = cascadeOffset * 30;
  cascadeOffset = (cascadeOffset + 1) % 8;

  const x = Math.max(40, 60 + offset);
  const y = Math.max(20, 30 + offset);
  const z = nextZIndex++;

  return {
    isMinimized: false,
    isMaximized: false,
    x,
    y,
    width: defaults.width,
    height: defaults.height,
    prevX: x,
    prevY: y,
    prevWidth: defaults.width,
    prevHeight: defaults.height,
    zIndex: z,
  };
}

interface WindowStore {
  windows: Map<WindowName, WindowState>;
  activeWindow: WindowName | null;
  currentFormId: string | null;
  user: AuthUser | null;
  startMenuOpen: boolean;
  wallpaper: string;
  iconPositions: Record<string, { x: number, y: number }>;

  openWindow: (name: WindowName) => void;
  closeWindow: (name: WindowName) => void;
  minimizeWindow: (name: WindowName) => void;
  maximizeWindow: (name: WindowName) => void;
  restoreWindow: (name: WindowName) => void;
  focusWindow: (name: WindowName) => void;
  toggleMinimize: (name: WindowName) => void;
  moveWindow: (name: WindowName, x: number, y: number) => void;
  resizeWindow: (name: WindowName, width: number, height: number) => void;
  setCurrentFormId: (id: string | null) => void;
  setUser: (user: AuthUser | null) => void;
  toggleStartMenu: () => void;
  closeStartMenu: () => void;
  setWallpaper: (wallpaper: string) => void;
  setIconPosition: (id: string, x: number, y: number) => void;
  autoArrangeIcons: () => void;
  logout: () => void;
}

export const useWindowStore = create<WindowStore>((set) => ({
  windows: new Map(),
  activeWindow: null,
  currentFormId: null,
  user: null,
  startMenuOpen: false,
  wallpaper: typeof window !== 'undefined' ? localStorage.getItem('fb98_wallpaper') || 'teal' : 'teal',
  iconPositions: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('fb98_icons') || '{}') : {},

  openWindow: (name) => set((state) => {
    const next = new Map(state.windows);
    if (next.has(name)) {
      // Window already open — un-minimize and focus it
      const ws = { ...next.get(name)! };
      ws.isMinimized = false;
      ws.zIndex = nextZIndex++;
      next.set(name, ws);
    } else {
      next.set(name, createDefaultWindowState(name));
    }
    return {
      windows: next,
      activeWindow: name,
      startMenuOpen: false,
    };
  }),

  closeWindow: (name) => set((state) => {
    const next = new Map(state.windows);
    next.delete(name);
    // Find new active window (highest z-index, not minimized)
    let newActive: WindowName | null = null;
    let maxZ = -1;
    next.forEach((ws, wn) => {
      if (!ws.isMinimized && ws.zIndex > maxZ) {
        maxZ = ws.zIndex;
        newActive = wn;
      }
    });
    return {
      windows: next,
      activeWindow: state.activeWindow === name ? newActive : state.activeWindow,
    };
  }),

  minimizeWindow: (name) => set((state) => {
    const next = new Map(state.windows);
    const ws = next.get(name);
    if (!ws) return state;
    next.set(name, { ...ws, isMinimized: true });
    // Find new active window
    let newActive: WindowName | null = null;
    let maxZ = -1;
    next.forEach((w, wn) => {
      if (!w.isMinimized && w.zIndex > maxZ) {
        maxZ = w.zIndex;
        newActive = wn;
      }
    });
    return {
      windows: next,
      activeWindow: state.activeWindow === name ? newActive : state.activeWindow,
    };
  }),

  maximizeWindow: (name) => set((state) => {
    const next = new Map(state.windows);
    const ws = next.get(name);
    if (!ws) return state;
    next.set(name, {
      ...ws,
      isMaximized: true,
      isMinimized: false,
      prevX: ws.x,
      prevY: ws.y,
      prevWidth: ws.width,
      prevHeight: ws.height,
      x: 0,
      y: 0,
      width: window.innerWidth,
      height: window.innerHeight - 28, // taskbar height
      zIndex: nextZIndex++,
    });
    return { windows: next, activeWindow: name };
  }),

  restoreWindow: (name) => set((state) => {
    const next = new Map(state.windows);
    const ws = next.get(name);
    if (!ws) return state;
    next.set(name, {
      ...ws,
      isMaximized: false,
      isMinimized: false,
      x: ws.prevX,
      y: ws.prevY,
      width: ws.prevWidth,
      height: ws.prevHeight,
      zIndex: nextZIndex++,
    });
    return { windows: next, activeWindow: name };
  }),

  focusWindow: (name) => set((state) => {
    const next = new Map(state.windows);
    const ws = next.get(name);
    if (!ws) return state;
    next.set(name, { ...ws, zIndex: nextZIndex++, isMinimized: false });
    return { windows: next, activeWindow: name, startMenuOpen: false };
  }),

  toggleMinimize: (name) => set((state) => {
    const ws = state.windows.get(name);
    if (!ws) return state;
    if (ws.isMinimized) {
      // Restore from minimized
      const next = new Map(state.windows);
      next.set(name, { ...ws, isMinimized: false, zIndex: nextZIndex++ });
      return { windows: next, activeWindow: name };
    } else if (state.activeWindow === name) {
      // Currently active — minimize it
      const next = new Map(state.windows);
      next.set(name, { ...ws, isMinimized: true });
      let newActive: WindowName | null = null;
      let maxZ = -1;
      next.forEach((w, wn) => {
        if (!w.isMinimized && w.zIndex > maxZ) {
          maxZ = w.zIndex;
          newActive = wn;
        }
      });
      return { windows: next, activeWindow: newActive };
    } else {
      // Not active — just focus it
      const next = new Map(state.windows);
      next.set(name, { ...ws, zIndex: nextZIndex++ });
      return { windows: next, activeWindow: name };
    }
  }),

  moveWindow: (name, x, y) => set((state) => {
    const next = new Map(state.windows);
    const ws = next.get(name);
    if (!ws || ws.isMaximized) return state;
    next.set(name, { ...ws, x, y });
    return { windows: next };
  }),

  resizeWindow: (name, width, height) => set((state) => {
    const next = new Map(state.windows);
    const ws = next.get(name);
    if (!ws || ws.isMaximized) return state;
    next.set(name, { ...ws, width: Math.max(200, width), height: Math.max(150, height) });
    return { windows: next };
  }),

  setCurrentFormId: (id) => set({ currentFormId: id }),
  setUser: (user) => set({ user }),
  toggleStartMenu: () => set((s) => ({ startMenuOpen: !s.startMenuOpen })),
  closeStartMenu: () => set({ startMenuOpen: false }),
  setWallpaper: (wallpaper) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fb98_wallpaper', wallpaper);
    }
    set({ wallpaper });
  },
  setIconPosition: (id, x, y) => set((state) => {
    const next = { ...state.iconPositions, [id]: { x, y } };
    if (typeof window !== 'undefined') {
      localStorage.setItem('fb98_icons', JSON.stringify(next));
    }
    return { iconPositions: next };
  }),
  autoArrangeIcons: () => set(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fb98_icons');
    }
    return { iconPositions: {} };
  }),
  logout: () => {
    cascadeOffset = 0;
    nextZIndex = 100;
    set({ user: null, windows: new Map(), activeWindow: null, startMenuOpen: false });
  },
}));

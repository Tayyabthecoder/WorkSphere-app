import { create } from 'zustand';

export type ThemeAccent = 'forest' | 'ocean' | 'plum' | 'ember';

export interface ThemeAccentConfig {
  id: ThemeAccent;
  label: string;
  color: string;
  subColor: string;
  description: string;
}

export const THEME_ACCENTS: ThemeAccentConfig[] = [
  {
    id: 'forest',
    label: 'Forest',
    color: '#155A37',
    subColor: '#34D399',
    description: 'Calm evergreen and emerald flora',
  },
  {
    id: 'ocean',
    label: 'Ocean',
    color: '#1F4FA8',
    subColor: '#60A5FA',
    description: 'Crisp deep cobalt and maritime sapphire',
  },
  {
    id: 'plum',
    label: 'Plum',
    color: '#6A3FB0',
    subColor: '#C084FC',
    description: 'Refined royal amethyst and lavender',
  },
  {
    id: 'ember',
    label: 'Ember',
    color: '#B1491D',
    subColor: '#FB923C',
    description: 'Warm terracotta clay and sunset amber',
  },
];

interface ThemeState {
  accent: ThemeAccent;
  setAccent: (accent: ThemeAccent) => void;
}

const getInitialAccent = (): ThemeAccent => {
  try {
    const stored = localStorage.getItem('worksphere:accent');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (['forest', 'ocean', 'plum', 'ember'].includes(parsed)) {
        return parsed as ThemeAccent;
      }
    }
  } catch (e) {}
  return 'forest';
};

export const useThemeStore = create<ThemeState>((set) => ({
  accent: getInitialAccent(),
  setAccent: (accent: ThemeAccent) => {
    try {
      localStorage.setItem('worksphere:accent', JSON.stringify(accent));
      document.documentElement.dataset.accent = accent;
    } catch (e) {
      console.error('Failed to persist accent theme:', e);
    }
    set({ accent });
  },
}));

// Apply on import/mount
if (typeof document !== 'undefined') {
  document.documentElement.dataset.accent = getInitialAccent();
}

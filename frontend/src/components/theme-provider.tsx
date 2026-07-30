import { createContext, useContext, useEffect, useState } from 'react';

export type Palette = 'warm' | 'sage' | 'cobalt' | 'lavender' | 'moss' | 'berry';
export type Mode = 'dark' | 'light';

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultPalette?: Palette;
  defaultMode?: Mode;
  storageKeyPrefix?: string;
}

interface ThemeProviderState {
  palette: Palette;
  mode: Mode;
  setPalette: (palette: Palette) => void;
  setMode: (mode: Mode) => void;
  theme: Mode;
  setTheme: (mode: Mode) => void;
}

const initialState: ThemeProviderState = {
  palette: 'warm',
  mode: 'dark',
  setPalette: () => null,
  setMode: () => null,
  theme: 'dark',
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultPalette = 'warm',
  defaultMode = 'dark',
  storageKeyPrefix = 'garage-ui',
  ...props
}: ThemeProviderProps) {
  const [palette, setPaletteState] = useState<Palette>(
    () => (localStorage.getItem(`${storageKeyPrefix}-palette`) as Palette) || defaultPalette
  );

  const [mode, setModeState] = useState<Mode>(
    () => (localStorage.getItem(`${storageKeyPrefix}-mode`) as Mode) || defaultMode
  );

  useEffect(() => {
    const root = window.document.documentElement;
    const allPalettes = ['warm', 'sage', 'cobalt', 'lavender', 'moss', 'berry'];

    root.classList.remove(...allPalettes);

    if (mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    root.classList.add(palette);
  }, [palette, mode]);

  const setPalette = (p: Palette) => {
    localStorage.setItem(`${storageKeyPrefix}-palette`, p);
    setPaletteState(p);
  };

  const setMode = (m: Mode) => {
    localStorage.setItem(`${storageKeyPrefix}-mode`, m);
    setModeState(m);
  };

  const value: ThemeProviderState = {
    palette,
    mode,
    setPalette,
    setMode,
    theme: mode,
    setTheme: setMode,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};



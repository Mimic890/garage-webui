import { Check, ChevronDown, Sparkles } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme, type Theme } from '@/components/theme-provider';

export interface ThemeConfig {
  id: Theme;
  name: string;
  colors: {
    text: string;
    bg: string;
    primary: string;
    secondary: string;
    accent: string;
  };
}

export const THEMES: ThemeConfig[] = [
  {
    id: 'light',
    name: 'Warm Light',
    colors: { text: '#1c1917', bg: '#faf7f2', primary: '#ff9447', secondary: '#f3efe8', accent: '#e7e2d8' },
  },
  {
    id: 'dark',
    name: 'Midnight Dark',
    colors: { text: '#e8eaed', bg: '#1a1d29', primary: '#ff9447', secondary: '#3a3f52', accent: '#2d3142' },
  },
  {
    id: 'sage',
    name: 'Sage Mint',
    colors: { text: '#121313', bg: '#f8f9f8', primary: '#78998d', secondary: '#b1cac1', accent: '#88b7a6' },
  },
  {
    id: 'cobalt',
    name: 'Cobalt Blue',
    colors: { text: '#0c0d10', bg: '#f2f4f9', primary: '#3f68c0', secondary: '#92aeec', accent: '#4e82f4' },
  },
  {
    id: 'lavender',
    name: 'Lavender Dusk',
    colors: { text: '#070c18', bg: '#eff3fb', primary: '#416fca', secondary: '#b596e2', accent: '#b569d5' },
  },
  {
    id: 'moss',
    name: 'Muted Moss',
    colors: { text: '#0f1411', bg: '#f6f8f7', primary: '#6f9580', secondary: '#aaadc0', accent: '#9e97b2' },
  },
  {
    id: 'berry',
    name: 'Berry Velvet',
    colors: { text: '#403d88', bg: '#fdf6fa', primary: '#8b639b', secondary: '#af719d', accent: '#f8b2b2' },
  },
  {
    id: 'ocean',
    name: 'Deep Ocean',
    colors: { text: '#bde8f5', bg: '#0f2854', primary: '#4988c4', secondary: '#1c4d8d', accent: '#bde8f5' },
  },
];

function PaletteRectangle({ colors, className = '' }: { colors: ThemeConfig['colors']; className?: string }) {
  return (
    <div className={`flex h-4 w-12 overflow-hidden rounded border border-border/80 shadow-xs ${className}`}>
      <div className="flex-1 h-full" style={{ backgroundColor: colors.bg }} title="Background" />
      <div className="flex-1 h-full" style={{ backgroundColor: colors.text }} title="Text" />
      <div className="flex-1 h-full" style={{ backgroundColor: colors.primary }} title="Primary" />
      <div className="flex-1 h-full" style={{ backgroundColor: colors.secondary }} title="Secondary" />
      <div className="flex-1 h-full" style={{ backgroundColor: colors.accent }} title="Accent" />
    </div>
  );
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const currentThemeId =
    theme === 'system'
      ? typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme;

  const currentThemeConfig = THEMES.find((t) => t.id === currentThemeId) || THEMES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-2 px-2.5 py-1.5 h-8 rounded-lg border border-border bg-card hover:bg-muted/80 transition-all shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        title="Change color theme"
      >
        <PaletteRectangle colors={currentThemeConfig.colors} />
        <ChevronDown className="h-3.5 w-3.5 opacity-60 transition-transform duration-200" />
        <span className="sr-only">Toggle theme</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-1.5 space-y-0.5">
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          Color Schemes
        </div>
        {THEMES.map((t) => {
          const isSelected = theme === t.id;
          return (
            <DropdownMenuItem
              key={t.id}
              onClick={() => setTheme(t.id)}
              className="flex items-center justify-between cursor-pointer py-1.5 px-2.5 rounded-md hover:bg-accent hover:text-accent-foreground"
            >
              <div className="flex items-center gap-2">
                <div className="w-4 flex items-center justify-center">
                  {isSelected && <Check className="h-3.5 w-3.5 text-primary font-bold" />}
                </div>
                <span className={`text-sm ${isSelected ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                  {t.name}
                </span>
              </div>
              <PaletteRectangle colors={t.colors} />
            </DropdownMenuItem>
          );
        })}
        <div className="my-1 border-t border-border" />
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className="flex items-center justify-between cursor-pointer py-1.5 px-2.5 rounded-md hover:bg-accent"
        >
          <div className="flex items-center gap-2">
            <div className="w-4 flex items-center justify-center">
              {theme === 'system' && <Check className="h-3.5 w-3.5 text-primary font-bold" />}
            </div>
            <span className={`text-sm ${theme === 'system' ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
              System
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground font-mono">Auto</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


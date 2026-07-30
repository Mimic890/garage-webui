import { Check, ChevronDown, Moon, Sparkles, Sun } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme, type Palette } from '@/components/theme-provider';
import { cn } from '@/lib/utils';

export interface PaletteConfig {
  id: Palette;
  name: string;
  colors: {
    dark: { text: string; bg: string; primary: string; secondary: string; accent: string };
    light: { text: string; bg: string; primary: string; secondary: string; accent: string };
  };
}

export const PALETTES: PaletteConfig[] = [
  {
    id: 'warm',
    name: 'Warm',
    colors: {
      dark: { text: '#e8eaed', bg: '#1a1d29', primary: '#ff9447', secondary: '#3a3f52', accent: '#2d3142' },
      light: { text: '#1c1917', bg: '#faf7f2', primary: '#ff9447', secondary: '#f3efe8', accent: '#e7e2d8' },
    },
  },
  {
    id: 'sage',
    name: 'Sage',
    colors: {
      dark: { text: '#e2ede8', bg: '#111614', primary: '#78998d', secondary: '#2a3d36', accent: '#88b7a6' },
      light: { text: '#121313', bg: '#f8f9f8', primary: '#78998d', secondary: '#b1cac1', accent: '#88b7a6' },
    },
  },
  {
    id: 'cobalt',
    name: 'Cobalt',
    colors: {
      dark: { text: '#e5ecf9', bg: '#0c1019', primary: '#4e82f4', secondary: '#23355e', accent: '#3f68c0' },
      light: { text: '#0c0d10', bg: '#f2f4f9', primary: '#3f68c0', secondary: '#92aeec', accent: '#4e82f4' },
    },
  },
  {
    id: 'lavender',
    name: 'Lavender',
    colors: {
      dark: { text: '#f0ebf8', bg: '#110d1a', primary: '#b569d5', secondary: '#382650', accent: '#b596e2' },
      light: { text: '#070c18', bg: '#eff3fb', primary: '#416fca', secondary: '#b596e2', accent: '#b569d5' },
    },
  },
  {
    id: 'moss',
    name: 'Moss',
    colors: {
      dark: { text: '#e6eae8', bg: '#111613', primary: '#6f9580', secondary: '#2b3630', accent: '#9e97b2' },
      light: { text: '#0f1411', bg: '#f6f8f7', primary: '#6f9580', secondary: '#aaadc0', accent: '#9e97b2' },
    },
  },
  {
    id: 'berry',
    name: 'Berry',
    colors: {
      dark: { text: '#f8e8f3', bg: '#171224', primary: '#af719d', secondary: '#3e284a', accent: '#f8b2b2' },
      light: { text: '#403d88', bg: '#fdf6fa', primary: '#8b639b', secondary: '#af719d', accent: '#f8b2b2' },
    },
  },
];

function PaletteRectangle({
  colors,
  className = '',
}: {
  colors: { text: string; bg: string; primary: string; secondary: string; accent: string };
  className?: string;
}) {
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
  const { palette, mode, setPalette, setMode } = useTheme();

  const currentPaletteConfig = PALETTES.find((p) => p.id === palette) || PALETTES[0];
  const activeColors = currentPaletteConfig.colors[mode];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-2 px-2.5 py-1.5 h-8 rounded-lg border border-border bg-card hover:bg-muted/80 transition-all shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        title="Change theme palette"
      >
        <PaletteRectangle colors={activeColors} />
        <ChevronDown className="h-3.5 w-3.5 opacity-60 transition-transform duration-200" />
        <span className="sr-only">Toggle theme</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-1.5 space-y-0.5">
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          Color Palette
        </div>
        {PALETTES.map((p) => {
          const isSelected = palette === p.id;
          const pColors = p.colors[mode];
          return (
            <DropdownMenuItem
              key={p.id}
              onClick={() => setPalette(p.id)}
              className="flex items-center justify-between cursor-pointer py-1.5 px-2.5 rounded-md hover:bg-accent hover:text-accent-foreground"
            >
              <div className="flex items-center gap-2">
                <div className="w-4 flex items-center justify-center">
                  {isSelected && <Check className="h-3.5 w-3.5 text-primary font-bold" />}
                </div>
                <span className={`text-sm ${isSelected ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                  {p.name}
                </span>
              </div>
              <PaletteRectangle colors={pColors} />
            </DropdownMenuItem>
          );
        })}

        <div className="my-1.5 border-t border-border" />

        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground tracking-wider uppercase">
          Theme Mode
        </div>
        <div className="grid grid-cols-2 gap-1 p-1 bg-muted/50 rounded-lg border border-border/50">
          <button
            type="button"
            onClick={() => setMode('light')}
            className={cn(
              'flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-all cursor-pointer',
              mode === 'light'
                ? 'bg-background text-foreground shadow-xs border border-border'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Sun className="w-3.5 h-3.5" />
            Light
          </button>
          <button
            type="button"
            onClick={() => setMode('dark')}
            className={cn(
              'flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-all cursor-pointer',
              mode === 'dark'
                ? 'bg-background text-foreground shadow-xs border border-border'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Moon className="w-3.5 h-3.5" />
            Dark
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}



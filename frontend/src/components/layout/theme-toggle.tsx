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
  group: string;
  /** When set, this palette locks brightness (Catppuccin flavors). */
  fixedMode?: 'light' | 'dark';
  colors: {
    dark: { text: string; bg: string; primary: string; secondary: string; accent: string };
    light: { text: string; bg: string; primary: string; secondary: string; accent: string };
  };
}

export const PALETTES: PaletteConfig[] = [
  {
    id: 'warm',
    name: 'Warm',
    group: 'Brand',
    colors: {
      dark: { text: '#e8eaed', bg: '#1a1d29', primary: '#ff9447', secondary: '#3a3f52', accent: '#2d3142' },
      light: { text: '#1c1917', bg: '#faf7f2', primary: '#ff9447', secondary: '#f3efe8', accent: '#e7e2d8' },
    },
  },
  {
    id: 'catppuccin-latte',
    name: 'Latte',
    group: 'Catppuccin',
    fixedMode: 'light',
    colors: {
      // Flavor is light-only; both swatch slots show Latte.
      dark: { text: '#4c4f69', bg: '#eff1f5', primary: '#8839ef', secondary: '#ccd0da', accent: '#e6e9ef' },
      light: { text: '#4c4f69', bg: '#eff1f5', primary: '#8839ef', secondary: '#ccd0da', accent: '#e6e9ef' },
    },
  },
  {
    id: 'catppuccin-frappe',
    name: 'Frappé',
    group: 'Catppuccin',
    fixedMode: 'dark',
    colors: {
      dark: { text: '#c6d0f5', bg: '#303446', primary: '#ca9ee6', secondary: '#414559', accent: '#292c3c' },
      light: { text: '#c6d0f5', bg: '#303446', primary: '#ca9ee6', secondary: '#414559', accent: '#292c3c' },
    },
  },
  {
    id: 'catppuccin-macchiato',
    name: 'Macchiato',
    group: 'Catppuccin',
    fixedMode: 'dark',
    colors: {
      dark: { text: '#cad3f5', bg: '#24273a', primary: '#c6a0f6', secondary: '#363a4f', accent: '#1e2030' },
      light: { text: '#cad3f5', bg: '#24273a', primary: '#c6a0f6', secondary: '#363a4f', accent: '#1e2030' },
    },
  },
  {
    id: 'catppuccin-mocha',
    name: 'Mocha',
    group: 'Catppuccin',
    fixedMode: 'dark',
    colors: {
      dark: { text: '#cdd6f4', bg: '#1e1e2e', primary: '#cba6f7', secondary: '#313244', accent: '#181825' },
      light: { text: '#cdd6f4', bg: '#1e1e2e', primary: '#cba6f7', secondary: '#313244', accent: '#181825' },
    },
  },
  {
    id: 'github',
    name: 'GitHub',
    group: 'Others',
    colors: {
      dark: { text: '#e6edf3', bg: '#0d1117', primary: '#2f81f7', secondary: '#21262d', accent: '#161b22' },
      light: { text: '#1f2328', bg: '#ffffff', primary: '#0969da', secondary: '#f6f8fa', accent: '#d0d7de' },
    },
  },
  {
    id: 'kanagawa',
    name: 'Kanagawa',
    group: 'Others',
    colors: {
      // Wave (dark) / Lotus (light)
      dark: { text: '#dcd7ba', bg: '#1f1f28', primary: '#7e9cd8', secondary: '#2a2a37', accent: '#16161d' },
      light: { text: '#545464', bg: '#f2ecbc', primary: '#4d699b', secondary: '#e7dba0', accent: '#e4d794' },
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

function groupPalettes(palettes: PaletteConfig[]) {
  const groups: { name: string; items: PaletteConfig[] }[] = [];
  for (const p of palettes) {
    const last = groups[groups.length - 1];
    if (last && last.name === p.group) {
      last.items.push(p);
    } else {
      groups.push({ name: p.group, items: [p] });
    }
  }
  return groups;
}

export function ThemeToggle() {
  const { palette, mode, setPalette, setMode } = useTheme();

  const currentPaletteConfig = PALETTES.find((p) => p.id === palette) || PALETTES[0];
  const swatchMode = currentPaletteConfig.fixedMode ?? mode;
  const activeColors = currentPaletteConfig.colors[swatchMode];
  const groups = groupPalettes(PALETTES);
  const isCatppuccin = palette.startsWith('catppuccin-');

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
      <DropdownMenuContent align="end" className="w-60 p-1.5 space-y-0.5 max-h-[min(80vh,32rem)] overflow-y-auto">
        {groups.map((group) => (
          <div key={group.name}>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
              {group.name === 'Brand' ? <Sparkles className="w-3.5 h-3.5 text-primary" /> : null}
              {group.name}
            </div>
            {group.items.map((p) => {
              const isSelected = palette === p.id;
              const pColors = p.colors[p.fixedMode ?? mode];
              return (
                <DropdownMenuItem
                  key={p.id}
                  closeOnClick={false}
                  onClick={() => setPalette(p.id)}
                  className="flex items-center justify-between cursor-pointer py-1.5 px-2.5 rounded-md hover:bg-accent hover:text-accent-foreground"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-4 flex items-center justify-center shrink-0">
                      {isSelected && <Check className="h-3.5 w-3.5 text-primary font-bold" />}
                    </div>
                    <span
                      className={`text-sm truncate ${isSelected ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}
                    >
                      {p.name}
                    </span>
                  </div>
                  <PaletteRectangle colors={pColors} />
                </DropdownMenuItem>
              );
            })}
          </div>
        ))}

        <div className="my-1.5 border-t border-border" />

        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground tracking-wider uppercase">
          Theme Mode
        </div>
        {isCatppuccin ? (
          <p className="px-2.5 pb-1.5 text-[11px] text-muted-foreground leading-snug">
            On Catppuccin, Light → Latte and Dark → Mocha. Pick Frappé / Macchiato from the list.
          </p>
        ) : null}
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

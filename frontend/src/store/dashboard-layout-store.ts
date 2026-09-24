import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PanelSize {
  /** Width in columns of a 12-column row (applies on wide screens). */
  w: number;
  /** Body height in pixels (the chart itself for time series). */
  h: number;
}

interface DashboardLayoutStore {
  /** Panel ids per row in display order; ids not listed keep their default place. */
  order: Record<string, string[]>;
  hidden: string[];
  sizes: Record<string, PanelSize>;
  setOrder: (row: string, ids: string[]) => void;
  setHidden: (id: string, hidden: boolean) => void;
  setSize: (id: string, size: PanelSize) => void;
  reset: () => void;
}

export const useDashboardLayout = create<DashboardLayoutStore>()(
  persist(
    (set) => ({
      order: {},
      hidden: [],
      sizes: {},
      setOrder: (row, ids) => set((s) => ({ order: { ...s.order, [row]: ids } })),
      setHidden: (id, hidden) =>
        set((s) => ({ hidden: hidden ? [...s.hidden.filter((h) => h !== id), id] : s.hidden.filter((h) => h !== id) })),
      setSize: (id, size) => set((s) => ({ sizes: { ...s.sizes, [id]: size } })),
      reset: () => set({ order: {}, hidden: [], sizes: {} }),
    }),
    { name: 'dashboard-layout', version: 1 },
  ),
);

/**
 * Applies a saved order to the current panel ids: unknown saved ids are
 * dropped, and panels added since (or never moved) are slotted in after the
 * panel that precedes them by default.
 */
export function mergeOrder(saved: string[] | undefined, defaults: string[]): string[] {
  const known = new Set(defaults);
  const out = (saved ?? []).filter((id) => known.has(id));
  defaults.forEach((id, i) => {
    if (out.includes(id)) return;
    const prev = defaults
      .slice(0, i)
      .reverse()
      .find((p) => out.includes(p));
    out.splice(prev ? out.indexOf(prev) + 1 : 0, 0, id);
  });
  return out;
}

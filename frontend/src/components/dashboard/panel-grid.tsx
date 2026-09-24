import * as React from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Eye, EyeOff, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { PanelSlotContext, type PanelSlot } from '@/components/dashboard/panels';
import { mergeOrder, useDashboardLayout, type PanelSize } from '@/store/dashboard-layout-store';

export interface PanelDef {
  id: string;
  /** Shown on the compact stub that stands in for a hidden panel in edit mode. */
  title: string;
  /** Default width in columns of 12 (wide screens). */
  w: number;
  /** Default body height in pixels. */
  h: number;
  minH?: number;
  /** Small tiles: two per row on phones, three on tablets. */
  compact?: boolean;
  /** Receives the current size so fixed-layout panels can size their body. */
  render: (size: PanelSize) => React.ReactNode;
}

const COLS = 12;
const H_STEP = 10;
const MAX_H = 900;
// Custom widths apply from this width up; below it panels use a responsive
// default so a 2-column tile never gets squeezed on a laptop.
const WIDE_QUERY = '(min-width: 1280px)';

function useWide() {
  const [wide, setWide] = React.useState(() => typeof window !== 'undefined' && window.matchMedia(WIDE_QUERY).matches);
  React.useEffect(() => {
    const mq = window.matchMedia(WIDE_QUERY);
    const on = () => setWide(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return wide;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function ResizeHandle({ size, minH, gridRef, onPreview, onCommit }: {
  size: PanelSize;
  minH: number;
  gridRef: React.RefObject<HTMLDivElement | null>;
  onPreview: (s: PanelSize | null) => void;
  onCommit: (s: PanelSize) => void;
}) {
  const { t } = useTranslation();
  const start = React.useRef<{ x: number; y: number; size: PanelSize; col: number; last: PanelSize } | null>(null);

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const width = gridRef.current?.clientWidth ?? 1200;
    start.current = { x: e.clientX, y: e.clientY, size, col: width / COLS, last: size };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const s = start.current;
    if (!s) return;
    const next = {
      w: clamp(Math.round(s.size.w + (e.clientX - s.x) / s.col), 1, COLS),
      h: clamp(Math.round((s.size.h + e.clientY - s.y) / H_STEP) * H_STEP, minH, MAX_H),
    };
    if (next.w !== s.last.w || next.h !== s.last.h) {
      s.last = next;
      onPreview(next);
    }
  };
  const onPointerUp = () => {
    const s = start.current;
    start.current = null;
    if (!s) return;
    onPreview(null);
    if (s.last.w !== s.size.w || s.last.h !== s.size.h) onCommit(s.last);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -H_STEP], ArrowDown: [0, H_STEP] }[e.key];
    if (!d) return;
    e.preventDefault();
    onCommit({ w: clamp(size.w + d[0], 1, COLS), h: clamp(size.h + d[1], minH, MAX_H) });
  };

  return (
    <button
      type="button"
      aria-label={t('dashboard.edit.resize')}
      title={t('dashboard.edit.resize')}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      className="absolute bottom-0 right-0 z-10 flex h-5 w-5 cursor-nwse-resize touch-none items-end justify-end p-1 text-[var(--muted-foreground)] hover:text-[var(--primary)] focus-visible:text-[var(--primary)] focus-visible:outline-none"
    >
      <svg viewBox="0 0 10 10" className="h-2.5 w-2.5" aria-hidden>
        <path d="M9 1 1 9M9 5 5 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      </svg>
    </button>
  );
}

function SortablePanel({ def, size, hidden, editing, wide, gridRef }: {
  def: PanelDef;
  size: PanelSize;
  hidden: boolean;
  editing: boolean;
  wide: boolean;
  gridRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { t } = useTranslation();
  const setHidden = useDashboardLayout((s) => s.setHidden);
  const setSize = useDashboardLayout((s) => s.setSize);
  const [preview, setPreview] = React.useState<PanelSize | null>(null);
  const [expanded, setExpanded] = React.useState(false);
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: def.id, disabled: !editing });

  React.useEffect(() => {
    if (editing) setExpanded(false);
  }, [editing]);

  const cur = preview ?? size;
  const span = expanded ? COLS : cur.w;

  const slot = React.useMemo<PanelSlot>(
    () => ({
      height: cur.h,
      editing,
      inactive: hidden,
      expanded,
      toggleExpanded: () => setExpanded((e) => !e),
      controls: (
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => setHidden(def.id, !hidden)}
            className="rounded p-1 text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
            aria-label={hidden ? t('dashboard.edit.show') : t('dashboard.edit.hide')}
            title={hidden ? t('dashboard.edit.show') : t('dashboard.edit.hide')}
          >
            {hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            className="cursor-grab touch-none rounded p-1 text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)] active:cursor-grabbing"
            aria-label={t('dashboard.edit.move')}
            title={t('dashboard.edit.move')}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
      resizeHandle: (
        <ResizeHandle size={size} minH={def.minH ?? 60} gridRef={gridRef} onPreview={setPreview} onCommit={(s) => setSize(def.id, s)} />
      ),
    }),
    [cur.h, editing, hidden, expanded, def.id, def.minH, size, gridRef, setHidden, setSize, setActivatorNodeRef, attributes, listeners, t],
  );

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 30 : undefined,
    gridColumn: wide || expanded ? `span ${span} / span ${span}` : undefined,
  };

  // A hidden panel is never rendered: in edit mode a title-only stub stands
  // in for it, so it neither fetches nor re-renders on refresh.
  if (hidden) {
    return (
      <div
        ref={setNodeRef}
        style={{ transform: CSS.Translate.toString(transform), transition, zIndex: isDragging ? 30 : undefined }}
        data-panel={def.id}
        className={cn('col-span-6 min-w-0 sm:col-span-4 xl:col-span-3', isDragging && 'opacity-80 shadow-lg')}
      >
        <div className="flex h-9 items-center gap-1.5 rounded-lg border border-dashed border-[var(--input)] bg-[var(--card)]/60 pl-3 pr-1.5 text-[var(--muted-foreground)]">
          <span className="min-w-0 flex-1 truncate text-[0.8125rem]">{def.title}</span>
          {slot.controls}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-panel={def.id}
      className={cn(
        'relative min-w-0',
        !wide && !expanded && (def.compact ? 'col-span-6 sm:col-span-4' : def.w >= COLS ? 'col-span-12' : 'col-span-12 lg:col-span-6'),
        !wide && expanded && 'col-span-12',
        hidden && 'opacity-50 saturate-50',
        isDragging && 'opacity-80 shadow-lg',
      )}
    >
      <PanelSlotContext.Provider value={slot}>{def.render(cur)}</PanelSlotContext.Provider>
    </div>
  );
}

function HiddenZone({ id, empty, children }: { id: string; empty: boolean; children: React.ReactNode }) {
  const { t } = useTranslation();
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={cn('mt-3 border-t border-dashed border-[var(--input)] pt-3', isOver && 'border-[var(--primary)]')}>
      <div className="mb-2 text-[0.6875rem] uppercase tracking-wide text-[var(--muted-foreground)]">{t('dashboard.edit.hiddenPanels')}</div>
      {empty ? (
        <div className={cn('rounded-md border border-dashed border-[var(--border)] py-4 text-center text-[0.75rem] text-[var(--muted-foreground)]', isOver && 'border-[var(--primary)] text-[var(--foreground)]')}>
          {t('dashboard.edit.dropToHide')}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

/**
 * A dashboard row's panels on a 12-column grid. In edit mode panels can be
 * dragged by their grip, hidden with the eye button and resized from the
 * bottom-right corner; hidden panels then sit under a dashed line. Outside
 * edit mode hidden panels are not rendered at all (so they fetch nothing).
 */
export function PanelGrid({ row, panels, editing }: { row: string; panels: PanelDef[]; editing: boolean }) {
  const saved = useDashboardLayout((s) => s.order[row]);
  const hiddenIds = useDashboardLayout((s) => s.hidden);
  const sizes = useDashboardLayout((s) => s.sizes);
  const setOrder = useDashboardLayout((s) => s.setOrder);
  const setHidden = useDashboardLayout((s) => s.setHidden);
  const gridRef = React.useRef<HTMLDivElement>(null);
  const wide = useWide();

  const byId = React.useMemo(() => new Map(panels.map((p) => [p.id, p])), [panels]);
  const order = React.useMemo(() => mergeOrder(saved, panels.map((p) => p.id)), [saved, panels]);
  const hiddenSet = React.useMemo(() => new Set(hiddenIds), [hiddenIds]);
  const visible = order.filter((id) => !hiddenSet.has(id));
  const hidden = order.filter((id) => hiddenSet.has(id));
  const zoneId = `${row}:hidden`;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return;
    const id = String(active.id);
    const overId = String(over.id);
    if (overId === zoneId) {
      setHidden(id, true);
      return;
    }
    if (id === overId) return;
    // Dropping onto a panel of the other group moves it across.
    const toHidden = hiddenSet.has(overId);
    if (toHidden !== hiddenSet.has(id)) setHidden(id, toHidden);
    setOrder(row, arrayMove(order, order.indexOf(id), order.indexOf(overId)));
  };

  const sizeOf = (p: PanelDef): PanelSize => ({ w: sizes[p.id]?.w ?? p.w, h: sizes[p.id]?.h ?? p.h });
  const renderPanel = (id: string, isHidden: boolean) => {
    const def = byId.get(id)!;
    return <SortablePanel key={id} def={def} size={sizeOf(def)} hidden={isHidden} editing={editing} wide={wide} gridRef={gridRef} />;
  };

  if (!editing && visible.length === 0) return null;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={visible} strategy={rectSortingStrategy}>
        <div ref={gridRef} className="grid grid-cols-12 gap-2">
          {visible.map((id) => renderPanel(id, false))}
        </div>
      </SortableContext>
      {editing && (
        <HiddenZone id={zoneId} empty={hidden.length === 0}>
          <SortableContext items={hidden} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-12 gap-2">{hidden.map((id) => renderPanel(id, true))}</div>
          </SortableContext>
        </HiddenZone>
      )}
    </DndContext>
  );
}

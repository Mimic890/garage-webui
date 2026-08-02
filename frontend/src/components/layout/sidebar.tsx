import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Database, Key, LayoutDashboard, Server, Plug, Settings } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  visible?: (p: ReturnType<typeof usePermissions>, hasClusters: boolean) => boolean;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    items: [{ title: 'nav.dashboard', href: '/', icon: LayoutDashboard }],
  },
  {
    label: 'nav.storage',
    items: [
      { title: 'nav.buckets', href: '/buckets', icon: Database, visible: (p, hasClusters) => hasClusters && p.hasAnyPerm('bucket.list') },
    ],
  },
  {
    label: 'nav.cluster',
    items: [
      { title: 'nav.connections', href: '/connections', icon: Plug, visible: () => true },
      { title: 'nav.status', href: '/cluster', icon: Server, visible: (p, hasClusters) => hasClusters && p.hasAnyClusterAccess },
      { title: 'nav.access', href: '/access', icon: Key, visible: (p, hasClusters) => hasClusters && p.hasClusterPerm('key.list') },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

import { useClusterStore } from '@/store/cluster-store';
import { useTranslation } from '@/lib/i18n';

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const perms = usePermissions();
  const { clusters } = useClusterStore();
  const hasClusters = clusters.length > 0;

  const isActive = (href: string) =>
    href === '/'
      ? location.pathname === '/'
      : location.pathname === href || location.pathname.startsWith(href + '/');

  return (
    <aside
      className={cn(
        'flex h-full w-full flex-col bg-[var(--background)] transition-transform duration-300 ease-in-out md:w-64 md:border-r md:border-[var(--border)] md:bg-[var(--surface-sunken)] md:translate-x-0 shrink-0',
        'fixed md:static z-50 top-14 bottom-0',
        isOpen ? 'translate-x-0' : '-translate-x-full',
      )}
    >
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin">
        {navGroups.map((group, gi) => {
          const visibleItems = group.items.filter((item) => !item.visible || item.visible(perms, hasClusters));
          if (visibleItems.length === 0) return null;
          return (
            <div key={gi}>
              {group.label && (
                <div className="px-2 pb-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--muted-foreground)]">
                  {t(group.label)}
                </div>
              )}
              <ul className="space-y-0.5">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        to={item.href}
                        onClick={onClose}
                        className={cn(
                          'flex h-9 items-center gap-2 rounded-md px-2.5 text-[14px] transition-colors',
                          active
                            ? 'bg-[var(--primary)] font-medium text-[var(--primary-foreground)]'
                            : 'text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]',
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {t(item.title)}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
      <div className="px-3 py-3 border-t border-[var(--border)]">
        <Link
          to="/settings"
          onClick={onClose}
          className={cn(
            'flex h-9 items-center gap-2 rounded-md px-2.5 text-[14px] transition-colors',
            isActive('/settings')
              ? 'bg-[var(--primary)] font-medium text-[var(--primary-foreground)]'
              : 'text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]'
          )}
        >
          <Settings className="h-4 w-4" />
          {t('nav.settings')}
        </Link>
      </div>
    </aside>
  );
}

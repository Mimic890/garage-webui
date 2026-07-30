import * as React from 'react';
import { User, LogOut, Menu, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClusterSwitcher } from '@/components/layout/cluster-switcher';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { useAuthStore } from '@/store/auth-store';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/lib/i18n';

interface TopBarProps {
  onMenuClick?: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { user, config, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  React.useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const hasUser = !!(config && (config.admin.enabled || config.oidc.enabled) && user);

  return (
    <div
      className="sticky top-0 z-30 flex h-14 w-full shrink-0 items-center gap-3 border-b border-[var(--border)] bg-[var(--surface-sunken)] px-4 backdrop-blur"
    >
      <div className="flex items-center gap-2 pr-4 border-r border-[var(--border)] mr-2 md:mr-4">
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8 mr-1"
            onClick={onMenuClick}
            aria-label="Toggle navigation"
          >
            <Menu className="h-4 w-4" />
          </Button>
        )}
        <img src="/garage.png" alt="" className="h-7 w-7" />
        <span className="text-[16px] font-semibold tracking-tight hidden sm:inline-block">Garage UI</span>
      </div>
      <div className="min-w-0 flex-1 pl-1 md:pl-0 flex items-center">
        <ClusterSwitcher />
      </div>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        {hasUser && (
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="flex h-8 items-center gap-2 rounded-md px-2 text-[13.5px] text-[var(--foreground)] hover:bg-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)]">
                <User className="h-3.5 w-3.5" />
              </span>
              <span className="hidden max-w-[140px] truncate sm:inline">{user?.name || user?.username}</span>
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-1 w-56 overflow-hidden rounded-md border border-[var(--border)] bg-[var(--popover)] shadow-lg">
                <div className="border-b border-[var(--border)] px-3 py-2">
                  <div className="truncate text-[14px] font-medium">{user?.name || user?.username}</div>
                  {user?.email && (
                    <div className="truncate text-[12.5px] text-[var(--muted-foreground)]">{user.email}</div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); navigate('/user-settings'); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[14px] hover:bg-[var(--accent)]"
                >
                  <Settings className="h-3.5 w-3.5" /> {t('settings.user') || 'User Settings'}
                </button>
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); logout(); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[14px] hover:bg-[var(--accent)] text-red-500"
                >
                  <LogOut className="h-3.5 w-3.5" /> Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

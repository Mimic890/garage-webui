import {Link, useLocation} from 'react-router-dom';
import {cn} from '@/lib/utils';
import {Database, Key, LayoutDashboard,} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    title: 'Buckets',
    href: '/buckets',
    icon: Database,
  },
  {
    title: 'Access Control',
    href: '/access',
    icon: Key,
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();

  return (
    <div
      className={cn(
        'flex h-full w-64 flex-col border-r transition-transform duration-300 ease-in-out md:translate-x-0',
        'fixed md:static z-50',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
      style={{ backgroundColor: 'var(--background)' }}
    >
      <div className="flex h-16 items-center border-b px-6">
        <img src="/garage.png" alt="Garage UI Logo" className="h-8 w-8 mr-2" />
        <span className="text-lg font-semibold">Garage UI</span>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;

          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
              style={isActive ? { backgroundColor: 'var(--primary)', color: '#000000' } : undefined}
            >
              <Icon className="h-5 w-5" />
              {item.title}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4">
        <div className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
            AD
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate">Admin User</p>
            <p className="text-xs text-muted-foreground truncate">admin@garage.local</p>
          </div>
        </div>
      </div>
    </div>
  );
}

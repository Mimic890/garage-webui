import { Outlet } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { TopBar } from './top-bar';
import { useState } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { NoAccess } from '@/pages/NoAccess';
export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { noAccess } = usePermissions();

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--background)]">
      <TopBar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex flex-1 overflow-hidden min-h-0">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <main className="flex-1 overflow-y-auto min-w-0 scrollbar-thin">
          {noAccess ? <NoAccess /> : <Outlet />}
        </main>
      </div>
    </div>
  );
}

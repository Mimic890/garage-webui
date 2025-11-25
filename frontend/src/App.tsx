import {BrowserRouter, Route, Routes} from 'react-router-dom';
import {QueryClientProvider} from '@tanstack/react-query';
import {ThemeProvider, useTheme} from '@/components/theme-provider';
import {Layout} from '@/components/layout/layout';
import {Dashboard} from '@/pages/Dashboard';
import {Buckets} from '@/pages/Buckets';
import {Cluster} from '@/pages/Cluster';
import {AccessControl} from '@/pages/AccessControl';
import {Toaster} from 'sonner';
import {queryClient} from '@/lib/query-client';

function ThemedToaster() {
  const { theme } = useTheme();

  return <Toaster richColors position="bottom-right" theme={theme} />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="Noooste/garage-ui-theme">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="buckets" element={<Buckets />} />
              <Route path="cluster" element={<Cluster />} />
              <Route path="access" element={<AccessControl />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <ThemedToaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

import { useEffect } from 'react';
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import {QueryClientProvider} from '@tanstack/react-query';
import {ThemeProvider, useTheme} from '@/components/theme-provider';
import {Layout} from '@/components/layout/layout';
import {Dashboard} from '@/pages/Dashboard';
import {Buckets} from '@/pages/Buckets';
import {Cluster} from '@/pages/Cluster';
import {AccessControl} from '@/pages/AccessControl';
import {Login} from '@/pages/Login';
import {ObjectDetailsView} from '@/components/buckets/ObjectDetailsView';
import {Toaster} from 'sonner';
import {queryClient} from '@/lib/query-client';
import {useAuthStore} from '@/store/auth-store';
import {ProtectedRoute} from '@/components/auth/ProtectedRoute';
import {LoadingSpinner} from '@/components/auth/LoadingSpinner';

function ThemedToaster() {
  const { theme } = useTheme();

  return <Toaster richColors position="bottom-right" theme={theme} />;
}

function App() {
  const { initialize, isLoading } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="Noooste/garage-ui-theme">
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="buckets" element={<Buckets />} />
              <Route path="buckets/:bucketName/objects/*" element={<ObjectDetailsView />} />
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

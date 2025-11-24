import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme-provider';
import { Layout } from '@/components/layout/layout';
import { Dashboard } from '@/pages/Dashboard';
import { Buckets } from '@/pages/Buckets';
import { AccessControl } from '@/pages/AccessControl';

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="garage-ui-theme">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="buckets" element={<Buckets />} />
            <Route path="access" element={<AccessControl />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;

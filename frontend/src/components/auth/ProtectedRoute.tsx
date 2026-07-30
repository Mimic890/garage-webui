import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth-store';
import { useClusterStore } from '@/store/cluster-store';
import { LoadingSpinner } from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, config, isSetup } = useAuthStore();
  const { fetchClusters } = useClusterStore();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      fetchClusters();
    }
  }, [isAuthenticated, fetchClusters]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isSetup) {
    return <Navigate to="/setup" state={{ from: location }} replace />;
  }

  // If no auth is enabled, always allow access
  if (config && !config.admin.enabled && !config.oidc.enabled && !config.token.enabled) {
    return <>{children}</>;
  }

  // If not authenticated, redirect to login with return URL
  if (!isAuthenticated) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnUrl=${returnUrl}`} replace />;
  }

  return <>{children}</>;
}

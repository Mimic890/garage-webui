import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store/auth-store';
import { BasicLoginForm } from '@/components/auth/BasicLoginForm';
import { OIDCLoginView } from '@/components/auth/OIDCLoginView';
import { LoadingSpinner } from '@/components/auth/LoadingSpinner';

export function Login() {
  const { config, isLoading, initialize, isAuthenticated } = useAuthStore();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const loginSuccess = searchParams.get('login');
  const returnUrl = searchParams.get('returnUrl') || '/';

  useEffect(() => {
    // Handle OIDC callback
    if (loginSuccess === 'success') {
      // OIDC login successful, re-initialize auth to fetch user
      initialize().then(() => {
        navigate(decodeURIComponent(returnUrl));
      });
    }
  }, [loginSuccess, initialize, navigate, returnUrl]);

  useEffect(() => {
    // If already authenticated, redirect to return URL
    if (isAuthenticated && !loginSuccess) {
      navigate(decodeURIComponent(returnUrl));
    }
  }, [isAuthenticated, navigate, returnUrl, loginSuccess]);

  if (isLoading || loginSuccess === 'success') {
    return <LoadingSpinner />;
  }

  // No auth enabled, redirect to dashboard immediately
  if (config && !config.admin.enabled && !config.oidc.enabled) {
    navigate('/');
    return null;
  }

  // Show login options based on what's enabled
  const showAdmin = config?.admin.enabled || false;
  const showOIDC = config?.oidc.enabled || false;

  // If both are enabled, show both options in single modal
  if (showAdmin && showOIDC) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">Sign in to Garage UI</h1>
            <p className="text-muted-foreground mt-2">Enter your credentials to continue</p>
          </div>
          <BasicLoginForm showOIDC={true} config={config} />
        </div>
      </div>
    );
  }

  // Show only OIDC if enabled
  if (showOIDC) {
    return <OIDCLoginView />;
  }

  // Show only admin if enabled
  if (showAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <BasicLoginForm />
        </div>
      </div>
    );
  }

  // Still loading config
  return <LoadingSpinner />;
}

import { useEffect } from 'react';
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth-store';
import { BasicLoginForm } from '@/components/auth/BasicLoginForm';
import { LoadingSpinner } from '@/components/auth/LoadingSpinner';

export function Login() {
  const { config, isLoading, initialize, isAuthenticated, isSetup } = useAuthStore();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const loginSuccess = searchParams.get('login');
  const returnUrl = searchParams.get('returnUrl') || '/';

  useEffect(() => {
    if (!isSetup) {
      navigate('/setup', { replace: true });
    }
  }, [isSetup, navigate]);

  useEffect(() => {
    if (loginSuccess === 'success') {
      initialize().then(() => {
        navigate(returnUrl);
      });
    }
  }, [loginSuccess, initialize, navigate, returnUrl]);

  useEffect(() => {
    if (isAuthenticated && !loginSuccess) {
      navigate(returnUrl);
    }
  }, [isAuthenticated, navigate, returnUrl, loginSuccess]);

  if (isLoading || loginSuccess === 'success') {
    return <LoadingSpinner />;
  }

  // No auth enabled, redirect to dashboard immediately
  if (config && !config.admin.enabled && !config.oidc.enabled && !config.token.enabled) {
    return <Navigate to="/" replace />;
  }

  // Admin login is the only supported login now
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <BasicLoginForm />
      </div>
    </div>
  );
}

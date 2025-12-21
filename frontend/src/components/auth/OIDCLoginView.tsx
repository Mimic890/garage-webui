import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn } from 'lucide-react';

export function OIDCLoginView() {
  const { config, loginOIDC } = useAuthStore();

  const providerName = config?.oidc.provider || 'OIDC Provider';

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <LogIn className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Sign in to Garage UI</CardTitle>
          <CardDescription className="text-center">
            Authenticate using your {providerName} account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={loginOIDC}
            className="w-full"
            size="lg"
          >
            <LogIn className="mr-2 h-5 w-5" />
            Continue with {providerName}
          </Button>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            You will be redirected to {providerName} to complete the sign-in process
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

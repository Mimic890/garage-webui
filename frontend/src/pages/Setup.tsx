import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Box } from 'lucide-react';
import { authApi } from '@/lib/api';
import { toast } from 'sonner';

export function Setup() {
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nickname.trim()) {
      toast.error('Nickname is required');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.setupPanel({ nickname, password });
      toast.success('Panel setup completed!');
      window.location.href = '/login';
    } catch (err: any) {
      toast.error('Failed to setup panel', {
        description: err.response?.data?.error?.message || err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-[400px] space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Box className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Garage Admin Panel</h1>
          <p className="text-sm text-muted-foreground">
            Welcome! Let's set up your local administrator account.
          </p>
        </div>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle>Initial Setup</CardTitle>
            <CardDescription>
              Choose a nickname for the local admin. A password is optional but recommended.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSetup} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="nickname" className="text-sm font-medium">Nickname (Required)</label>
                <Input
                  id="nickname"
                  placeholder="admin"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">Password (Optional)</label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  You can always set or change this later.
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading || !nickname.trim()}>
                {isLoading ? 'Setting up...' : 'Complete Setup'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

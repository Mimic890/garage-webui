import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth-store';
import { Shield, User } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export function UserSettings() {
  const { config, user } = useAuthStore();
  const { t } = useTranslation();

  return (
    <div>
      <PageHeader
        title={t('settings.user') || 'User Settings'}
        subtitle={t('settings.user.desc') || 'Manage your account and authentication preferences'}
      />

      <div className="px-6 py-6 max-w-4xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-[var(--primary)]" />
              {t('settings.profile') || 'Profile'}
            </CardTitle>
            <CardDescription>
              {t('settings.profile.desc') || 'Your account details'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                <span className="text-[12px] font-medium text-[var(--muted-foreground)]">Username</span>
                <span className="text-[14px] mt-1">{user?.name || user?.username || 'Unknown'}</span>
              </div>
              {user?.email && (
                <div className="flex flex-col p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                  <span className="text-[12px] font-medium text-[var(--muted-foreground)]">Email</span>
                  <span className="text-[14px] mt-1">{user.email}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-[var(--primary)]" />
              {t('settings.auth')}
            </CardTitle>
            <CardDescription>
              {t('settings.auth.desc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {config ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center justify-between p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                  <div>
                    <div className="font-medium text-[14px]">{t('settings.admin_pass')}</div>
                    <div className="text-[13px] text-[var(--muted-foreground)]">{t('settings.admin_pass.desc')}</div>
                  </div>
                  <div className={`px-2.5 py-1 rounded-full text-[12px] font-medium ${config.admin.enabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-[var(--muted)] text-[var(--muted-foreground)]'}`}>
                    {config.admin.enabled ? t('settings.enabled') : t('settings.disabled')}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-[14px] text-[var(--muted-foreground)]">
                Loading configuration...
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

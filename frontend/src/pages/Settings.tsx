import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSettingsStore } from '@/store/settings-store';
import type { Language } from '@/store/settings-store';
import { Settings as SettingsIcon, Globe, Languages } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { Select, SelectOption } from '@/components/ui/select';
import { useMemo } from 'react';
import { useTranslation } from '@/lib/i18n';

type ByteUnit = 'B' | 'KB' | 'MB' | 'GB';

const formatBytes = (bytes: number | undefined, unit: ByteUnit = 'MB', unavailable: string = '', locale: string = ''): string => {
  if (bytes === undefined) return unavailable;
  const divisor = unit === 'GB' ? 1024 ** 3 : unit === 'MB' ? 1024 ** 2 : unit === 'KB' ? 1024 : 1;
  return `${new Intl.NumberFormat(locale, unit === 'B' ? undefined : { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(bytes / divisor)} ${unit}`;
};

export function Settings() {
  const { config } = useAuthStore();
  const { timezone, setTimezone, language, setLanguage } = useSettingsStore();
  const { t, language: interfaceLanguage } = useTranslation();

  const detectedRootUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const systemDefault = t('settings.timezone.systemDefault');
  const timezones = useMemo(() => {
    try {
      const zones = Intl.supportedValuesOf('timeZone');
      return zones.map(tz => {
        // Build a display string like (UTC+02:00) Europe/Paris
        const format = new Intl.DateTimeFormat(interfaceLanguage, { timeZone: tz, timeZoneName: 'shortOffset' });
        const parts = format.formatToParts(new Date());
        const offset = parts.find(p => p.type === 'timeZoneName')?.value || 'UTC';
        // Some browsers return "GMT" instead of "UTC" offsets
        const cleanOffset = offset.replace('GMT', 'UTC');
        return {
          value: tz,
          label: `(${cleanOffset}) ${tz.replace(/_/g, ' ')}`
        };
      }).sort((a, b) => {
        // Basic sorting: alphabetical
        return a.label.localeCompare(b.label);
      });
    } catch {
      // Fallback if browser is very old
      return [{ value: Intl.DateTimeFormat().resolvedOptions().timeZone, label: systemDefault }];
    }
  }, [interfaceLanguage, systemDefault]);

  return (
    <div>
      <PageHeader
        title={t('settings.title')}
        subtitle={t('settings.subtitle')}
      />

      <div className="px-6 py-6 max-w-4xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-[var(--primary)]" />
              {t('settings.prefs')}
            </CardTitle>
            <CardDescription>
              {t('settings.prefs.desc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                <div>
                  <div className="flex items-center gap-2 font-medium text-[14px]">
                    <Globe className="h-4 w-4 text-[var(--muted-foreground)]" />
                    {t('settings.timezone')}
                  </div>
                  <div className="text-[13px] text-[var(--muted-foreground)] mt-0.5">
                    {t('settings.timezone.desc')}
                  </div>
                </div>
                <div className="w-full sm:w-64">
                  <Select
                    value={timezone}
                    onChange={(val) => {
                      setTimezone(val);
                      // Force a tiny reload to apply the non-reactive util format changes
                      setTimeout(() => window.location.reload(), 150);
                    }}
                  >
                    {timezones.map(tz => (
                      <SelectOption key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectOption>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                <div>
                  <div className="flex items-center gap-2 font-medium text-[14px]">
                    <Languages className="h-4 w-4 text-[var(--muted-foreground)]" />
                    {t('settings.language')}
                  </div>
                  <div className="text-[13px] text-[var(--muted-foreground)] mt-0.5">
                    {t('settings.language.desc')}
                  </div>
                </div>
                <div className="w-full sm:w-64">
                  <Select
                    value={language}
                    onChange={(val) => {
                      setLanguage(val as Language);
                    }}
                  >
                    <SelectOption value="en">{t('settings.language.english')}</SelectOption>
                    <SelectOption value="ru">Русский</SelectOption>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-[var(--primary)]" />
              {t('settings.network')}
            </CardTitle>
            <CardDescription>
              {t('settings.network.desc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {config ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                  <span className="text-[12px] font-medium text-[var(--muted-foreground)]">{t('settings.network.bindingHost')}</span>
                  <span className="text-[14px] mt-1 font-mono">{config.server.host === '::' || config.server.host === '' ? t('settings.network.allInterfaces', { address: '0.0.0.0' }) : config.server.host}</span>
                </div>
                <div className="flex flex-col p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                  <span className="text-[12px] font-medium text-[var(--muted-foreground)]">{t('settings.network.port')}</span>
                  <span className="text-[14px] mt-1 font-mono">{config.server.port}</span>
                </div>
                <div className="flex flex-col p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                  <span className="text-[12px] font-medium text-[var(--muted-foreground)]">{t('settings.network.protocol')}</span>
                  <span className="text-[14px] mt-1 font-mono">{config.server.protocol || t('settings.network.autoProtocol')}</span>
                </div>
                <div className="flex flex-col p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                  <span className="text-[12px] font-medium text-[var(--muted-foreground)]">{t('settings.network.rootUrl')}</span>
                  <span className="text-[14px] mt-1 font-mono">
                    {config.server.root_url || <span className="text-[var(--muted-foreground)] italic">{t('settings.network.autoDetected', { value: detectedRootUrl })}</span>}
                  </span>
                </div>
                <div className="flex flex-col p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] sm:col-span-2">
                  <span className="text-[12px] font-medium text-[var(--muted-foreground)]">{t('settings.network.allowedIps')}</span>
                  <span className="text-[14px] mt-1 font-mono break-all">
                    {config.server.allowed_ips && config.server.allowed_ips.length > 0 
                      ? config.server.allowed_ips.join(', ')
                      : <span className="text-[var(--muted-foreground)] italic">{t('settings.network.allIpsAllowed')}</span>}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-[14px] text-[var(--muted-foreground)]">
                {t('settings.status.loadingConfiguration')}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-[var(--primary)]" />
              {t('settings.limits.title')}
            </CardTitle>
            <CardDescription>
              {t('settings.limits.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {config ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                  <span className="text-[12px] font-medium text-[var(--muted-foreground)]">{t('settings.limits.maxBodySize')}</span>
                  <span className="text-[14px] mt-1 font-mono">{formatBytes(config.server.max_body_size, 'MB', t('common.value.unavailable'), interfaceLanguage)}</span>
                </div>
                
                <div className="flex flex-col p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                  <span className="text-[12px] font-medium text-[var(--muted-foreground)]">{t('settings.limits.maxHeaderSize')}</span>
                  <span className="text-[14px] mt-1 font-mono">{formatBytes(config.server.max_header_size, 'MB', t('common.value.unavailable'), interfaceLanguage)}</span>
                </div>
                
                <div className="flex flex-col p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                  <span className="text-[12px] font-medium text-[var(--muted-foreground)]">{t('settings.limits.readBufferSize')}</span>
                  <span className="text-[14px] mt-1 font-mono">{formatBytes(config.server.read_buffer_size, 'MB', t('common.value.unavailable'), interfaceLanguage)}</span>
                </div>
                
                <div className="flex flex-col p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                  <span className="text-[12px] font-medium text-[var(--muted-foreground)]">{t('settings.limits.writeBufferSize')}</span>
                  <span className="text-[14px] mt-1 font-mono">{formatBytes(config.server.write_buffer_size, 'MB', t('common.value.unavailable'), interfaceLanguage)}</span>
                </div>
              </div>
            ) : (
              <div className="text-[14px] text-[var(--muted-foreground)]">
                {t('settings.status.loadingConfiguration')}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-[var(--primary)]" />
              {t('settings.logging.title')}
            </CardTitle>
            <CardDescription>
              {t('settings.logging.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {config?.logging ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                  <span className="text-[12px] font-medium text-[var(--muted-foreground)]">{t('settings.logging.level')}</span>
                  <span className="text-[14px] mt-1 font-mono uppercase">{config.logging.level}</span>
                </div>
                <div className="flex flex-col p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                  <span className="text-[12px] font-medium text-[var(--muted-foreground)]">{t('settings.logging.format')}</span>
                  <span className="text-[14px] mt-1 font-mono uppercase">{config.logging.format}</span>
                </div>
              </div>
            ) : (
              <div className="text-[14px] text-[var(--muted-foreground)]">
                {t('settings.status.loadingConfiguration')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

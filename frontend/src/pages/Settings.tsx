import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSettingsStore } from '@/store/settings-store';
import type { Language } from '@/store/settings-store';
import { Settings as SettingsIcon, Shield, Globe, Languages } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { Select, SelectOption } from '@/components/ui/select';
import { useMemo, useState } from 'react';
import { useTranslation } from '@/lib/i18n';

type ByteUnit = 'B' | 'KB' | 'MB' | 'GB';

const formatBytes = (bytes: number | undefined, unit: ByteUnit): string => {
  if (bytes === undefined) return 'N/A';
  switch (unit) {
    case 'GB': return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    case 'MB': return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    case 'KB': return (bytes / 1024).toFixed(2) + ' KB';
    default: return bytes + ' B';
  }
};

export function Settings() {
  const { config } = useAuthStore();
  const { timezone, setTimezone, language, setLanguage } = useSettingsStore();
  const { t } = useTranslation();
  
  const [maxBodyUnit, setMaxBodyUnit] = useState<ByteUnit>('MB');
  const [maxHeaderUnit, setMaxHeaderUnit] = useState<ByteUnit>('MB');
  const [readBufferUnit, setReadBufferUnit] = useState<ByteUnit>('KB');
  const [writeBufferUnit, setWriteBufferUnit] = useState<ByteUnit>('KB');

  const detectedRootUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const timezones = useMemo(() => {
    try {
      const zones = Intl.supportedValuesOf('timeZone');
      return zones.map(tz => {
        // Build a display string like (UTC+02:00) Europe/Paris
        const format = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' });
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
    } catch (e) {
      // Fallback if browser is very old
      return [{ value: Intl.DateTimeFormat().resolvedOptions().timeZone, label: 'System Default' }];
    }
  }, []);

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
                    <SelectOption value="en">English</SelectOption>
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
              <Shield className="h-5 w-5 text-[var(--primary)]" />
              {t('settings.user') || 'User Settings'}
            </CardTitle>
            <CardDescription>
              {t('settings.profile.desc') || 'Manage your account and authentication preferences'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a href="/user-settings" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
              Go to User Settings
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-[var(--primary)]" />
              {t('settings.network') || 'Network Settings'}
            </CardTitle>
            <CardDescription>
              {t('settings.network.desc') || 'Service binding and network configuration'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {config ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                  <span className="text-[12px] font-medium text-[var(--muted-foreground)]">Binding Host</span>
                  <span className="text-[14px] mt-1 font-mono">{config.server.host === '::' || config.server.host === '' ? '0.0.0.0 (All Interfaces)' : config.server.host}</span>
                </div>
                <div className="flex flex-col p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                  <span className="text-[12px] font-medium text-[var(--muted-foreground)]">Port</span>
                  <span className="text-[14px] mt-1 font-mono">{config.server.port}</span>
                </div>
                <div className="flex flex-col p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                  <span className="text-[12px] font-medium text-[var(--muted-foreground)]">Protocol</span>
                  <span className="text-[14px] mt-1 font-mono">{config.server.protocol || 'Auto / Reverse Proxy'}</span>
                </div>
                <div className="flex flex-col p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                  <span className="text-[12px] font-medium text-[var(--muted-foreground)]">Root URL</span>
                  <span className="text-[14px] mt-1 font-mono">
                    {config.server.root_url || <span className="text-[var(--muted-foreground)] italic">Auto-detected: {detectedRootUrl}</span>}
                  </span>
                </div>
                <div className="flex flex-col p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] sm:col-span-2">
                  <span className="text-[12px] font-medium text-[var(--muted-foreground)]">Allowed IPs (Whitelist)</span>
                  <span className="text-[14px] mt-1 font-mono break-all">
                    {config.server.allowed_ips && config.server.allowed_ips.length > 0 
                      ? config.server.allowed_ips.join(', ')
                      : <span className="text-[var(--muted-foreground)] italic">None (All Allowed)</span>}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-[14px] text-[var(--muted-foreground)]">
                Loading configuration...
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-[var(--primary)]" />
              Limits & Buffers
            </CardTitle>
            <CardDescription>
              Server request and buffer size limits (Read Only)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {config ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-medium text-[var(--muted-foreground)]">Max Body Size</span>
                    <Select value={maxBodyUnit} onChange={(val) => setMaxBodyUnit(val as ByteUnit)}>
                      <SelectOption value="B">B</SelectOption>
                      <SelectOption value="KB">KB</SelectOption>
                      <SelectOption value="MB">MB</SelectOption>
                      <SelectOption value="GB">GB</SelectOption>
                    </Select>
                  </div>
                  <span className="text-[14px] mt-1 font-mono">{formatBytes(config.server.max_body_size, maxBodyUnit)}</span>
                </div>
                
                <div className="flex flex-col p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-medium text-[var(--muted-foreground)]">Max Header Size</span>
                    <Select value={maxHeaderUnit} onChange={(val) => setMaxHeaderUnit(val as ByteUnit)}>
                      <SelectOption value="B">B</SelectOption>
                      <SelectOption value="KB">KB</SelectOption>
                      <SelectOption value="MB">MB</SelectOption>
                      <SelectOption value="GB">GB</SelectOption>
                    </Select>
                  </div>
                  <span className="text-[14px] mt-1 font-mono">{formatBytes(config.server.max_header_size, maxHeaderUnit)}</span>
                </div>
                
                <div className="flex flex-col p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-medium text-[var(--muted-foreground)]">Read Buffer Size</span>
                    <Select value={readBufferUnit} onChange={(val) => setReadBufferUnit(val as ByteUnit)}>
                      <SelectOption value="B">B</SelectOption>
                      <SelectOption value="KB">KB</SelectOption>
                      <SelectOption value="MB">MB</SelectOption>
                      <SelectOption value="GB">GB</SelectOption>
                    </Select>
                  </div>
                  <span className="text-[14px] mt-1 font-mono">{formatBytes(config.server.read_buffer_size, readBufferUnit)}</span>
                </div>
                
                <div className="flex flex-col p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-medium text-[var(--muted-foreground)]">Write Buffer Size</span>
                    <Select value={writeBufferUnit} onChange={(val) => setWriteBufferUnit(val as ByteUnit)}>
                      <SelectOption value="B">B</SelectOption>
                      <SelectOption value="KB">KB</SelectOption>
                      <SelectOption value="MB">MB</SelectOption>
                      <SelectOption value="GB">GB</SelectOption>
                    </Select>
                  </div>
                  <span className="text-[14px] mt-1 font-mono">{formatBytes(config.server.write_buffer_size, writeBufferUnit)}</span>
                </div>
              </div>
            ) : (
              <div className="text-[14px] text-[var(--muted-foreground)]">
                Loading configuration...
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-[var(--primary)]" />
              Logging
            </CardTitle>
            <CardDescription>
              Backend service logging configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            {config?.logging ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                  <span className="text-[12px] font-medium text-[var(--muted-foreground)]">Log Level</span>
                  <span className="text-[14px] mt-1 font-mono uppercase">{config.logging.level}</span>
                </div>
                <div className="flex flex-col p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                  <span className="text-[12px] font-medium text-[var(--muted-foreground)]">Log Format</span>
                  <span className="text-[14px] mt-1 font-mono uppercase">{config.logging.format}</span>
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

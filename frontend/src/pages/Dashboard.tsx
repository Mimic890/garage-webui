import { useEffect, useState } from 'react';
import { AlertCircle, Database, FolderOpen, HardDrive, Server, Zap } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { IconTile } from '@/components/ui/icon-tile';
import { EmptyState } from '@/components/ui/empty-state';
import { BucketUsageChart } from '@/components/charts/BucketUsageChart';
import { useDashboardData } from '@/hooks/useApi';
import { formatBytes } from '@/lib/file-utils';
import { getUniqueThemeColors } from '@/lib/chart-colors';
import { useClusterStore } from '@/store/cluster-store';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import type { ClusterHealth } from '@/types';
import { useTranslation } from '@/lib/i18n';

type StatTone = 'primary' | 'destructive' | 'neutral';
type HealthLabel = 'Healthy' | 'Degraded' | 'Unhealthy' | 'Unknown';

function deriveHealth(health: ClusterHealth | null): { label: HealthLabel; tone: StatTone } {
  if (!health) return { label: 'Unknown', tone: 'neutral' };
  if (
    health.storageNodesUp === health.storageNodes &&
    health.partitionsAllOk === health.partitions &&
    health.connectedNodes === health.knownNodes
  ) return { label: 'Healthy', tone: 'primary' };
  if (health.storageNodesUp > 0 && health.partitionsQuorum > 0) return { label: 'Degraded', tone: 'primary' };
  return { label: 'Unhealthy', tone: 'destructive' };
}

export function Dashboard() {
  const { metrics: metricsQuery, buckets: bucketsQuery, health: healthQuery, isLoading } = useDashboardData();
  const metrics = metricsQuery.data;
  const buckets = bucketsQuery.data ?? [];
  const clusterHealth = healthQuery.data ?? null;
  const health = deriveHealth(clusterHealth);

  const bucketCount = metrics?.usageByBucket?.length ?? 0;
  const [themeColors, setThemeColors] = useState<string[]>([]);

  useEffect(() => {
    const updateThemeColors = () => {
      setThemeColors(getUniqueThemeColors(bucketCount));
    };

    updateThemeColors();

    const observer = new MutationObserver(updateThemeColors);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, [bucketCount]);

  const { clusters } = useClusterStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (clusters.length === 0) {
    return (
      <div>
        <PageHeader title={t('nav.dashboard')} subtitle="Welcome to Garage Admin Panel" />
        <div className="px-6 py-12 flex items-center justify-center">
          <EmptyState
            icon={<Server />}
            title={t('dashboard.no_clusters')}
            description={t('dashboard.no_clusters.desc')}
            tone="primary"
            action={
              <Button onClick={() => navigate('/connections', { state: { addCluster: true } })}>
                {t('dashboard.add_btn')}
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={t('nav.dashboard')}
        subtitle={
          clusterHealth
            ? `${clusterHealth.connectedNodes}/${clusterHealth.knownNodes} ${t('dashboard.nodes_connected')}`
            : t('dashboard.loading')
        }
      />

      {isLoading ? (
        <div className="flex min-h-[360px] items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[var(--primary)] border-r-transparent" />
            <p className="mt-3 text-[13.5px] text-[var(--muted-foreground)]">{t('dashboard.loading')}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6 px-6 py-5">
          {/* KPI row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label={t('dashboard.total_storage')}
              value={metrics ? formatBytes(metrics.totalSize) : '—'}
              sub={`across ${metrics?.bucketCount ?? 0} bucket${metrics?.bucketCount === 1 ? '' : 's'}`}
              icon={<HardDrive />}
            />
            <StatCard
              label={t('dashboard.objects')}
              value={(metrics?.objectCount ?? 0).toLocaleString()}
              sub={t('dashboard.files_folders')}
              icon={<FolderOpen />}
            />
            <StatCard
              label={t('nav.buckets')}
              value={(metrics?.bucketCount ?? 0).toLocaleString()}
              sub={t('dashboard.active_buckets')}
              icon={<Database />}
            />
            <StatCard
              label={t('nav.cluster')}
              value={health.label}
              valueTone={health.tone}
              sub={
                clusterHealth
                  ? `${clusterHealth.storageNodesUp}/${clusterHealth.storageNodes} ${t('dashboard.storage_nodes').toLowerCase()}`
                  : '—'
              }
              icon={health.label === 'Unhealthy' ? <AlertCircle /> : <Zap />}
              iconTone={health.tone}
            />
          </div>

          {/* Cluster row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              label={t('dashboard.storage_nodes')}
              value={clusterHealth ? `${clusterHealth.storageNodesUp}/${clusterHealth.storageNodes}` : '—'}
              sub={t('dashboard.healthy')}
              icon={<Server />}
            />
            <StatCard
              label={t('dashboard.partitions')}
              value={clusterHealth ? `${clusterHealth.partitionsAllOk}/${clusterHealth.partitions}` : '—'}
              sub={t('dashboard.healthy')}
              icon={<Zap />}
            />
            <StatCard
              label={t('dashboard.connected_nodes')}
              value={clusterHealth ? `${clusterHealth.connectedNodes}/${clusterHealth.knownNodes}` : '—'}
              sub={t('dashboard.cluster_membership')}
              icon={<Server />}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card title={t('dashboard.usage_by_bucket')} description={t('dashboard.usage_desc')}>
              {metrics?.usageByBucket && metrics.usageByBucket.length > 0 ? (
                <BucketUsageChart data={metrics.usageByBucket} />
              ) : (
                <div className="py-8 text-center text-[13.5px] text-[var(--muted-foreground)]">{t('dashboard.no_data')}</div>
              )}
            </Card>

            <Card title={t('dashboard.breakdown')} description={t('dashboard.breakdown_desc')}>
              {metrics?.usageByBucket && metrics.usageByBucket.length > 0 ? (
                <div className="space-y-4">
                  {metrics.usageByBucket.map((bucket, idx) => {
                    const color = themeColors[idx] || 'var(--primary)';
                    return (
                      <div key={bucket.bucketName} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2 text-[13.5px]">
                          <span className="truncate font-medium flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                              style={{ backgroundColor: color }}
                            />
                            {bucket.bucketName}
                          </span>
                          <div className="flex items-center gap-3 text-[13px] text-[var(--muted-foreground)]">
                            <span>{(bucket.objectCount ?? 0).toLocaleString()} {t('dashboard.objects').toLowerCase()}</span>
                            <span className="font-medium text-[var(--foreground)]">{formatBytes(bucket.size)}</span>
                            <span className="w-10 text-right">{(bucket.percentage ?? 0).toFixed(1)}%</span>
                          </div>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--muted)]">
                          <div
                            className="h-full transition-all rounded-full"
                            style={{
                              width: `${bucket.percentage ?? 0}%`,
                              backgroundColor: color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-[13.5px] text-[var(--muted-foreground)]">{t('dashboard.no_buckets')}</div>
              )}
            </Card>
          </div>

          {/* Recent buckets */}
          <Card title={t('dashboard.recent_buckets')} description={t('dashboard.recent_desc')}>
            {buckets.length === 0 ? (
              <EmptyState
                icon={<Database />}
                title={t('dashboard.no_buckets_yet')}
                description={t('dashboard.no_buckets_yet_desc')}
                tone="neutral"
              />
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {buckets.slice(0, 5).map((bucket) => (
                  <li key={bucket.name} className="flex items-center gap-3 py-3">
                    <IconTile icon={<Database />} tone="primary" size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium">{bucket.name}</p>
                      <p className="truncate text-[12.5px] text-[var(--muted-foreground)]">
                        {t('dashboard.created')} {new Date(bucket.creationDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[14px] font-medium">{bucket.objectCount?.toLocaleString() ?? '—'} {t('dashboard.objects').toLowerCase()}</p>
                      <p className="text-[12.5px] text-[var(--muted-foreground)]">
                        {bucket.size ? formatBytes(bucket.size) : '—'}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
  iconTone = 'primary',
  valueTone = 'neutral',
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  iconTone?: StatTone;
  valueTone?: StatTone;
}) {
  const valueColor =
    valueTone === 'primary'
      ? 'text-[var(--primary)]'
      : valueTone === 'destructive'
      ? 'text-[var(--destructive)]'
      : 'text-[var(--foreground)]';
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--muted-foreground)]">
          {label}
        </span>
        <IconTile icon={icon} tone={iconTone} size="sm" />
      </div>
      <div className={`mt-2 text-[26px] font-semibold tracking-[-0.02em] leading-none ${valueColor}`}>
        {value}
      </div>
      {sub && <div className="mt-1.5 text-[13px] text-[var(--muted-foreground)]">{sub}</div>}
    </div>
  );
}

function Card({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--card)]">
      <header className="border-b border-[var(--border)] px-5 py-3">
        <h2 className="text-[15px] font-semibold">{title}</h2>
        {description && <p className="mt-0.5 text-[12.5px] text-[var(--muted-foreground)]">{description}</p>}
      </header>
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}

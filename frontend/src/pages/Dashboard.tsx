import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Header} from '@/components/layout/header';
import {formatBytes} from '@/lib/utils';
import {AlertCircle, Database, FolderOpen, HardDrive, Server, Zap} from 'lucide-react';
import {BucketUsageChart} from '@/components/charts/BucketUsageChart';
import {useDashboardData} from '@/hooks/useApi';
import type {ClusterHealth} from '@/types';

export function Dashboard() {
  const { metrics: metricsQuery, buckets: bucketsQuery, health: healthQuery, isLoading } = useDashboardData();

  const metrics = metricsQuery.data;
  const buckets = bucketsQuery.data || [];
  const clusterHealth = healthQuery.data;

  const getHealthStatus = (health: ClusterHealth | null) => {
    if (!health) return { color: 'text-gray-500', label: 'Unknown', icon: AlertCircle };
    if (
      health.storageNodesUp === health.storageNodes &&
      health.partitionsAllOk === health.partitions &&
      health.connectedNodes === health.knownNodes
    ) {
      return { color: 'text-green-500', label: 'Healthy', icon: Zap };
    }
    if (
      health.storageNodesUp > 0 &&
      health.partitionsQuorum > 0
    ) {
      return { color: 'text-yellow-500', label: 'Degraded', icon: AlertCircle };
    }
    return { color: 'text-red-500', label: 'Unhealthy', icon: AlertCircle };
  };

  const healthStatus = getHealthStatus(clusterHealth ?? null);

  if (isLoading) {
    return (
      <div>
        <Header title="Dashboard" />
        <div className="p-4 sm:p-6 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Dashboard" />
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Top Stats Grid */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Storage</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics ? formatBytes(metrics.totalSize) : '---'}
              </div>
              <p className="text-xs text-muted-foreground">
                Across {metrics?.bucketCount || 0} buckets
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Objects</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics?.objectCount.toLocaleString() || '---'}
              </div>
              <p className="text-xs text-muted-foreground">
                Files and folders
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Buckets</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.bucketCount || '---'}</div>
              <p className="text-xs text-muted-foreground">
                Active storage buckets
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Cluster Status */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cluster Status</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className={`text-2xl font-bold ${healthStatus.color}`}>
                  {healthStatus.label}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {clusterHealth?.connectedNodes || 0}/{clusterHealth?.knownNodes || 0} nodes connected
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Storage Nodes</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {clusterHealth?.storageNodesUp || 0}/{clusterHealth?.storageNodes || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Healthy storage nodes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Partitions</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {clusterHealth?.partitionsAllOk || 0}/{clusterHealth?.partitions || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Healthy partitions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2">
          {/* Bucket Usage Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Storage Usage by Bucket</CardTitle>
              <CardDescription>Distribution of storage across buckets</CardDescription>
            </CardHeader>
            <CardContent>
              {metrics?.usageByBucket && metrics.usageByBucket.length > 0 ? (
                <BucketUsageChart data={metrics.usageByBucket} />
              ) : (
                <div className="text-center py-8 text-muted-foreground">No data available</div>
              )}
            </CardContent>
          </Card>

          {/* Bucket Details Table */}
          <Card>
            <CardHeader>
              <CardTitle>Storage Usage by Bucket (Table)</CardTitle>
              <CardDescription>Detailed breakdown of storage across all buckets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics?.usageByBucket && metrics.usageByBucket.length > 0 ? (
                    metrics.usageByBucket.map((bucket) => (
                        <div key={bucket.bucketName} className="space-y-2">
                          <div className="flex items-center justify-between text-sm flex-wrap gap-2">
                            <span className="font-medium">{bucket.bucketName}</span>
                            <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                        <span className="text-muted-foreground">
                          {bucket.objectCount.toLocaleString()} objects
                        </span>
                              <span className="font-medium">{formatBytes(bucket.size)}</span>
                              <span className="text-muted-foreground w-12 text-right">
                          {bucket.percentage.toFixed(1)}%
                        </span>
                            </div>
                          </div>
                          <div className="h-2 rounded-full bg-secondary overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all"
                                style={{ width: `${bucket.percentage}%` }}
                            />
                          </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-muted-foreground">No buckets available</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Buckets */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Buckets</CardTitle>
            <CardDescription>Your most recently created buckets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {buckets.slice(0, 5).map((bucket) => (
                <div
                  key={bucket.name}
                  className="flex items-center justify-between py-3 border-b last:border-0 gap-3"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                      <Database className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{bucket.name}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Created {new Date(bucket.creationDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-medium text-sm sm:text-base">{bucket.objectCount?.toLocaleString()} objects</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {bucket.size ? formatBytes(bucket.size) : '---'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

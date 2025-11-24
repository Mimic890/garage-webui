import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/layout/header';
import { garageApi, bucketsApi } from '@/lib/api';
import { formatBytes } from '@/lib/utils';
import type { GarageMetrics, Bucket, ClusterHealth } from '@/types';
import { Database, FolderOpen, HardDrive, Activity, Server, Zap, AlertCircle } from 'lucide-react';
import { BucketUsageChart } from '@/components/charts/BucketUsageChart';
import { RequestMetricsChart } from '@/components/charts/RequestMetricsChart';

export function Dashboard() {
  const [metrics, setMetrics] = useState<GarageMetrics | null>(null);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [clusterHealth, setClusterHealth] = useState<ClusterHealth | null>(null);
  // const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // setLoading(true);
      const [garageMetrics, bucketsData, health] = await Promise.all([
        garageApi.getFullMetrics(),
        bucketsApi.list(),
        garageApi.getClusterHealth(),
      ]);
      setMetrics(garageMetrics);
      setBuckets(bucketsData);
      setClusterHealth(health);
      // setLoading(false);
    };

    fetchData();
  }, []);

  const getHealthStatus = (health: ClusterHealth | null) => {
    if (!health) return { color: 'text-gray-500', label: 'Unknown', icon: AlertCircle };
    if (
      health.healthyStorageNodes === health.declaredStorageNodes &&
      health.healthyPartitions === health.totalPartitions &&
      health.connectedNodes === health.knownNodes
    ) {
      return { color: 'text-green-500', label: 'Healthy', icon: Zap };
    }
    if (
      health.healthyStorageNodes > 0 &&
      health.healthyPartitions > 0
    ) {
      return { color: 'text-yellow-500', label: 'Degraded', icon: AlertCircle };
    }
    return { color: 'text-red-500', label: 'Unhealthy', icon: AlertCircle };
  };

  const healthStatus = getHealthStatus(clusterHealth);

  return (
    <div>
      <Header title="Dashboard" />
      <div className="p-6 space-y-6">
        {/* Top Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Requests (24h)</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics
                  ? (
                      metrics.requestMetrics.getRequests +
                      metrics.requestMetrics.putRequests +
                      metrics.requestMetrics.deleteRequests +
                      metrics.requestMetrics.listRequests
                    ).toLocaleString()
                  : '---'}
              </div>
              <p className="text-xs text-muted-foreground">
                GET, PUT, DELETE, LIST
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Cluster Status */}
        <div className="grid gap-4 md:grid-cols-3">
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
                {clusterHealth?.healthyStorageNodes || 0}/{clusterHealth?.declaredStorageNodes || 0}
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
                {clusterHealth?.healthyPartitions || 0}/{clusterHealth?.totalPartitions || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Healthy partitions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-4 md:grid-cols-2">
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

          {/* Request Metrics Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Request Metrics</CardTitle>
              <CardDescription>API request distribution (24h)</CardDescription>
            </CardHeader>
            <CardContent>
              {metrics?.requestMetrics ? (
                <RequestMetricsChart data={metrics.requestMetrics} />
              ) : (
                <div className="text-center py-8 text-muted-foreground">No data available</div>
              )}
            </CardContent>
          </Card>
        </div>

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
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{bucket.bucketName}</span>
                      <div className="flex items-center gap-4">
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
                  className="flex items-center justify-between py-3 border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Database className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{bucket.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Created {new Date(bucket.creationDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{bucket.objectCount?.toLocaleString()} objects</p>
                    <p className="text-sm text-muted-foreground">
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

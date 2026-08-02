import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bucketsApi, objectsApi, accessApi, garageApi, analyticsApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';
import { toast } from 'sonner';
import { useClusterStore } from '@/store/cluster-store';
import { useTranslation } from '@/lib/i18n';


export function useBuckets(enabled = true) {
  const activeClusterId = useClusterStore((state) => state.activeClusterId);
  return useQuery({
    queryKey: queryKeys.buckets.list(activeClusterId),
    queryFn: () => bucketsApi.list(),
    enabled: enabled && !!activeClusterId,
  });
}

export function useBucket(name: string, enabled = true) {
  const activeClusterId = useClusterStore((state) => state.activeClusterId);
  return useQuery({
    queryKey: queryKeys.buckets.detail(name, activeClusterId),
    queryFn: () => bucketsApi.get(name),
    enabled: enabled && !!activeClusterId && !!name,
  });
}

export function useCreateBucket() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ name, region }: { name: string; region?: string }) =>
      bucketsApi.create(name, region),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.buckets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      toast.success(t('api.bucket_created_success'));
    },
  });
}

export function useDeleteBucket() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (name: string) => bucketsApi.delete(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.buckets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      toast.success(t('api.bucket_deleted_success'));
    },
  });
}

export function useGrantBucketPermission() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ bucketName, accessKeyId, permissions }: {
      bucketName: string;
      accessKeyId: string;
      permissions: { read: boolean; write: boolean; owner: boolean };
    }) => bucketsApi.grantPermission(bucketName, accessKeyId, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.buckets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.accessKeys.all });
      toast.success(t('api.permissions_granted_success'));
    },
  });
}

export function useUpdateBucketQuotas() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({
      bucketName,
      maxSize,
      maxObjects,
    }: {
      bucketName: string;
      maxSize: number | null;
      maxObjects: number | null;
    }) => bucketsApi.updateBucketQuotas(bucketName, { maxSize, maxObjects }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.buckets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.buckets.all });
      toast.success(t('api.quotas_updated_success'));
    },
  });
}


export function useObjects(bucket: string, prefix?: string, enabled = true) {
  const activeClusterId = useClusterStore((state) => state.activeClusterId);
  return useQuery({
    queryKey: queryKeys.objects.list(bucket, prefix, activeClusterId),
    queryFn: () => objectsApi.list(bucket, prefix),
    enabled: enabled && !!activeClusterId && !!bucket,
  });
}

export function useUploadObject() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ bucket, key, file }: { bucket: string; key: string; file: File }) =>
      objectsApi.upload(bucket, key, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.objects.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.buckets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      toast.success(t('api.file_uploaded_success'));
    },
  });
}

export function useUploadMultipleObjects() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ bucket, files }: { bucket: string; files: File[] }) =>
      objectsApi.uploadMultiple(bucket, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.objects.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.buckets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      toast.success(t('api.files_uploaded_success'));
    },
  });
}

export function useDeleteObject() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ bucket, key }: { bucket: string; key: string }) =>
      objectsApi.delete(bucket, key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.objects.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.buckets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      toast.success(t('api.file_deleted_success'));
    },
  });
}

export function useDeleteMultipleObjects() {
  const queryClient = useQueryClient();
  const { t, language } = useTranslation();

  return useMutation({
    mutationFn: ({ bucket, keys, prefixes }: { bucket: string; keys: string[]; prefixes?: string[] }) =>
      objectsApi.deleteMultiple(bucket, keys, prefixes),
     onSuccess: (_, variables) => {
       queryClient.invalidateQueries({ queryKey: queryKeys.objects.all });
       queryClient.invalidateQueries({ queryKey: queryKeys.buckets.all });
       queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
       toast.success(t(variables.keys.length === 1 ? 'api.file_deleted_count_success' : 'api.files_deleted_count_success')
         .replace('{{count}}', variables.keys.length.toLocaleString(language)));
    },
  });
}


export function useAccessKeys(enabled = true) {
  const activeClusterId = useClusterStore((state) => state.activeClusterId);
  return useQuery({
    queryKey: queryKeys.accessKeys.list(activeClusterId),
    queryFn: () => accessApi.listKeys(),
    enabled: enabled && !!activeClusterId,
  });
}

export function useAccessKey(keyId: string, enabled = true) {
  const activeClusterId = useClusterStore((state) => state.activeClusterId);
  return useQuery({
    queryKey: queryKeys.accessKeys.detail(keyId, activeClusterId),
    queryFn: () => accessApi.getKey(keyId),
    enabled: enabled && !!activeClusterId && !!keyId,
  });
}

export function useCreateAccessKey() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ name, permissions }: { name: string; permissions?: any[] }) =>
      accessApi.createKey(name, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accessKeys.all });
      toast.success(t('api.access_key_created_success'));
    },
  });
}

export function useDeleteAccessKey() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (keyId: string) => accessApi.deleteKey(keyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accessKeys.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.buckets.all });
      toast.success(t('api.access_key_deleted_success'));
    },
  });
}

export function useUpdateAccessKey() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ keyId, updates }: { keyId: string; updates: any }) =>
      accessApi.updateKey(keyId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accessKeys.all });
      toast.success(t('api.access_key_updated_success'));
    },
  });
}


export function useClusterHealth(enabled = true) {
  const activeClusterId = useClusterStore((state) => state.activeClusterId);
  return useQuery({
    queryKey: queryKeys.cluster.health(activeClusterId),
    queryFn: () => garageApi.getClusterHealth(),
    staleTime: 30 * 1000,
    enabled: enabled && !!activeClusterId,
  });
}

export function useClusterStatus(enabled = true) {
  const activeClusterId = useClusterStore((state) => state.activeClusterId);
  return useQuery({
    queryKey: queryKeys.cluster.status(activeClusterId),
    queryFn: () => garageApi.getClusterStatus(),
    staleTime: 60 * 1000,
    enabled: enabled && !!activeClusterId,
  });
}

export function useClusterStatistics(enabled = true) {
  const activeClusterId = useClusterStore((state) => state.activeClusterId);
  return useQuery({
    queryKey: queryKeys.cluster.statistics(activeClusterId),
    queryFn: () => garageApi.getClusterStatistics(),
    staleTime: 60 * 1000,
    enabled: enabled && !!activeClusterId,
  });
}


export function useDashboardMetrics(enabled = true) {
  const activeClusterId = useClusterStore((state) => state.activeClusterId);
  return useQuery({
    queryKey: queryKeys.dashboard.metrics(activeClusterId),
    queryFn: () => analyticsApi.getMetrics(),
    staleTime: 2 * 60 * 1000,
    enabled: enabled && !!activeClusterId,
  });
}

// Combined hook for dashboard data
export function useDashboardData() {
  const metrics = useDashboardMetrics();
  const buckets = useBuckets();
  const health = useClusterHealth();

  return {
    metrics,
    buckets,
    health,
    isLoading: metrics.isLoading || buckets.isLoading || health.isLoading,
    isError: metrics.isError || buckets.isError || health.isError,
  };
}

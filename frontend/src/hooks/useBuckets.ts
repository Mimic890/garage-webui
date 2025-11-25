import { useState, useEffect, useCallback } from 'react';
import { bucketsApi } from '@/lib/api';
import type { Bucket } from '@/types';
import { toast } from 'sonner';

export function useBuckets() {
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchBuckets = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await bucketsApi.list();
      setBuckets(data);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to fetch buckets:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBuckets();
  }, [fetchBuckets]);

  const createBucket = useCallback(async (name: string, region?: string) => {
    try {
      await bucketsApi.create(name, region);
      toast.success(`Bucket "${name}" created successfully`);
      await fetchBuckets();
      return true;
    } catch (error) {
      console.error('Create bucket error:', error);
      return false;
    }
  }, [fetchBuckets]);

  const deleteBucket = useCallback(async (name: string) => {
    try {
      await bucketsApi.delete(name);
      toast.success(`Bucket "${name}" deleted successfully`);
      await fetchBuckets();
      return true;
    } catch (error) {
      console.error('Delete bucket error:', error);
      return false;
    }
  }, [fetchBuckets]);

  const grantPermission = useCallback(async (
    bucketName: string,
    accessKeyId: string,
    permissions: { read: boolean; write: boolean; owner: boolean }
  ) => {
    try {
      await bucketsApi.grantPermission(bucketName, accessKeyId, permissions);
      toast.success('Permissions granted successfully');
      return true;
    } catch (error) {
      console.error('Grant permission error:', error);
      return false;
    }
  }, []);

  return {
    buckets,
    isLoading,
    error,
    fetchBuckets,
    createBucket,
    deleteBucket,
    grantPermission,
  };
}

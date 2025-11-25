import { useState, useEffect, useCallback } from 'react';
import { objectsApi } from '@/lib/api';
import type { S3Object } from '@/types';
import { toast } from 'sonner';

export function useBucketObjects(bucketName: string | null, currentPath: string = '') {
  const [objects, setObjects] = useState<S3Object[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const [nextContinuationToken, setNextContinuationToken] = useState<string | undefined>(undefined);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [currentContinuationToken, setCurrentContinuationToken] = useState<string | undefined>(undefined);
  const [previousPath, setPreviousPath] = useState<string>(currentPath);

  const fetchObjects = useCallback(async (continuationToken?: string, isRefresh = false, isNav = false) => {
    if (!bucketName) return;

    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else if (isNav) {
        setIsNavigating(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      const response = await objectsApi.list(bucketName, currentPath, itemsPerPage, continuationToken);
      setObjects(response.objects);
      setIsTruncated(response.isTruncated);
      setNextContinuationToken(response.nextContinuationToken);
      setCurrentContinuationToken(continuationToken);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to fetch objects:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsNavigating(false);
    }
  }, [bucketName, currentPath, itemsPerPage]);

  useEffect(() => {
    if (!bucketName) return;

    // Detect if this is a path change (navigation) or initial load
    const isPathChange = previousPath !== currentPath && objects.length > 0;
    setPreviousPath(currentPath);

    // Use navigation mode if it's a path change, otherwise use normal loading
    fetchObjects(undefined, false, isPathChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bucketName, currentPath, itemsPerPage]);

  const uploadFiles = useCallback(async (files: File[]) => {
    if (!bucketName) return false;

    try {
      // Check if files are from a folder upload
      const hasRelativePaths = files.some((file: any) => file.webkitRelativePath);

      // Get unique folders from the files
      const folders = new Set<string>();
      files.forEach((file: any) => {
        if (file.webkitRelativePath) {
          const parts = file.webkitRelativePath.split('/');
          if (parts.length > 1) {
            folders.add(parts[0]);
          }
        }
      });

      for (const file of files) {
        // Use webkitRelativePath if available (for folder uploads), otherwise use file.name
        const relativePath = (file as any).webkitRelativePath || file.name;
        const key = currentPath ? `${currentPath}${relativePath}` : relativePath;
        await objectsApi.upload(bucketName, key, file);
      }

      if (hasRelativePaths && folders.size > 0) {
        const folderNames = Array.from(folders).join(', ');
        toast.success(`Successfully uploaded ${files.length} file${files.length > 1 ? 's' : ''} from ${folders.size} folder${folders.size > 1 ? 's' : ''} (${folderNames})`);
      } else {
        toast.success(`Successfully uploaded ${files.length} file${files.length > 1 ? 's' : ''}`);
      }

      await fetchObjects(currentContinuationToken, true);
      return true;
    } catch (error) {
      console.error('Upload error:', error);
      return false;
    }
  }, [bucketName, currentPath, currentContinuationToken, fetchObjects]);

  const deleteObject = useCallback(async (key: string) => {
    if (!bucketName) return false;

    try {
      // Optimistically remove the object from the UI
      setObjects(prev => prev.filter(obj => obj.key !== key));

      await objectsApi.delete(bucketName, key);
      toast.success(`Object "${key}" deleted successfully`);
      await fetchObjects(currentContinuationToken, true);
      return true;
    } catch (error) {
      console.error('Delete object error:', error);
      // Revert the optimistic update by refetching
      await fetchObjects(currentContinuationToken, true);
      return false;
    }
  }, [bucketName, currentContinuationToken, fetchObjects]);

  const deleteMultipleObjects = useCallback(async (keys: string[]) => {
    if (!bucketName || keys.length === 0) return false;

    try {
      // Optimistically remove the objects from the UI
      setObjects(prev => prev.filter(obj => !keys.includes(obj.key)));

      await objectsApi.deleteMultiple(bucketName, keys, currentPath || undefined);
      toast.success(`Successfully deleted ${keys.length} file${keys.length > 1 ? 's' : ''}`);
      await fetchObjects(currentContinuationToken, true);
      return true;
    } catch (error) {
      console.error('Bulk delete error:', error);
      // Revert the optimistic update by refetching
      await fetchObjects(currentContinuationToken, true);
      return false;
    }
  }, [bucketName, currentPath, currentContinuationToken, fetchObjects]);

  const createDirectory = useCallback(async (dirName: string) => {
    if (!bucketName) return false;

    try {
      const dirKey = currentPath ? `${currentPath}${dirName}/` : `${dirName}/`;
      await objectsApi.upload(bucketName, dirKey, new File([], ''));
      toast.success(`Directory "${dirName}" created successfully`);
      await fetchObjects(currentContinuationToken, true);
      return true;
    } catch (error) {
      console.error('Create directory error:', error);
      return false;
    }
  }, [bucketName, currentPath, currentContinuationToken, fetchObjects]);

  return {
    objects,
    isLoading,
    isRefreshing,
    isNavigating,
    error,
    isTruncated,
    nextContinuationToken,
    currentContinuationToken,
    itemsPerPage,
    setItemsPerPage,
    fetchObjects,
    uploadFiles,
    deleteObject,
    deleteMultipleObjects,
    createDirectory,
  };
}

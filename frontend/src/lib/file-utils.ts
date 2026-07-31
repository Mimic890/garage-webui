import { objectsApi } from './api';
import { toast } from 'sonner';

/**
 * Download an object from a bucket by fetching it as a blob and clicking a
 * temporary anchor element. Errors are surfaced by the axios interceptor.
 */
export async function downloadObject(bucket: string, key: string): Promise<void> {
  try {
    const blob = await objectsApi.get(bucket, key);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = key.split('/').pop() || 'download';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    toast.success('Download started');
  } catch {
    // error toast handled by axios interceptor
  }
}


/**
 * Generate breadcrumbs from a file path
 */
export function getBreadcrumbs(currentPath: string): Array<{ label: string; path: string }> {
  if (!currentPath) return [{ label: 'Root', path: '' }];

  const parts = currentPath.split('/').filter(Boolean);
  const breadcrumbs = [{ label: 'Root', path: '' }];

  parts.forEach((part, index) => {
    const path = parts.slice(0, index + 1).join('/') + '/';
    breadcrumbs.push({ label: part, path });
  });

  return breadcrumbs;
}

/**
 * Format relative time from a date
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) !== 1 ? 's' : ''} ago`;
  return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) !== 1 ? 's' : ''} ago`;
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

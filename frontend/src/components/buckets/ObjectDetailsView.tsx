import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { objectsApi } from '@/lib/api';
import type { ObjectMetadata } from '@/types';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Trash, Copy, File } from 'lucide-react';
import { toast } from 'sonner';
import { formatBytes } from '@/lib/file-utils';

export function ObjectDetailsView() {
  const navigate = useNavigate();
  const { bucketName, '*': encodedObjectKey } = useParams();
  // Decode the object key from the URL
  const objectKey = encodedObjectKey ? decodeURIComponent(encodedObjectKey) : undefined;
  const [metadata, setMetadata] = useState<ObjectMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bucketName || !objectKey) {
      setError('Bucket name and object key are required');
      setIsLoading(false);
      return;
    }

    const fetchMetadata = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await objectsApi.getMetadata(bucketName, objectKey);
        setMetadata(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load object metadata');
        console.error('Failed to fetch object metadata:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetadata();
  }, [bucketName, objectKey]);

  const handleDownload = async () => {
    if (!bucketName || !objectKey) return;

    try {
      const blob = await objectsApi.get(bucketName, objectKey);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = objectKey.split('/').pop() || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Download started');
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const handleDelete = async () => {
    if (!bucketName || !objectKey) return;

    if (!confirm(`Are you sure you want to delete "${objectKey}"?`)) {
      return;
    }

    try {
      await objectsApi.delete(bucketName, objectKey);
      toast.success('Object deleted successfully');
      handleBackNavigation();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleBackNavigation = () => {
    if (!bucketName) return;

    // Navigate back to the bucket explorer with the appropriate prefix
    // Extract the folder path from the object key (everything before the last /)
    const folderPath = objectKey?.split('/').slice(0, -1).join('/') || '';
    const prefix = folderPath ? `${folderPath}/` : '';

    // Navigate to the bucket view with the correct prefix
    navigate(`/buckets?bucket=${encodeURIComponent(bucketName)}${prefix ? `&prefix=${encodeURIComponent(prefix)}` : ''}`);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    });
  };

  if (isLoading) {
    return (
      <div>
        <Header title="Object Details" />
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading object details...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !metadata) {
    return (
      <div>
        <Header title="Object Details" />
        <div className="p-4 sm:p-6">
          <Button variant="outline" onClick={handleBackNavigation} className="mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center justify-center h-64">
            <div className="text-red-500">{error || 'Object not found'}</div>
          </div>
        </div>
      </div>
    );
  }

  const fileName = objectKey?.split('/').pop() || objectKey || '';
  const pathParts = objectKey?.split('/').filter(part => part) || [];
  const parentPath = pathParts.slice(0, -1).join('/');

  return (
    <div>
      <Header title={fileName} />
      <div className="p-4 sm:p-6 space-y-6">
        {/* Back Button and Actions */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handleBackNavigation}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button
              variant="outline"
              className="border-red-500 text-red-500 hover:bg-red-500/5"
              onClick={handleDelete}
            >
              <Trash className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* File Name Header */}
        <div className="flex items-start gap-3 p-4 border-b border-border bg-card rounded-t-lg">
          <div className="mt-1">
            <File className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-4 flex-wrap">
              <h2 className="text-lg font-medium text-foreground break-all">
                {parentPath && (
                  <span className="text-muted-foreground font-mono">/{parentPath}/</span>
                )}
                {fileName}
              </h2>
              <button
                onClick={() => copyToClipboard(metadata.key)}
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 shrink-0"
              >
                <Copy className="h-3 w-3" />
                Copy
              </button>
            </div>
          </div>
        </div>

        {/* Object Details Section */}
        <div className="border border-border rounded-lg bg-card">
          <div className="p-6 border-b border-border">
            <h3 className="text-base font-semibold text-foreground">Object Details</h3>
          </div>
          <div className="divide-y divide-border">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6">
              <div className="text-sm font-medium text-muted-foreground">Date Created</div>
              <div className="sm:col-span-2 text-sm text-foreground">
                {formatDate(metadata.lastModified)}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6">
              <div className="text-sm font-medium text-muted-foreground">Type</div>
              <div className="sm:col-span-2 text-sm text-foreground">
                {metadata.contentType || 'application/octet-stream'}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6">
              <div className="text-sm font-medium text-muted-foreground">Storage Class</div>
              <div className="sm:col-span-2 text-sm text-foreground">
                {metadata.storageClass || 'Standard'}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6">
              <div className="text-sm font-medium text-muted-foreground">Size</div>
              <div className="sm:col-span-2 text-sm text-foreground">
                {formatBytes(metadata.size)}
              </div>
            </div>
          </div>
        </div>

        {/* Custom Metadata Section */}
        {metadata.metadata && Object.keys(metadata.metadata).length > 0 && (
          <div className="border border-border rounded-lg bg-card">
            <div className="p-6 border-b border-border">
              <h3 className="text-base font-semibold text-foreground">Custom Metadata</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/30">
                  <tr className="border-b border-border">
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
                      Key
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {Object.entries(metadata.metadata).map(([key, value]) => (
                    <tr key={key} className="hover:bg-muted/30">
                      <td className="px-6 py-4 text-sm font-medium text-foreground break-all">
                        {key}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground break-all">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Object Preview Section */}
        <div className="border border-border rounded-lg bg-card">
          <div className="p-6 border-b border-border">
            <h3 className="text-base font-semibold text-foreground">Object Preview</h3>
          </div>
          <div className="p-6">
            <p className="text-sm text-muted-foreground">No preview available</p>
          </div>
        </div>
      </div>
    </div>
  );
}

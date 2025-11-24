import { useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { bucketsApi, objectsApi } from '@/lib/api';
import { formatBytes, formatDate } from '@/lib/utils';
import type { Bucket, S3Object } from '@/types';
import {
  Plus,
  MoreVertical,
  Trash2,
  Settings,
  Search,
  Upload,
  FolderIcon,
  FileIcon,
  Download,
  ChevronRight,
  Home,
  ArrowLeft,
  Eye,
  RotateCwIcon,
  FolderPlus,
  Trash,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';

export function Buckets() {
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [filteredBuckets, setFilteredBuckets] = useState<Bucket[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteBucketDialogOpen, setDeleteBucketDialogOpen] = useState(false);
  const [selectedBucket, setSelectedBucket] = useState<Bucket | null>(null);
  const [newBucketName, setNewBucketName] = useState('');
  const [showCreatePreview, setShowCreatePreview] = useState(false);

  // Objects state
  const [viewingBucket, setViewingBucket] = useState<string | null>(null);
  const [objects, setObjects] = useState<S3Object[]>([]);
  const [filteredObjects, setFilteredObjects] = useState<S3Object[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [objectSearchQuery, setObjectSearchQuery] = useState('');
  const [showUploadZone, setShowUploadZone] = useState(false);
  const [deleteObjectDialogOpen, setDeleteObjectDialogOpen] = useState(false);
  const [selectedObject, setSelectedObject] = useState<S3Object | null>(null);
  const [createDirDialogOpen, setCreateDirDialogOpen] = useState(false);
  const [newDirName, setNewDirName] = useState('');
  const [sortColumn, setSortColumn] = useState<'name' | 'size' | 'modified'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedFileKeys, setSelectedFileKeys] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Main area drag & drop
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles) => {
      await uploadFiles(acceptedFiles);
      setShowUploadZone(false);
    },
    noClick: true,
  });

  // File upload handler
  const uploadFiles = async (files: File[]) => {
    if (!viewingBucket) return;

    try {
      for (const file of files) {
        const key = currentPath ? `${currentPath}${file.name}` : file.name;
        await objectsApi.upload(viewingBucket, key, file);
      }

      // Refresh objects list
      const data = await objectsApi.list(viewingBucket, currentPath);
      setObjects(data);
      toast.success(`Successfully uploaded ${files.length} file${files.length > 1 ? 's' : ''}`);
    } catch (error) {
      toast.error('Failed to upload files. Please try again.');
      console.error('Upload error:', error);
    }
  };

  useEffect(() => {
    const fetchBuckets = async () => {
      const data = await bucketsApi.list();
      setBuckets(data);
      setFilteredBuckets(data);
    };

    fetchBuckets();
  }, []);

  useEffect(() => {
    const filtered = buckets.filter((bucket) =>
      bucket.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredBuckets(filtered);
  }, [searchQuery, buckets]);

  useEffect(() => {
    if (viewingBucket) {
      const fetchObjects = async () => {
        const data = await objectsApi.list(viewingBucket, currentPath);
        setObjects(data);
        setFilteredObjects(data);
      };

      fetchObjects();
    }
  }, [viewingBucket, currentPath]);

  const sortObjects = (objList: S3Object[]): S3Object[] => {
    const sorted = [...objList].sort((a, b) => {
      // Always put folders before files
      const aIsFolder = a.isFolder ? 1 : 0;
      const bIsFolder = b.isFolder ? 1 : 0;
      if (aIsFolder !== bIsFolder) {
        return bIsFolder - aIsFolder; // Folders first (1 > 0)
      }

      // Then sort by selected column
      let compareValue = 0;
      switch (sortColumn) {
        case 'name': {
          const aName = a.key.replace(currentPath, '').replace('/', '').toLowerCase();
          const bName = b.key.replace(currentPath, '').replace('/', '').toLowerCase();
          compareValue = aName.localeCompare(bName);
          break;
        }
        case 'size':
          compareValue = a.size - b.size;
          break;
        case 'modified': {
          const aDate = new Date(a.lastModified).getTime();
          const bDate = new Date(b.lastModified).getTime();
          compareValue = aDate - bDate;
          break;
        }
      }

      return sortDirection === 'asc' ? compareValue : -compareValue;
    });

    return sorted;
  };

  useEffect(() => {
    const filtered = objects.filter((obj) =>
      obj.key.toLowerCase().includes(objectSearchQuery.toLowerCase())
    );
    const sorted = sortObjects(filtered);
    setFilteredObjects(sorted);
  }, [objectSearchQuery, objects, sortColumn, sortDirection, currentPath]);

  const handleCreateBucket = async () => {
    if (!newBucketName) {
      toast.error('Please enter a bucket name');
      return;
    }

    try {
      await bucketsApi.create(newBucketName);
      setCreateDialogOpen(false);
      setNewBucketName('');
      setShowCreatePreview(false);

      // Refresh bucket list
      const data = await bucketsApi.list();
      setBuckets(data);
      toast.success(`Bucket "${newBucketName}" created successfully`);
    } catch (error) {
      toast.error('Failed to create bucket. Please try again.');
      console.error('Create bucket error:', error);
    }
  };

  const handleDeleteBucket = async () => {
    if (!selectedBucket) return;

    try {
      await bucketsApi.delete(selectedBucket.name);
      const bucketName = selectedBucket.name;
      setDeleteBucketDialogOpen(false);
      setSelectedBucket(null);

      // Refresh bucket list
      const data = await bucketsApi.list();
      setBuckets(data);
      toast.success(`Bucket "${bucketName}" deleted successfully`);
    } catch (error) {
      toast.error('Failed to delete bucket. Please try again.');
      console.error('Delete bucket error:', error);
    }
  };

  const handleViewBucket = (bucketName: string) => {
    setViewingBucket(bucketName);
    setCurrentPath('');
    setObjectSearchQuery('');
  };

  const handleBackToBuckets = () => {
    setViewingBucket(null);
    setCurrentPath('');
    setObjectSearchQuery('');
  };

  const handleNavigateToFolder = (folderKey: string) => {
    setCurrentPath(folderKey);
    setObjectSearchQuery('');
  };

  const handleDeleteObject = async () => {
    if (!selectedObject || !viewingBucket) return;

    try {
      await objectsApi.delete(viewingBucket, selectedObject.key);
      const objectName = selectedObject.key;
      setDeleteObjectDialogOpen(false);
      setSelectedObject(null);

      // Refresh objects list
      const data = await objectsApi.list(viewingBucket, currentPath);
      setObjects(data);
      toast.success(`Object "${objectName}" deleted successfully`);
    } catch (error) {
      toast.error('Failed to delete object. Please try again.');
      console.error('Delete object error:', error);
    }
  };

  const handleRefreshObjects = async () => {
    if (!viewingBucket || isRefreshing) return;
    try {
      setIsRefreshing(true);
      const data = await objectsApi.list(viewingBucket, currentPath);
      setObjects(data);
      toast.success('Objects refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh objects. Please try again.');
      console.error('Refresh error:', error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  const handleToggleFileSelection = (key: string) => {
    const newSelected = new Set(selectedFileKeys);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedFileKeys(newSelected);
  };

  const handleSelectAllFiles = () => {
    const fileKeys = filteredObjects
      .filter(obj => !obj.isFolder)
      .map(obj => obj.key);

    if (selectedFileKeys.size === fileKeys.length && fileKeys.length > 0) {
      // Deselect all
      setSelectedFileKeys(new Set());
    } else {
      // Select all files
      setSelectedFileKeys(new Set(fileKeys));
    }
  };

  const handleBulkDeleteFiles = async () => {
    if (!viewingBucket || selectedFileKeys.size === 0) return;

    try {
      const count = selectedFileKeys.size;
      for (const key of selectedFileKeys) {
        await objectsApi.delete(viewingBucket, key);
      }

      setSelectedFileKeys(new Set());

      // Refresh objects list
      const data = await objectsApi.list(viewingBucket, currentPath);
      setObjects(data);
      toast.success(`Successfully deleted ${count} file${count > 1 ? 's' : ''}`);
    } catch (error) {
      toast.error('Failed to delete files. Please try again.');
      console.error('Bulk delete error:', error);
    }
  };

  const handleCreateDirectory = async () => {
    if (!newDirName || !viewingBucket) {
      toast.error('Please enter a directory name');
      return;
    }

    try {
      // Create a directory by uploading an empty object with a trailing slash
      const dirKey = currentPath ? `${currentPath}${newDirName}/` : `${newDirName}/`;
      await objectsApi.upload(viewingBucket, dirKey, new File([], ''));

      setCreateDirDialogOpen(false);
      setNewDirName('');

      // Refresh objects list
      const data = await objectsApi.list(viewingBucket, currentPath);
      setObjects(data);
      toast.success(`Directory "${newDirName}" created successfully`);
    } catch (error) {
      toast.error('Failed to create directory. Please try again.');
      console.error('Create directory error:', error);
    }
  };

  const getBreadcrumbs = () => {
    if (!currentPath) return [{ label: 'Root', path: '' }];

    const parts = currentPath.split('/').filter(Boolean);
    const breadcrumbs = [{ label: 'Root', path: '' }];

    parts.forEach((part, index) => {
      const path = parts.slice(0, index + 1).join('/') + '/';
      breadcrumbs.push({ label: part, path });
    });

    return breadcrumbs;
  };

  const getFileType = (filename: string): string => {
    if (!filename) return 'Unknown';

    const extension = filename.split('.').pop()?.toLowerCase() || '';
    if (!extension) return 'File';

    const typeMap: Record<string, string> = {
      // Images
      'png': 'Image',
      'jpg': 'Image',
      'jpeg': 'Image',
      'gif': 'Image',
      'svg': 'Image',
      'webp': 'Image',

      // Documents
      'pdf': 'PDF',
      'doc': 'Document',
      'docx': 'Document',
      'xls': 'Spreadsheet',
      'xlsx': 'Spreadsheet',
      'ppt': 'Presentation',
      'pptx': 'Presentation',
      'txt': 'Text',

      // Archives
      'zip': 'Archive',
      'rar': 'Archive',
      'gz': 'Archive',
      'tar': 'Archive',

      // Video/Audio
      'mp4': 'Video',
      'avi': 'Video',
      'mov': 'Video',
      'mkv': 'Video',
      'webm': 'Video',
      'mp3': 'Audio',
      'wav': 'Audio',
      'flac': 'Audio',

      // Code
      'js': 'JavaScript',
      'ts': 'TypeScript',
      'tsx': 'TypeScript',
      'jsx': 'JavaScript',
      'py': 'Python',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C',
      'html': 'HTML',
      'css': 'CSS',
      'json': 'JSON',
      'xml': 'XML',
      'sql': 'SQL',

      // Data
      'csv': 'CSV',
    };

    return typeMap[extension] || extension.toUpperCase();
  };

  // If viewing a bucket's objects, show the objects view
  if (viewingBucket) {
    return (
      <div>
        <Header
          title={`Objects in ${viewingBucket}`}
        />
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Back Button */}
          <Button variant="outline" onClick={handleBackToBuckets} className="text-sm sm:text-base">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Buckets</span>
            <span className="sm:hidden">Back</span>
          </Button>

          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs sm:text-sm overflow-x-auto">
            <Home className="h-4 w-4 text-muted-foreground" />
            {getBreadcrumbs().map((crumb, index) => (
              <div key={index} className="flex items-center gap-2">
                {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                <button
                  onClick={() => setCurrentPath(crumb.path)}
                  className={
                    index === getBreadcrumbs().length - 1
                      ? 'font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                  }
                >
                  {crumb.label}
                </button>
              </div>
            ))}
          </div>

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search objects..."
                value={objectSearchQuery}
                onChange={(e) => setObjectSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {selectedFileKeys.size > 0 && (
                <Button
                  onClick={handleBulkDeleteFiles}
                  title={`Delete ${selectedFileKeys.size} selected file(s)`}
                  // set border in red and background transparent and text color red
                  className={"bg-transparent border border-red-500 text-red-500 hover:bg-red-500/5"}
                >
                  <Trash className="h-4 w-4" />
                  Delete {selectedFileKeys.size} file{selectedFileKeys.size !== 1 ? 's' : ''}
                </Button>
              )}
              <Button variant={"secondary"} onClick={() => setShowUploadZone(!showUploadZone)} className="flex-1 sm:flex-initial">
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Upload</span>
              </Button>
              <Button onClick={() => setCreateDirDialogOpen(true)} className="flex-1 sm:flex-initial">
                <FolderPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Directory</span>
              </Button>
              <Button variant="outline" size="icon" onClick={handleRefreshObjects} title="Refresh" disabled={isRefreshing}>
                <RotateCwIcon className={`h-4 w-4 transition-transform duration-500 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Upload Zone */}
          {showUploadZone && (
            <div className="border rounded-lg p-6 bg-muted/30 space-y-4">
              <div className="flex gap-6">
                {/* Upload SVG Icon */}
                <div className="flex-shrink-0 flex items-center justify-center">
                  <div className="w-20 h-20 bg-primary/10 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-12 h-12 text-primary"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                </div>

                {/* Upload Content */}
                <div className="flex-1 space-y-3">
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                      isDragActive
                        ? 'border-primary bg-primary/5'
                        : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <p className="text-sm">
                      Drag and drop or{' '}
                      <label
                        htmlFor="file-folder-input"
                        className="font-medium text-primary hover:underline cursor-pointer"
                      >
                        select from computer
                      </label>
                    </p>
                    <input
                      id="file-folder-input"
                      type="file"
                      multiple
                      onChange={(e) => {
                        if (e.target.files) {
                          const files = Array.from(e.target.files);
                          uploadFiles(files);
                          setShowUploadZone(false);
                        }
                      }}
                      style={{ display: 'none' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Objects Table with Drag & Drop */}
          <div
            {...getRootProps()}
            className={`border rounded-lg transition-colors overflow-x-auto ${
              isDragActive
                ? 'border-primary bg-primary/5 border-2'
                : 'border-border'
            }`}
          >
            <input {...getInputProps()} />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={
                        filteredObjects.filter(obj => !obj.isFolder).length > 0 &&
                        selectedFileKeys.size === filteredObjects.filter(obj => !obj.isFolder).length
                      }
                      onCheckedChange={handleSelectAllFiles}
                      aria-label="Select all files"
                    />
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => {
                    if (sortColumn === 'name') {
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortColumn('name');
                      setSortDirection('asc');
                    }
                  }}>
                    Objects {sortColumn === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">Type</TableHead>
                  <TableHead className="hidden md:table-cell">Storage Class</TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => {
                    if (sortColumn === 'size') {
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortColumn('size');
                      setSortDirection('asc');
                    }
                  }}>
                    Size {sortColumn === 'size' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => {
                    if (sortColumn === 'modified') {
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortColumn('modified');
                      setSortDirection('asc');
                    }
                  }}>
                    Modified {sortColumn === 'modified' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredObjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      {objectSearchQuery
                        ? 'No objects found matching your search'
                        : isDragActive
                        ? 'Drop files or folders here'
                        : 'No objects in this location'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredObjects.map((obj) => (
                    <TableRow key={obj.key}>
                      <TableCell className="w-[50px]">
                        {obj.isFolder ? (
                          <Checkbox
                            disabled
                            checked={false}
                            className="opacity-50 cursor-not-allowed bg-muted"
                            aria-label="Folders cannot be selected"
                          />
                        ) : (
                          <Checkbox
                            checked={selectedFileKeys.has(obj.key)}
                            onCheckedChange={() => handleToggleFileSelection(obj.key)}
                            aria-label={`Select file ${obj.key}`}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {obj.isFolder ? (
                            <FolderIcon className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <FileIcon className="h-4 w-4 text-muted-foreground" />
                          )}
                          {obj.isFolder ? (
                            <button
                              onClick={() => handleNavigateToFolder(obj.key)}
                              className="font-medium cursor-pointer underline hover:text-primary"
                            >
                              {obj.key.replace(currentPath, '').replace('/', '')}
                            </button>
                          ) : (
                            <span className="font-medium">
                              {obj.key.replace(currentPath, '')}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {obj.isFolder ? 'Folder' : getFileType(obj.key.replace(currentPath, ''))}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {obj.storageClass && (
                          <Badge variant="secondary">{obj.storageClass}</Badge>
                        )}
                      </TableCell>
                      <TableCell>{obj.isFolder ? null : formatBytes(obj.size)}</TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="decoration-dashed decoration-1 underline underline-offset-6 cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                                {new Date(obj.lastModified).toLocaleDateString('en-GB', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })} {new Date(obj.lastModified).toLocaleTimeString('en-GB', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                  hour12: false,
                                })} CET
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="space-y-1 min-w-max">
                                <div className="flex gap-3 items-center">
                                  <span className="text-sm text-gray-400 w-20 text-right">UTC</span>
                                  <span className="text-sm text-white">
                                    {new Date(obj.lastModified).toLocaleString('en-GB', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      second: '2-digit',
                                      hour12: false,
                                      timeZone: 'UTC',
                                    })} UTC
                                  </span>
                                </div>
                                <div className="flex gap-3 items-center">
                                  <span className="text-sm text-gray-400 w-20 text-right">Relative</span>
                                  <span className="text-sm text-white">
                                    {(() => {
                                      const now = new Date();
                                      const date = new Date(obj.lastModified);
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
                                    })()}
                                  </span>
                                </div>
                                <div className="flex gap-3 items-center">
                                  <span className="text-sm text-gray-400 w-20 text-right">Timestamp</span>
                                  <span className="text-sm text-white font-mono">
                                    {new Date(obj.lastModified).toISOString()}
                                  </span>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        {!obj.isFolder && (
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              {/*make the button not affecting the row height*/}
                              <Button variant="ghost" size="icon" className={"-m-6 top-1 relative"}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Download className="h-4 w-4" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  setSelectedObject(obj);
                                  setDeleteObjectDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Create Directory Dialog */}
        <Dialog open={createDirDialogOpen} onOpenChange={setCreateDirDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Directory</DialogTitle>
              <DialogDescription>
                Create a new directory in {currentPath || 'the root'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Directory Name</label>
                <Input
                  placeholder="my-directory"
                  value={newDirName}
                  onChange={(e) => setNewDirName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateDirectory();
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDirDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateDirectory} disabled={!newDirName}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Object Dialog */}
        <Dialog open={deleteObjectDialogOpen} onOpenChange={setDeleteObjectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Object</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{selectedObject?.key}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteObjectDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteObject}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Default view: show buckets list
  return (
    <div>
      <Header title="Buckets" />
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search buckets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Create Bucket
          </Button>
        </div>

        {/* Buckets Table */}
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Region</TableHead>
                <TableHead className="hidden md:table-cell">Objects</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="hidden lg:table-cell">Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBuckets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    {searchQuery ? 'No buckets found matching your search' : 'No buckets yet'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredBuckets.map((bucket) => (
                  <TableRow
                    key={bucket.name}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleViewBucket(bucket.name)}
                  >
                    <TableCell className="font-medium truncate max-w-[200px]">{bucket.name}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="secondary">{bucket.region || 'default'}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{bucket.objectCount?.toLocaleString() || 0}</TableCell>
                    <TableCell>{bucket.size ? formatBytes(bucket.size) : '0 B'}</TableCell>
                    <TableCell className="hidden lg:table-cell">{formatDate(bucket.creationDate)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className={"-m-3 top-1 relative"}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            handleViewBucket(bucket.name);
                          }}>
                            <FolderIcon className="h-4 w-4" />
                            View Objects
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                            <Settings className="h-4 w-4" />
                            Settings
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBucket(bucket);
                              setDeleteBucketDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create Bucket Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Bucket</DialogTitle>
            <DialogDescription>
              Create a new storage bucket for your objects
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Bucket Name</label>
              <Input
                placeholder="my-bucket-name"
                value={newBucketName}
                onChange={(e) => setNewBucketName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Must be unique and follow DNS naming conventions
              </p>
            </div>
          </div>
          <DialogFooter className={"space-y-2"}>
            <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
                variant={!newBucketName ? "default_disabled" : "default"}
                onClick={handleCreateBucket}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Bucket Preview Dialog */}
      <Dialog open={showCreatePreview} onOpenChange={setShowCreatePreview}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bucket Preview</DialogTitle>
            <DialogDescription>
              Review the bucket configuration before creating
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="border rounded-lg p-4 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Bucket Name</p>
                <p className="text-sm font-medium">{newBucketName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge variant="outline">Ready to Create</Badge>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreatePreview(false)}>
              Back
            </Button>
            <Button onClick={handleCreateBucket}>
              Confirm & Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Bucket Dialog */}
      <Dialog open={deleteBucketDialogOpen} onOpenChange={setDeleteBucketDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Bucket</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedBucket?.name}"? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteBucketDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteBucket}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

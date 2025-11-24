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
} from 'lucide-react';

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

    for (const file of files) {
      const key = currentPath ? `${currentPath}${file.name}` : file.name;
      await objectsApi.upload(viewingBucket, key, file);
    }

    // Refresh objects list
    const data = await objectsApi.list(viewingBucket, currentPath);
    setObjects(data);
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

  useEffect(() => {
    const filtered = objects.filter((obj) =>
      obj.key.toLowerCase().includes(objectSearchQuery.toLowerCase())
    );
    setFilteredObjects(filtered);
  }, [objectSearchQuery, objects]);

  const handleCreateBucket = async () => {
    if (!newBucketName) return;

    await bucketsApi.create(newBucketName);
    setCreateDialogOpen(false);
    setNewBucketName('');
    setShowCreatePreview(false);

    // Refresh bucket list
    const data = await bucketsApi.list();
    setBuckets(data);
  };

  const handleDeleteBucket = async () => {
    if (!selectedBucket) return;

    await bucketsApi.delete(selectedBucket.name);
    setDeleteBucketDialogOpen(false);
    setSelectedBucket(null);

    // Refresh bucket list
    const data = await bucketsApi.list();
    setBuckets(data);
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

    await objectsApi.delete(viewingBucket, selectedObject.key);
    setDeleteObjectDialogOpen(false);
    setSelectedObject(null);

    // Refresh objects list
    const data = await objectsApi.list(viewingBucket, currentPath);
    setObjects(data);
  };

  const handleRefreshObjects = async () => {
    if (!viewingBucket) return;
    const data = await objectsApi.list(viewingBucket, currentPath);
    setObjects(data);
  };

  const handleCreateDirectory = async () => {
    if (!newDirName || !viewingBucket) return;

    // Create a directory by uploading an empty object with a trailing slash
    const dirKey = currentPath ? `${currentPath}${newDirName}/` : `${newDirName}/`;
    await objectsApi.upload(viewingBucket, dirKey, new File([], ''));

    setCreateDirDialogOpen(false);
    setNewDirName('');

    // Refresh objects list
    const data = await objectsApi.list(viewingBucket, currentPath);
    setObjects(data);
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

  // If viewing a bucket's objects, show the objects view
  if (viewingBucket) {
    return (
      <div>
        <Header
          title={`Objects in ${viewingBucket}`}
        />
        <div className="p-6 space-y-6">
          {/* Back Button */}
          <Button variant="outline" onClick={handleBackToBuckets}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Buckets
          </Button>

          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-sm">
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
          <div className="flex items-center justify-between">
            <div className="relative w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search objects..."
                value={objectSearchQuery}
                onChange={(e) => setObjectSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setShowUploadZone(!showUploadZone)}>
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </Button>
              <Button onClick={() => setCreateDirDialogOpen(true)}>
                <FolderPlus className="mr-2 h-4 w-4" />
                Create Directory
              </Button>
              <Button variant="outline" size="icon" onClick={handleRefreshObjects} title="Refresh">
                <RotateCwIcon className="h-4 w-4" />
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
            className={`border rounded-lg transition-colors ${
              isDragActive
                ? 'border-primary bg-primary/5 border-2'
                : 'border-border'
            }`}
          >
            <input {...getInputProps()} />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Last Modified</TableHead>
                  <TableHead>Storage Class</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredObjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
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
                              className="font-medium hover:underline"
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
                      <TableCell>{obj.isFolder ? '---' : formatBytes(obj.size)}</TableCell>
                      <TableCell>{formatDate(obj.lastModified)}</TableCell>
                      <TableCell>
                        {obj.storageClass && (
                          <Badge variant="secondary">{obj.storageClass}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {!obj.isFolder && (
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              {/*make the button not affecting the row height*/}
                              <Button variant="ghost" size="icon" className={"-m-3 top-1 relative"}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Download className="mr-2 h-4 w-4" />
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
                                <Trash2 className="mr-2 h-4 w-4" />
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
      <div className="p-6 space-y-6">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search buckets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Bucket
          </Button>
        </div>

        {/* Buckets Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Objects</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Created</TableHead>
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
                    <TableCell className="font-medium">{bucket.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{bucket.region || 'default'}</Badge>
                    </TableCell>
                    <TableCell>{bucket.objectCount?.toLocaleString() || 0}</TableCell>
                    <TableCell>{bucket.size ? formatBytes(bucket.size) : '0 B'}</TableCell>
                    <TableCell>{formatDate(bucket.creationDate)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            handleViewBucket(bucket.name);
                          }}>
                            <FolderIcon className="mr-2 h-4 w-4" />
                            View Objects
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                            <Settings className="mr-2 h-4 w-4" />
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
                            <Trash2 className="mr-2 h-4 w-4" />
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowCreatePreview(true)}
              disabled={!newBucketName}
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
            <Button onClick={handleCreateBucket} disabled={!newBucketName}>
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

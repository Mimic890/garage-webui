import { useEffect, useState } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { accessApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { AccessKey, Permission } from '@/types';
import {
  Plus,
  MoreVertical,
  Trash2,
  Edit,
  Search,
  Key,
  ShieldCheck,
  ShieldX,
  Copy,
} from 'lucide-react';

export function AccessControl() {
  const [keys, setKeys] = useState<AccessKey[]>([]);
  const [filteredKeys, setFilteredKeys] = useState<AccessKey[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<AccessKey | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyResource, setNewKeyResource] = useState('*');
  const [newKeyActions, setNewKeyActions] = useState<string[]>(['GetObject']);

  useEffect(() => {
    const fetchKeys = async () => {
      const data = await accessApi.listKeys();
      setKeys(data);
      setFilteredKeys(data);
    };

    fetchKeys();
  }, []);

  useEffect(() => {
    const filtered = keys.filter(
      (key) =>
        key.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        key.accessKeyId.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredKeys(filtered);
  }, [searchQuery, keys]);

  const handleCreateKey = async () => {
    if (!newKeyName) return;

    const permissions: Permission[] = [
      {
        resource: newKeyResource,
        actions: newKeyActions,
        effect: 'Allow',
      },
    ];

    await accessApi.createKey(newKeyName, permissions);
    setCreateDialogOpen(false);
    setNewKeyName('');
    setNewKeyResource('*');
    setNewKeyActions(['GetObject']);

    // Refresh keys list
    const data = await accessApi.listKeys();
    setKeys(data);
  };

  const handleDeleteKey = async () => {
    if (!selectedKey) return;

    await accessApi.deleteKey(selectedKey.accessKeyId);
    setDeleteDialogOpen(false);
    setSelectedKey(null);

    // Refresh keys list
    const data = await accessApi.listKeys();
    setKeys(data);
  };

  const handleToggleKeyStatus = async (key: AccessKey) => {
    const newStatus = key.status === 'active' ? 'inactive' : 'active';
    await accessApi.updateKey(key.accessKeyId, { status: newStatus });

    // Refresh keys list
    const data = await accessApi.listKeys();
    setKeys(data);
  };

  const availableActions = [
    'GetObject',
    'PutObject',
    'DeleteObject',
    'ListBucket',
    'GetBucketLocation',
    'CreateBucket',
    'DeleteBucket',
  ];

  return (
    <div>
      <Header
        title="Access Control"
      />
      <div className="p-6 space-y-6">
        <Tabs defaultValue="keys">
          <TabsList>
            <TabsTrigger value="keys">API Keys</TabsTrigger>
            <TabsTrigger value="policies">Bucket Policies</TabsTrigger>
          </TabsList>

          <TabsContent value="keys" className="space-y-6 mt-6">
            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Keys</CardTitle>
                  <Key className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{keys.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Keys</CardTitle>
                  <ShieldCheck className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {keys.filter((k) => k.status === 'active').length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Inactive Keys</CardTitle>
                  <ShieldX className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {keys.filter((k) => k.status === 'inactive').length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between">
              <div className="relative w-80">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search keys..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Key
              </Button>
            </div>

            {/* Keys Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Access Key ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredKeys.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        {searchQuery ? 'No keys found matching your search' : 'No API keys yet'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredKeys.map((key) => (
                      <TableRow key={key.accessKeyId}>
                        <TableCell className="font-medium">{key.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {key.accessKeyId}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => navigator.clipboard.writeText(key.accessKeyId)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={key.status === 'active' ? 'default' : 'secondary'}>
                            {key.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(key.createdAt)}</TableCell>
                        <TableCell>
                          {key.lastUsed ? formatDate(key.lastUsed) : 'Never'}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {key.permissions.slice(0, 2).map((perm, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {perm.actions.length} action{perm.actions.length > 1 ? 's' : ''}
                              </Badge>
                            ))}
                            {key.permissions.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{key.permissions.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleKeyStatus(key)}>
                                {key.status === 'active' ? (
                                  <>
                                    <ShieldX className="mr-2 h-4 w-4" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <ShieldCheck className="mr-2 h-4 w-4" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  setSelectedKey(key);
                                  setDeleteDialogOpen(true);
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
          </TabsContent>

          <TabsContent value="policies" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Bucket Policies</CardTitle>
                <CardDescription>
                  Manage resource-based policies for your buckets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-12">
                  Bucket policy editor coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Key Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Create a new API key with specific permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Key Name</label>
              <Input
                placeholder="My Application Key"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Resource</label>
              <Input
                placeholder="bucket-name/* or *"
                value={newKeyResource}
                onChange={(e) => setNewKeyResource(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Specify which resources this key can access
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Actions</label>
              <div className="grid grid-cols-2 gap-2">
                {availableActions.map((action) => (
                  <label key={action} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={newKeyActions.includes(action)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewKeyActions([...newKeyActions, action]);
                        } else {
                          setNewKeyActions(newKeyActions.filter((a) => a !== action));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    {action}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateKey} disabled={!newKeyName || newKeyActions.length === 0}>
              Create Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Key Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete API Key</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedKey?.name}"? Applications using this key
              will lose access immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteKey}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

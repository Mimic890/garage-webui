import axios from 'axios';
import type {
  Bucket,
  BucketDetails,
  S3Object,
  ObjectMetadata,
  AccessKey,
  StorageMetrics,
  ClusterHealth,
  ClusterStatistics,
  NodeInfo,
  GarageMetrics,
} from '@/types';

// Configure axios instance with base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Bucket API
export const bucketsApi = {
  list: async (): Promise<Bucket[]> => {
    // const response = await api.get('/buckets');
    // return response.data;
    return mockBuckets; // Using mock data for now
  },

  get: async (_name: string): Promise<BucketDetails> => {
    // const response = await api.get(`/buckets/${_name}`);
    // return response.data;
    return mockBucketDetails; // Using mock data for now
  },

  create: async (bucketName: string, bucketRegion?: string): Promise<void> => {
    // await api.post('/buckets', { name: bucketName, region: bucketRegion });
    console.log('Create bucket:', bucketName, bucketRegion);
  },

  delete: async (name: string): Promise<void> => {
    // await api.delete(`/buckets/${name}`);
    console.log('Delete bucket:', name);
  },

  updateSettings: async (name: string, settings: Partial<BucketDetails>): Promise<void> => {
    // await api.put(`/buckets/${name}/settings`, settings);
    console.log('Update bucket settings:', name, settings);
  },
};

// Objects API
export const objectsApi = {
  list: async (_bucket: string, _prefix?: string): Promise<S3Object[]> => {
    // const response = await api.get(`/buckets/${_bucket}/objects`, { params: { prefix: _prefix } });
    // return response.data;

    // Filter mock objects by prefix
    if (!_prefix) {
      return mockObjectsFlat.filter(obj => !obj.key.includes('/'));
    }

    // Get all objects with this prefix, but only direct children
    const prefixObjects = mockObjectsFlat.filter(obj => obj.key.startsWith(_prefix));
    const directChildren = new Set<string>();

    prefixObjects.forEach(obj => {
      const remaining = obj.key.slice(_prefix.length);
      const parts = remaining.split('/');

      if (parts.length > 0 && parts[0]) {
        if (parts.length === 1 && !remaining.endsWith('/')) {
          // It's a file at this level
          directChildren.add(obj.key);
        } else if (parts.length > 1 || remaining.endsWith('/')) {
          // It's a folder, add the folder path
          const folderPath = _prefix + parts[0] + '/';
          directChildren.add(folderPath);
        }
      }
    });

    // Return unique objects
    const seen = new Set<string>();
    return Array.from(directChildren)
      .map(key => {
        if (seen.has(key)) return null;
        seen.add(key);
        return mockObjectsFlat.find(obj => obj.key === key) || {
          key,
          size: 0,
          lastModified: new Date().toISOString(),
          isFolder: key.endsWith('/'),
        };
      })
      .filter((obj): obj is S3Object => obj !== null);
  },

  get: async (_bucket: string, _key: string): Promise<Blob> => {
    // const response = await api.get(`/buckets/${_bucket}/objects/${_key}`, { responseType: 'blob' });
    // return response.data;
    return new Blob(); // Using mock data for now
  },

  getMetadata: async (_bucket: string, _key: string): Promise<ObjectMetadata> => {
    // const response = await api.get(`/buckets/${_bucket}/objects/${_key}/metadata`);
    // return response.data;
    return mockObjectMetadata; // Using mock data for now
  },

  upload: async (bucket: string, key: string, file: File): Promise<void> => {
    // const formData = new FormData();
    // formData.append('file', file);
    // await api.post(`/buckets/${bucket}/objects/${key}`, formData, {
    //   headers: { 'Content-Type': 'multipart/form-data' },
    // });
    console.log('Upload object:', bucket, key, file);
  },

  delete: async (bucket: string, key: string): Promise<void> => {
    // await api.delete(`/buckets/${bucket}/objects/${key}`);
    console.log('Delete object:', bucket, key);
  },

  deleteMultiple: async (bucket: string, keys: string[]): Promise<void> => {
    // await api.post(`/buckets/${bucket}/objects/delete`, { keys });
    console.log('Delete multiple objects:', bucket, keys);
  },

  getPresignedUrl: async (_bucket: string, _key: string, _expiresIn?: number): Promise<string> => {
    // const response = await api.post(`/buckets/${_bucket}/objects/${_key}/presign`, { expiresIn: _expiresIn });
    // return response.data.url;
    return 'https://example.com/presigned-url'; // Using mock data for now
  },
};

// Access Control API
export const accessApi = {
  listKeys: async (): Promise<AccessKey[]> => {
    // const response = await api.get('/access/keys');
    // return response.data;
    return mockAccessKeys; // Using mock data for now
  },

  createKey: async (name: string, permissions: any[]): Promise<AccessKey> => {
    // const response = await api.post('/access/keys', { name, permissions });
    // return response.data;
    console.log('Create access key:', name, permissions);
    return mockAccessKeys[0]; // Using mock data for now
  },

  updateKey: async (keyId: string, updates: Partial<AccessKey>): Promise<void> => {
    // await api.put(`/access/keys/${keyId}`, updates);
    console.log('Update access key:', keyId, updates);
  },

  deleteKey: async (keyId: string): Promise<void> => {
    // await api.delete(`/access/keys/${keyId}`);
    console.log('Delete access key:', keyId);
  },
};

// Analytics API
export const analyticsApi = {
  getMetrics: async (): Promise<StorageMetrics> => {
    // const response = await api.get('/analytics/metrics');
    // return response.data;
    return mockMetrics; // Using mock data for now
  },
};

// Garage Admin API
export const garageApi = {
  getClusterHealth: async (): Promise<ClusterHealth> => {
    // const response = await api.get('/v2/GetClusterHealth');
    // return response.data;
    return mockClusterHealth; // Using mock data for now
  },

  getClusterStatistics: async (): Promise<ClusterStatistics> => {
    // const response = await api.get('/v2/GetClusterStatistics');
    // return response.data;
    return mockClusterStatistics; // Using mock data for now
  },

  getNodeInfo: async (): Promise<NodeInfo> => {
    // const response = await api.get('/v2/GetNodeInfo?node=self');
    // return response.data;
    return mockNodeInfo; // Using mock data for now
  },

  getFullMetrics: async (): Promise<GarageMetrics> => {
    // Fetch all cluster-related metrics
    const [health, statistics, nodeInfo, storageMetrics] = await Promise.all([
      garageApi.getClusterHealth(),
      garageApi.getClusterStatistics(),
      garageApi.getNodeInfo(),
      analyticsApi.getMetrics(),
    ]);

    return {
      ...storageMetrics,
      clusterHealth: health,
      clusterStatistics: statistics,
      nodeInfo: nodeInfo,
    };
  },
};

// Mock data
const mockBuckets: Bucket[] = [
  {
    name: 'production-assets',
    creationDate: '2025-01-15T10:30:00Z',
    objectCount: 1247,
    size: 524288000,
    region: 'us-east-1',
  },
  {
    name: 'user-uploads',
    creationDate: '2025-01-10T14:20:00Z',
    objectCount: 3892,
    size: 1073741824,
    region: 'us-east-1',
  },
  {
    name: 'backups',
    creationDate: '2025-01-05T08:15:00Z',
    objectCount: 156,
    size: 2147483648,
    region: 'us-west-2',
  },
  {
    name: 'logs',
    creationDate: '2024-12-20T16:45:00Z',
    objectCount: 8934,
    size: 314572800,
    region: 'eu-west-1',
  },
  {
    name: 'media-cdn',
    creationDate: '2024-12-15T11:00:00Z',
    objectCount: 5621,
    size: 3221225472,
    region: 'ap-southeast-1',
  },
];

const mockBucketDetails: BucketDetails = {
  ...mockBuckets[0],
  versioning: true,
  encryption: true,
  publicAccess: false,
  lifecycleRules: [
    {
      id: 'rule-1',
      enabled: true,
      prefix: 'temp/',
      expirationDays: 30,
    },
  ],
};

const mockObjectsFlat: S3Object[] = [
  // Root level files
  {
    key: 'config.json',
    size: 2048,
    lastModified: '2025-01-22T09:15:00Z',
    etag: 'abc123',
    storageClass: 'STANDARD',
  },
  {
    key: 'README.md',
    size: 4096,
    lastModified: '2025-01-21T14:20:00Z',
    etag: 'def456',
    storageClass: 'STANDARD',
  },
  {
    key: 'app.log',
    size: 1048576,
    lastModified: '2025-01-24T11:45:00Z',
    etag: 'ghi789',
    storageClass: 'STANDARD',
  },
  // Folder entries
  {
    key: 'images/',
    size: 0,
    lastModified: '2025-01-20T10:00:00Z',
    isFolder: true,
  },
  {
    key: 'documents/',
    size: 0,
    lastModified: '2025-01-19T15:30:00Z',
    isFolder: true,
  },
  {
    key: 'videos/',
    size: 0,
    lastModified: '2025-01-18T14:00:00Z',
    isFolder: true,
  },
  {
    key: 'backups/',
    size: 0,
    lastModified: '2025-01-17T08:30:00Z',
    isFolder: true,
  },
  // Images subfolder
  {
    key: 'images/avatar.png',
    size: 256000,
    lastModified: '2025-01-20T10:15:00Z',
    etag: 'img001',
    storageClass: 'STANDARD',
  },
  {
    key: 'images/logo.svg',
    size: 12288,
    lastModified: '2025-01-20T10:20:00Z',
    etag: 'img002',
    storageClass: 'STANDARD',
  },
  {
    key: 'images/banner.jpg',
    size: 512000,
    lastModified: '2025-01-20T10:25:00Z',
    etag: 'img003',
    storageClass: 'STANDARD',
  },
  {
    key: 'images/thumbnails/',
    size: 0,
    lastModified: '2025-01-20T11:00:00Z',
    isFolder: true,
  },
  // Images/thumbnails subfolder
  {
    key: 'images/thumbnails/avatar-small.png',
    size: 32000,
    lastModified: '2025-01-20T11:05:00Z',
    etag: 'thumb001',
    storageClass: 'STANDARD',
  },
  {
    key: 'images/thumbnails/logo-small.svg',
    size: 4096,
    lastModified: '2025-01-20T11:10:00Z',
    etag: 'thumb002',
    storageClass: 'STANDARD',
  },
  {
    key: 'images/thumbnails/banner-small.jpg',
    size: 64000,
    lastModified: '2025-01-20T11:15:00Z',
    etag: 'thumb003',
    storageClass: 'STANDARD',
  },
  // Documents subfolder
  {
    key: 'documents/report-2025-01.pdf',
    size: 2048000,
    lastModified: '2025-01-19T16:00:00Z',
    etag: 'doc001',
    storageClass: 'STANDARD',
  },
  {
    key: 'documents/report-2025-02.pdf',
    size: 2156000,
    lastModified: '2025-01-19T16:10:00Z',
    etag: 'doc002',
    storageClass: 'STANDARD',
  },
  {
    key: 'documents/contract.docx',
    size: 128000,
    lastModified: '2025-01-19T16:20:00Z',
    etag: 'doc003',
    storageClass: 'STANDARD',
  },
  {
    key: 'documents/spreadsheet.xlsx',
    size: 256000,
    lastModified: '2025-01-19T16:30:00Z',
    etag: 'doc004',
    storageClass: 'STANDARD',
  },
  {
    key: 'documents/archives/',
    size: 0,
    lastModified: '2025-01-19T17:00:00Z',
    isFolder: true,
  },
  // Documents/archives subfolder
  {
    key: 'documents/archives/2024-reports.zip',
    size: 10485760,
    lastModified: '2025-01-19T17:15:00Z',
    etag: 'arch001',
    storageClass: 'STANDARD',
  },
  {
    key: 'documents/archives/2023-reports.zip',
    size: 9437184,
    lastModified: '2025-01-19T17:20:00Z',
    etag: 'arch002',
    storageClass: 'STANDARD',
  },
  // Videos subfolder
  {
    key: 'videos/tutorial-intro.mp4',
    size: 104857600,
    lastModified: '2025-01-18T14:30:00Z',
    etag: 'vid001',
    storageClass: 'STANDARD',
  },
  {
    key: 'videos/tutorial-advanced.mp4',
    size: 157286400,
    lastModified: '2025-01-18T14:35:00Z',
    etag: 'vid002',
    storageClass: 'STANDARD',
  },
  {
    key: 'videos/demo.webm',
    size: 52428800,
    lastModified: '2025-01-18T14:40:00Z',
    etag: 'vid003',
    storageClass: 'STANDARD',
  },
  {
    key: 'videos/clips/',
    size: 0,
    lastModified: '2025-01-18T15:00:00Z',
    isFolder: true,
  },
  // Videos/clips subfolder
  {
    key: 'videos/clips/intro.mp4',
    size: 20971520,
    lastModified: '2025-01-18T15:10:00Z',
    etag: 'clip001',
    storageClass: 'STANDARD',
  },
  {
    key: 'videos/clips/outro.mp4',
    size: 20971520,
    lastModified: '2025-01-18T15:15:00Z',
    etag: 'clip002',
    storageClass: 'STANDARD',
  },
  {
    key: 'videos/clips/transition.mp4',
    size: 10485760,
    lastModified: '2025-01-18T15:20:00Z',
    etag: 'clip003',
    storageClass: 'STANDARD',
  },
  // Backups subfolder
  {
    key: 'backups/db-backup-2025-01-24.sql',
    size: 536870912,
    lastModified: '2025-01-24T03:00:00Z',
    etag: 'backup001',
    storageClass: 'STANDARD',
  },
  {
    key: 'backups/db-backup-2025-01-23.sql',
    size: 524288000,
    lastModified: '2025-01-23T03:00:00Z',
    etag: 'backup002',
    storageClass: 'STANDARD',
  },
  {
    key: 'backups/app-backup-2025-01-24.tar.gz',
    size: 1073741824,
    lastModified: '2025-01-24T03:15:00Z',
    etag: 'backup003',
    storageClass: 'STANDARD',
  },
  {
    key: 'backups/daily/',
    size: 0,
    lastModified: '2025-01-24T03:30:00Z',
    isFolder: true,
  },
  // Backups/daily subfolder
  {
    key: 'backups/daily/db-backup-2025-01-24-00.sql',
    size: 268435456,
    lastModified: '2025-01-24T00:30:00Z',
    etag: 'daily001',
    storageClass: 'STANDARD',
  },
  {
    key: 'backups/daily/db-backup-2025-01-24-06.sql',
    size: 268435456,
    lastModified: '2025-01-24T06:30:00Z',
    etag: 'daily002',
    storageClass: 'STANDARD',
  },
  {
    key: 'backups/daily/db-backup-2025-01-24-12.sql',
    size: 268435456,
    lastModified: '2025-01-24T12:30:00Z',
    etag: 'daily003',
    storageClass: 'STANDARD',
  },
  {
    key: 'backups/daily/db-backup-2025-01-24-18.sql',
    size: 268435456,
    lastModified: '2025-01-24T18:30:00Z',
    etag: 'daily004',
    storageClass: 'STANDARD',
  },
];

const mockObjectMetadata: ObjectMetadata = {
  key: 'config.json',
  size: 2048,
  lastModified: '2025-01-22T09:15:00Z',
  contentType: 'application/json',
  etag: 'abc123',
  metadata: {
    'x-amz-meta-author': 'admin',
    'x-amz-meta-version': '1.0',
  },
};

const mockAccessKeys: AccessKey[] = [
  {
    accessKeyId: 'GK1234567890ABCDEF',
    name: 'Production API Key',
    createdAt: '2025-01-10T10:00:00Z',
    lastUsed: '2025-01-24T14:30:00Z',
    status: 'active',
    permissions: [
      {
        resource: 'production-assets/*',
        actions: ['GetObject', 'PutObject'],
        effect: 'Allow',
      },
    ],
  },
  {
    accessKeyId: 'GK0987654321FEDCBA',
    name: 'Backup Service',
    createdAt: '2025-01-05T08:00:00Z',
    lastUsed: '2025-01-24T02:00:00Z',
    status: 'active',
    permissions: [
      {
        resource: 'backups/*',
        actions: ['GetObject', 'PutObject', 'DeleteObject'],
        effect: 'Allow',
      },
    ],
  },
  {
    accessKeyId: 'GK5555666677778888',
    name: 'Legacy Integration',
    createdAt: '2024-11-15T12:00:00Z',
    status: 'inactive',
    permissions: [
      {
        resource: 'user-uploads/*',
        actions: ['GetObject'],
        effect: 'Allow',
      },
    ],
  },
];

const mockMetrics: StorageMetrics = {
  totalSize: 7282384896,
  objectCount: 19850,
  bucketCount: 5,
  usageByBucket: [
    {
      bucketName: 'media-cdn',
      size: 3221225472,
      objectCount: 5621,
      percentage: 44.2,
    },
    {
      bucketName: 'backups',
      size: 2147483648,
      objectCount: 156,
      percentage: 29.5,
    },
    {
      bucketName: 'user-uploads',
      size: 1073741824,
      objectCount: 3892,
      percentage: 14.7,
    },
    {
      bucketName: 'production-assets',
      size: 524288000,
      objectCount: 1247,
      percentage: 7.2,
    },
    {
      bucketName: 'logs',
      size: 314572800,
      objectCount: 8934,
      percentage: 4.3,
    },
  ],
  requestMetrics: {
    getRequests: 145678,
    putRequests: 12456,
    deleteRequests: 3421,
    listRequests: 8934,
    period: 'last-24h',
  },
};

const mockClusterHealth = {
  status: 'Healthy',
  connectedNodes: 3,
  knownNodes: 3,
  healthyStorageNodes: 3,
  declaredStorageNodes: 3,
  healthyPartitions: 256,
  totalPartitions: 256,
};

const mockClusterStatistics = {
  timestamp: Date.now(),
  uptime: 864000000,
  freeform: 'Cluster operating normally',
};

const mockNodeInfo = {
  nodeId: 'node-001',
  version: '1.0.0',
  rustVersion: '1.75.0',
  uptime: 864000,
  dbSize: 1073741824,
  blockReferenceTableSize: 536870912,
  blockMetricsTableSize: 268435456,
  objectTableSize: 134217728,
  objectVersionTableSize: 67108864,
  bucketTableSize: 33554432,
  bucketAliasTableSize: 16777216,
};

export default api;

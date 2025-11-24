// Bucket types
export interface Bucket {
  name: string;
  creationDate: string;
  objectCount?: number;
  size?: number;
  region?: string;
}

export interface BucketDetails extends Bucket {
  versioning?: boolean;
  encryption?: boolean;
  publicAccess?: boolean;
  lifecycleRules?: LifecycleRule[];
}

export interface LifecycleRule {
  id: string;
  enabled: boolean;
  prefix?: string;
  expirationDays?: number;
  transitions?: Transition[];
}

export interface Transition {
  days: number;
  storageClass: string;
}

// Object types
export interface S3Object {
  key: string;
  size: number;
  lastModified: string;
  etag?: string;
  storageClass?: string;
  isFolder?: boolean;
}

export interface ObjectMetadata {
  key: string;
  size: number;
  lastModified: string;
  contentType: string;
  etag: string;
  metadata?: Record<string, string>;
  versionId?: string;
}

// Access Control types
export interface AccessKey {
  accessKeyId: string;
  name: string;
  createdAt: string;
  lastUsed?: string;
  status: 'active' | 'inactive';
  permissions: Permission[];
}

export interface Permission {
  resource: string;
  actions: string[];
  effect: 'Allow' | 'Deny';
}

export interface BucketPolicy {
  bucketName: string;
  policy: PolicyStatement[];
}

export interface PolicyStatement {
  sid?: string;
  effect: 'Allow' | 'Deny';
  principal: string | string[];
  action: string | string[];
  resource: string | string[];
  condition?: Record<string, any>;
}

// User types
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'readonly';
  createdAt: string;
}

// Storage Analytics types
export interface StorageMetrics {
  totalSize: number;
  objectCount: number;
  bucketCount: number;
  usageByBucket: BucketUsage[];
  requestMetrics: RequestMetrics;
}

export interface BucketUsage {
  bucketName: string;
  size: number;
  objectCount: number;
  percentage: number;
}

export interface RequestMetrics {
  getRequests: number;
  putRequests: number;
  deleteRequests: number;
  listRequests: number;
  period: string;
}

// Upload types
export interface UploadTask {
  id: string;
  file: File;
  key: string;
  bucket: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Filter and Sort types
export interface TableFilter {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  pageSize?: number;
  page?: number;
}

// Garage Cluster types
export interface ClusterHealth {
  status: string;
  connectedNodes: number;
  knownNodes: number;
  healthyStorageNodes: number;
  declaredStorageNodes: number;
  healthyPartitions: number;
  totalPartitions: number;
}

export interface ClusterStatistics {
  timestamp: number;
  uptime: number;
  freeform: string;
  [key: string]: any;
}

export interface NodeInfo {
  nodeId: string;
  version: string;
  rustVersion: string;
  uptime: number;
  dbSize: number;
  blockReferenceTableSize: number;
  blockMetricsTableSize: number;
  objectTableSize: number;
  objectVersionTableSize: number;
  bucketTableSize: number;
  bucketAliasTableSize: number;
  [key: string]: any;
}

export interface RequestTypeMetrics {
  read: number;
  write: number;
  delete: number;
  list: number;
}

export interface GarageMetrics extends StorageMetrics {
  clusterHealth?: ClusterHealth;
  clusterStatistics?: ClusterStatistics;
  nodeInfo?: NodeInfo;
  requestTypeMetrics?: RequestTypeMetrics;
}

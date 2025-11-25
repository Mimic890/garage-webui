/**
 * Get the file type based on file extension
 */
export function getFileType(filename: string): string {
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

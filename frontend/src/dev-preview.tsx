// Throwaway preview harness for the Dialog + Select responsive work.
// Served only in dev at /dev-preview.html — not part of the app or the build.
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectOption } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const buckets = [
  'obsidian',
  'nextcloud-storage',
  'photos-2024',
  'photos-2025',
  'backups-daily',
  'backups-weekly',
  'terraform-state',
  'loki-chunks',
  'postgres-dumps',
  'media-archive',
  'ci-artifacts',
  'restic-repo',
];

function Preview() {
  const [openForm, setOpenForm] = useState(true);
  const [openSmall, setOpenSmall] = useState(false);
  const [bucket, setBucket] = useState('');

  return (
    <div className="min-h-screen bg-[var(--background)] p-6 text-[var(--foreground)]">
      <div className="space-y-3">
        <h1 className="text-lg font-semibold">Dialog / Select preview</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Resize the window below / above 640px to switch between full-screen sheet and centered dialog.
          Open the bucket select near the bottom of the list to check flipping and scrolling.
        </p>
        <div className="flex gap-2">
          <Button onClick={() => setOpenForm(true)}>Open form dialog</Button>
          <Button variant="secondary" onClick={() => setOpenSmall(true)}>
            Open small dialog
          </Button>
        </div>
      </div>

      <Dialog open={openForm} onOpenChange={setOpenForm} size="form">
        <DialogContent>
          <DialogHeader>
            <div className="min-w-0 flex-1">
              <DialogTitle>Create access key</DialogTitle>
              <DialogDescription>Create an access key for S3 clients and integrations.</DialogDescription>
            </div>
          </DialogHeader>
          <DialogBody className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium">Key name</label>
              <Input placeholder="Backup service" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium">Bucket</label>
              <Select value={bucket} onChange={setBucket}>
                <SelectOption value="">Select a bucket</SelectOption>
                {buckets.map((name) => (
                  <SelectOption key={name} value={name}>
                    {name}
                  </SelectOption>
                ))}
              </Select>
            </div>
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="space-y-1.5">
                <label className="text-[13px] font-medium">Filler field {i + 1}</label>
                <Input placeholder="makes the body scroll" />
              </div>
            ))}
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium">Bucket (bottom of the form)</label>
              <Select value={bucket} onChange={setBucket}>
                <SelectOption value="">Select a bucket</SelectOption>
                {buckets.map((name) => (
                  <SelectOption key={name} value={name}>
                    {name}
                  </SelectOption>
                ))}
              </Select>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpenForm(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpenForm(false)}>Create key</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openSmall} onOpenChange={setOpenSmall} size="destructive">
        <DialogContent>
          <DialogHeader>
            <div className="min-w-0 flex-1">
              <DialogTitle>Delete bucket</DialogTitle>
              <DialogDescription>This cannot be undone.</DialogDescription>
            </div>
          </DialogHeader>
          <DialogBody>Short content — footer should sit at the bottom on mobile.</DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpenSmall(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => setOpenSmall(false)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<Preview />);

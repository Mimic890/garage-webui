import * as React from 'react';
import { Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { IconTile } from '@/components/ui/icon-tile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

interface DeleteBucketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bucketName: string;
  objectCount: number;
  onEmptyBucket: () => Promise<void>;
  onDeleteBucket: () => Promise<void>;
}

export function DeleteBucketDialog({
  open,
  onOpenChange,
  bucketName,
  objectCount,
  onEmptyBucket,
  onDeleteBucket,
}: DeleteBucketDialogProps) {
  const [value, setValue] = React.useState('');
  const [confirmed, setConfirmed] = React.useState(false);
  const [highlight, setHighlight] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState('');
  const [error, setError] = React.useState('');

  const isEmpty = objectCount === 0;
  const matches = value === bucketName;

  React.useEffect(() => {
    if (!open) {
      setValue('');
      setConfirmed(false);
      setHighlight(false);
      setLoading(false);
      setStatus('');
      setError('');
    }
  }, [open]);

  const submit = async () => {
    if (!matches || loading) return;

    if (!isEmpty && !confirmed) {
      setHighlight(true);
      return;
    }

    setLoading(true);
    setError('');

    if (!isEmpty) {
      setStatus('Deleting objects…');
      try {
        await onEmptyBucket();
      } catch {
        setError('Failed to delete objects in the bucket.');
        setLoading(false);
        setStatus('');
        return;
      }
    }

    setStatus('Deleting bucket…');
    try {
      await onDeleteBucket();
    } catch {
      setError('Failed to delete the bucket.');
      setLoading(false);
      setStatus('');
      return;
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} size="destructive">
      <DialogContent>
        <DialogHeader>
          <IconTile icon={<Trash2 />} tone="destructive" size="md" />
          <div className="flex-1">
            <DialogTitle>Delete bucket &ldquo;{bucketName}&rdquo;?</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </div>
        </DialogHeader>
        <DialogBody className="space-y-4">
          {/* Data confirmation checkbox */}
          <label
            className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 transition-colors ${
              isEmpty
                ? 'border-[var(--border)] opacity-50 cursor-not-allowed'
                : highlight && !confirmed
                  ? 'border-[var(--destructive)] bg-[var(--destructive)]/5'
                  : 'border-[var(--border)] cursor-pointer'
            }`}
          >
            <Checkbox
              checked={confirmed}
              disabled={isEmpty}
              onCheckedChange={(c) => {
                setConfirmed(c);
                if (c) setHighlight(false);
              }}
              className="mt-0.5"
            />
            <span className={`text-[13.5px] select-none ${isEmpty ? 'text-[var(--muted-foreground)]' : ''}`}>
              Delete all data in the bucket permanently
              {!isEmpty && (
                <span className="text-[var(--muted-foreground)]">
                  {' '}({objectCount.toLocaleString()} object{objectCount === 1 ? '' : 's'})
                </span>
              )}
            </span>
          </label>
          {highlight && !confirmed && (
            <p className="text-[13px] text-[var(--destructive)]">
              Please confirm deletion of bucket data first.
            </p>
          )}

          {/* Confirmation text input */}
          <div className="space-y-2">
            <p className="text-[13.5px] text-[var(--muted-foreground)]">
              To confirm, type{' '}
              <code className="rounded bg-[var(--surface-sunken)] px-1 py-0.5 font-mono text-[13px] text-[var(--foreground)]">
                {bucketName}
              </code>{' '}
              below.
            </p>
            <Input
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder={bucketName}
              aria-label={`Type ${bucketName} to confirm`}
            />
          </div>

          {error && (
            <p className="text-[13px] text-[var(--destructive)]">{error}</p>
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={submit}
            disabled={!matches || loading}
          >
            {loading ? status || 'Working…' : 'Delete bucket'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Bucket } from '@/types';

interface DeleteBucketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bucket: Bucket | null;
  onDeleteBucket: (name: string) => Promise<boolean>;
}

export function DeleteBucketDialog({ open, onOpenChange, bucket, onDeleteBucket }: DeleteBucketDialogProps) {
  const handleDelete = async () => {
    if (!bucket) return;

    const success = await onDeleteBucket(bucket.name);
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Bucket</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{bucket?.name}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

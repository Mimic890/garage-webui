import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { S3Object } from '@/types';

interface DeleteObjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  object: S3Object | null;
  onDeleteObject: (key: string) => Promise<boolean>;
}

export function DeleteObjectDialog({ open, onOpenChange, object, onDeleteObject }: DeleteObjectDialogProps) {
  const handleDelete = async () => {
    if (!object) return;

    const success = await onDeleteObject(object.key);
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Object</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{object?.key}"? This action cannot be undone.
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

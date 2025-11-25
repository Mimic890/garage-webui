import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface CreateBucketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateBucket: (name: string) => Promise<boolean>;
}

export function CreateBucketDialog({ open, onOpenChange, onCreateBucket }: CreateBucketDialogProps) {
  const [bucketName, setBucketName] = useState('');

  const handleCreate = async () => {
    if (!bucketName) {
      toast.error('Please enter a bucket name');
      return;
    }

    const success = await onCreateBucket(bucketName);
    if (success) {
      setBucketName('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              value={bucketName}
              onChange={(e) => setBucketName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreate();
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Must be unique and follow DNS naming conventions
            </p>
          </div>
        </div>
        <DialogFooter className="space-y-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant={!bucketName ? 'default_disabled' : 'default'}
            onClick={handleCreate}
            disabled={!bucketName}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

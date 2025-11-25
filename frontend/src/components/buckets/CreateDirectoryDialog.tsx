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

interface CreateDirectoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPath: string;
  onCreateDirectory: (name: string) => Promise<boolean>;
}

export function CreateDirectoryDialog({ open, onOpenChange, currentPath, onCreateDirectory }: CreateDirectoryDialogProps) {
  const [dirName, setDirName] = useState('');

  const handleCreate = async () => {
    if (!dirName) {
      toast.error('Please enter a directory name');
      return;
    }

    const success = await onCreateDirectory(dirName);
    if (success) {
      setDirName('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              value={dirName}
              onChange={(e) => setDirName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreate();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!dirName}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

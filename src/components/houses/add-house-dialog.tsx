'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface AddHouseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  createdBy: string;
}

export function AddHouseDialog({
  open,
  onOpenChange,
  schoolId,
  createdBy,
}: AddHouseDialogProps): React.JSX.Element {
  const [name, setName] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const addHouse = useMutation(api.houses.addHouse);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter the house name');
      return;
    }

    if (!code.trim()) {
      toast.error('Please enter the house code');
      return;
    }

    setIsLoading(true);

    try {
      await addHouse({
        schoolId,
        name: name.trim(),
        code: code.trim(),
        createdBy,
      });

      toast.success('House added successfully');
      onOpenChange(false);
      setName('');
      setCode('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add house');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add House</DialogTitle>
          <DialogDescription>
            Create a new house for your school. Students and teachers can be assigned to houses (e.g., for competitions or pastoral groups).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Jubilee, Ambassadors"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">Code *</Label>
            <Input
              id="code"
              placeholder="e.g., JUB, AMB"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
              maxLength={6}
              required
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add House
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

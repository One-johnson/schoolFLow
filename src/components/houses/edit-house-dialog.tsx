'use client';

import { useState, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';
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

interface House {
  _id: Id<'houses'>;
  schoolId: string;
  name: string;
  code: string;
  sortOrder?: number;
}

interface EditHouseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  house: House | null;
  updatedBy: string;
}

export function EditHouseDialog({
  open,
  onOpenChange,
  house,
  updatedBy,
}: EditHouseDialogProps): React.JSX.Element {
  const [name, setName] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const updateHouse = useMutation(api.houses.updateHouse);

  useEffect(() => {
    if (house) {
      setName(house.name);
      setCode(house.code);
    }
  }, [house]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!house) return;

    if (!name.trim()) {
      toast.error('Please enter the house name');
      return;
    }

    if (!code.trim()) {
      toast.error('House code must be at least 1 character');
      return;
    }

    setIsLoading(true);

    try {
      await updateHouse({
        houseId: house._id,
        name: name.trim(),
        code: code.trim(),
        updatedBy,
      });

      toast.success('House updated successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update house');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit House</DialogTitle>
          <DialogDescription>
            Update the house details.
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
              Update House
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

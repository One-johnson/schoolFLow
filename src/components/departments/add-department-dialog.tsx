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

interface AddDepartmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  createdBy: string;
}

export function AddDepartmentDialog({
  open,
  onOpenChange,
  schoolId,
  createdBy,
}: AddDepartmentDialogProps): React.JSX.Element {
  const [name, setName] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const addDepartment = useMutation(api.departments.addDepartment);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter the department name');
      return;
    }

    if (!code.trim()) {
      toast.error('Please enter the department code');
      return;
    }

    if (code.trim().length < 2) {
      toast.error('Department code must be 2-3 characters');
      return;
    }

    setIsLoading(true);

    try {
      await addDepartment({
        schoolId,
        name: name.trim(),
        code: code.trim(),
        createdBy,
      });

      toast.success('Department added successfully');
      onOpenChange(false);
      setName('');
      setCode('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add department');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Department</DialogTitle>
          <DialogDescription>
            Create a new department for your school. The code is used for subject codes (e.g., PR for Primary).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Primary, Junior High"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">Code (2-3 chars) *</Label>
            <Input
              id="code"
              placeholder="e.g., PR, JH"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 3))}
              maxLength={3}
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
              Add Department
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { JSX, useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface AddCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
}

export function AddCategoryDialog({
  open,
  onOpenChange,
  schoolId,
}: AddCategoryDialogProps): React.JSX.Element {
  const { user } = useAuth();
  const [categoryName, setCategoryName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isOptional, setIsOptional] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const createCategory = useMutation(api.feeCategories.createFeeCategory);

  const handleSubmit = async (): Promise<void> => {
    if (!categoryName.trim()) {
      toast.error('Please enter category name');
      return;
    }

    if (!user?.email) {
      toast.error('User not authenticated');
      return;
    }

    setLoading(true);
    try {
      await createCategory({
        schoolId,
        categoryName: categoryName.trim(),
        description: description.trim() || undefined,
        isOptional,
        createdBy: user.email,
      });

      toast.success('Fee category created successfully');
      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to create fee category');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = (): void => {
    setCategoryName('');
    setDescription('');
    setIsOptional(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Fee Category</DialogTitle>
          <DialogDescription>
            Create a new fee category (e.g., Tuition, Transport, Library)
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="categoryName">Category Name *</Label>
            <Input
              id="categoryName"
              placeholder="e.g., Tuition, Transport, Library"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of this fee category"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="isOptional">Optional Fee</Label>
              <p className="text-sm text-muted-foreground">
                Is this fee optional for students?
              </p>
            </div>
            <Switch
              id="isOptional"
              checked={isOptional}
              onCheckedChange={setIsOptional}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creating...' : 'Create Category'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

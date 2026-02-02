'use client';

import { useState, useEffect, JSX } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface EditCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: {
    _id: Id<'feeCategories'>;
    categoryName: string;
    description?: string;
    isOptional: boolean;
    status: 'active' | 'inactive';
  } | null;
}

export function EditCategoryDialog({
  open,
  onOpenChange,
  category,
}: EditCategoryDialogProps): React.JSX.Element {
  const [categoryName, setCategoryName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isOptional, setIsOptional] = useState<boolean>(false);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [loading, setLoading] = useState<boolean>(false);

  const updateCategory = useMutation(api.feeCategories.updateFeeCategory);

  useEffect(() => {
    if (category) {
      setCategoryName(category.categoryName);
      setDescription(category.description || '');
      setIsOptional(category.isOptional);
      setStatus(category.status);
    }
  }, [category]);

  const handleSubmit = async (): Promise<void> => {
    if (!categoryName.trim()) {
      toast.error('Please enter category name');
      return;
    }

    if (!category) {
      toast.error('No category selected');
      return;
    }

    setLoading(true);
    try {
      await updateCategory({
        categoryId: category._id,
        categoryName: categoryName.trim(),
        description: description.trim() || undefined,
        isOptional,
        status,
      });

      toast.success('Category updated successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to update category');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Fee Category</DialogTitle>
          <DialogDescription>
            Update the fee category information
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

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as 'active' | 'inactive')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
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
            {loading ? 'Updating...' : 'Update Category'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

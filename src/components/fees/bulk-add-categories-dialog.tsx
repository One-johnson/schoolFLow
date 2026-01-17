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
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

interface AddCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
}

interface Category {
  id: string;
  categoryName: string;
  description: string;
  isOptional: boolean;
}

export function BulkAddCategoriesDialog({
  open,
  onOpenChange,
  schoolId,
}: AddCategoryDialogProps): JSX.Element {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([
    { id: '1', categoryName: '', description: '', isOptional: false },
  ]);
  const [loading, setLoading] = useState<boolean>(false);

  const bulkCreateCategories = useMutation(api.feeCategories.bulkCreateCategories);

  const addCategory = (): void => {
    const newId = String(Date.now());
    setCategories([
      ...categories,
      { id: newId, categoryName: '', description: '', isOptional: false },
    ]);
  };

  const removeCategory = (id: string): void => {
    if (categories.length > 1) {
      setCategories(categories.filter((cat) => cat.id !== id));
    }
  };

  const updateCategory = (id: string, field: keyof Category, value: string | boolean): void => {
    setCategories(
      categories.map((cat) =>
        cat.id === id ? { ...cat, [field]: value } : cat
      )
    );
  };

  const handleSubmit = async (): Promise<void> => {
    // Validation
    const validCategories = categories.filter((cat) => cat.categoryName.trim());
    
    if (validCategories.length === 0) {
      toast.error('Please enter at least one category name');
      return;
    }

    if (!user?.email) {
      toast.error('User not authenticated');
      return;
    }

    setLoading(true);
    try {
      await bulkCreateCategories({
        schoolId,
        categories: validCategories.map((cat) => ({
          categoryName: cat.categoryName.trim(),
          description: cat.description.trim() || undefined,
          isOptional: cat.isOptional,
        })),
        createdBy: user.email,
      });

      toast.success(`Successfully created ${validCategories.length} fee categories`);
      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to create fee categories');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = (): void => {
    setCategories([{ id: '1', categoryName: '', description: '', isOptional: false }]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Add Fee Categories</DialogTitle>
          <DialogDescription>
            Add multiple fee categories at once (e.g., Tuition, Transport, Library)
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 py-4">
            {categories.map((category, index) => (
              <div key={category.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">
                    Category {index + 1}
                  </Label>
                  {categories.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCategory(category.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`categoryName-${category.id}`}>
                    Category Name *
                  </Label>
                  <Input
                    id={`categoryName-${category.id}`}
                    placeholder="e.g., Tuition, Transport, Library"
                    value={category.categoryName}
                    onChange={(e) =>
                      updateCategory(category.id, 'categoryName', e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`description-${category.id}`}>
                    Description
                  </Label>
                  <Textarea
                    id={`description-${category.id}`}
                    placeholder="Brief description"
                    value={category.description}
                    onChange={(e) =>
                      updateCategory(category.id, 'description', e.target.value)
                    }
                    rows={2}
                  />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label htmlFor={`isOptional-${category.id}`}>
                      Optional Fee
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Is this fee optional for students?
                    </p>
                  </div>
                  <Switch
                    id={`isOptional-${category.id}`}
                    checked={category.isOptional}
                    onCheckedChange={(checked) =>
                      updateCategory(category.id, 'isOptional', checked)
                    }
                  />
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addCategory}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Another Category
            </Button>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creating...' : `Create ${categories.filter(c => c.categoryName.trim()).length} Categories`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

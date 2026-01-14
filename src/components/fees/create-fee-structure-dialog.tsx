'use client';

import { useState, useCallback, useMemo, JSX } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Plus, Trash2, DollarSign } from 'lucide-react';

interface CreateFeeStructureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  createdBy: string;
}

interface FeeItem {
  categoryId: string;
  categoryName: string;
  amount: number;
}

export function CreateFeeStructureDialog({
  open,
  onOpenChange,
  schoolId,
  createdBy,
}: CreateFeeStructureDialogProps): JSX.Element {
  const [structureName, setStructureName] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [feeItems, setFeeItems] = useState<FeeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const categories = useQuery(api.feeCategories.getCategoriesBySchool, { schoolId });
  const classes = useQuery(api.classes.getClassesBySchool, { schoolId });
  const createStructure = useMutation(api.feeStructures.createFeeStructure);

  const availableCategories = useMemo(() => {
    if (!categories) return [];
    const selectedIds = new Set(feeItems.map(item => item.categoryId));
    return categories.filter(cat => cat.status === 'active' && !selectedIds.has(cat._id));
  }, [categories, feeItems]);

  const totalAmount = useMemo(() => {
    return feeItems.reduce((sum, item) => sum + item.amount, 0);
  }, [feeItems]);

  const handleAddFeeItem = useCallback(() => {
    if (availableCategories.length === 0) {
      toast.error('No more categories available');
      return;
    }
    const firstCategory = availableCategories[0];
    setFeeItems(prev => [
      ...prev,
      {
        categoryId: firstCategory._id,
        categoryName: firstCategory.categoryName,
        amount: 0,
      },
    ]);
  }, [availableCategories]);

  const handleRemoveFeeItem = useCallback((index: number) => {
    setFeeItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleCategoryChange = useCallback((index: number, categoryId: string) => {
    const category = categories?.find(cat => cat._id === categoryId);
    if (!category) return;

    setFeeItems(prev => prev.map((item, i) => 
      i === index 
        ? { ...item, categoryId: category._id, categoryName: category.categoryName }
        : item
    ));
  }, [categories]);

  const handleAmountChange = useCallback((index: number, amount: string) => {
    const numAmount = parseFloat(amount) || 0;
    setFeeItems(prev => prev.map((item, i) => 
      i === index ? { ...item, amount: numAmount } : item
    ));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!structureName.trim()) {
      toast.error('Please enter structure name');
      return;
    }

    if (feeItems.length === 0) {
      toast.error('Please add at least one fee category');
      return;
    }

    if (feeItems.some(item => item.amount <= 0)) {
      toast.error('All fee amounts must be greater than 0');
      return;
    }

    setLoading(true);

    try {
      await createStructure({
        schoolId,
        structureName: structureName.trim(),
        classId: selectedClass || undefined,
        department: selectedDepartment ? selectedDepartment as 'creche' | 'kindergarten' | 'primary' | 'junior_high' : undefined,
        fees: JSON.stringify(feeItems),
        totalAmount,
        dueDate: dueDate || undefined,
        createdBy,
      });

      toast.success('Fee structure created successfully');
      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to create fee structure');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [
    structureName,
    feeItems,
    totalAmount,
    schoolId,
    selectedClass,
    selectedDepartment,
    dueDate,
    createdBy,
    createStructure,
    onOpenChange,
  ]);

  const resetForm = (): void => {
    setStructureName('');
    setSelectedClass('');
    setSelectedDepartment('');
    setDueDate('');
    setFeeItems([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Fee Structure</DialogTitle>
          <DialogDescription>
            Create a template with multiple fee categories that can be applied to students
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Structure Name */}
          <div className="space-y-2">
            <Label htmlFor="structureName">Structure Name *</Label>
            <Input
              id="structureName"
              placeholder="e.g., Grade 1 Term 1 Fees"
              value={structureName}
              onChange={(e) => setStructureName(e.target.value)}
            />
          </div>

          {/* Class Selection */}
          <div className="space-y-2">
            <Label htmlFor="class">Class (Optional)</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {classes?.map((cls) => (
                  <SelectItem key={cls._id} value={cls.classCode}>
                    {cls.className}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Department Selection */}
          <div className="space-y-2">
            <Label htmlFor="department">Department (Optional)</Label>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="creche">Crèche</SelectItem>
                <SelectItem value="kindergarten">Kindergarten</SelectItem>
                <SelectItem value="primary">Primary</SelectItem>
                <SelectItem value="junior_high">Junior High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date (Optional)</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {/* Fee Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Fee Categories *</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddFeeItem}
                disabled={availableCategories.length === 0}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </div>

            {feeItems.length === 0 ? (
              <div className="text-center py-8 border rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  No categories added yet. Click "Add Category" to start.
                </p>
              </div>
            ) : (
              <div className="space-y-3 border rounded-lg p-4">
                {feeItems.map((item, index) => (
                  <div key={index} className="flex items-end gap-2">
                    <div className="flex-1 space-y-2">
                      <Label>Category</Label>
                      <Select
                        value={item.categoryId}
                        onValueChange={(value) => handleCategoryChange(index, value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories
                            ?.filter(
                              cat =>
                                cat.status === 'active' &&
                                (cat._id === item.categoryId ||
                                  !feeItems.some(fi => fi.categoryId === cat._id))
                            )
                            .map((cat) => (
                              <SelectItem key={cat._id} value={cat._id}>
                                {cat.categoryName}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-40 space-y-2">
                      <Label>Amount (GHS)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={item.amount || ''}
                        onChange={(e) => handleAmountChange(index, e.target.value)}
                      />
                    </div>

                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      onClick={() => handleRemoveFeeItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total Amount Display */}
          {feeItems.length > 0 && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  <span className="font-medium">Total Amount:</span>
                </div>
                <span className="text-2xl font-bold">
                  GHS {totalAmount.toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {feeItems.length} fee {feeItems.length === 1 ? 'category' : 'categories'} included
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || feeItems.length === 0}>
              {loading ? 'Creating...' : 'Create Structure'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

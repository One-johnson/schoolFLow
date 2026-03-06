'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import type { Id } from '@/../convex/_generated/dataModel';
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
import { DatePicker } from '@/components/ui/date-picker';
import { toast } from 'sonner';
import { Plus, Trash2, DollarSign } from 'lucide-react';

interface FeeItem {
  categoryId: string;
  categoryName: string;
  amount: number;
}

export interface FeeStructureForEdit {
  _id: Id<'feeStructures'>;
  structureName: string;
  structureCode: string;
  classId?: string;
  departmentId?: Id<'departments'>;
  fees: string;
  totalAmount: number;
  dueDate?: string;
  status: 'active' | 'inactive';
}

interface EditFeeStructureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  structure: FeeStructureForEdit | null;
}

export function EditFeeStructureDialog({
  open,
  onOpenChange,
  schoolId,
  structure,
}: EditFeeStructureDialogProps): React.JSX.Element | null {
  const [structureName, setStructureName] = useState<string>('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('none');
  const [selectedClassCode, setSelectedClassCode] = useState<string>('none');
  const [dueDate, setDueDate] = useState<string>('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [feeItems, setFeeItems] = useState<FeeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const categories = useQuery(api.feeCategories.getCategoriesBySchool, { schoolId });
  const departments = useQuery(api.departments.getDepartmentsBySchool, schoolId ? { schoolId } : 'skip');
  const departmentClasses = useQuery(
    api.classes.getClassesByDepartment,
    selectedDepartmentId && selectedDepartmentId !== 'none'
      ? { departmentId: selectedDepartmentId as Id<'departments'> }
      : 'skip'
  );
  const updateStructure = useMutation(api.feeStructures.updateFeeStructure);

  useEffect(() => {
    if (structure && open) {
      setStructureName(structure.structureName);
      setSelectedDepartmentId(structure.departmentId ?? 'none');
      setSelectedClassCode(structure.classId ?? 'none');
      setDueDate(structure.dueDate ?? '');
      setStatus(structure.status);
      try {
        const parsed = JSON.parse(structure.fees) as FeeItem[];
        setFeeItems(Array.isArray(parsed) ? parsed : []);
      } catch {
        setFeeItems([]);
      }
    }
  }, [structure, open]);

  const availableCategories = useMemo(() => {
    if (!categories) return [];
    const selectedIds = new Set(feeItems.map(item => item.categoryId));
    return categories.filter(cat => cat.status === 'active' && !selectedIds.has(cat._id));
  }, [categories, feeItems]);

  const totalAmount = useMemo(() => {
    return feeItems.reduce((sum, item) => sum + item.amount, 0);
  }, [feeItems]);

  const handleDepartmentChange = useCallback((value: string) => {
    setSelectedDepartmentId(value);
    setSelectedClassCode('none');
  }, []);

  const handleAddFeeItem = useCallback(() => {
    if (availableCategories.length === 0) {
      toast.error('No more categories available');
      return;
    }
    const first = availableCategories[0];
    setFeeItems(prev => [...prev, { categoryId: first._id, categoryName: first.categoryName, amount: 0 }]);
  }, [availableCategories]);

  const handleCategoryChange = useCallback((index: number, categoryId: string) => {
    const category = categories?.find(cat => cat._id === categoryId);
    if (!category) return;
    setFeeItems(prev => prev.map((item, i) =>
      i === index ? { ...item, categoryId: category._id, categoryName: category.categoryName } : item
    ));
  }, [categories]);

  const handleAmountChange = useCallback((index: number, amount: string) => {
    const numAmount = parseFloat(amount) || 0;
    setFeeItems(prev => prev.map((item, i) =>
      i === index ? { ...item, amount: numAmount } : item
    ));
  }, []);

  const handleRemoveFeeItem = useCallback((index: number) => {
    setFeeItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!structure) return;

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
      await updateStructure({
        structureId: structure._id,
        structureName: structureName.trim(),
        departmentId: selectedDepartmentId && selectedDepartmentId !== 'none' ? (selectedDepartmentId as Id<'departments'>) : undefined,
        classId: selectedClassCode && selectedClassCode !== 'none' ? selectedClassCode : undefined,
        fees: JSON.stringify(feeItems),
        totalAmount,
        dueDate: dueDate || undefined,
        status,
      });
      toast.success('Fee structure updated successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to update fee structure');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [
    structure,
    structureName,
    feeItems,
    totalAmount,
    selectedDepartmentId,
    selectedClassCode,
    dueDate,
    status,
    updateStructure,
    onOpenChange,
  ]);

  if (!structure) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Fee Structure</DialogTitle>
          <DialogDescription>
            Update structure name, due date, class, and fee categories
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-structureName">Structure Name *</Label>
                <Input
                  id="edit-structureName"
                  placeholder="e.g., Grade 1 Term 1 Fees"
                  value={structureName}
                  onChange={(e) => setStructureName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Due Date (Optional)</Label>
                <DatePicker
                  value={dueDate}
                  onChange={setDueDate}
                  placeholder="Pick due date"
                  disableFuture={false}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as 'active' | 'inactive')}>
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

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={selectedDepartmentId} onValueChange={handleDepartmentChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {departments?.map((dept) => (
                      <SelectItem key={dept._id} value={dept._id}>
                        {dept.name} ({dept.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Class</Label>
                <Select value={selectedClassCode} onValueChange={setSelectedClassCode}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {departmentClasses?.map((cls) => (
                      <SelectItem key={cls._id} value={cls.classCode}>
                        {cls.className}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedDepartmentId === 'none' && (
                  <p className="text-xs text-muted-foreground">Select a department to see classes</p>
                )}
              </div>
            </div>
          </div>

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
            <div className="space-y-3 border rounded-lg p-4">
              {feeItems.map((item, index) => (
                <div key={index} className="flex items-end gap-2">
                  <div className="flex-1 space-y-2">
                    <Label className="text-xs">Category</Label>
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
                              (cat._id === item.categoryId || !feeItems.some(fi => fi.categoryId === cat._id))
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
                    <Label className="text-xs">Amount (GHS)</Label>
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
          </div>

          {feeItems.length > 0 && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  <span className="font-medium">Total Amount:</span>
                </div>
                <span className="text-2xl font-bold">GHS {totalAmount.toFixed(2)}</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || feeItems.length === 0}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

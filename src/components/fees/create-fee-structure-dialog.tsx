'use client';

import { useState, useCallback, useMemo, JSX } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DatePicker } from '@/components/ui/date-picker';
import { ScrollArea } from '@/components/ui/scroll-area';
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
}: CreateFeeStructureDialogProps): React.JSX.Element {
  const [structureName, setStructureName] = useState<string>('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('none');
  const [dueDate, setDueDate] = useState<string>('');
  /** When a department is selected: one structure for whole department vs one per class */
  const [applyScope, setApplyScope] = useState<'whole_department' | 'specific_classes'>('whole_department');
  const [applyToAllClasses, setApplyToAllClasses] = useState<boolean>(false);
  const [selectedClassCodes, setSelectedClassCodes] = useState<Set<string>>(new Set());
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
  const createStructure = useMutation(api.feeStructures.createFeeStructure);

  const availableCategories = useMemo(() => {
    if (!categories) return [];
    const selectedIds = new Set(feeItems.map(item => item.categoryId));
    return categories.filter(cat => cat.status === 'active' && !selectedIds.has(cat._id));
  }, [categories, feeItems]);

  const totalAmount = useMemo(() => {
    return feeItems.reduce((sum, item) => sum + item.amount, 0);
  }, [feeItems]);

  // When department changes, clear class selection and default to whole department
  const handleDepartmentChange = useCallback((value: string) => {
    setSelectedDepartmentId(value);
    setApplyScope('whole_department');
    setApplyToAllClasses(false);
    setSelectedClassCodes(new Set());
  }, []);

  const handleApplyToAllChange = useCallback(
    (checked: boolean) => {
      setApplyToAllClasses(checked);
      if (checked && departmentClasses) {
        setSelectedClassCodes(new Set(departmentClasses.map(c => c.classCode)));
      } else {
        setSelectedClassCodes(new Set());
      }
    },
    [departmentClasses]
  );

  const handleClassToggle = useCallback((classCode: string, checked: boolean) => {
    setSelectedClassCodes(prev => {
      const next = new Set(prev);
      if (checked) next.add(classCode);
      else next.delete(classCode);
      return next;
    });
    setApplyToAllClasses(false);
  }, []);

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

  const getClassesToCreate = useCallback((): Array<{ classCode: string }> => {
    if (!selectedDepartmentId || selectedDepartmentId === 'none' || !departmentClasses?.length) {
      return [];
    }
    if (applyScope === 'whole_department') {
      return []; // One structure for whole department (no classId)
    }
    if (applyToAllClasses) {
      return departmentClasses.map(c => ({ classCode: c.classCode }));
    }
    return Array.from(selectedClassCodes).map(classCode => ({ classCode }));
  }, [selectedDepartmentId, departmentClasses, applyScope, applyToAllClasses, selectedClassCodes]);

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

    const departmentIdResolved =
      selectedDepartmentId && selectedDepartmentId !== 'none'
        ? (selectedDepartmentId as Id<'departments'>)
        : undefined;
    const classesToCreate = getClassesToCreate();

    if (
      departmentIdResolved &&
      applyScope === 'specific_classes' &&
      classesToCreate.length === 0
    ) {
      toast.error('Select at least one class or "Apply to all classes in department"');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        schoolId,
        structureName: structureName.trim(),
        departmentId: departmentIdResolved,
        fees: JSON.stringify(feeItems),
        totalAmount,
        dueDate: dueDate || undefined,
        createdBy,
      };

      if (classesToCreate.length === 0) {
        await createStructure({ ...payload });
        const msg = departmentIdResolved
          ? 'Fee structure created for whole department (one structure for all classes)'
          : 'Fee structure created successfully';
        toast.success(msg);
      } else {
        let created = 0;
        for (const { classCode } of classesToCreate) {
          await createStructure({ ...payload, classId: classCode });
          created++;
        }
        toast.success(`Fee structure created for ${created} class${created !== 1 ? 'es' : ''}`);
      }

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
    selectedDepartmentId,
    applyScope,
    dueDate,
    createdBy,
    getClassesToCreate,
    createStructure,
    onOpenChange,
  ]);

  const resetForm = (): void => {
    setStructureName('');
    setSelectedDepartmentId('none');
    setDueDate('');
    setApplyScope('whole_department');
    setApplyToAllClasses(false);
    setSelectedClassCodes(new Set());
    setFeeItems([]);
  };

  const hasDepartmentSelected = selectedDepartmentId && selectedDepartmentId !== 'none';

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
          {/* Two-column grid: (Structure name + Due date) | (Department + Classes) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Column 1: Structure name and Due date */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="structureName">Structure Name *</Label>
                <Input
                  id="structureName"
                  placeholder="e.g., Grade 1 Term 1 Fees"
                  value={structureName}
                  onChange={(e) => setStructureName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date (Optional)</Label>
                <DatePicker
                  id="dueDate"
                  value={dueDate}
                  onChange={setDueDate}
                  placeholder="Pick due date"
                  disableFuture={false}
                  className="w-full"
                />
              </div>
            </div>

            {/* Column 2: Department and Classes */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
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

              {hasDepartmentSelected && (
                <div className="space-y-2">
                  <Label>Apply to</Label>
                  <div className="border rounded-lg p-3 space-y-3">
                    <RadioGroup
                      value={applyScope}
                      onValueChange={(v) => {
                        setApplyScope(v as 'whole_department' | 'specific_classes');
                        if (v === 'whole_department') {
                          setApplyToAllClasses(false);
                          setSelectedClassCodes(new Set());
                        }
                      }}
                      className="space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="whole_department" id="whole_department" />
                        <label
                          htmlFor="whole_department"
                          className="text-sm font-medium leading-none cursor-pointer"
                        >
                          Whole department (one structure for all classes)
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="specific_classes" id="specific_classes" />
                        <label
                          htmlFor="specific_classes"
                          className="text-sm font-medium leading-none cursor-pointer"
                        >
                          Specific classes (one structure per class)
                        </label>
                      </div>
                    </RadioGroup>
                    {applyScope === 'specific_classes' && (
                      <>
                        <div className="flex items-center space-x-2 pt-1 border-t">
                          <Checkbox
                            id="applyToAll"
                            checked={
                              applyToAllClasses ||
                              (departmentClasses &&
                                departmentClasses.length > 0 &&
                                selectedClassCodes.size === departmentClasses.length)
                            }
                            onCheckedChange={(c) => handleApplyToAllChange(c === true)}
                          />
                          <label
                            htmlFor="applyToAll"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Apply to all classes in department
                          </label>
                        </div>
                        {departmentClasses && departmentClasses.length > 0 && (
                          <ScrollArea className="h-[120px] rounded border p-2">
                            <div className="space-y-2">
                              {departmentClasses.map((cls) => (
                                <div key={cls._id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`class-${cls.classCode}`}
                                    checked={selectedClassCodes.has(cls.classCode)}
                                    onCheckedChange={(c) =>
                                      handleClassToggle(cls.classCode, c === true)
                                    }
                                  />
                                  <label
                                    htmlFor={`class-${cls.classCode}`}
                                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    {cls.className}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        )}
                        {departmentClasses?.length === 0 && (
                          <p className="text-sm text-muted-foreground">
                            No active classes in this department.
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Fee Categories - unchanged layout */}
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

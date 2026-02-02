'use client';

import { useState, useCallback, JSX } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { toast } from 'sonner';

interface AddDiscountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  createdBy: string;
}

export function AddDiscountDialog({
  open,
  onOpenChange,
  schoolId,
  createdBy,
}: AddDiscountDialogProps): React.JSX.Element {
  const [discountName, setDiscountName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<string>('');
  const [reason, setReason] = useState<'scholarship' | 'sibling' | 'merit' | 'need_based' | 'other'>('scholarship');
  const [applicableTo, setApplicableTo] = useState<'all' | 'specific_categories'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [hasEndDate, setHasEndDate] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const createDiscount = useMutation(api.feeDiscounts.createDiscount);
  const categories = useQuery(
    api.feeCategories.getActiveCategoriesBySchool,
    { schoolId }
  );

  const handleSubmit = useCallback(async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!discountName || !discountValue) {
      toast.error('Please fill in all required fields');
      return;
    }

    const value = parseFloat(discountValue);
    if (isNaN(value) || value <= 0) {
      toast.error('Please enter a valid discount value');
      return;
    }

    if (discountType === 'percentage' && value > 100) {
      toast.error('Percentage discount cannot exceed 100%');
      return;
    }

    setLoading(true);

    try {
      await createDiscount({
        schoolId,
        discountName,
        description: description || undefined,
        discountType,
        discountValue: value,
        applicableTo,
        reason,
        startDate: startDate || undefined,
        endDate: hasEndDate ? endDate : undefined,
        createdBy,
      });

      toast.success('Discount created successfully');

      // Reset form
      setDiscountName('');
      setDescription('');
      setDiscountValue('');
      setStartDate('');
      setEndDate('');
      setHasEndDate(false);

      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to create discount');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [
    discountName,
    description,
    discountType,
    discountValue,
    reason,
    applicableTo,
    startDate,
    endDate,
    hasEndDate,
    schoolId,
    createdBy,
    createDiscount,
    onOpenChange,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Fee Discount</DialogTitle>
          <DialogDescription>
            Create a discount for scholarships, sibling discounts, or merit-based reductions
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Discount Name */}
          <div className="space-y-2">
            <Label htmlFor="discountName">Discount Name *</Label>
            <Input
              id="discountName"
              value={discountName}
              onChange={(e) => setDiscountName(e.target.value)}
              placeholder="e.g., Sibling Discount, Merit Scholarship"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={2}
            />
          </div>

          {/* Discount Type & Value */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="discountType">Discount Type *</Label>
              <Select
                value={discountType}
                onValueChange={(value) => setDiscountType(value as 'percentage' | 'fixed')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount (GHS)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discountValue">
                {discountType === 'percentage' ? 'Percentage (%)' : 'Amount (GHS)'} *
              </Label>
              <Input
                id="discountValue"
                type="number"
                step="0.01"
                min="0"
                max={discountType === 'percentage' ? '100' : undefined}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === 'percentage' ? 'e.g., 20' : 'e.g., 500'}
                required
              />
            </div>
          </div>

          {/* Reason & Applicable To */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason *</Label>
              <Select
                value={reason}
                onValueChange={(value) => setReason(value as typeof reason)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scholarship">Scholarship</SelectItem>
                  <SelectItem value="sibling">Sibling Discount</SelectItem>
                  <SelectItem value="merit">Merit-Based</SelectItem>
                  <SelectItem value="need_based">Need-Based</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="applicableTo">Applicable To *</Label>
              <Select
                value={applicableTo}
                onValueChange={(value) => setApplicableTo(value as typeof applicableTo)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Fee Categories</SelectItem>
                  <SelectItem value="specific_categories">Specific Categories</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date (Optional)</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="hasEndDate">Set End Date</Label>
              <Switch
                checked={hasEndDate}
                onCheckedChange={setHasEndDate}
              />
            </div>
            {hasEndDate && (
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
              />
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Discount'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

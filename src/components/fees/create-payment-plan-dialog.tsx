'use client';

import { useState, useCallback, useEffect, JSX } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { toast } from 'sonner';
import { Calendar } from 'lucide-react';

interface CreatePaymentPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  createdBy: string;
}

export function CreatePaymentPlanDialog({
  open,
  onOpenChange,
  schoolId,
  createdBy,
}: CreatePaymentPlanDialogProps): JSX.Element {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [totalAmount, setTotalAmount] = useState<string>('');
  const [numberOfInstallments, setNumberOfInstallments] = useState<string>('3');
  const [frequency, setFrequency] = useState<'monthly' | 'quarterly' | 'custom'>('monthly');
  const [startDate, setStartDate] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [installmentAmount, setInstallmentAmount] = useState<string>('0.00');

  const students = useQuery(api.students.getStudentsBySchool, { schoolId });
  const categories = useQuery(api.feeCategories.getActiveCategoriesBySchool, { schoolId });
  const createPlan = useMutation(api.paymentPlans.createPaymentPlan);

  // Calculate installment amount
  useEffect(() => {
    const amount = parseFloat(totalAmount);
    const installments = parseInt(numberOfInstallments);

    if (!isNaN(amount) && !isNaN(installments) && installments > 0) {
      setInstallmentAmount((amount / installments).toFixed(2));
    } else {
      setInstallmentAmount('0.00');
    }
  }, [totalAmount, numberOfInstallments]);

  const handleSubmit = useCallback(async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!selectedStudentId || !selectedCategoryId || !totalAmount || !startDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(totalAmount);
    const installments = parseInt(numberOfInstallments);

    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid total amount');
      return;
    }

    if (isNaN(installments) || installments < 2 || installments > 12) {
      toast.error('Number of installments must be between 2 and 12');
      return;
    }

    const selectedStudent = students?.find((s) => s._id === selectedStudentId);
    const selectedCategory = categories?.find((c) => c._id === selectedCategoryId);

    if (!selectedStudent || !selectedCategory) {
      toast.error('Invalid student or category selection');
      return;
    }

    setLoading(true);

    try {
      await createPlan({
        schoolId,
        studentId: selectedStudent.studentId,
        studentName: `${selectedStudent.firstName} ${selectedStudent.lastName}`,
        classId: selectedStudent.classId,
        className: selectedStudent.className,
        categoryId: selectedCategory._id,
        categoryName: selectedCategory.categoryName,
        totalAmount: amount,
        numberOfInstallments: installments,
        frequency,
        startDate,
        createdBy,
      });

      toast.success('Payment plan created successfully');

      // Reset form
      setSelectedStudentId('');
      setSelectedCategoryId('');
      setTotalAmount('');
      setNumberOfInstallments('3');
      setStartDate('');

      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to create payment plan');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [
    selectedStudentId,
    selectedCategoryId,
    totalAmount,
    numberOfInstallments,
    frequency,
    startDate,
    students,
    categories,
    schoolId,
    createdBy,
    createPlan,
    onOpenChange,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Payment Plan</DialogTitle>
          <DialogDescription>
            Set up an installment payment plan for a student
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Student Selection */}
          <div className="space-y-2">
            <Label htmlFor="student">Student *</Label>
            <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {students?.map((student) => (
                  <SelectItem key={student._id} value={student._id}>
                    {student.firstName} {student.lastName} ({student.studentId}) - {student.className}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <Label htmlFor="category">Fee Category *</Label>
            <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select fee category" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((category) => (
                  <SelectItem key={category._id} value={category._id}>
                    {category.categoryName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Total Amount */}
          <div className="space-y-2">
            <Label htmlFor="totalAmount">Total Amount (GHS) *</Label>
            <Input
              id="totalAmount"
              type="number"
              step="0.01"
              min="0"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder="e.g., 5000"
              required
            />
          </div>

          {/* Number of Installments & Frequency */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="installments">Number of Installments *</Label>
              <Input
                id="installments"
                type="number"
                min="2"
                max="12"
                value={numberOfInstallments}
                onChange={(e) => setNumberOfInstallments(e.target.value)}
                required
              />
              <p className="text-sm text-muted-foreground">Between 2 and 12 installments</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency *</Label>
              <Select value={frequency} onValueChange={(value) => setFrequency(value as typeof frequency)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label htmlFor="startDate">First Payment Due Date *</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          {/* Installment Summary */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Total Amount:</span>
              <span>GHS {parseFloat(totalAmount || '0').toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Number of Installments:</span>
              <span>{numberOfInstallments}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Amount per Installment:</span>
              <span className="text-lg font-bold">GHS {installmentAmount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Frequency:</span>
              <span className="capitalize">{frequency}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              <Calendar className="mr-2 h-4 w-4" />
              {loading ? 'Creating...' : 'Create Payment Plan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

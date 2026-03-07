'use client';

import { useState, useEffect, useMemo } from 'react';
import { useMutation, useQuery } from 'convex/react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import { toast } from 'sonner';
interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  schoolAdminName: string;
}

/** Fee item from structure: category + due (read-only) + paid (editable) */
interface PaymentItem {
  id: string;
  categoryId: string;
  categoryName: string;
  amountDue: number;
  amountPaid: string;
}

interface StructureFeeEntry {
  categoryId: string;
  categoryName: string;
  amount: number;
}

export function RecordPaymentMultiDialog({
  open,
  onOpenChange,
  schoolId,
  schoolAdminName,
}: RecordPaymentDialogProps): React.JSX.Element {
  const { user } = useAuth();
  const [selectedStructureId, setSelectedStructureId] = useState<string>('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [items, setItems] = useState<PaymentItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [paidBy, setPaidBy] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState<boolean>(false);

  const structures = useQuery(api.feeStructures.getActiveStructuresBySchool, { schoolId });
  const classes = useQuery(api.classes.getClassesBySchool, { schoolId });
  const departments = useQuery(api.departments.getDepartmentsBySchool, { schoolId });

  const selectedStructure = useMemo(
    () => structures?.find((s) => s._id === selectedStructureId) ?? null,
    [structures, selectedStructureId]
  );

  const studentsByClass = useQuery(
    api.students.getStudentsByClass,
    selectedStructure?.classId ? { classId: selectedStructure.classId } : 'skip'
  );
  const studentsByDepartment = useQuery(
    api.students.getStudentsByDepartment,
    selectedStructure?.departmentId && !selectedStructure?.classId
      ? { schoolId, departmentId: selectedStructure.departmentId }
      : 'skip'
  );

  const students = useMemo(() => {
    if (!selectedStructure) return undefined;
    if (selectedStructure.classId) return studentsByClass;
    return studentsByDepartment;
  }, [selectedStructure, studentsByClass, studentsByDepartment]);

  const recordPayment = useMutation(api.feePayments.recordPayment);

  /** Only show structures that have class or department so we can narrow the list */
  const filterableStructures = useMemo(
    () =>
      structures?.filter(
        (s) => (s.classId && s.classId.trim() !== '') || s.departmentId
      ) ?? [],
    [structures]
  );

  const structureLabel = (structure: typeof selectedStructure): string => {
    if (!structure) return '';
    const parts = [structure.structureName];
    if (structure.classId && classes?.length) {
      const cls = classes.find((c) => c._id === structure.classId);
      if (cls) parts.push(`(${cls.className})`);
    }
    if (structure.departmentId && departments?.length && !structure.classId) {
      const dept = departments.find((d) => d._id === structure.departmentId);
      if (dept) parts.push(`(${dept.name})`);
    }
    return parts.join(' ');
  };

  useEffect(() => {
    if (!selectedStructure?.fees) {
      setItems([]);
      return;
    }
    try {
      const fees = JSON.parse(selectedStructure.fees) as StructureFeeEntry[];
      if (!Array.isArray(fees) || fees.length === 0) {
        setItems([]);
        return;
      }
      setItems(
        fees.map((f, i) => ({
          id: `item-${i}-${f.categoryId}`,
          categoryId: f.categoryId,
          categoryName: f.categoryName,
          amountDue: f.amount,
          amountPaid: '',
        }))
      );
    } catch {
      setItems([]);
    }
  }, [selectedStructure?._id, selectedStructure?.fees]);

  useEffect(() => {
    setSelectedStudentIds(new Set());
  }, [selectedStructureId]);

  const toggleStudent = (studentId: string, checked: boolean): void => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(studentId);
      else next.delete(studentId);
      return next;
    });
  };

  const toggleSelectAll = (checked: boolean): void => {
    if (!students) return;
    setSelectedStudentIds(checked ? new Set(students.map((s) => s._id)) : new Set());
  };

  const updateAmountPaid = (id: string, value: string): void => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, amountPaid: value } : item))
    );
  };

  const getTotalDue = (): number =>
    items.reduce((sum, item) => sum + item.amountDue, 0);

  const getTotalPaid = (): number =>
    items.reduce((sum, item) => sum + (parseFloat(item.amountPaid) || 0), 0);

  const getBalance = (): number => getTotalDue() - getTotalPaid();

  const handleSubmit = async (): Promise<void> => {
    if (!selectedStructure) {
      toast.error('Please select a fee structure');
      return;
    }
    if (selectedStudentIds.size === 0) {
      toast.error('Please select at least one student');
      return;
    }
    const validItems = items.filter(
      (item) => item.categoryId && !Number.isNaN(parseFloat(item.amountPaid))
    );
    if (validItems.length === 0) {
      toast.error('Please enter amount paid for at least one category');
      return;
    }
    if (!user?.email) {
      toast.error('User not authenticated');
      return;
    }

    const paymentItems = validItems.map((item) => ({
      categoryId: item.categoryId,
      categoryName: item.categoryName,
      amountDue: item.amountDue,
      amountPaid: parseFloat(item.amountPaid) || 0,
    }));

    const selectedStudents = students?.filter((s) => selectedStudentIds.has(s._id)) ?? [];
    if (selectedStudents.length === 0) {
      toast.error('Invalid student selection');
      return;
    }

    const common = {
      schoolId,
      items: paymentItems,
      paymentMethod: paymentMethod as 'cash' | 'bank_transfer' | 'mobile_money' | 'check' | 'other',
      transactionReference: transactionRef || undefined,
      paymentDate,
      notes: notes || undefined,
      paidBy: paidBy || undefined,
      collectedBy: user.email,
      collectedByName: schoolAdminName,
      feeStructureId: selectedStructure._id,
    };

    setLoading(true);
    try {
      for (const student of selectedStudents) {
        await recordPayment({
          ...common,
          studentId: student.studentId,
          studentName: `${student.firstName} ${student.lastName}`,
          classId: student.classId,
          className: student.className ?? '',
        });
      }
      toast.success(`Payment recorded for ${selectedStudents.length} student(s)`);
      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to record payment');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = (): void => {
    setSelectedStructureId('');
    setSelectedStudentIds(new Set());
    setItems([]);
    setPaymentMethod('cash');
    setTransactionRef('');
    setPaidBy('');
    setNotes('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
  };

  useEffect(() => {
    if (!open) resetForm();
  }, [open]);

  const canSubmit =
    selectedStructure &&
    selectedStudentIds.size > 0 &&
    items.length > 0 &&
    items.some((i) => parseFloat(i.amountPaid) > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Fee Payment</DialogTitle>
          <DialogDescription>
            Select a fee structure to narrow students, then choose one or more students and enter amounts paid
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Fee Structure *</Label>
              <Select
                value={selectedStructureId}
                onValueChange={setSelectedStructureId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select fee structure (by class or department)" />
                </SelectTrigger>
                <SelectContent>
                  {filterableStructures.length === 0 ? (
                    <div className="py-2 px-2 text-sm text-muted-foreground">
                      No fee structures with class or department. Create one and link it to a class or department.
                    </div>
                  ) : (
                    filterableStructures.map((s) => (
                      <SelectItem key={s._id} value={s._id}>
                        {structureLabel(s)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedStructure && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Students *</Label>
                    {students && students.length > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <Checkbox
                          id="select-all-students"
                          checked={
                            students.length > 0 &&
                            selectedStudentIds.size === students.length
                          }
                          onCheckedChange={(c) =>
                            toggleSelectAll(c === true)
                          }
                        />
                        <label htmlFor="select-all-students">
                          Select all
                        </label>
                      </div>
                    )}
                  </div>
                  {!students || students.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No students in this class/department
                    </p>
                  ) : (
                    <ScrollArea className="h-[180px] rounded-md border p-2">
                      <div className="space-y-2">
                        {students.map((student) => (
                          <div
                            key={student._id}
                            className="flex items-center gap-2"
                          >
                            <Checkbox
                              id={`student-${student._id}`}
                              checked={selectedStudentIds.has(student._id)}
                              onCheckedChange={(c) =>
                                toggleStudent(student._id, c === true)
                              }
                            />
                            <label
                              htmlFor={`student-${student._id}`}
                              className="text-sm cursor-pointer"
                            >
                              {student.firstName} {student.lastName} (
                              {student.className})
                            </label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>

                <div className="border-t pt-4">
                  <Label className="text-base font-semibold">Fee categories (due from structure)</Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Amount due is read-only. Enter amount paid per category.
                  </p>
                  {items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      This structure has no fee categories.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 rounded-lg border p-3"
                        >
                          <div className="flex-1">
                            <Label className="text-xs text-muted-foreground">
                              Category
                            </Label>
                            <p className="font-medium">{item.categoryName}</p>
                          </div>
                          <div className="w-28">
                            <Label className="text-xs text-muted-foreground">
                              Amount due
                            </Label>
                            <p className="font-mono font-medium">
                              GHS {item.amountDue.toFixed(2)}
                            </p>
                          </div>
                          <div className="w-32">
                            <Label htmlFor={`paid-${item.id}`}>
                              Amount paid *
                            </Label>
                            <Input
                              id={`paid-${item.id}`}
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={item.amountPaid}
                              onChange={(e) =>
                                updateAmountPaid(item.id, e.target.value)
                              }
                            />
                          </div>
                        </div>
                      ))}

                      <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">Total Due:</span>
                          <span className="font-bold">
                            GHS {getTotalDue().toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">Total Paid:</span>
                          <span className="font-bold">
                            GHS {getTotalPaid().toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-base border-t pt-2">
                          <span className="font-semibold">Balance:</span>
                          <span
                            className={`font-bold ${
                              getBalance() > 0
                                ? 'text-red-600'
                                : 'text-green-600'
                            }`}
                          >
                            GHS {getBalance().toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="border-t pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method *</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger id="paymentMethod">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="mobile_money">Mobile Money</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentDate">Payment Date *</Label>
                  <DatePicker
                    id="paymentDate"
                    value={paymentDate}
                    onChange={setPaymentDate}
                    placeholder="Pick payment date"
                    disableFuture={false}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="transactionRef">Transaction Reference</Label>
                  <Input
                    id="transactionRef"
                    placeholder="Transaction ID or reference"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paidBy">Paid By</Label>
                  <Input
                    id="paidBy"
                    placeholder="Name of person who paid"
                    value={paidBy}
                    onChange={(e) => setPaidBy(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes (optional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
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
          <Button
            onClick={handleSubmit}
            disabled={loading || !canSubmit}
          >
            {loading ? 'Recording...' : 'Record Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

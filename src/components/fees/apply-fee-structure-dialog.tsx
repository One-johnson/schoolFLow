'use client';

import { useState, useCallback, JSX } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { toast } from 'sonner';
import { Users, DollarSign } from 'lucide-react';

interface ApplyFeeStructureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  collectedBy: string;
  collectedByName: string;
}

export function ApplyFeeStructureDialog({
  open,
  onOpenChange,
  schoolId,
  collectedBy,
  collectedByName,
}: ApplyFeeStructureDialogProps): React.JSX.Element {
  const [selectedStructure, setSelectedStructure] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const structures = useQuery(api.feeStructures.getActiveStructuresBySchool, { schoolId });
  const classes = useQuery(api.classes.getClassesBySchool, { schoolId });
  const students = useQuery(
    api.students.getStudentsByClass,
    selectedClass ? { classId: selectedClass } : 'skip'
  );

  const applyStructure = useMutation(api.bulkPayments.applyFeeStructureToStudents);

  const handleSelectAll = useCallback((checked: boolean): void => {
    setSelectAll(checked);
    if (checked && students) {
      setSelectedStudents(new Set(students.map((s) => s.studentId)));
    } else {
      setSelectedStudents(new Set());
    }
  }, [students]);

  const handleStudentToggle = useCallback((studentId: string, checked: boolean): void => {
    setSelectedStudents((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(studentId);
      } else {
        newSet.delete(studentId);
      }
      return newSet;
    });
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!selectedStructure) {
      toast.error('Please select a fee structure');
      return;
    }

    if (selectedStudents.size === 0) {
      toast.error('Please select at least one student');
      return;
    }

    setLoading(true);

    try {
      const result = await applyStructure({
        schoolId,
        feeStructureId: selectedStructure,
        studentIds: Array.from(selectedStudents),
        collectedBy,
        collectedByName,
      });

      toast.success(`Applied fee structure to ${result.successCount} students`);

      if (result.failCount > 0) {
        toast.error(`Failed to apply to ${result.failCount} students`);
      }

      // Reset form
      setSelectedStructure('');
      setSelectedClass('');
      setSelectedStudents(new Set());
      setSelectAll(false);

      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to apply fee structure');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [
    selectedStructure,
    selectedStudents,
    schoolId,
    collectedBy,
    collectedByName,
    applyStructure,
    onOpenChange,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Apply Fee Structure to Students</DialogTitle>
          <DialogDescription>
            Select a fee structure and apply it to multiple students at once
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Fee Structure Selection */}
          <div className="space-y-2">
            <Label htmlFor="structure">Fee Structure *</Label>
            <Select value={selectedStructure} onValueChange={setSelectedStructure}>
              <SelectTrigger>
                <SelectValue placeholder="Select fee structure" />
              </SelectTrigger>
              <SelectContent>
                {structures?.map((structure) => (
                  <SelectItem key={structure._id} value={structure.structureCode}>
                    {structure.structureName} - GHS {structure.totalAmount.toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Class Filter */}
          <div className="space-y-2">
            <Label htmlFor="class">Filter by Class (Optional)</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue placeholder="All classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Classes">All Classes</SelectItem>
                {classes?.map((cls) => (
                  <SelectItem key={cls._id} value={cls.classCode}>
                    {cls.className}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Student Selection */}
          {selectedClass && students && students.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Select Students *</Label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                    id="select-all"
                  />
                  <label htmlFor="select-all" className="text-sm cursor-pointer">
                    Select All ({students.length})
                  </label>
                </div>
              </div>

              <div className="border rounded-lg max-h-64 overflow-y-auto p-4 space-y-2">
                {students.map((student) => (
                  <div key={student._id} className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedStudents.has(student.studentId)}
                      onCheckedChange={(checked) => handleStudentToggle(student.studentId, checked as boolean)}
                      id={student._id}
                    />
                    <label htmlFor={student._id} className="flex-1 text-sm cursor-pointer">
                      {student.firstName} {student.lastName} ({student.studentId}) - {student.className}
                    </label>
                  </div>
                ))}
              </div>

              <p className="text-sm text-muted-foreground">
                {selectedStudents.size} of {students.length} students selected
              </p>
            </div>
          )}

          {/* Summary */}
          {selectedStudents.size > 0 && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="font-medium">
                  Will create fee records for {selectedStudents.size} students
                </span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm text-muted-foreground">
                  Multiple fee categories will be applied based on the selected structure
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || selectedStudents.size === 0}>
              {loading ? 'Applying...' : `Apply to ${selectedStudents.size} Students`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

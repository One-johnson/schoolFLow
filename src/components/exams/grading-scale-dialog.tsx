'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, X } from 'lucide-react';

interface GradingScaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
}

interface Grade {
  grade: string;
  minPercent: number;
  maxPercent: number;
  remark: string;
}

export function GradingScaleDialog({ open, onOpenChange, schoolId }: GradingScaleDialogProps) {
  const { toast } = useToast();
  const createGradingScale = useMutation(api.grading.createGradingScale);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [scaleName, setScaleName] = useState<string>('');
  const [department, setDepartment] = useState<string>('primary');
  const [grades, setGrades] = useState<Grade[]>([
    { grade: '1', minPercent: 80, maxPercent: 100, remark: 'Excellent' },
    { grade: '2', minPercent: 70, maxPercent: 79, remark: 'Very Good' },
    { grade: '3', minPercent: 65, maxPercent: 69, remark: 'Good' },
    { grade: '4', minPercent: 60, maxPercent: 64, remark: 'High Average' },
    { grade: '5', minPercent: 55, maxPercent: 59, remark: 'Average' },
    { grade: '6', minPercent: 50, maxPercent: 54, remark: 'Low Average' },
    { grade: '7', minPercent: 45, maxPercent: 49, remark: 'Pass' },
    { grade: '8', minPercent: 40, maxPercent: 44, remark: 'Pass' },
    { grade: '9', minPercent: 0, maxPercent: 39, remark: 'Fail' },
  ]);

  const handleAddGrade = (): void => {
    setGrades([...grades, { grade: '', minPercent: 0, maxPercent: 0, remark: '' }]);
  };

  const handleRemoveGrade = (index: number): void => {
    setGrades(grades.filter((_, i) => i !== index));
  };

  const handleGradeChange = (index: number, field: keyof Grade, value: string | number): void => {
    const updated = [...grades];
    if (field === 'minPercent' || field === 'maxPercent') {
      updated[index][field] = Number(value);
    } else {
      updated[index][field] = value as string;
    }
    setGrades(updated);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await createGradingScale({
        schoolId,
        scaleName,
        department: department as 'creche' | 'kindergarten' | 'primary' | 'junior_high',
        grades: JSON.stringify(grades),
        createdBy: '',
        isDefault: false
      });

      toast({
        title: 'Success',
        description: 'Grading scale created successfully',
      });

      setScaleName('');
      setDepartment('primary');
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create grading scale',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Grading Scale</DialogTitle>
          <DialogDescription>
            Define grade ranges and remarks for assessments
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scaleName">Scale Name *</Label>
              <Input
                id="scaleName"
                placeholder="e.g., Primary Grading Scale"
                value={scaleName}
                onChange={(e) => setScaleName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Select value={department} onValueChange={setDepartment} required>
                <SelectTrigger id="department">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="creche">Creche</SelectItem>
                  <SelectItem value="kindergarten">Kindergarten</SelectItem>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="junior_high">Junior High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Grade Ranges *</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddGrade}>
                <Plus className="h-4 w-4 mr-2" />
                Add Grade
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-medium">Grade</th>
                    <th className="text-left p-3 font-medium">Min %</th>
                    <th className="text-left p-3 font-medium">Max %</th>
                    <th className="text-left p-3 font-medium">Remark</th>
                    <th className="w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {grades.map((grade, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-2">
                        <Input
                          value={grade.grade}
                          onChange={(e) => handleGradeChange(index, 'grade', e.target.value)}
                          placeholder="1"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={grade.minPercent}
                          onChange={(e) => handleGradeChange(index, 'minPercent', e.target.value)}
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={grade.maxPercent}
                          onChange={(e) => handleGradeChange(index, 'maxPercent', e.target.value)}
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          value={grade.remark}
                          onChange={(e) => handleGradeChange(index, 'remark', e.target.value)}
                          placeholder="Excellent"
                        />
                      </td>
                      <td className="p-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveGrade(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Scale
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

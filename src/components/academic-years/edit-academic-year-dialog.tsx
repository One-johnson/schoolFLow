'use client';

import { useState, useEffect, JSX } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';
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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface AcademicYear {
  _id: Id<'academicYears'>;
  yearName: string;
  startDate: string;
  endDate: string;
  description?: string;
  status: 'active' | 'upcoming' | 'completed' | 'archived';
  isCurrentYear: boolean;
}

interface EditAcademicYearDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  academicYear: AcademicYear;
  updatedBy: string;
}

export function EditAcademicYearDialog({
  open,
  onOpenChange,
  academicYear,
  updatedBy,
}: EditAcademicYearDialogProps): JSX.Element {
  const [yearName, setYearName] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const updateAcademicYear = useMutation(api.academicYears.updateAcademicYear);

  useEffect(() => {
    if (academicYear) {
      setYearName(academicYear.yearName);
      setStartDate(academicYear.startDate);
      setEndDate(academicYear.endDate);
      setDescription(academicYear.description || '');
    }
  }, [academicYear]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (!yearName || !startDate || !endDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      toast.error('End date must be after start date');
      return;
    }

    setIsLoading(true);

    try {
      await updateAcademicYear({
        yearId: academicYear._id,
        yearName,
        startDate,
        endDate,
        description: description || undefined,
        updatedBy,
      });

      toast.success('Academic year updated successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to update academic year');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Academic Year</DialogTitle>
          <DialogDescription>
            Update the details of this academic year
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="yearName">
                Year Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="yearName"
                placeholder="e.g., 2024/2025"
                value={yearName}
                onChange={(e) => setYearName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">
                  Start Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">
                  End Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Add any additional notes about this academic year..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {academicYear.isCurrentYear && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-700">
                  This is the current academic year for your school
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Academic Year
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

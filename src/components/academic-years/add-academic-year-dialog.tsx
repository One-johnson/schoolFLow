'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/../convex/_generated/api';
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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface AddAcademicYearDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  createdBy: string;
}

export function AddAcademicYearDialog({
  open,
  onOpenChange,
  schoolId,
  createdBy,
}: AddAcademicYearDialogProps): React.JSX.Element {
  const [yearName, setYearName] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [setAsCurrent, setSetAsCurrent] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const addAcademicYear = useMutation(api.academicYears.addAcademicYear);

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
      await addAcademicYear({
        schoolId,
        yearName,
        startDate,
        endDate,
        description: description || undefined,
        setAsCurrent,
        createdBy,
      });

      toast.success('Academic year added successfully');
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast.error('Failed to add academic year');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = (): void => {
    setYearName('');
    setStartDate('');
    setEndDate('');
    setDescription('');
    setSetAsCurrent(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Add Academic Year</DialogTitle>
          <DialogDescription>
            Create a new academic year for your school
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

            <div className="flex items-center space-x-2">
              <Checkbox
                id="setAsCurrent"
                checked={setAsCurrent}
                onCheckedChange={(checked) => setSetAsCurrent(checked as boolean)}
              />
              <Label
                htmlFor="setAsCurrent"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Set as current academic year
              </Label>
            </div>
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
              Add Academic Year
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

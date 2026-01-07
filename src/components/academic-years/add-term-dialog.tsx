'use client';

import { JSX, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface AddTermDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  createdBy: string;
}

export function AddTermDialog({
  open,
  onOpenChange,
  schoolId,
  createdBy,
}: AddTermDialogProps): JSX.Element {
  const [academicYearId, setAcademicYearId] = useState<string>('');
  const [termName, setTermName] = useState<string>('');
  const [termNumber, setTermNumber] = useState<string>('1');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [holidayStart, setHolidayStart] = useState<string>('');
  const [holidayEnd, setHolidayEnd] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [setAsCurrent, setSetAsCurrent] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const academicYears = useQuery(api.academicYears.getYearsBySchool, { schoolId });
  const addTerm = useMutation(api.terms.addTerm);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (!academicYearId || !termName || !termNumber || !startDate || !endDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      toast.error('End date must be after start date');
      return;
    }

    if (holidayStart && holidayEnd && new Date(holidayStart) >= new Date(holidayEnd)) {
      toast.error('Holiday end date must be after holiday start date');
      return;
    }

    setIsLoading(true);

    try {
      await addTerm({
        schoolId,
        academicYearId: academicYearId as Id<'academicYears'>,
        termName,
        termNumber: parseInt(termNumber),
        startDate,
        endDate,
        holidayStart: holidayStart || undefined,
        holidayEnd: holidayEnd || undefined,
        description: description || undefined,
        setAsCurrent,
        createdBy,
      });

      toast.success('Term added successfully');
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast.error('Failed to add term');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = (): void => {
    setAcademicYearId('');
    setTermName('');
    setTermNumber('1');
    setStartDate('');
    setEndDate('');
    setHolidayStart('');
    setHolidayEnd('');
    setDescription('');
    setSetAsCurrent(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Add Term</DialogTitle>
          <DialogDescription>
            Create a new term for an academic year
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4 max-h-[500px] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="academicYearId">
                Academic Year <span className="text-red-500">*</span>
              </Label>
              <Select value={academicYearId} onValueChange={setAcademicYearId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select academic year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears?.map((year) => (
                    <SelectItem key={year._id} value={year._id}>
                      {year.yearName} {year.isCurrentYear && '(Current)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="termName">
                  Term Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="termName"
                  placeholder="e.g., Term 1, First Semester"
                  value={termName}
                  onChange={(e) => setTermName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="termNumber">
                  Term Number <span className="text-red-500">*</span>
                </Label>
                <Select value={termNumber} onValueChange={setTermNumber} required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="holidayStart">Holiday Start (Optional)</Label>
                <Input
                  id="holidayStart"
                  type="date"
                  value={holidayStart}
                  onChange={(e) => setHolidayStart(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="holidayEnd">Holiday End (Optional)</Label>
                <Input
                  id="holidayEnd"
                  type="date"
                  value={holidayEnd}
                  onChange={(e) => setHolidayEnd(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Add any additional notes about this term..."
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
                Set as current term
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
              Add Term
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

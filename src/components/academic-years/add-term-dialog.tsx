'use client';

import { useState } from 'react';
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';

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
}: AddTermDialogProps): React.JSX.Element {
  const [academicYearId, setAcademicYearId] = useState<string>('');
  const [termName, setTermName] = useState<string>('');
  const [termNumber, setTermNumber] = useState<string>('1');
  const [termDateRange, setTermDateRange] = useState<DateRange | undefined>();
  const [holidayDateRange, setHolidayDateRange] = useState<DateRange | undefined>();
  const [description, setDescription] = useState<string>('');
  const [setAsCurrent, setSetAsCurrent] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const academicYears = useQuery(api.academicYears.getYearsBySchool, { schoolId });
  const addTerm = useMutation(api.terms.addTerm);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (!academicYearId || !termName || !termNumber || !termDateRange?.from || !termDateRange?.to) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (termDateRange.from >= termDateRange.to) {
      toast.error('End date must be after start date');
      return;
    }

    if (holidayDateRange?.from && holidayDateRange?.to && holidayDateRange.from >= holidayDateRange.to) {
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
        startDate: format(termDateRange.from, 'yyyy-MM-dd'),
        endDate: format(termDateRange.to, 'yyyy-MM-dd'),
        holidayStart: holidayDateRange?.from ? format(holidayDateRange.from, 'yyyy-MM-dd') : undefined,
        holidayEnd: holidayDateRange?.to ? format(holidayDateRange.to, 'yyyy-MM-dd') : undefined,
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
    setTermDateRange(undefined);
    setHolidayDateRange(undefined);
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

            <div className="space-y-2">
              <Label>
                Term Date Range <span className="text-red-500">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {termDateRange?.from ? (
                      termDateRange.to ? (
                        <>
                          {format(termDateRange.from, 'LLL dd, y')} -{' '}
                          {format(termDateRange.to, 'LLL dd, y')}
                        </>
                      ) : (
                        format(termDateRange.from, 'LLL dd, y')
                      )
                    ) : (
                      <span>Pick term date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={termDateRange?.from}
                    selected={termDateRange}
                    onSelect={setTermDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Holiday Date Range (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {holidayDateRange?.from ? (
                      holidayDateRange.to ? (
                        <>
                          {format(holidayDateRange.from, 'LLL dd, y')} -{' '}
                          {format(holidayDateRange.to, 'LLL dd, y')}
                        </>
                      ) : (
                        format(holidayDateRange.from, 'LLL dd, y')
                      )
                    ) : (
                      <span>Pick holiday date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={holidayDateRange?.from}
                    selected={holidayDateRange}
                    onSelect={setHolidayDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
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

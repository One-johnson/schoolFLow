'use client';

import { useState, useEffect } from 'react';
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

interface Term {
  _id: Id<'terms'>;
  termName: string;
  termNumber: number;
  startDate: string;
  endDate: string;
  holidayStart?: string;
  holidayEnd?: string;
  description?: string;
  academicYearName: string;
  isCurrentTerm: boolean;
}

interface EditTermDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  term: Term;
  updatedBy: string;
}

export function EditTermDialog({
  open,
  onOpenChange,
  term,
  updatedBy,
}: EditTermDialogProps): React.JSX.Element {
  const [termName, setTermName] = useState<string>('');
  const [termNumber, setTermNumber] = useState<string>('1');
  const [termDateRange, setTermDateRange] = useState<DateRange | undefined>();
  const [holidayDateRange, setHolidayDateRange] = useState<DateRange | undefined>();
  const [description, setDescription] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const updateTerm = useMutation(api.terms.updateTerm);

  useEffect(() => {
    if (term) {
      setTermName(term.termName);
      setTermNumber(term.termNumber.toString());
      setTermDateRange({
        from: new Date(term.startDate),
        to: new Date(term.endDate),
      });
      setHolidayDateRange(
        term.holidayStart && term.holidayEnd
          ? {
              from: new Date(term.holidayStart),
              to: new Date(term.holidayEnd),
            }
          : undefined
      );
      setDescription(term.description || '');
    }
  }, [term]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (!termName || !termNumber || !termDateRange?.from || !termDateRange?.to) {
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
      await updateTerm({
        termId: term._id,
        termName,
        termNumber: parseInt(termNumber),
        startDate: format(termDateRange.from, 'yyyy-MM-dd'),
        endDate: format(termDateRange.to, 'yyyy-MM-dd'),
        holidayStart: holidayDateRange?.from ? format(holidayDateRange.from, 'yyyy-MM-dd') : undefined,
        holidayEnd: holidayDateRange?.to ? format(holidayDateRange.to, 'yyyy-MM-dd') : undefined,
        description: description || undefined,
        updatedBy,
      });

      toast.success('Term updated successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to update term');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Term</DialogTitle>
          <DialogDescription>
            Update the details of this term for {term.academicYearName}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4 max-h-[500px] overflow-y-auto">
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

            {term.isCurrentTerm && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-700">
                  This is the current term for your school
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
              Update Term
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

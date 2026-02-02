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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

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
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [holidayStart, setHolidayStart] = useState<string>('');
  const [holidayEnd, setHolidayEnd] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const updateTerm = useMutation(api.terms.updateTerm);

  useEffect(() => {
    if (term) {
      setTermName(term.termName);
      setTermNumber(term.termNumber.toString());
      setStartDate(term.startDate);
      setEndDate(term.endDate);
      setHolidayStart(term.holidayStart || '');
      setHolidayEnd(term.holidayEnd || '');
      setDescription(term.description || '');
    }
  }, [term]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (!termName || !termNumber || !startDate || !endDate) {
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
      await updateTerm({
        termId: term._id,
        termName,
        termNumber: parseInt(termNumber),
        startDate,
        endDate,
        holidayStart: holidayStart || undefined,
        holidayEnd: holidayEnd || undefined,
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

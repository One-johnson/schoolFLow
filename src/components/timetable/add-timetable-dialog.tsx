'use client';

import { JSX, useState } from 'react';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import type { Id } from '../../../convex/_generated/dataModel';

interface AddTimetableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  classes: Array<{
    _id: Id<'classes'>;
    className: string;
  }>;
}

export function AddTimetableDialog({
  open,
  onOpenChange,
  schoolId,
  classes,
}: AddTimetableDialogProps): JSX.Element {
  const { user } = useAuth();
  const createTimetable = useMutation(api.timetables.createTimetable);

  const [selectedClass, setSelectedClass] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!selectedClass) {
      toast.error('Please select a class');
      return;
    }

    const selectedClassData = classes.find(c => c._id === selectedClass);
    if (!selectedClassData) {
      toast.error('Invalid class selected');
      return;
    }

    setIsLoading(true);

    try {
      await createTimetable({
        schoolId,
        classId: selectedClass,
        className: selectedClassData.className,
        createdBy: user?.userId || '',
      });

      toast.success(`Weekly timetable created for ${selectedClassData.className}`);
      
      // Reset form
      setSelectedClass('');
      onOpenChange(false);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to create timetable');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Weekly Timetable</DialogTitle>
            <DialogDescription>
              Create a complete weekly timetable for a class. Default periods will be created for all weekdays (Monday-Friday).
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Class Selection */}
            <div className="grid gap-2">
              <Label htmlFor="class">Class *</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger id="class">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls._id} value={cls._id}>
                      {cls.className}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Info about default schedule */}
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-medium mb-2">Default Schedule (Mon-Fri):</p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>• Assembly: 7:30 AM - 8:00 AM</li>
                <li>• Period 1: 8:00 AM - 9:10 AM</li>
                <li>• Period 2: 9:10 AM - 10:20 AM</li>
                <li>• Break: 10:20 AM - 10:40 AM</li>
                <li>• Period 3: 10:45 AM - 11:55 AM</li>
                <li>• Period 4: 11:55 AM - 1:05 PM</li>
                <li>• Lunch: 1:05 PM - 1:35 PM</li>
                <li>• Period 5: 1:35 PM - 2:45 PM</li>
                <li>• Period 6: 2:45 PM - 3:55 PM</li>
                <li>• Closing: 3:55 PM - 4:00 PM</li>
              </ul>
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
              Create Weekly Timetable
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

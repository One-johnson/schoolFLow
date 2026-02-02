'use client';

import { useState, useMemo, JSX } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, Copy } from 'lucide-react';
import type { Id } from '../../../convex/_generated/dataModel';

interface Class {
  _id: Id<'classes'>;
  className: string;
  status: 'active' | 'inactive';
}

interface Timetable {
  _id: Id<'timetables'>;
  classId: string;
  className: string;
}

interface CloneTimetableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timetables: Timetable[];
  availableClasses: Class[];
  schoolId: string;
  createdBy: string;
}

export function CloneTimetableDialog({
  open,
  onOpenChange,
  timetables,
  availableClasses,
  schoolId,
  createdBy,
}: CloneTimetableDialogProps): React.JSX.Element {
  const cloneTimetable = useMutation(api.timetableTemplates.cloneTimetable);

  const [sourceTimetableId, setSourceTimetableId] = useState<string>('');
  const [targetClassId, setTargetClassId] = useState<string>('');
  const [includeAssignments, setIncludeAssignments] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const selectedTimetable = useMemo(() => {
    return timetables.find(t => t._id === sourceTimetableId);
  }, [timetables, sourceTimetableId]);

  const selectedClass = useMemo(() => {
    return availableClasses.find(c => c._id === targetClassId);
  }, [availableClasses, targetClassId]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!sourceTimetableId || !targetClassId) {
      toast.error('Please select both source timetable and target class');
      return;
    }

    if (!selectedClass) {
      toast.error('Invalid target class selected');
      return;
    }

    setIsLoading(true);

    try {
      await cloneTimetable({
        sourceTimetableId: sourceTimetableId as Id<'timetables'>,
        targetClassId,
        targetClassName: selectedClass.className,
        schoolId,
        createdBy,
        includeAssignments,
      });

      toast.success(`Timetable cloned to ${selectedClass.className} successfully`);
      
      // Reset form
      setSourceTimetableId('');
      setTargetClassId('');
      setIncludeAssignments(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Clone timetable error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to clone timetable');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Clone Timetable</DialogTitle>
            <DialogDescription>
              Copy an existing timetable structure to another class
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Source Timetable */}
            <div className="grid gap-2">
              <Label htmlFor="source">Source Timetable *</Label>
              <Select value={sourceTimetableId} onValueChange={setSourceTimetableId}>
                <SelectTrigger id="source">
                  <SelectValue placeholder="Select timetable to clone" />
                </SelectTrigger>
                <SelectContent>
                  {timetables.map((timetable) => (
                    <SelectItem key={timetable._id} value={timetable._id}>
                      {timetable.className}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Target Class */}
            <div className="grid gap-2">
              <Label htmlFor="target">Target Class *</Label>
              <Select value={targetClassId} onValueChange={setTargetClassId}>
                <SelectTrigger id="target">
                  <SelectValue placeholder="Select class to clone to" />
                </SelectTrigger>
                <SelectContent>
                  {availableClasses.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No available classes
                    </SelectItem>
                  ) : (
                    availableClasses.map((cls) => (
                      <SelectItem key={cls._id} value={cls._id}>
                        {cls.className}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Include Assignments Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="assignments"
                checked={includeAssignments}
                onCheckedChange={(checked: boolean) => setIncludeAssignments(checked)}
              />
              <Label
                htmlFor="assignments"
                className="text-sm font-normal cursor-pointer"
              >
                Include teacher assignments
              </Label>
            </div>

            {/* Info */}
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-medium mb-2">What will be cloned:</p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>• All period names and timings</li>
                <li>• Break times structure</li>
                <li>• Weekly schedule layout</li>
                {includeAssignments && (
                  <li className="text-blue-600">• Teacher & subject assignments</li>
                )}
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
            <Button type="submit" disabled={isLoading || availableClasses.length === 0}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Copy className="mr-2 h-4 w-4" />
              Clone Timetable
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { CalendarIcon, Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface BulkMarkAttendanceDialogProps {
  schoolId: string;
  adminId: string;
  adminName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkMarkAttendanceDialog({
  schoolId,
  adminId,
  adminName,
  open,
  onOpenChange,
}: BulkMarkAttendanceDialogProps): JSX.Element {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [session, setSession] = useState<'morning' | 'afternoon' | 'full_day'>('full_day');
  const [defaultStatus, setDefaultStatus] = useState<'present' | 'absent'>('present');
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [results, setResults] = useState<{ classId: string; className: string; success: boolean; error?: string; }[]>([]);

  const classes = useQuery(api.classes.getClassesBySchool, { schoolId });
  const bulkMarkAttendance = useMutation(api.attendance.bulkMarkAttendance);

  const handleToggleClass = (classId: string): void => {
    setSelectedClassIds((prev) =>
      prev.includes(classId)
        ? prev.filter((id) => id !== classId)
        : [...prev, classId]
    );
  };

  const handleSelectAll = (): void => {
    if (!classes) return;
    if (selectedClassIds.length === classes.length) {
      setSelectedClassIds([]);
    } else {
      setSelectedClassIds(classes.map((c) => c._id));
    }
  };

  const handleSubmit = async (): Promise<void> => {
    if (selectedClassIds.length === 0) {
      toast.error('Please select at least one class');
      return;
    }

    if (!date) {
      toast.error('Please select a date');
      return;
    }

    setIsSubmitting(true);
    setResults([]);

    try {
      const bulkResults = await bulkMarkAttendance({
        schoolId,
        classIds: selectedClassIds,
        date,
        session,
        defaultStatus,
        markedBy: adminId,
        markedByName: adminName,
      });

      setResults(bulkResults);

      const successCount = bulkResults.filter((r) => r.success).length;
      const failCount = bulkResults.filter((r) => !r.success).length;

      if (successCount > 0 && failCount === 0) {
        toast.success(`Attendance marked for ${successCount} ${successCount === 1 ? 'class' : 'classes'}`);
        setTimeout(() => {
          onOpenChange(false);
          setSelectedClassIds([]);
          setResults([]);
        }, 2000);
      } else if (successCount > 0 && failCount > 0) {
        toast.warning(`Marked ${successCount} classes, ${failCount} failed`);
      } else {
        toast.error('Failed to mark attendance for all selected classes');
      }
    } catch (error) {
      console.error('Error bulk marking attendance:', error);
      toast.error('Failed to mark attendance');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (): void => {
    if (!isSubmitting) {
      onOpenChange(false);
      setSelectedClassIds([]);
      setResults([]);
      setDate(new Date().toISOString().split('T')[0]);
      setSession('full_day');
      setDefaultStatus('present');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Bulk Mark Attendance</DialogTitle>
          <DialogDescription>
            Mark attendance for multiple classes at once. All students will be marked with the default status.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1 pr-2">
          {/* Date Input */}
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <div className="relative">
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
              <CalendarIcon className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Session Select */}
          <div className="space-y-2">
            <Label htmlFor="session">Session</Label>
            <Select value={session} onValueChange={(value: 'morning' | 'afternoon' | 'full_day') => setSession(value)}>
              <SelectTrigger id="session">
                <SelectValue placeholder="Select session" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">Morning</SelectItem>
                <SelectItem value="afternoon">Afternoon</SelectItem>
                <SelectItem value="full_day">Full Day</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Default Status */}
          <div className="space-y-2">
            <Label htmlFor="defaultStatus">Default Status for All Students</Label>
            <Select value={defaultStatus} onValueChange={(value: 'present' | 'absent') => setDefaultStatus(value)}>
              <SelectTrigger id="defaultStatus">
                <SelectValue placeholder="Select default status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              All students in selected classes will be marked as {defaultStatus}. You can edit individual records later.
            </p>
          </div>

          {/* Class Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Select Classes ({selectedClassIds.length} selected)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedClassIds.length === classes?.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            <ScrollArea className="h-[200px] border rounded-md p-4">
              {!classes ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : classes.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  No classes available
                </div>
              ) : (
                <div className="space-y-2">
                  {classes.map((classItem) => (
                    <div
                      key={classItem._id}
                      className="flex items-center space-x-2 p-2 rounded hover:bg-accent cursor-pointer"
                      onClick={() => handleToggleClass(classItem._id)}
                    >
                      <Checkbox
                        checked={selectedClassIds.includes(classItem._id)}
                        onCheckedChange={() => handleToggleClass(classItem._id)}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{classItem.className}</p>
                        <p className="text-sm text-muted-foreground">
                          Grade {classItem.grade} • {classItem.section}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Results Display */}
          {results.length > 0 && (
            <div className="space-y-2">
              <Label>Results</Label>
              <ScrollArea className="h-[150px] border rounded-md p-4">
                <div className="space-y-2">
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-2 p-2 rounded ${
                        result.success ? 'bg-green-50' : 'bg-red-50'
                      }`}
                    >
                      {result.success ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                          {result.className}
                        </p>
                        {result.error && (
                          <p className="text-xs text-red-700">{result.error}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting || selectedClassIds.length === 0}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Marking...' : `Mark ${selectedClassIds.length} ${selectedClassIds.length === 1 ? 'Class' : 'Classes'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

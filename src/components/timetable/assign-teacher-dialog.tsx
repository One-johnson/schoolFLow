'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
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
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Id } from '../../../convex/_generated/dataModel';

type Day = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

interface Period {
  _id: Id<'periods'>;
  periodName: string;
  startTime: string;
  endTime: string;
}

interface Teacher {
  _id: Id<'teachers'>;
  teacherId: string;
  firstName: string;
  lastName: string;
}

interface Subject {
  status: string;
  _id: Id<'subjects'>;
  subjectCode: string;
  subjectName: string;
}

interface AssignTeacherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  period: Period;
  timetableId: Id<'timetables'>;
  classId: string;
  className: string;
  day: Day;
  schoolId: string;
  teachers: Teacher[];
}

export function AssignTeacherDialog({
  open,
  onOpenChange,
  period,
  timetableId,
  classId,
  className,
  day,
  schoolId,
  teachers,
}: AssignTeacherDialogProps): React.JSX.Element {
  const assignTeacher = useMutation(api.timetables.assignTeacherToSlot);
  
  // Get subjects
  const subjects = useQuery(
    api.subjects.getSubjectsBySchool,
    schoolId ? { schoolId } : 'skip'
  ) as Subject[] | undefined;

  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [conflictError, setConflictError] = useState<string>('');

  const activeSubjects = useMemo(() => {
    return subjects?.filter(s => s.status === 'active') || [];
  }, [subjects]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setConflictError('');

    if (!selectedTeacher || !selectedSubject) {
      toast.error('Please select both teacher and subject');
      return;
    }

    const teacher = teachers.find(t => t._id === selectedTeacher);
    const subject = activeSubjects.find(s => s._id === selectedSubject);

    if (!teacher || !subject) {
      toast.error('Invalid teacher or subject selected');
      return;
    }

    setIsLoading(true);

    try {
      await assignTeacher({
        timetableId,
        periodId: period._id,
        teacherId: teacher.teacherId,
        teacherName: `${teacher.firstName} ${teacher.lastName}`,
        subjectId: subject._id,
        subjectName: subject.subjectName,
        classId,
        className,
        schoolId,
        day,
        startTime: period.startTime,
        endTime: period.endTime,
      });

      toast.success(`${teacher.firstName} ${teacher.lastName} assigned to ${subject.subjectName}`);
      
      // Reset form
      setSelectedTeacher('');
      setSelectedSubject('');
      onOpenChange(false);
    } catch (error) {
      if (error instanceof Error) {
        setConflictError(error.message);
        toast.error(error.message);
      } else {
        toast.error('Failed to assign teacher');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Assign Teacher & Subject</DialogTitle>
            <DialogDescription>
              Assign a teacher and subject to {period.periodName} ({period.startTime} - {period.endTime}) for {className} on {day}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {conflictError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{conflictError}</AlertDescription>
              </Alert>
            )}

            {/* Teacher Selection */}
            <div className="grid gap-2">
              <Label htmlFor="teacher">Teacher *</Label>
              <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                <SelectTrigger id="teacher">
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher._id} value={teacher._id}>
                      {teacher.firstName} {teacher.lastName} ({teacher.teacherId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject Selection */}
            <div className="grid gap-2">
              <Label htmlFor="subject">Subject *</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger id="subject">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {activeSubjects.map((subject) => (
                    <SelectItem key={subject._id} value={subject._id}>
                      {subject.subjectName} ({subject.subjectCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Period Info */}
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-medium mb-2">Assignment Details:</p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>• Class: {className}</li>
                <li>• Day: {day.charAt(0).toUpperCase() + day.slice(1)}</li>
                <li>• Period: {period.periodName}</li>
                <li>• Time: {period.startTime} - {period.endTime}</li>
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
              Assign Teacher
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

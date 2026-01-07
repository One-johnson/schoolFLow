'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { useAuth } from '@/hooks/useAuth';
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
import { ArrowUpCircle, Loader2 } from 'lucide-react';

interface Student {
  _id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  className: string;
  classId: string;
  department: 'creche' | 'kindergarten' | 'primary' | 'junior_high';
}

interface PromoteStudentDialogProps {
  student: Student;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PromoteStudentDialog({
  student,
  open,
  onOpenChange,
}: PromoteStudentDialogProps): React.JSX.Element {
  const { user } = useAuth();
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const schoolAdmin = useQuery(
    api.schoolAdmins.getByEmail,
    user?.email ? { email: user.email } : 'skip'
  );

  const classes = useQuery(
    api.classes.getClassesBySchool,
    schoolAdmin?.schoolId ? { schoolId: schoolAdmin.schoolId } : 'skip'
  );

  const transferStudent = useMutation(api.students.transferStudent);

  const handlePromote = async (): Promise<void> => {
    if (!selectedClassId) {
      toast.error('Please select a class');
      return;
    }

    const selectedClass = classes?.find((c) => c.classCode === selectedClassId);
    if (!selectedClass) {
      toast.error('Selected class not found');
      return;
    }

    setIsSubmitting(true);

    try {
      await transferStudent({
        studentId: student._id as Id<'students'>,
        newClassId: selectedClass.classCode,
        newClassName: selectedClass.className,
        newDepartment: selectedClass.department,
        updatedBy: user?.email || 'unknown',
      });

      toast.success(`${student.firstName} ${student.lastName} promoted to ${selectedClass.className}`);
      onOpenChange(false);
      setSelectedClassId('');
    } catch (error) {
      toast.error('Failed to promote student');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedClass = classes?.find((c) => c.classCode === selectedClassId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] overflow-y-auto max-h[90vh]">
        <DialogHeader>
          <DialogTitle>Promote Student</DialogTitle>
          <DialogDescription>
            Promote {student.firstName} {student.lastName} to a new class
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Information */}
          <div className="rounded-lg border p-4 space-y-2">
            <h3 className="font-semibold text-sm">Current Information</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Student:</span>
                <p className="font-medium">
                  {student.firstName} {student.lastName}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Current Class:</span>
                <p className="font-medium">{student.className}</p>
              </div>
            </div>
          </div>

          {/* New Class Selection */}
          <div className="space-y-2">
            <Label htmlFor="newClass">New Class</Label>
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger id="newClass">
                <SelectValue placeholder="Select new class" />
              </SelectTrigger>
              <SelectContent>
                {classes
                  ?.filter((c) => c.classCode !== student.classId)
                  .map((classItem) => (
                    <SelectItem key={classItem._id} value={classItem.classCode}>
                      {classItem.className} - {classItem.department}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* New Department Display */}
          {selectedClass && (
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <h3 className="font-semibold text-sm">New Information</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">New Class:</span>
                  <p className="font-medium">{selectedClass.className}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Department:</span>
                  <p className="font-medium capitalize">
                    {selectedClass.department.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setSelectedClassId('');
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handlePromote} disabled={!selectedClassId || isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Promoting...
              </>
            ) : (
              <>
                <ArrowUpCircle className="mr-2 h-4 w-4" />
                Promote Student
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

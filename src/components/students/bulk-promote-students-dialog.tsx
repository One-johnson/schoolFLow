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
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { ArrowUpCircle, Loader2, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Student {
  _id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  className: string;
  classId: string;
  department: 'creche' | 'kindergarten' | 'primary' | 'junior_high';
}

interface BulkPromoteStudentsDialogProps {
  students: Student[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPromoted?: () => void;
}

export function BulkPromoteStudentsDialog({
  students,
  open,
  onOpenChange,
  onPromoted,
}: BulkPromoteStudentsDialogProps): React.JSX.Element {
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

  const promoteStudents = useMutation(api.students.promoteStudents);

  const handleBulkPromote = async (): Promise<void> => {
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
      const result = await promoteStudents({
        studentIds: students.map((s) => s._id as Id<'students'>),
        newClassId: selectedClass.classCode,
        newClassName: selectedClass.className,
        newDepartment: selectedClass.department,
        updatedBy: user?.email || 'unknown',
      });

      if (result.successCount > 0) {
        toast.success(
          `Successfully promoted ${result.successCount} student${result.successCount > 1 ? 's' : ''} to ${selectedClass.className}`
        );
      }

      if (result.failCount > 0) {
        toast.error(`Failed to promote ${result.failCount} student${result.failCount > 1 ? 's' : ''}`);
      }

      onOpenChange(false);
      setSelectedClassId('');
      onPromoted?.();
    } catch (error) {
      toast.error('Failed to promote students');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedClass = classes?.find((c) => c.classCode === selectedClassId);

  // Group students by current class
  const studentsByClass = students.reduce((acc: Record<string, Student[]>, student) => {
    if (!acc[student.className]) {
      acc[student.className] = [];
    }
    acc[student.className].push(student);
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Promote Students</DialogTitle>
          <DialogDescription>
            Promote {students.length} student{students.length > 1 ? 's' : ''} to a new class
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Students Summary */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">
                Selected Students ({students.length})
              </h3>
            </div>

            <ScrollArea className="h-[200px]">
              <div className="space-y-3">
                {Object.entries(studentsByClass).map(([className, classStudents]) => (
                  <div key={className} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{className}</Badge>
                      <span className="text-xs text-muted-foreground">
                        ({classStudents.length} student{classStudents.length > 1 ? 's' : ''})
                      </span>
                    </div>
                    <div className="pl-4 space-y-1">
                      {classStudents.map((student) => (
                        <div key={student._id} className="text-sm">
                          {student.firstName} {student.lastName}
                          <span className="text-muted-foreground ml-2">
                            ({student.studentId})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* New Class Selection */}
          <div className="space-y-2">
            <Label htmlFor="newClass">Promote To Class</Label>
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger id="newClass">
                <SelectValue placeholder="Select target class" />
              </SelectTrigger>
              <SelectContent>
                {classes?.map((classItem) => (
                  <SelectItem key={classItem._id} value={classItem.classCode}>
                    {classItem.className} - {classItem.department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* New Class Information */}
          {selectedClass && (
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <h3 className="font-semibold text-sm">Target Class Information</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Class:</span>
                  <p className="font-medium">{selectedClass.className}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Department:</span>
                  <p className="font-medium capitalize">
                    {selectedClass.department.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Current Students:</span>
                  <p className="font-medium">{selectedClass.currentStudentCount}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">After Promotion:</span>
                  <p className="font-medium">
                    {selectedClass.currentStudentCount + students.length}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Note about status change */}
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 text-sm text-blue-900 dark:text-blue-100">
            <p className="font-medium">Note:</p>
            <p>All promoted students will have their status automatically set to &quot;Continuing&quot;</p>
          </div>
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
          <Button onClick={handleBulkPromote} disabled={!selectedClassId || isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Promoting...
              </>
            ) : (
              <>
                <ArrowUpCircle className="mr-2 h-4 w-4" />
                Promote {students.length} Student{students.length > 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

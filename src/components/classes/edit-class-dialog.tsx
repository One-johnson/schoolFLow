'use client';

import { useState, useEffect, JSX } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface Class {
  _id: Id<'classes'>;
  schoolId: string;
  classCode: string;
  className: string;
  grade: string;
  section?: string;
  department: 'creche' | 'kindergarten' | 'primary' | 'junior_high';
  classTeacherId?: string;
  capacity?: number;
  currentStudentCount: number;
  status: 'active' | 'inactive';
}

interface EditClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classData: Class;
  updatedBy: string;
}

export function EditClassDialog({
  open,
  onOpenChange,
  classData,
  updatedBy,
}: EditClassDialogProps): React.JSX.Element {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    className: classData.className,
    grade: classData.grade,
    section: classData.section || '',
    department: classData.department,
    classTeacherId: classData.classTeacherId || '',
    capacity: classData.capacity?.toString() || '',
  });

  const updateClass = useMutation(api.classes.updateClass);

  // Fetch teachers for selection
  const teachers = useQuery(
    api.teachers.getTeachersBySchool,
    { schoolId: classData.schoolId }
  );

  useEffect(() => {
    setFormData({
      className: classData.className,
      grade: classData.grade,
      section: classData.section || '',
      department: classData.department,
      classTeacherId: classData.classTeacherId || '',
      capacity: classData.capacity?.toString() || '',
    });
  }, [classData]);

  const handleInputChange = (field: string, value: string): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await updateClass({
        classId: classData._id,
        className: formData.className,
        grade: formData.grade,
        section: formData.section || undefined,
        department: formData.department,
        classTeacherId: formData.classTeacherId || undefined,
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        updatedBy,
      });

      toast.success('Class updated successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update class');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Class</DialogTitle>
          <DialogDescription>
            Update the class information. Class Code: {classData.classCode}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Class Name */}
          <div className="space-y-2">
            <Label htmlFor="className">Class Name</Label>
            <Input
              id="className"
              value={formData.className}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('className', e.target.value)}
              required
            />
          </div>

          {/* Grade and Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="grade">Grade</Label>
              <Input
                id="grade"
                value={formData.grade}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('grade', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="section">Section</Label>
              <Input
                id="section"
                value={formData.section}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('section', e.target.value)}
              />
            </div>
          </div>

          {/* Department */}
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Select value={formData.department} onValueChange={(value: string) => handleInputChange('department', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="creche">Creche</SelectItem>
                <SelectItem value="kindergarten">Kindergarten</SelectItem>
                <SelectItem value="primary">Primary</SelectItem>
                <SelectItem value="junior_high">Junior High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Class Teacher */}
          <div className="space-y-2">
            <Label htmlFor="classTeacherId">Class Teacher</Label>
            <Select value={formData.classTeacherId} onValueChange={(value: string) => handleInputChange('classTeacherId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a teacher" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {teachers?.map((teacher) => (
                  <SelectItem key={teacher._id} value={teacher._id}>
                    {teacher.firstName} {teacher.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Capacity */}
          <div className="space-y-2">
            <Label htmlFor="capacity">Class Capacity</Label>
            <Input
              id="capacity"
              type="number"
              min="1"
              value={formData.capacity}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('capacity', e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

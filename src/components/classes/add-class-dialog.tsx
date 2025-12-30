'use client';

import { JSX, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';
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

interface AddClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  createdBy: string;
}

export function AddClassDialog({
  open,
  onOpenChange,
  schoolId,
  createdBy,
}: AddClassDialogProps): JSX.Element {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    className: '',
    grade: '',
    section: '',
    department: 'primary' as 'kindergarten' | 'primary' | 'junior_high',
    classTeacherId: '',
    capacity: '',
  });

  const addClass = useMutation(api.classes.addClass);

  // Fetch teachers for selection
  const teachers = useQuery(
    api.teachers.getTeachersBySchool,
    { schoolId }
  );

  const handleInputChange = (field: string, value: string): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validation
      if (!formData.className || !formData.grade || !formData.department) {
        toast.error('Please fill in all required fields');
        setIsSubmitting(false);
        return;
      }

      const result = await addClass({
        schoolId,
        className: formData.className,
        grade: formData.grade,
        section: formData.section || undefined,
        department: formData.department,
        classTeacherId: formData.classTeacherId || undefined,
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        createdBy,
      });

      toast.success(`Class added successfully! Code: ${result.generatedClassCode}`);
      
      // Reset form
      setFormData({
        className: '',
        grade: '',
        section: '',
        department: 'primary',
        classTeacherId: '',
        capacity: '',
      });
      
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add class');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Class</DialogTitle>
          <DialogDescription>
            Fill in the details to add a new class to your school. Required fields are marked with an asterisk (*).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Class Name */}
          <div className="space-y-2">
            <Label htmlFor="className">Class Name *</Label>
            <Input
              id="className"
              placeholder="e.g., Grade 1A, Form 3B"
              value={formData.className}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('className', e.target.value)}
              required
            />
          </div>

          {/* Grade and Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="grade">Grade *</Label>
              <Input
                id="grade"
                placeholder="e.g., 1, 2, Form 1"
                value={formData.grade}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('grade', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="section">Section (Optional)</Label>
              <Input
                id="section"
                placeholder="e.g., A, B, C"
                value={formData.section}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('section', e.target.value)}
              />
            </div>
          </div>

          {/* Department */}
          <div className="space-y-2">
            <Label htmlFor="department">Department *</Label>
            <Select value={formData.department} onValueChange={(value: string) => handleInputChange('department', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kindergarten">Kindergarten</SelectItem>
                <SelectItem value="primary">Primary</SelectItem>
                <SelectItem value="junior_high">Junior High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Class Teacher */}
          <div className="space-y-2">
            <Label htmlFor="classTeacherId">Class Teacher (Optional)</Label>
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
            <Label htmlFor="capacity">Class Capacity (Optional)</Label>
            <Input
              id="capacity"
              type="number"
              placeholder="e.g., 30"
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
              {isSubmitting ? 'Adding Class...' : 'Add Class'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

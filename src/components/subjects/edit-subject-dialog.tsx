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

interface Subject {
  _id: Id<'subjects'>;
  schoolId: string;
  subjectCode: string;
  subjectName: string;
  description?: string;
  category: 'core' | 'elective' | 'extracurricular';
  department: 'creche' | 'kindergarten' | 'primary' | 'junior_high';
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

interface EditSubjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectData: Subject;
  updatedBy: string;
}

export function EditSubjectDialog({
  open,
  onOpenChange,
  subjectData,
  updatedBy,
}: EditSubjectDialogProps): React.JSX.Element {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    subjectName: '',
    description: '',
    category: 'core' as 'core' | 'elective' | 'extracurricular',
    department: 'primary' as 'creche' | 'kindergarten' | 'primary' | 'junior_high',
  });

  const updateSubject = useMutation(api.subjects.updateSubject);

  useEffect(() => {
    if (subjectData) {
      setFormData({
        subjectName: subjectData.subjectName,
        description: subjectData.description || '',
        category: subjectData.category,
        department: subjectData.department,
      });
    }
  }, [subjectData]);

  const handleInputChange = (field: string, value: string): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validation
      if (!formData.subjectName || !formData.category || !formData.department) {
        toast.error('Please fill in all required fields');
        setIsSubmitting(false);
        return;
      }

      await updateSubject({
        subjectId: subjectData._id,
        subjectName: formData.subjectName,
        description: formData.description || undefined,
        category: formData.category,
        department: formData.department,
        updatedBy,
      });

      toast.success('Subject updated successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update subject');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Subject</DialogTitle>
          <DialogDescription>
            Update the subject details. Required fields are marked with an asterisk (*).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Subject Code (Read-only) */}
          <div className="space-y-2">
            <Label htmlFor="subjectCode">Subject Code</Label>
            <Input
              id="subjectCode"
              value={subjectData.subjectCode}
              disabled
              className="bg-muted"
            />
          </div>

          {/* Subject Name */}
          <div className="space-y-2">
            <Label htmlFor="subjectName">Subject Name *</Label>
            <Input
              id="subjectName"
              placeholder="e.g., Mathematics, English"
              value={formData.subjectName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('subjectName', e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the subject..."
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>

          {/* Category and Department */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value: string) => handleInputChange('category', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="core">Core</SelectItem>
                  <SelectItem value="elective">Elective</SelectItem>
                  <SelectItem value="extracurricular">Extracurricular</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
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
              {isSubmitting ? 'Updating Subject...' : 'Update Subject'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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
import { Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface BulkAddClassesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  createdBy: string;
}

interface ClassEntry {
  id: string;
  className: string;
  grade: string;
  section: string;
  department: 'kindergarten' | 'primary' | 'junior_high';
  classTeacherId: string;
  capacity: string;
}

export function BulkAddClassesDialog({
  open,
  onOpenChange,
  schoolId,
  createdBy,
}: BulkAddClassesDialogProps): React.JSX.Element {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [classes, setClasses] = useState<ClassEntry[]>([
    {
      id: '1',
      className: '',
      grade: '',
      section: '',
      department: 'primary',
      classTeacherId: '',
      capacity: '',
    },
  ]);

  const addBulkClasses = useMutation(api.classes.addBulkClasses);

  // Fetch teachers for selection
  const teachers = useQuery(
    api.teachers.getTeachersBySchool,
    { schoolId }
  );

  const addClassEntry = (): void => {
    const newId = (Math.max(...classes.map(c => parseInt(c.id))) + 1).toString();
    setClasses([
      ...classes,
      {
        id: newId,
        className: '',
        grade: '',
        section: '',
        department: 'primary',
        classTeacherId: '',
        capacity: '',
      },
    ]);
  };

  const removeClassEntry = (id: string): void => {
    if (classes.length > 1) {
      setClasses(classes.filter(c => c.id !== id));
    }
  };

  const updateClassEntry = (id: string, field: keyof ClassEntry, value: string): void => {
    setClasses(classes.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validation
      const invalidClasses = classes.filter(c => !c.className || !c.grade || !c.department);
      if (invalidClasses.length > 0) {
        toast.error('Please fill in class name, grade, and department for all entries');
        setIsSubmitting(false);
        return;
      }

      const classesData = classes.map(c => ({
        className: c.className,
        grade: c.grade,
        section: c.section || undefined,
        department: c.department,
        classTeacherId: c.classTeacherId || undefined,
        capacity: c.capacity ? parseInt(c.capacity) : undefined,
      }));

      const results = await addBulkClasses({
        schoolId,
        classes: classesData,
        createdBy,
      });

      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      if (failCount === 0) {
        toast.success(`Successfully added ${successCount} classes!`);
      } else {
        toast.warning(`Added ${successCount} classes. ${failCount} failed.`);
        results.filter(r => !r.success).forEach(r => {
          toast.error(`${r.className}: ${r.error}`);
        });
      }
      
      // Reset form
      setClasses([
        {
          id: '1',
          className: '',
          grade: '',
          section: '',
          department: 'primary',
          classTeacherId: '',
          capacity: '',
        },
      ]);
      
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add classes');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Add Classes</DialogTitle>
          <DialogDescription>
            Add multiple classes at once. Required fields are marked with an asterisk (*).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            {classes.map((classEntry, index) => (
              <div key={classEntry.id} className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">Class {index + 1}</Badge>
                  {classes.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeClassEntry(classEntry.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Class Name */}
                  <div className="space-y-2">
                    <Label>Class Name *</Label>
                    <Input
                      placeholder="e.g., Grade 1A"
                      value={classEntry.className}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        updateClassEntry(classEntry.id, 'className', e.target.value)
                      }
                    />
                  </div>

                  {/* Grade */}
                  <div className="space-y-2">
                    <Label>Grade *</Label>
                    <Input
                      placeholder="e.g., 1, 2, Form 1"
                      value={classEntry.grade}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        updateClassEntry(classEntry.id, 'grade', e.target.value)
                      }
                    />
                  </div>

                  {/* Section */}
                  <div className="space-y-2">
                    <Label>Section</Label>
                    <Input
                      placeholder="e.g., A, B"
                      value={classEntry.section}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        updateClassEntry(classEntry.id, 'section', e.target.value)
                      }
                    />
                  </div>

                  {/* Department */}
                  <div className="space-y-2">
                    <Label>Department *</Label>
                    <Select 
                      value={classEntry.department} 
                      onValueChange={(value: string) => 
                        updateClassEntry(classEntry.id, 'department', value)
                      }
                    >
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
                    <Label>Class Teacher</Label>
                    <Select 
                      value={classEntry.classTeacherId} 
                      onValueChange={(value: string) => 
                        updateClassEntry(classEntry.id, 'classTeacherId', value)
                      }
                    >
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
                    <Label>Capacity</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 30"
                      min="1"
                      value={classEntry.capacity}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        updateClassEntry(classEntry.id, 'capacity', e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={addClassEntry}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Another Class
          </Button>

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
              {isSubmitting ? 'Adding Classes...' : `Add ${classes.length} Class${classes.length > 1 ? 'es' : ''}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

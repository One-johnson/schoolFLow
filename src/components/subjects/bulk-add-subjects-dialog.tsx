'use client';

import { JSX, useState } from 'react';
import { useMutation } from 'convex/react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

interface SubjectInput {
  id: string;
  subjectName: string;
  description: string;
  category: 'core' | 'elective' | 'extracurricular';
  department: 'creche' | 'kindergarten' | 'primary' | 'junior_high';
}

interface BulkAddSubjectsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  createdBy: string;
}

export function BulkAddSubjectsDialog({
  open,
  onOpenChange,
  schoolId,
  createdBy,
}: BulkAddSubjectsDialogProps): React.JSX.Element {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [subjects, setSubjects] = useState<SubjectInput[]>([
    { id: '1', subjectName: '', description: '', category: 'core', department: 'primary' },
  ]);

  const addBulkSubjects = useMutation(api.subjects.addBulkSubjects);

  const addSubjectRow = (): void => {
    setSubjects((prev) => [
      ...prev,
      { 
        id: Date.now().toString(), 
        subjectName: '', 
        description: '', 
        category: 'core', 
        department: 'primary' 
      },
    ]);
  };

  const removeSubjectRow = (id: string): void => {
    if (subjects.length > 1) {
      setSubjects((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const updateSubject = (id: string, field: string, value: string): void => {
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, [field]: value } : s
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validation
      const validSubjects = subjects.filter((s) => s.subjectName.trim() !== '');
      
      if (validSubjects.length === 0) {
        toast.error('Please add at least one subject with a name');
        setIsSubmitting(false);
        return;
      }

      const results = await addBulkSubjects({
        schoolId,
        subjects: validSubjects.map((s) => ({
          subjectName: s.subjectName,
          description: s.description || undefined,
          category: s.category,
          department: s.department,
        })),
        createdBy,
      });

      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.length - successCount;

      if (successCount > 0) {
        toast.success(`${successCount} subject${successCount > 1 ? 's' : ''} added successfully`);
      }
      if (failureCount > 0) {
        toast.error(`${failureCount} subject${failureCount > 1 ? 's' : ''} failed to add`);
      }
      
      // Reset form
      setSubjects([{ id: '1', subjectName: '', description: '', category: 'core', department: 'primary' }]);
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add subjects');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Add Subjects</DialogTitle>
          <DialogDescription>
            Add multiple subjects at once. Fill in the details for each subject.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {subjects.map((subject, index) => (
              <Card key={subject.id}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold">Subject #{index + 1}</h4>
                      {subjects.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSubjectRow(subject.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Subject Name *</Label>
                      <Input
                        placeholder="e.g., Mathematics, English"
                        value={subject.subjectName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          updateSubject(subject.id, 'subjectName', e.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Description (Optional)</Label>
                      <Textarea
                        placeholder="Brief description..."
                        value={subject.description}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          updateSubject(subject.id, 'description', e.target.value)
                        }
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Category *</Label>
                        <Select
                          value={subject.category}
                          onValueChange={(value: string) => updateSubject(subject.id, 'category', value)}
                        >
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
                        <Label>Department *</Label>
                        <Select
                          value={subject.department}
                          onValueChange={(value: string) => updateSubject(subject.id, 'department', value)}
                        >
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
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={addSubjectRow}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Another Subject
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
              {isSubmitting ? 'Adding Subjects...' : `Add ${subjects.length} Subject${subjects.length > 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

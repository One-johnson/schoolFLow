'use client';

import { useState, useEffect } from 'react';
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
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import type { Id } from '../../../convex/_generated/dataModel';

interface AddTimetableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  classes: Array<{
    _id: Id<'classes'>;
    className: string;
  }>;
  academicYearId?: string;
  termId?: string;
}

export function AddTimetableDialog({
  open,
  onOpenChange,
  schoolId,
  classes,
  academicYearId: defaultAcademicYearId,
  termId: defaultTermId,
}: AddTimetableDialogProps): React.JSX.Element {
  const { user } = useAuth();
  const createTimetable = useMutation(api.timetables.createTimetable);

  const academicYears = useQuery(
    api.academicYears.getYearsBySchool,
    schoolId ? { schoolId } : 'skip'
  );
  const terms = useQuery(
    api.terms.getTermsBySchool,
    schoolId ? { schoolId } : 'skip'
  );
  const templates = useQuery(
    api.timetableTemplates.getTemplates,
    schoolId ? { schoolId } : 'skip'
  );
  const currentYear = useQuery(
    api.academicYears.getCurrentYear,
    schoolId ? { schoolId } : 'skip'
  );
  const currentTerm = useQuery(
    api.terms.getCurrentTerm,
    schoolId ? { schoolId } : 'skip'
  );

  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<string>(defaultAcademicYearId || '');
  const [selectedTermId, setSelectedTermId] = useState<string>(defaultTermId || '');
  const [scheduleSource, setScheduleSource] = useState<'default' | 'template'>('default');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      if (defaultAcademicYearId) {
        setSelectedAcademicYearId(defaultAcademicYearId);
      } else if (currentYear) {
        setSelectedAcademicYearId(currentYear._id);
      }
    }
  }, [open, defaultAcademicYearId, currentYear]);

  useEffect(() => {
    if (open) {
      if (defaultTermId) {
        setSelectedTermId(defaultTermId);
      } else if (currentTerm) {
        setSelectedTermId(currentTerm._id);
      }
    }
  }, [open, defaultTermId, currentTerm]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!selectedClass) {
      toast.error('Please select a class');
      return;
    }

    if (scheduleSource === 'template' && !selectedTemplateId) {
      toast.error('Please select a template');
      return;
    }

    const selectedClassData = classes.find(c => c._id === selectedClass);
    if (!selectedClassData) {
      toast.error('Invalid class selected');
      return;
    }

    setIsLoading(true);

    let periodStructure: string | undefined;
    if (scheduleSource === 'template' && selectedTemplateId) {
      const template = templates?.find((t) => t._id === selectedTemplateId);
      periodStructure = template?.periodStructure;
    }

    try {
      await createTimetable({
        schoolId,
        classId: selectedClass,
        className: selectedClassData.className,
        academicYearId: selectedAcademicYearId || undefined,
        termId: selectedTermId || undefined,
        periodStructure,
        createdBy: user?.userId || '',
      });

      toast.success(`Weekly timetable created for ${selectedClassData.className}`);
      
      // Reset form
      setSelectedClass('');
      setSelectedAcademicYearId(defaultAcademicYearId || currentYear?._id || '');
      setSelectedTermId(defaultTermId || currentTerm?._id || '');
      setScheduleSource('default');
      setSelectedTemplateId('');
      onOpenChange(false);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to create timetable');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Weekly Timetable</DialogTitle>
            <DialogDescription>
              Create a complete weekly timetable for a class. Default periods will be created for all weekdays (Monday-Friday).
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Academic Year */}
            {academicYears && academicYears.length > 0 && (
              <div className="grid gap-2">
                <Label htmlFor="academicYear">Academic Year</Label>
                <Select
                  value={selectedAcademicYearId}
                  onValueChange={(v) => {
                    setSelectedAcademicYearId(v);
                    setSelectedTermId('');
                  }}
                >
                  <SelectTrigger id="academicYear">
                    <SelectValue placeholder="Select academic year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((y) => (
                      <SelectItem key={y._id} value={y._id}>
                        {y.yearName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Term */}
            {terms && terms.length > 0 && (
              <div className="grid gap-2">
                <Label htmlFor="term">Term</Label>
                <Select value={selectedTermId} onValueChange={setSelectedTermId}>
                  <SelectTrigger id="term">
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    {terms
                      .filter((t) => !selectedAcademicYearId || t.academicYearId === selectedAcademicYearId)
                      .map((t) => (
                        <SelectItem key={t._id} value={t._id}>
                          {t.termName} {t.academicYearName ? `(${t.academicYearName})` : ''}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Class Selection */}
            <div className="grid gap-2">
              <Label htmlFor="class">Class *</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger id="class">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls._id} value={cls._id}>
                      {cls.className}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Schedule source */}
            {templates && templates.length > 0 && (
              <div className="grid gap-2">
                <Label>Schedule Structure</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="scheduleSource"
                      checked={scheduleSource === 'default'}
                      onChange={() => {
                        setScheduleSource('default');
                        setSelectedTemplateId('');
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">Default schedule</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="scheduleSource"
                      checked={scheduleSource === 'template'}
                      onChange={() => setScheduleSource('template')}
                      className="rounded"
                    />
                    <span className="text-sm">Use template</span>
                  </label>
                </div>
                {scheduleSource === 'template' && (
                  <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((t) => (
                        <SelectItem key={t._id} value={t._id}>
                          {t.templateName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {/* Info about default schedule */}
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-medium mb-2">
                {scheduleSource === 'template' && selectedTemplateId
                  ? 'Template periods will be used for all weekdays'
                  : 'Default Schedule (Mon-Fri):'}
              </p>
              {scheduleSource !== 'template' && (
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li>• Assembly: 7:30 AM - 8:00 AM</li>
                  <li>• Period 1: 8:00 AM - 9:10 AM</li>
                  <li>• Period 2: 9:10 AM - 10:20 AM</li>
                  <li>• Break: 10:20 AM - 10:40 AM</li>
                  <li>• Period 3: 10:45 AM - 11:55 AM</li>
                  <li>• Period 4: 11:55 AM - 1:05 PM</li>
                  <li>• Lunch: 1:05 PM - 1:35 PM</li>
                  <li>• Period 5: 1:35 PM - 2:45 PM</li>
                  <li>• Period 6: 2:45 PM - 3:55 PM</li>
                  <li>• Closing: 3:55 PM - 4:00 PM</li>
                </ul>
              )}
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
              Create Weekly Timetable
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

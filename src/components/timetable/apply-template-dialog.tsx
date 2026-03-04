'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Layout } from 'lucide-react';
import type { Id } from '../../../convex/_generated/dataModel';

interface Class {
  _id: Id<'classes'>;
  className: string;
  status: 'active' | 'inactive';
}

interface ApplyTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableClasses: Class[];
  schoolId: string;
  createdBy: string;
  academicYearId?: string;
  termId?: string;
}

export function ApplyTemplateDialog({
  open,
  onOpenChange,
  availableClasses,
  schoolId,
  createdBy,
  academicYearId: defaultAcademicYearId,
  termId: defaultTermId,
}: ApplyTemplateDialogProps): React.JSX.Element {
  const applyTemplate = useMutation(api.timetableTemplates.applyTemplate);

  const templates = useQuery(
    api.timetableTemplates.getTemplates,
    schoolId ? { schoolId } : 'skip'
  );
  const academicYears = useQuery(
    api.academicYears.getYearsBySchool,
    schoolId ? { schoolId } : 'skip'
  );
  const terms = useQuery(
    api.terms.getTermsBySchool,
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

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<string>('');
  const [selectedTermId, setSelectedTermId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      setSelectedAcademicYearId(defaultAcademicYearId || currentYear?._id || '');
    }
  }, [open, defaultAcademicYearId, currentYear]);

  useEffect(() => {
    if (open) {
      setSelectedTermId(defaultTermId || currentTerm?._id || '');
    }
  }, [open, defaultTermId, currentTerm]);

  const selectedClass = useMemo(() => {
    return availableClasses.find(c => c._id === selectedClassId);
  }, [availableClasses, selectedClassId]);

  const selectedTemplate = useMemo(() => {
    return templates?.find(t => t._id === selectedTemplateId);
  }, [templates, selectedTemplateId]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!selectedTemplateId || !selectedClassId) {
      toast.error('Please select both template and class');
      return;
    }

    if (!selectedClass) {
      toast.error('Invalid class selected');
      return;
    }

    setIsLoading(true);

    try {
      await applyTemplate({
        templateId: selectedTemplateId as Id<'timetableTemplates'>,
        schoolId,
        classId: selectedClassId,
        className: selectedClass.className,
        createdBy,
        academicYearId: selectedAcademicYearId || undefined,
        termId: selectedTermId || undefined,
      });

      toast.success(`Template applied to ${selectedClass.className} successfully`);
      
      // Reset form
      setSelectedTemplateId('');
      setSelectedClassId('');
      setSelectedAcademicYearId(defaultAcademicYearId || currentYear?._id || '');
      setSelectedTermId(defaultTermId || currentTerm?._id || '');
      onOpenChange(false);
    } catch (error) {
      console.error('Apply template error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to apply template');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Apply Template</DialogTitle>
            <DialogDescription>
              Create a new timetable from a saved template
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Template Selection */}
            <div className="grid gap-2">
              <Label htmlFor="template">Select Template *</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger id="template">
                  <SelectValue placeholder="Choose a template" />
                </SelectTrigger>
                <SelectContent>
                  {!templates || templates.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No templates available
                    </SelectItem>
                  ) : (
                    templates.map((template) => (
                      <SelectItem key={template._id} value={template._id}>
                        <div className="flex items-center gap-2">
                          {template.templateName}
                          {template.isDefault && (
                            <Badge variant="outline" className="text-xs">
                              Default
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {selectedTemplate?.description && (
                <p className="text-xs text-muted-foreground">
                  {selectedTemplate.description}
                </p>
              )}
            </div>

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
                      .filter(
                        (t) =>
                          !selectedAcademicYearId ||
                          t.academicYearId === selectedAcademicYearId
                      )
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
              <Label htmlFor="class">Apply to Class *</Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger id="class">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {availableClasses.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No available classes
                    </SelectItem>
                  ) : (
                    availableClasses.map((cls) => (
                      <SelectItem key={cls._id} value={cls._id}>
                        {cls.className}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Template Preview */}
            {selectedTemplate && (
              <div className="rounded-lg bg-muted p-3 text-sm">
                <p className="font-medium mb-2">Template Preview:</p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li>• Created: {new Date(selectedTemplate.createdAt).toLocaleDateString()}</li>
                  {selectedTemplate.periodStructure && (
                    <li>
                      • Periods: {JSON.parse(selectedTemplate.periodStructure).length} periods defined
                    </li>
                  )}
                  <li className="text-blue-600">• Will create periods for all weekdays</li>
                </ul>
              </div>
            )}
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
            <Button 
              type="submit" 
              disabled={
                isLoading || 
                availableClasses.length === 0 || 
                !templates || 
                templates.length === 0
              }
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Layout className="mr-2 h-4 w-4" />
              Apply Template
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import {  useState } from 'react';
import { useMutation } from 'convex/react';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';
import type { Id } from '../../../convex/_generated/dataModel';

interface SaveAsTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timetableId: Id<'timetables'>;
  className: string;
  schoolId: string;
  createdBy: string;
}

export function SaveAsTemplateDialog({
  open,
  onOpenChange,
  timetableId,
  className,
  schoolId,
  createdBy,
}: SaveAsTemplateDialogProps): React.JSX.Element {
  const createTemplate = useMutation(api.timetableTemplates.createTemplate);

  const [templateName, setTemplateName] = useState<string>(`${className} Template`);
  const [description, setDescription] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    setIsLoading(true);

    try {
      await createTemplate({
        schoolId,
        templateName: templateName.trim(),
        description: description.trim() || undefined,
        timetableId,
        createdBy,
      });

      toast.success('Template saved successfully');
      
      // Reset form
      setTemplateName(`${className} Template`);
      setDescription('');
      onOpenChange(false);
    } catch (error) {
      console.error('Create template error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save template');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
            <DialogDescription>
              Save the period structure of {className} as a reusable template
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Template Name */}
            <div className="grid gap-2">
              <Label htmlFor="templateName">Template Name *</Label>
              <Input
                id="templateName"
                value={templateName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTemplateName(e.target.value)}
                placeholder="e.g., Standard Weekly Template"
              />
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                placeholder="Describe when to use this template..."
                rows={3}
              />
            </div>

            {/* Info */}
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-medium mb-2">What will be saved:</p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>• Period names and timings</li>
                <li>• Break times</li>
                <li>• Period structure for all weekdays</li>
                <li className="text-destructive">• Teacher assignments will NOT be saved</li>
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
              <Save className="mr-2 h-4 w-4" />
              Save Template
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

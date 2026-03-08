'use client';

import { JSX, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
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

interface CreateAnnouncementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  schoolId?: string;
  createdBy?: string;
}

export function CreateAnnouncementDialog({ open, onOpenChange, onSuccess, schoolId: schoolIdProp, createdBy: createdByProp }: CreateAnnouncementDialogProps): React.JSX.Element {
  const { user } = useAuth();
  const schoolId = schoolIdProp ?? user?.schoolId ?? '';
  const createdBy = createdByProp ?? user?.userId ?? user?.email ?? '';
  const createAnnouncement = useMutation(api.announcements.create);
  const classes = useQuery(api.classes.getClassesBySchool, schoolId ? { schoolId } : 'skip');
  const departments = useQuery(
    api.departments.getDepartmentsBySchool,
    schoolId ? { schoolId } : 'skip'
  );

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetType, setTargetType] = useState<'school' | 'class' | 'department' | 'teachers'>('school');
  const [targetId, setTargetId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getTargetName = (): string => {
    if (targetType === 'class') {
      const cls = classes?.find((c) => c._id === targetId);
      return cls?.className || '';
    }
    if (targetType === 'department') {
      const dept = departments?.find((d) => d._id === targetId);
      return dept?.name || '';
    }
    return '';
  };

  const resetForm = (): void => {
    setTitle('');
    setContent('');
    setTargetType('school');
    setTargetId('');
  };

  const handleSubmit = async (): Promise<void> => {
    if (!title.trim() || !content.trim()) return;
    if ((targetType === 'class' || targetType === 'department') && !targetId) return;

    setIsSubmitting(true);
    try {
      await createAnnouncement({
        schoolId,
        title: title.trim(),
        content: content.trim(),
        targetType,
        targetId: targetType === 'school' || targetType === 'teachers' ? undefined : targetId,
        targetName: getTargetName() || undefined,
        createdBy,
      });
      toast.success('Announcement created as draft');
      onSuccess();
      onOpenChange(false);
      resetForm();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error('Failed to create announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const needsTarget = targetType === 'class' || targetType === 'department';
  const isDisabled = isSubmitting || !title.trim() || !content.trim() || (needsTarget && !targetId);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) resetForm(); onOpenChange(isOpen); }}>
      <DialogContent className="sm:max-w-150">
        <DialogHeader>
          <DialogTitle>New Announcement</DialogTitle>
          <DialogDescription>Create a new announcement for your school</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="ann-title">Title</Label>
            <Input
              id="ann-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter announcement title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ann-content">Content</Label>
            <Textarea
              id="ann-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter announcement content..."
              className="min-h-30"
            />
          </div>
          <div className="space-y-2">
            <Label>Target Audience</Label>
            <Select value={targetType} onValueChange={(value) => { setTargetType(value as typeof targetType); setTargetId(''); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="school">Entire School</SelectItem>
                <SelectItem value="class">Single Class</SelectItem>
                <SelectItem value="department">Department</SelectItem>
                <SelectItem value="teachers">Teachers</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {targetType === 'class' && (
            <div className="space-y-2">
              <Label>Select Class</Label>
              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes?.map((cls) => (
                    <SelectItem key={cls._id} value={cls._id}>
                      {cls.className}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {targetType === 'department' && (
            <div className="space-y-2">
              <Label>Select Department</Label>
              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a department" />
                </SelectTrigger>
                <SelectContent>
                  {departments?.map((dept) => (
                    <SelectItem key={dept._id} value={dept._id}>
                      {dept.name} ({dept.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isDisabled}>
            {isSubmitting ? 'Creating...' : 'Save as Draft'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

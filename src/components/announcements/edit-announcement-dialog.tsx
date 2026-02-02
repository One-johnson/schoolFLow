'use client';

import { JSX, useState, useEffect } from 'react';
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
import type { Id } from '../../../convex/_generated/dataModel';

export interface Announcement {
  _id: Id<'announcements'>;
  schoolId: string;
  title: string;
  content: string;
  targetType: 'school' | 'class' | 'department' | 'teachers';
  targetId?: string;
  targetName?: string;
  status: 'draft' | 'published' | 'archived';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

interface EditAnnouncementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  announcement: Announcement;
  onSuccess: () => void;
}

const DEPARTMENTS = [
  { value: 'creche', label: 'Creche' },
  { value: 'kindergarten', label: 'Kindergarten' },
  { value: 'primary', label: 'Primary' },
  { value: 'junior_high', label: 'Junior High' },
];

export function EditAnnouncementDialog({ open, onOpenChange, announcement, onSuccess }: EditAnnouncementDialogProps): React.JSX.Element {
  const { user } = useAuth();
  const updateAnnouncement = useMutation(api.announcements.update);
  const classes = useQuery(api.classes.getClassesBySchool, {
    schoolId: user?.schoolId || '',
  });

  const [title, setTitle] = useState(announcement.title);
  const [content, setContent] = useState(announcement.content);
  const [targetType, setTargetType] = useState<'school' | 'class' | 'department' | 'teachers'>(announcement.targetType);
  const [targetId, setTargetId] = useState(announcement.targetId || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setTitle(announcement.title);
    setContent(announcement.content);
    setTargetType(announcement.targetType);
    setTargetId(announcement.targetId || '');
  }, [announcement]);

  const getTargetName = (): string => {
    if (targetType === 'class') {
      const cls = classes?.find((c) => c._id === targetId);
      return cls?.className || '';
    }
    if (targetType === 'department') {
      const dept = DEPARTMENTS.find((d) => d.value === targetId);
      return dept?.label || '';
    }
    return '';
  };

  const handleSubmit = async (): Promise<void> => {
    if (!title.trim() || !content.trim()) return;
    if ((targetType === 'class' || targetType === 'department') && !targetId) return;

    setIsSubmitting(true);
    try {
      await updateAnnouncement({
        id: announcement._id,
        title: title.trim(),
        content: content.trim(),
        targetType,
        targetId: targetType === 'school' || targetType === 'teachers' ? undefined : targetId,
        targetName: getTargetName() || undefined,
        updatedBy: user?.userId || '',
      });
      toast.success('Announcement updated');
      onSuccess();
      onOpenChange(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error('Failed to update announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const needsTarget = targetType === 'class' || targetType === 'department';
  const isDisabled = isSubmitting || !title.trim() || !content.trim() || (needsTarget && !targetId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-150">
        <DialogHeader>
          <DialogTitle>Edit Announcement</DialogTitle>
          <DialogDescription>Update this draft announcement</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-ann-title">Title</Label>
            <Input
              id="edit-ann-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter announcement title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-ann-content">Content</Label>
            <Textarea
              id="edit-ann-content"
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
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept.value} value={dept.value}>
                      {dept.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isDisabled}>
            {isSubmitting ? 'Updating...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

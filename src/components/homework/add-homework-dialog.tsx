'use client';

import { useState, useRef } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { toast } from 'sonner';
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
import { Paperclip, X } from 'lucide-react';

interface Teacher {
  id: string;
  schoolId: string;
  firstName: string;
  lastName: string;
  classIds?: string[];
  classNames?: string[];
}

interface AddHomeworkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher: Teacher;
}

export function AddHomeworkDialog({
  open,
  onOpenChange,
  teacher,
}: AddHomeworkDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [classId, setClassId] = useState('');
  const [className, setClassName] = useState('');
  const [subjectId, setSubjectId] = useState<string>('__none__');
  const [subjectName, setSubjectName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createHomework = useMutation(api.homework.create);
  const generateUploadUrl = useMutation(api.photos.generateUploadUrl);
  const subjects = useQuery(
    api.subjects.getSubjectsBySchool,
    teacher?.schoolId ? { schoolId: teacher.schoolId } : 'skip'
  );

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setClassId('');
    setClassName('');
    setSubjectId('__none__');
    setSubjectName('');
    setDueDate('');
    setAttachmentFiles([]);
  };

  const handleClassChange = (cid: string) => {
    setClassId(cid);
    const idx = (teacher.classIds ?? []).indexOf(cid);
    setClassName(teacher.classNames?.[idx] ?? '');
  };

  const handleSubjectChange = (sid: string) => {
    setSubjectId(sid);
    if (sid === '__none__') {
      setSubjectName('');
    } else {
      const sub = subjects?.find((s) => s._id === sid);
      setSubjectName(sub?.subjectName ?? '');
    }
  };

  const addFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setAttachmentFiles((prev) => [...prev, ...files]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (idx: number) => {
    setAttachmentFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const uploadFile = async (file: File): Promise<string> => {
    const uploadUrl = await generateUploadUrl();
    const result = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': file.type },
      body: file,
    });
    if (!result.ok) throw new Error('Upload failed');
    const { storageId } = await result.json();
    return storageId;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!classId) {
      toast.error('Please select a class');
      return;
    }
    if (!dueDate) {
      toast.error('Due date is required');
      return;
    }

    setIsSubmitting(true);
    try {
      let attachmentStorageIds: string[] | undefined;
      if (attachmentFiles.length > 0) {
        attachmentStorageIds = await Promise.all(
          attachmentFiles.map((f) => uploadFile(f))
        );
      }

      await createHomework({
        schoolId: teacher.schoolId,
        teacherId: teacher.id,
        teacherName: `${teacher.firstName} ${teacher.lastName}`,
        classId,
        className,
        subjectId: subjectId && subjectId !== '__none__' ? subjectId : undefined,
        subjectName: subjectName && subjectId !== '__none__' ? subjectName : undefined,
        title: title.trim(),
        description: description.trim(),
        dueDate,
        attachmentStorageIds,
      });

      toast.success('Homework created');
      resetForm();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create homework');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Homework</DialogTitle>
          <DialogDescription>
            Create homework for your class. Parents will be notified.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chapter 5 Exercises"
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Instructions for students..."
              rows={3}
            />
          </div>
          <div>
            <Label>Class *</Label>
            <Select value={classId} onValueChange={handleClassChange} required>
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {(teacher.classIds ?? []).map((cid, i) => (
                  <SelectItem key={cid} value={cid}>
                    {teacher.classNames?.[i] ?? cid}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Subject (optional)</Label>
            <Select value={subjectId} onValueChange={handleSubjectChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {subjects?.filter((s) => s.status === 'active').map((s) => (
                  <SelectItem key={s._id} value={s._id}>
                    {s.subjectName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="dueDate">Due Date *</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Attachments (optional)</Label>
            <div className="flex gap-2 mt-1">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={addFiles}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-4 w-4 mr-1" />
                Add files
              </Button>
            </div>
            {attachmentFiles.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm">
                {attachmentFiles.map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="truncate flex-1">{f.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => removeFile(i)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Homework'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

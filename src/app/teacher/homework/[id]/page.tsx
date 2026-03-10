'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { useTeacherAuth } from '@/hooks/useTeacherAuth';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Calendar,
  Paperclip,
  Users,
  FileDown,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import type { Id } from '../../../../../convex/_generated/dataModel';

export default function TeacherHomeworkDetailPage() {
  const params = useParams();
  const { teacher } = useTeacherAuth();
  const id = params.id as Id<'homework'>;

  const homework = useQuery(api.homework.getById, { id });
  const submissions = useQuery(api.homework.getSubmissionsByHomework, { homeworkId: id });
  const markSubmission = useMutation(api.homework.markSubmission);

  const [markingId, setMarkingId] = useState<Id<'homeworkSubmissions'> | null>(null);
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');


  const handleMark = async () => {
    if (!markingId || !teacher) return;
    try {
      await markSubmission({
        id: markingId,
        teacherId: teacher.id,
        grade: grade || undefined,
        feedback: feedback || undefined,
      });
      toast.success('Submission marked');
      setMarkingId(null);
      setGrade('');
      setFeedback('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to mark');
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  if (!teacher) {
    return (
      <div className="space-y-6 py-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (homework === null || homework === undefined) {
    return (
      <div className="space-y-6 py-4">
        <Button variant="ghost" asChild>
          <Link href="/teacher/homework">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <p className="text-muted-foreground">Homework not found.</p>
      </div>
    );
  }

  if (homework.teacherId !== teacher.id) {
    return (
      <div className="space-y-6 py-4">
        <Button variant="ghost" asChild>
          <Link href="/teacher/homework">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <p className="text-muted-foreground">You don&apos;t have access to this homework.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/teacher/homework">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {homework.title}
            {homework.status === 'archived' && (
              <Badge variant="secondary">Archived</Badge>
            )}
          </CardTitle>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3" />
              {homework.className}
            </span>
            {homework.subjectName && <span>{homework.subjectName}</span>}
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3" />
              Due {formatDate(homework.dueDate)}
            </span>
            {homework.attachmentStorageIds && homework.attachmentStorageIds.length > 0 && (
              <span className="flex items-center gap-1">
                <Paperclip className="h-3.5 w-3" />
                {homework.attachmentStorageIds.length} attachment(s)
              </span>
            )}
          </div>
          {homework.attachmentStorageIds && homework.attachmentStorageIds.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {homework.attachmentStorageIds.map((sid, i) => (
                <AttachmentLink key={sid} storageId={sid} label={`Attachment ${i + 1}`} />
              ))}
            </div>
          )}
        </CardHeader>
        {homework.description && (
          <CardContent className="pt-0">
            <p className="whitespace-pre-wrap text-sm">{homework.description}</p>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Submissions ({submissions?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {submissions === undefined ? (
            <Skeleton className="h-24 w-full" />
          ) : submissions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No submissions yet.</p>
          ) : (
            <div className="space-y-3">
              {submissions.map((sub) => (
                <div
                  key={sub._id}
                  className="flex items-center justify-between gap-4 p-4 rounded-lg border"
                >
                  <div>
                    <p className="font-medium">{sub.studentName}</p>
                    <p className="text-sm text-muted-foreground">
                      Submitted by {sub.submittedByName} • {formatDate(sub.createdAt)}
                    </p>
                    {sub.status === 'marked' && sub.grade && (
                      <p className="text-sm mt-1">
                        Grade: {sub.grade}
                        {sub.feedback && ` • ${sub.feedback}`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {sub.storageId && (
                      <HomeworkFileLink storageId={sub.storageId} fileName={sub.fileName} />
                    )}
                    {sub.status === 'submitted' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setMarkingId(sub._id);
                          setGrade(sub.grade ?? '');
                          setFeedback(sub.feedback ?? '');
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Mark
                      </Button>
                    )}
                    {sub.status === 'marked' && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Marked
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <MarkSubmissionDialog
        open={!!markingId}
        onOpenChange={() => setMarkingId(null)}
        grade={grade}
        setGrade={setGrade}
        feedback={feedback}
        setFeedback={setFeedback}
        onMark={handleMark}
      />
    </div>
  );
}

function AttachmentLink({ storageId, label }: { storageId: string; label: string }) {
  const url = useQuery(api.photos.getFileUrl, { storageId });
  if (!url) return null;
  return (
    <Button size="sm" variant="outline" asChild>
      <a href={url} target="_blank" rel="noopener noreferrer">
        <FileDown className="h-4 w-4 mr-1" />
        {label}
      </a>
    </Button>
  );
}

function HomeworkFileLink({
  storageId,
  fileName,
}: {
  storageId: string;
  fileName: string;
}) {
  const url = useQuery(api.photos.getFileUrl, { storageId });
  if (!url) return null;
  return (
    <Button size="sm" variant="ghost" asChild>
      <a href={url} target="_blank" rel="noopener noreferrer">
        <FileDown className="h-4 w-4 mr-1" />
        {fileName}
      </a>
    </Button>
  );
}

function MarkSubmissionDialog({
  open,
  onOpenChange,
  grade,
  setGrade,
  feedback,
  setFeedback,
  onMark,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  grade: string;
  setGrade: (v: string) => void;
  feedback: string;
  setFeedback: (v: string) => void;
  onMark: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark Submission</DialogTitle>
          <DialogDescription>Add grade and feedback for this submission.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Grade</Label>
            <Input
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="e.g. A, 85%"
            />
          </div>
          <div>
            <Label>Feedback</Label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Optional feedback..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={async () => {
              setLoading(true);
              await onMark();
              setLoading(false);
              onOpenChange(false);
            }}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

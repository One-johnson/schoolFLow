'use client';

import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useParentAuth } from '@/hooks/useParentAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Megaphone } from 'lucide-react';

export default function ParentAnnouncementsPage() {
  const { parent } = useParentAuth();

  const announcements = useQuery(
    api.announcements.getPublishedForParent,
    parent
      ? {
          schoolId: parent.schoolId,
          studentClassIds: parent.students?.map((s) => s.classId) ?? [],
        }
      : 'skip'
  );

  if (!parent) {
    return (
      <div className="space-y-6 py-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Megaphone className="h-7 w-7" />
          Announcements
        </h1>
        <p className="text-muted-foreground mt-1">
          School and class announcements relevant to your children
        </p>
      </div>

      <div className="space-y-4">
        {announcements === undefined ? (
          <Skeleton className="h-32 w-full" />
        ) : announcements.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No announcements at the moment.</p>
            </CardContent>
          </Card>
        ) : (
          announcements.map((a) => (
            <Card key={a._id}>
              <CardHeader>
                <CardTitle className="text-lg">{a.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {new Date(a.createdAt).toLocaleDateString()} • {a.targetName ?? 'School-wide'}
                </p>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{a.content}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

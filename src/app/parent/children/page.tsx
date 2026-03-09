'use client';

import { useParentAuth } from '@/hooks/useParentAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, Users } from 'lucide-react';
import Link from 'next/link';

export default function ParentChildrenPage() {
  const { parent } = useParentAuth();

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
          <Users className="h-7 w-7" />
          My Children
        </h1>
        <p className="text-muted-foreground mt-1">
          View progress and details for each of your children
        </p>
      </div>

      <div className="grid gap-4">
        {parent.students && parent.students.length > 0 ? (
          parent.students.map((student) => (
            <Link key={student.id} href={`/parent/children/${student.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">
                    {student.firstName} {student.lastName}
                  </CardTitle>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Class: {student.className}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Student ID: {student.studentId}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No children linked to your account.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Please contact your school if you believe this is an error.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

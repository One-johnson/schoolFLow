'use client';

import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useParentAuth } from '@/hooks/useParentAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, AlertCircle, CheckCircle } from 'lucide-react';
import { PhotoCell } from '@/components/students/photo-cell';
import type { Id } from '../../../../convex/_generated/dataModel';

export default function ParentFeesPage() {
  const { parent } = useParentAuth();

  const studentIds = parent?.students?.flatMap((s) => [s.id, s.studentId]) ?? [];
  const obligations = useQuery(
    api.feePayments.getFeeObligationsForParent,
    parent ? { schoolId: parent.schoolId, studentIds } : 'skip'
  );

  if (!parent) {
    return (
      <div className="space-y-6 py-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const byStudent = new Map<
    string,
    { name: string; student: (typeof parent.students)[0]; obligations: typeof obligations }
  >();
  if (obligations && parent.students) {
    for (const student of parent.students) {
      const studentObs = obligations.filter(
        (o) => o.studentId === student.id || o.studentId === student.studentId
      );
      if (studentObs.length > 0) {
        byStudent.set(student.id, {
          name: `${student.firstName} ${student.lastName}`,
          student,
          obligations: studentObs,
        });
      }
    }
  }

  const totalBalance = obligations?.reduce((sum, o) => sum + (o.totalBalance ?? 0), 0) ?? 0;

  return (
    <div className="space-y-6 py-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Wallet className="h-7 w-7" />
          Fee Status
        </h1>
        <p className="text-muted-foreground mt-1">
          View fee obligations and payment status for your children
        </p>
      </div>

      {totalBalance > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="py-4 flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-amber-600" />
            <div>
              <p className="font-semibold">Outstanding Balance</p>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                {totalBalance.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {obligations === undefined ? (
          <Skeleton className="h-32 w-full" />
        ) : obligations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No fee obligations on record.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Contact the school for fee-related inquiries.
              </p>
            </CardContent>
          </Card>
        ) : (
          Array.from(byStudent.entries()).map(([studentId, { name, student, obligations: obs }]) => (
            <Card key={studentId}>
              <CardHeader className="flex flex-row items-center gap-3">
                <PhotoCell
                  photoStorageId={student.photoStorageId as Id<'_storage'> | undefined}
                  firstName={student.firstName}
                  lastName={student.lastName}
                />
                <CardTitle>{name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(obs ?? []).map((o) => (
                    <div
                      key={o._id}
                      className="flex justify-between items-center py-2 border-b last:border-0"
                    >
                      <div>
                        <p className="font-medium">
                          {o.termId ? 'Term fees' : o.feeStructureId ? 'Structure fees' : 'Fees'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Due: {o.totalAmountDue?.toLocaleString()} • Paid: {o.totalAmountPaid?.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        {o.totalBalance > 0 ? (
                          <span className="text-destructive font-semibold">
                            {o.totalBalance.toLocaleString()} due
                          </span>
                        ) : (
                          <span className="text-emerald-600 flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            Paid
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

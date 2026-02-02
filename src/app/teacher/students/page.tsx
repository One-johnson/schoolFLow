'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useTeacherAuth } from '@/hooks/useTeacherAuth';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, User } from 'lucide-react';
import Link from 'next/link';

export default function TeacherStudentsPage() {
  const { teacher } = useTeacherAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const classId = teacher?.classIds?.[0];

  const students = useQuery(
    api.students.getStudentsByClassId,
    classId ? { classId } : 'skip'
  );

  const filteredStudents = students?.filter((student) => {
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    return (
      fullName.includes(query) ||
      student.studentId.toLowerCase().includes(query)
    );
  });

  if (!teacher) {
    return (
      <div className="space-y-4 py-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4">
      <div>
        <h1 className="text-xl font-bold">Students</h1>
        {teacher.classNames && teacher.classNames.length > 0 && (
          <p className="text-sm text-muted-foreground">{teacher.classNames[0]}</p>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Student Count */}
      {students && (
        <p className="text-sm text-muted-foreground">
          {filteredStudents?.length} student{filteredStudents?.length !== 1 ? 's' : ''}
          {searchQuery && ` matching "${searchQuery}"`}
        </p>
      )}

      {/* Student List */}
      <div className="space-y-3">
        {!students ? (
          <>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </>
        ) : filteredStudents?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No students found</p>
          </div>
        ) : (
          filteredStudents?.map((student) => (
            <Link key={student._id} href={`/teacher/students/${student._id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-semibold text-primary">
                      {student.firstName[0]}
                      {student.lastName[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {student.firstName} {student.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {student.studentId}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      student.status === 'continuing' || student.status === 'fresher'
                        ? 'bg-green-100 text-green-700'
                        : student.status === 'inactive'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {student.status}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

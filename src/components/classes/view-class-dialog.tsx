'use client';

import { useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { JSX } from 'react';

interface Class {
  _id: Id<'classes'>;
  schoolId: string;
  classCode: string;
  className: string;
  grade: string;
  section?: string;
  department: 'creche' | 'kindergarten' | 'primary' | 'junior_high';
  classTeacherId?: string;
  capacity?: number;
  currentStudentCount: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

interface ViewClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classData: Class;
}

export function ViewClassDialog({
  open,
  onOpenChange,
  classData,
}: ViewClassDialogProps): React.JSX.Element {
  // Fetch teacher details if classTeacherId exists
  const teacher = useQuery(
    api.teachers.getTeacherById,
    classData.classTeacherId ? { teacherId: classData.classTeacherId as Id<'teachers'> } : 'skip'
  );

  const getDepartmentBadge = (department: string): React.JSX.Element => {
    switch (department) {
      case 'creche':
        return <Badge className="bg-orange-500">Creche</Badge>;
      case 'kindergarten':
        return <Badge className="bg-pink-500">Kindergarten</Badge>;
      case 'primary':
        return <Badge className="bg-blue-500">Primary</Badge>;
      case 'junior_high':
        return <Badge className="bg-purple-500">Junior High</Badge>;
      default:
        return <Badge>{department}</Badge>;
    }
  };

  const getStatusBadge = (status: string): React.JSX.Element => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-500">Inactive</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{classData.className}</DialogTitle>
          <DialogDescription>
            Class Code: {classData.classCode}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Class Name</p>
                <p className="font-medium">{classData.className}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Class Code</p>
                <p className="font-medium">{classData.classCode}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Grade</p>
                <p className="font-medium">{classData.grade}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Section</p>
                <p className="font-medium">{classData.section || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Department</p>
                {getDepartmentBadge(classData.department)}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                {getStatusBadge(classData.status)}
              </div>
            </div>
          </div>

          <Separator />

          {/* Class Teacher Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Class Teacher</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Teacher Name</p>
                <p className="font-medium">
                  {teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Not Assigned'}
                </p>
              </div>
              {teacher && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{teacher.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{teacher.phone}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          <Separator />

          {/* Student Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Student Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Current Students</p>
                <p className="text-2xl font-bold">{classData.currentStudentCount}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Class Capacity</p>
                <p className="text-2xl font-bold">{classData.capacity || 'Not Set'}</p>
              </div>
              {classData.capacity && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Occupancy Rate</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          classData.currentStudentCount > classData.capacity
                            ? 'bg-red-500'
                            : classData.currentStudentCount / classData.capacity > 0.9
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{
                          width: `${Math.min((classData.currentStudentCount / classData.capacity) * 100, 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {Math.round((classData.currentStudentCount / classData.capacity) * 100)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Timestamps */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Timestamps</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Created At</p>
                <p className="font-medium">{new Date(classData.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">{new Date(classData.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

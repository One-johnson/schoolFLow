'use client';

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

interface Subject {
  _id: Id<'subjects'>;
  schoolId: string;
  subjectCode: string;
  subjectName: string;
  description?: string;
  category: 'core' | 'elective' | 'extracurricular';
  department: 'creche' | 'kindergarten' | 'primary' | 'junior_high';
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

interface ViewSubjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectData: Subject;
}

export function ViewSubjectDialog({
  open,
  onOpenChange,
  subjectData,
}: ViewSubjectDialogProps): JSX.Element {
  const getDepartmentBadge = (department: string): JSX.Element => {
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

  const getCategoryBadge = (category: string): JSX.Element => {
    switch (category) {
      case 'core':
        return <Badge className="bg-green-600">Core</Badge>;
      case 'elective':
        return <Badge className="bg-blue-600">Elective</Badge>;
      case 'extracurricular':
        return <Badge className="bg-purple-600">Extracurricular</Badge>;
      default:
        return <Badge>{category}</Badge>;
    }
  };

  const getStatusBadge = (status: string): JSX.Element => {
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Subject Details</DialogTitle>
          <DialogDescription>
            Comprehensive information about this subject
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Section */}
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold">{subjectData.subjectName}</h3>
                <p className="text-sm text-muted-foreground">{subjectData.subjectCode}</p>
              </div>
              {getStatusBadge(subjectData.status)}
            </div>
          </div>

          <Separator />

          {/* Subject Information */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm uppercase text-muted-foreground">Subject Information</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <div className="mt-1">{getCategoryBadge(subjectData.category)}</div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Department</p>
                <div className="mt-1">{getDepartmentBadge(subjectData.department)}</div>
              </div>
            </div>

            {subjectData.description && (
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="mt-1 text-sm">{subjectData.description}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Metadata */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm uppercase text-muted-foreground">Metadata</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Created At</p>
                <p className="text-sm font-medium">{new Date(subjectData.createdAt).toLocaleDateString()}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="text-sm font-medium">{new Date(subjectData.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

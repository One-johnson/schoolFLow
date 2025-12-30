'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Teacher } from '@/types';
import { Mail, Phone, MapPin, Calendar, Briefcase, DollarSign, User } from 'lucide-react';

interface ViewTeacherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher: Teacher;
}

export function ViewTeacherDialog({
  open,
  onOpenChange,
  teacher,
}: ViewTeacherDialogProps): JSX.Element {
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string): JSX.Element => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'on_leave':
        return <Badge className="bg-yellow-500">On Leave</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-500">Inactive</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getEmploymentTypeBadge = (type: string): JSX.Element => {
    const displayText = type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    
    return <Badge variant="outline">{displayText}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">
                {teacher.firstName} {teacher.lastName}
              </DialogTitle>
              <DialogDescription>Teacher ID: {teacher.teacherId}</DialogDescription>
            </div>
            {getStatusBadge(teacher.status)}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Personal Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Date of Birth</p>
                <p className="font-medium">{formatDate(teacher.dateOfBirth)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Gender</p>
                <p className="font-medium capitalize">{teacher.gender}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Contact Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{teacher.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{teacher.phone}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span>{teacher.address}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Employment Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Employment Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Employment Type</p>
                <div className="mt-1">{getEmploymentTypeBadge(teacher.employmentType)}</div>
              </div>
              <div>
                <p className="text-muted-foreground">Employment Date</p>
                <div className="mt-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span className="font-medium">{formatDate(teacher.employmentDate)}</span>
                </div>
              </div>
            </div>
            {teacher.salary && (
              <div>
                <p className="text-muted-foreground text-sm">Monthly Salary</p>
                <div className="mt-1 flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-medium text-lg">{teacher.salary.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Qualifications */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Qualifications</h3>
            <div className="flex flex-wrap gap-2">
              {teacher.qualifications.map((qual, index) => (
                <Badge key={index} variant="secondary">
                  {qual}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Subjects */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Subjects Taught</h3>
            <div className="flex flex-wrap gap-2">
              {teacher.subjects.map((subject, index) => (
                <Badge key={index} className="bg-blue-500">
                  {subject}
                </Badge>
              ))}
            </div>
          </div>

          {/* Emergency Contact */}
          {teacher.emergencyContactName && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Emergency Contact</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Contact Name</p>
                    <p className="font-medium">{teacher.emergencyContactName}</p>
                  </div>
                  {teacher.emergencyContact && (
                    <div>
                      <p className="text-muted-foreground">Contact Phone</p>
                      <p className="font-medium">{teacher.emergencyContact}</p>
                    </div>
                  )}
                  {teacher.emergencyContactRelationship && (
                    <div>
                      <p className="text-muted-foreground">Relationship</p>
                      <p className="font-medium capitalize">{teacher.emergencyContactRelationship}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Metadata */}
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>Created: {formatDate(teacher.createdAt)}</p>
            <p>Last Updated: {formatDate(teacher.updatedAt)}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

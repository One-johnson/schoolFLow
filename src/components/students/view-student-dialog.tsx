'use client';

import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { JSX } from 'react';

interface Student {
  _id: string;
  studentId: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  nationality?: string;
  religion?: string;
  email?: string;
  phone?: string;
  address: string;
  className: string;
  department: 'creche' | 'kindergarten' | 'primary' | 'junior_high';
  rollNumber?: string;
  admissionDate: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  parentOccupation?: string;
  relationship: 'father' | 'mother' | 'guardian';
  secondaryContactName?: string;
  secondaryContactPhone?: string;
  secondaryContactRelationship?: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  medicalConditions?: string[];
  allergies?: string[];
  photoStorageId?: string;
  birthCertificateStorageId?: string;
  status: 'active' | 'inactive' | 'fresher' | 'continuing' | 'transferred' | 'graduated';
  createdAt: string;
  updatedAt: string;
}

interface ViewStudentDialogProps {
  student: Student;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewStudentDialog({ student, open, onOpenChange }: ViewStudentDialogProps): JSX.Element {
  // Fetch photo and document URLs from storage
  const photoUrl = useQuery(
    api.photos.getFileUrl,
    student.photoStorageId ? { storageId: student.photoStorageId } : 'skip'
  );

  const birthCertificateUrl = useQuery(
    api.photos.getFileUrl,
    student.birthCertificateStorageId ? { storageId: student.birthCertificateStorageId } : 'skip'
  );

  const getStatusBadge = (status: string): JSX.Element => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      inactive: 'secondary',
      fresher: 'outline',
      continuing: 'default',
      transferred: 'secondary',
      graduated: 'outline',
    };

    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const getDepartmentLabel = (dept: string): string => {
    const labels: Record<string, string> = {
      creche: 'Creche',
      kindergarten: 'Kindergarten',
      primary: 'Primary',
      junior_high: 'Junior High',
    };
    return labels[dept] || dept;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-2xl max-h-[90vh] flex flex-col overflow-y-auto">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Student Details</DialogTitle>
          <DialogDescription>View complete student information</DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="space-y-6 px-1">
            {/* Header with Photo */}
            <div className="flex items-start gap-4 p-4 border rounded-lg">
              <Avatar className="h-24 w-24">
                <AvatarImage src={photoUrl || undefined} />
                <AvatarFallback className="text-2xl">
                  {student.firstName.charAt(0)}
                  {student.lastName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">
                      {student.firstName} {student.middleName} {student.lastName}
                    </h3>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">{student.studentId}</Badge>
                      <Badge variant="outline">{student.admissionNumber}</Badge>
                      {getStatusBadge(student.status)}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Class:</span>{' '}
                    <span className="font-medium">{student.className}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Department:</span>{' '}
                    <span className="font-medium">{getDepartmentLabel(student.department)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div>
              <h4 className="font-semibold mb-3">Personal Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Date of Birth:</span>{' '}
                  <span className="font-medium">{formatDate(student.dateOfBirth)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Gender:</span>{' '}
                  <span className="font-medium capitalize">{student.gender}</span>
                </div>
                {student.nationality && (
                  <div>
                    <span className="text-muted-foreground">Nationality:</span>{' '}
                    <span className="font-medium">{student.nationality}</span>
                  </div>
                )}
                {student.religion && (
                  <div>
                    <span className="text-muted-foreground">Religion:</span>{' '}
                    <span className="font-medium">{student.religion}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Contact Information */}
            <div>
              <h4 className="font-semibold mb-3">Contact Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {student.email && (
                  <div>
                    <span className="text-muted-foreground">Email:</span>{' '}
                    <span className="font-medium">{student.email}</span>
                  </div>
                )}
                {student.phone && (
                  <div>
                    <span className="text-muted-foreground">Phone:</span>{' '}
                    <span className="font-medium">{student.phone}</span>
                  </div>
                )}
                <div className="col-span-2">
                  <span className="text-muted-foreground">Address:</span>{' '}
                  <span className="font-medium">{student.address}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Academic Information */}
            <div>
              <h4 className="font-semibold mb-3">Academic Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Class:</span>{' '}
                  <span className="font-medium">{student.className}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Department:</span>{' '}
                  <span className="font-medium">{getDepartmentLabel(student.department)}</span>
                </div>
                {student.rollNumber && (
                  <div>
                    <span className="text-muted-foreground">Roll Number:</span>{' '}
                    <span className="font-medium">{student.rollNumber}</span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Admission Date:</span>{' '}
                  <span className="font-medium">{formatDate(student.admissionDate)}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Parent/Guardian Information */}
            <div>
              <h4 className="font-semibold mb-3">Parent/Guardian Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Name:</span>{' '}
                  <span className="font-medium">{student.parentName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Relationship:</span>{' '}
                  <span className="font-medium capitalize">{student.relationship}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>{' '}
                  <span className="font-medium">{student.parentEmail}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone:</span>{' '}
                  <span className="font-medium">{student.parentPhone}</span>
                </div>
                {student.parentOccupation && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Occupation:</span>{' '}
                    <span className="font-medium">{student.parentOccupation}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Secondary Contact */}
            {student.secondaryContactName && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-3">Secondary Contact</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name:</span>{' '}
                      <span className="font-medium">{student.secondaryContactName}</span>
                    </div>
                    {student.secondaryContactPhone && (
                      <div>
                        <span className="text-muted-foreground">Phone:</span>{' '}
                        <span className="font-medium">{student.secondaryContactPhone}</span>
                      </div>
                    )}
                    {student.secondaryContactRelationship && (
                      <div>
                        <span className="text-muted-foreground">Relationship:</span>{' '}
                        <span className="font-medium">{student.secondaryContactRelationship}</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Emergency Contact */}
            <div>
              <h4 className="font-semibold mb-3">Emergency Contact</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Name:</span>{' '}
                  <span className="font-medium">{student.emergencyContactName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone:</span>{' '}
                  <span className="font-medium">{student.emergencyContactPhone}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Relationship:</span>{' '}
                  <span className="font-medium">{student.emergencyContactRelationship}</span>
                </div>
              </div>
            </div>

            {/* Medical Information */}
            {(student.medicalConditions || student.allergies) && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-3">Medical Information</h4>
                  {student.medicalConditions && student.medicalConditions.length > 0 && (
                    <div className="mb-3">
                      <span className="text-sm text-muted-foreground">Medical Conditions:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {student.medicalConditions.map((condition, index) => (
                          <Badge key={index} variant="secondary">
                            {condition}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {student.allergies && student.allergies.length > 0 && (
                    <div>
                      <span className="text-sm text-muted-foreground">Allergies:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {student.allergies.map((allergy, index) => (
                          <Badge key={index} variant="secondary">
                            {allergy}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Documents */}
            {birthCertificateUrl && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-3">Documents</h4>
                  <a
                    href={birthCertificateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    <Badge variant="outline">View Birth Certificate</Badge>
                  </a>
                </div>
              </>
            )}

            <Separator />

            {/* Metadata */}
            <div className="text-xs text-muted-foreground">
              <div>Created: {formatDate(student.createdAt)}</div>
              <div>Last Updated: {formatDate(student.updatedAt)}</div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState, useEffect, JSX } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';
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
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import type { Teacher } from '@/types';

interface EditTeacherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher: Teacher;
  updatedBy: string;
}

export function EditTeacherDialog({
  open,
  onOpenChange,
  teacher,
  updatedBy,
}: EditTeacherDialogProps): JSX.Element {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    firstName: teacher.firstName,
    lastName: teacher.lastName,
    email: teacher.email,
    phone: teacher.phone,
    address: teacher.address,
    dateOfBirth: teacher.dateOfBirth,
    gender: teacher.gender,
    employmentType: teacher.employmentType,
    employmentDate: teacher.employmentDate,
    salary: teacher.salary?.toString() || '',
    emergencyContact: teacher.emergencyContact || '',
    emergencyContactName: teacher.emergencyContactName || '',
    emergencyContactRelationship: teacher.emergencyContactRelationship || '',
  });
  const [qualifications, setQualifications] = useState<string[]>(teacher.qualifications);
  const [qualificationInput, setQualificationInput] = useState<string>('');
  const [subjects, setSubjects] = useState<string[]>(teacher.subjects);
  const [subjectInput, setSubjectInput] = useState<string>('');

  const updateTeacher = useMutation(api.teachers.updateTeacher);

  useEffect(() => {
    setFormData({
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      email: teacher.email,
      phone: teacher.phone,
      address: teacher.address,
      dateOfBirth: teacher.dateOfBirth,
      gender: teacher.gender,
      employmentType: teacher.employmentType,
      employmentDate: teacher.employmentDate,
      salary: teacher.salary?.toString() || '',
      emergencyContact: teacher.emergencyContact || '',
      emergencyContactName: teacher.emergencyContactName || '',
      emergencyContactRelationship: teacher.emergencyContactRelationship || '',
    });
    setQualifications(teacher.qualifications);
    setSubjects(teacher.subjects);
  }, [teacher]);

  const handleInputChange = (field: string, value: string): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addQualification = (): void => {
    if (qualificationInput.trim() && !qualifications.includes(qualificationInput.trim())) {
      setQualifications([...qualifications, qualificationInput.trim()]);
      setQualificationInput('');
    }
  };

  const removeQualification = (qual: string): void => {
    setQualifications(qualifications.filter((q) => q !== qual));
  };

  const addSubject = (): void => {
    if (subjectInput.trim() && !subjects.includes(subjectInput.trim())) {
      setSubjects([...subjects, subjectInput.trim()]);
      setSubjectInput('');
    }
  };

  const removeSubject = (subject: string): void => {
    setSubjects(subjects.filter((s) => s !== subject));
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (qualifications.length === 0) {
        toast.error('Please add at least one qualification');
        setIsSubmitting(false);
        return;
      }

      if (subjects.length === 0) {
        toast.error('Please add at least one subject');
        setIsSubmitting(false);
        return;
      }

      await updateTeacher({
        teacherId: teacher._id as Id<'teachers'>,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        qualifications,
        subjects,
        employmentDate: formData.employmentDate,
        employmentType: formData.employmentType,
        salary: formData.salary ? parseFloat(formData.salary) : undefined,
        emergencyContact: formData.emergencyContact || undefined,
        emergencyContactName: formData.emergencyContactName || undefined,
        emergencyContactRelationship: formData.emergencyContactRelationship || undefined,
        updatedBy,
      });

      toast.success('Teacher updated successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update teacher');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Teacher</DialogTitle>
          <DialogDescription>
            Update the teacher&apos;s information. Teacher ID: {teacher.teacherId}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('firstName', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('lastName', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('dateOfBirth', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={formData.gender} onValueChange={(value: string) => handleInputChange('gender', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Contact Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('phone', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('address', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Employment Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Employment Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employmentType">Employment Type</Label>
                <Select value={formData.employmentType} onValueChange={(value: string) => handleInputChange('employmentType', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full Time</SelectItem>
                    <SelectItem value="part_time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="employmentDate">Employment Date</Label>
                <Input
                  id="employmentDate"
                  type="date"
                  value={formData.employmentDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('employmentDate', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="salary">Salary (Optional)</Label>
              <Input
                id="salary"
                type="number"
                placeholder="Enter monthly salary"
                value={formData.salary}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('salary', e.target.value)}
              />
            </div>
          </div>

          {/* Qualifications */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Qualifications</h3>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., Bachelor of Education"
                value={qualificationInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQualificationInput(e.target.value)}
                onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addQualification();
                  }
                }}
              />
              <Button type="button" onClick={addQualification}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {qualifications.map((qual, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {qual}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removeQualification(qual)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Subjects */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Subjects Taught</h3>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., Mathematics"
                value={subjectInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubjectInput(e.target.value)}
                onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSubject();
                  }
                }}
              />
              <Button type="button" onClick={addSubject}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {subjects.map((subject, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {subject}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removeSubject(subject)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Emergency Contact</h3>
            <div className="space-y-2">
              <Label htmlFor="emergencyContactName">Contact Name</Label>
              <Input
                id="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('emergencyContactName', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyContact">Contact Phone</Label>
                <Input
                  id="emergencyContact"
                  type="tel"
                  value={formData.emergencyContact}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('emergencyContact', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyContactRelationship">Relationship</Label>
                <Input
                  id="emergencyContactRelationship"
                  placeholder="e.g., Spouse, Parent"
                  value={formData.emergencyContactRelationship}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('emergencyContactRelationship', e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

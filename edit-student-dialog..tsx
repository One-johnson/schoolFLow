'use client';

import { JSX, useState, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/../convex/_generated/api';
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
import { X, Upload, User } from 'lucide-react';

interface EditStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  student: any; // replace with Student type if you have it
  classes: { id: string; name: string }[];
  updatedBy: string;
}

export function EditStudentDialog({
  open,
  onOpenChange,
  schoolId,
  student,
  classes,
  updatedBy,
}: EditStudentDialogProps): JSX.Element {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: 'male' as 'male' | 'female' | 'other',
    dateOfBirth: '',
    hometown: '',
    placeOfBirth: '',
    email: '',
    phone: '',
    address: '',
    classId: '',
    enrollmentDate: '',
    medicalInfo: '',
    guardianName: '',
    guardianEmail: '',
    guardianPhone: '',
    guardianRelationship: '',
  });

  const updateStudent = useMutation(api.students.updateStudent);

  // Pre-fill form when student prop changes
  useEffect(() => {
    if (student) {
      setFormData({
        firstName: student.firstName,
        lastName: student.lastName,
        gender: student.gender,
        dateOfBirth: student.dateOfBirth,
        hometown: student.hometown || '',
        placeOfBirth: student.placeOfBirth || '',
        email: student.email || '',
        phone: student.phone || '',
        address: student.address,
        classId: student.classId,
        enrollmentDate: student.enrollmentDate,
        medicalInfo: student.medicalInfo || '',
        guardianName: student.guardianName,
        guardianEmail: student.guardianEmail || '',
        guardianPhone: student.guardianPhone || '',
        guardianRelationship: student.guardianRelationship,
      });
      setPhotoUrl(student.photoUrl || '');
      setPhotoPreview(student.photoUrl || '');
    }
  }, [student]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPhotoPreview(result);
      setPhotoUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (): void => {
    setPhotoUrl('');
    setPhotoPreview('');
  };

  const handleInputChange = (field: string, value: string): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (
        !formData.firstName ||
        !formData.lastName ||
        !formData.gender ||
        !formData.dateOfBirth ||
        !formData.address ||
        !formData.classId ||
        !formData.guardianName ||
        !formData.guardianRelationship
      ) {
        toast.error('Please fill in all required fields');
        setIsSubmitting(false);
        return;
      }

      await updateStudent({
        studentId: student._id,
        firstName: formData.firstName,
        lastName: formData.lastName,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        hometown: formData.hometown || undefined,
        placeOfBirth: formData.placeOfBirth || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        address: formData.address,
        classId: formData.classId,
        enrollmentDate: formData.enrollmentDate,
        medicalInfo: formData.medicalInfo || undefined,
        guardianName: formData.guardianName,
        guardianEmail: formData.guardianEmail || undefined,
        guardianPhone: formData.guardianPhone || undefined,
        guardianRelationship: formData.guardianRelationship,
        updatedBy,
      });

      toast.success('Student updated successfully!');

      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update student');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
          <DialogDescription>
            Update the details of the student. Required fields are marked with an asterisk (*).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo Upload */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Profile Photo (Optional)</h3>
            <div className="flex items-center gap-4">
              <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-12 w-12 text-gray-400" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="photo" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 w-fit">
                    <Upload className="h-4 w-4" />
                    <span>Upload Photo</span>
                  </div>
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </Label>
                {photoPreview && (
                  <Button type="button" variant="outline" size="sm" onClick={removeImage}>
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                )}
                <p className="text-xs text-muted-foreground">Max file size: 5MB</p>
              </div>
            </div>
          </div>

          {/* Personal Information, Contact, Class, Medical, Guardian */}
          {/* ...reuse all the same JSX blocks from AddStudentDialog, just pre-filled using formData... */}

          {/* Example for first name / last name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                required
              />
            </div>
          </div>

          {/* The rest of the fields (gender, DOB, address, class, medical info, guardian info) follow the same pattern */}

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
              {isSubmitting ? 'Updating Student...' : 'Update Student'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { useAuth } from '@/hooks/useAuth';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ChevronDown, ChevronUp, Upload, X, Loader2, Trash2, FileText } from 'lucide-react';

interface Student {
  _id: string;
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
  classId: string;
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
}

interface EditStudentDialogProps {
  student: Student;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditStudentDialog({ student, open, onOpenChange }: EditStudentDialogProps): React.JSX.Element {
  const { user } = useAuth();
  const updateStudent = useMutation(api.students.updateStudent);
  const generateUploadUrl = useMutation(api.photos.generateUploadUrl);
  const createPhotoRecord = useMutation(api.photos.createPhotoRecord);
  const deleteFile = useMutation(api.photos.deletePhoto);
  const classes = useQuery(api.classes.getClassesBySchool, {
    schoolId: user?.schoolId || '',
  });

  // Fetch photo URL if storage ID exists
  const photoUrl = useQuery(
    api.photos.getFileUrl,
    student.photoStorageId ? { storageId: student.photoStorageId } : 'skip'
  );

  // Fetch birth certificate URL if storage ID exists
  const birthCertificateUrl = useQuery(
    api.photos.getFileUrl,
    student.birthCertificateStorageId ? { storageId: student.birthCertificateStorageId } : 'skip'
  );

  const [formData, setFormData] = useState(student);
  const [medicalConditions, setMedicalConditions] = useState<string[]>(student.medicalConditions || []);
  const [allergies, setAllergies] = useState<string[]>(student.allergies || []);
  const [medicalInput, setMedicalInput] = useState<string>('');
  const [allergyInput, setAllergyInput] = useState<string>('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState<string>('');
  const [newPhotoStorageId, setNewPhotoStorageId] = useState<string | undefined>();
  const [newBirthCertificateStorageId, setNewBirthCertificateStorageId] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState<boolean>(false);

  const [personalOpen, setPersonalOpen] = useState<boolean>(true);
  const [contactOpen, setContactOpen] = useState<boolean>(false);
  const [academicOpen, setAcademicOpen] = useState<boolean>(false);
  const [parentOpen, setParentOpen] = useState<boolean>(false);
  const [secondaryContactOpen, setSecondaryContactOpen] = useState<boolean>(false);
  const [emergencyOpen, setEmergencyOpen] = useState<boolean>(false);
  const [medicalOpen, setMedicalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      setFormData(student);
      setMedicalConditions(student.medicalConditions || []);
      setAllergies(student.allergies || []);
      setPhotoFile(null);
      setPhotoPreview('');
      setDocumentFile(null);
      setDocumentName('');
      setNewPhotoStorageId(undefined);
      setNewBirthCertificateStorageId(undefined);
    }
  }, [open, student]);

  const uploadFileToConvex = async (file: File): Promise<string> => {
    const uploadUrl = await generateUploadUrl();
    const result = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': file.type },
      body: file,
    });

    if (!result.ok) {
      throw new Error(`Upload failed: ${result.statusText}`);
    }

    const { storageId } = await result.json();
    return storageId;
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Photo size must be less than 5MB');
        return;
      }

      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload immediately
      setIsUploadingPhoto(true);
      try {
        const storageId = await uploadFileToConvex(file);
        
        // Create photo record in photos table
        if (storageId) {
          await createPhotoRecord({
            storageId,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            entityType: 'student',
            entityId: student._id,
            fileType: 'photo',
            uploadedBy: user?.userId || '',
            schoolId: user?.schoolId,
          });
        }
        
        setNewPhotoStorageId(storageId);
        toast.success('Photo uploaded');
      } catch (error) {
        toast.error('Failed to upload photo');
        console.error(error);
      } finally {
        setIsUploadingPhoto(false);
      }
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Document size must be less than 10MB');
        return;
      }

      setDocumentFile(file);
      setDocumentName(file.name);

      // Upload immediately
      setIsUploadingDoc(true);
      try {
        const storageId = await uploadFileToConvex(file);
        
        // Create document record in photos table
        if (storageId) {
          await createPhotoRecord({
            storageId,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            entityType: 'student',
            entityId: student._id,
            fileType: 'certificate',
            uploadedBy: user?.userId || '',
            schoolId: user?.schoolId,
          });
        }
        
        setNewBirthCertificateStorageId(storageId);
        toast.success('Document uploaded');
      } catch (error) {
        toast.error('Failed to upload document');
        console.error(error);
      } finally {
        setIsUploadingDoc(false);
      }
    }
  };

  const handleRemovePhoto = async (): Promise<void> => {
    if (student.photoStorageId) {
      try {
        await deleteFile({ storageId: student.photoStorageId });
        toast.success('Photo removed');
      } catch (error) {
        toast.error('Failed to remove photo');
        console.error(error);
      }
    }
    setPhotoFile(null);
    setPhotoPreview('');
    setNewPhotoStorageId(undefined);
  };

  const handleRemoveDocument = async (): Promise<void> => {
    if (student.birthCertificateStorageId) {
      try {
        await deleteFile({ storageId: student.birthCertificateStorageId });
        toast.success('Document removed');
      } catch (error) {
        toast.error('Failed to remove document');
        console.error(error);
      }
    }
    setDocumentFile(null);
    setDocumentName('');
    setNewBirthCertificateStorageId(undefined);
  };

  const addMedicalCondition = (): void => {
    if (medicalInput.trim()) {
      setMedicalConditions([...medicalConditions, medicalInput.trim()]);
      setMedicalInput('');
    }
  };

  const removeMedicalCondition = (index: number): void => {
    setMedicalConditions(medicalConditions.filter((_, i) => i !== index));
  };

  const addAllergy = (): void => {
    if (allergyInput.trim()) {
      setAllergies([...allergies, allergyInput.trim()]);
      setAllergyInput('');
    }
  };

  const removeAllergy = (index: number): void => {
    setAllergies(allergies.filter((_, i) => i !== index));
  };

  const handleSubmit = async (): Promise<void> => {
    if (!formData.firstName || !formData.lastName) {
      toast.error('Please enter first and last name');
      return;
    }

    setIsSubmitting(true);

    try {
      // If old photo exists and we have a new one, delete the old one
      if (student.photoStorageId && newPhotoStorageId && student.photoStorageId !== newPhotoStorageId) {
        try {
          await deleteFile({ storageId: student.photoStorageId });
        } catch (error) {
          console.error('Failed to delete old photo:', error);
        }
      }

      // If old birth certificate exists and we have a new one, delete the old one
      if (student.birthCertificateStorageId && newBirthCertificateStorageId && student.birthCertificateStorageId !== newBirthCertificateStorageId) {
        try {
          await deleteFile({ storageId: student.birthCertificateStorageId });
        } catch (error) {
          console.error('Failed to delete old birth certificate:', error);
        }
      }

      const selectedClass = classes?.find((c) => c.classCode === formData.classId);

      await updateStudent({
        studentId: student._id as Id<'students'>,
        firstName: formData.firstName,
        lastName: formData.lastName,
        middleName: formData.middleName || undefined,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        nationality: formData.nationality || undefined,
        religion: formData.religion || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        address: formData.address,
        classId: formData.classId,
        className: selectedClass?.className || formData.className,
        department: selectedClass?.department || formData.department,
        rollNumber: formData.rollNumber || undefined,
        admissionDate: formData.admissionDate,
        parentName: formData.parentName,
        parentEmail: formData.parentEmail,
        parentPhone: formData.parentPhone,
        parentOccupation: formData.parentOccupation || undefined,
        relationship: formData.relationship,
        secondaryContactName: formData.secondaryContactName || undefined,
        secondaryContactPhone: formData.secondaryContactPhone || undefined,
        secondaryContactRelationship: formData.secondaryContactRelationship || undefined,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactPhone: formData.emergencyContactPhone,
        emergencyContactRelationship: formData.emergencyContactRelationship,
        medicalConditions: medicalConditions.length > 0 ? medicalConditions : undefined,
        allergies: allergies.length > 0 ? allergies : undefined,
        photoStorageId: newPhotoStorageId || student.photoStorageId,
        birthCertificateStorageId: newBirthCertificateStorageId || student.birthCertificateStorageId,
        status: formData.status,
        updatedBy: user?.userId || '',
      });

      toast.success('Student updated successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update student');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentPhotoUrl = photoPreview || photoUrl || '';
  const currentDocumentName = documentName || (birthCertificateUrl ? 'Current Document' : '');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-y-auto">
        <DialogHeader className="shrink-0">
          <DialogTitle>Edit Student</DialogTitle>
          <DialogDescription>Update student information</DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 w-full">
          <div className="space-y-4 px-1">
            {/* Photo Upload */}
            <div className="flex items-center gap-4 p-3 border rounded-lg">
              <Avatar className="h-16 w-16">
                <AvatarImage src={currentPhotoUrl} />
                <AvatarFallback>
                  {formData.firstName.charAt(0)}
                  {formData.lastName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 flex items-center gap-2">
                <Label htmlFor="photo" className="cursor-pointer">
                  <div className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700">
                    {isUploadingPhoto ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    Update Photo
                  </div>
                  <input
                    id="photo"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                    disabled={isUploadingPhoto}
                  />
                </Label>
                {currentPhotoUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemovePhoto}
                    disabled={isUploadingPhoto}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as Student['status'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="fresher">Fresher</SelectItem>
                  <SelectItem value="continuing">Continuing</SelectItem>
                  <SelectItem value="transferred">Transferred</SelectItem>
                  <SelectItem value="graduated">Graduated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Personal Information */}
            <Collapsible open={personalOpen} onOpenChange={setPersonalOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 border rounded-lg hover:bg-accent">
                <span className="font-semibold">Personal Information</span>
                {personalOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-4 p-4 border rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="middleName">Middle Name</Label>
                    <Input
                      id="middleName"
                      value={formData.middleName || ''}
                      onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => setFormData({ ...formData, gender: value as 'male' | 'female' | 'other' })}
                    >
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
                  <div>
                    <Label htmlFor="nationality">Nationality</Label>
                    <Input
                      id="nationality"
                      value={formData.nationality || ''}
                      onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="religion">Religion</Label>
                    <Input
                      id="religion"
                      value={formData.religion || ''}
                      onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Contact Information */}
            <Collapsible open={contactOpen} onOpenChange={setContactOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 border rounded-lg hover:bg-accent">
                <span className="font-semibold">Contact Information</span>
                {contactOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-4 p-4 border rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Academic Information */}
            <Collapsible open={academicOpen} onOpenChange={setAcademicOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 border rounded-lg hover:bg-accent">
                <span className="font-semibold">Academic Information</span>
                {academicOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-4 p-4 border rounded-lg">
                <div>
                  <Label htmlFor="classId">Class</Label>
                  <Select
                    value={formData.classId}
                    onValueChange={(value) => setFormData({ ...formData, classId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {classes?.map((cls) => (
                        <SelectItem key={cls._id} value={cls.classCode}>
                          {cls.className}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="rollNumber">Roll Number</Label>
                  <Input
                    id="rollNumber"
                    value={formData.rollNumber || ''}
                    onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="birthCertificate">Birth Certificate</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Label htmlFor="birthCertificate" className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-accent">
                        {isUploadingDoc ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                        Upload Document
                      </div>
                      <input
                        id="birthCertificate"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={handleDocumentUpload}
                        disabled={isUploadingDoc}
                      />
                    </Label>
                    {currentDocumentName && (
                      <>
                        <Badge variant="outline">{currentDocumentName}</Badge>
                        {birthCertificateUrl && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveDocument}
                            disabled={isUploadingDoc}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Parent Information */}
            <Collapsible open={parentOpen} onOpenChange={setParentOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 border rounded-lg hover:bg-accent">
                <span className="font-semibold">Parent/Guardian Information</span>
                {parentOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-4 p-4 border rounded-lg">
                <div>
                  <Label htmlFor="parentName">Name</Label>
                  <Input
                    id="parentName"
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="parentEmail">Email</Label>
                    <Input
                      id="parentEmail"
                      type="email"
                      value={formData.parentEmail}
                      onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="parentPhone">Phone</Label>
                    <Input
                      id="parentPhone"
                      value={formData.parentPhone}
                      onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="relationship">Relationship</Label>
                    <Select
                      value={formData.relationship}
                      onValueChange={(value) => setFormData({ ...formData, relationship: value as 'father' | 'mother' | 'guardian' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="father">Father</SelectItem>
                        <SelectItem value="mother">Mother</SelectItem>
                        <SelectItem value="guardian">Guardian</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="parentOccupation">Occupation</Label>
                    <Input
                      id="parentOccupation"
                      value={formData.parentOccupation || ''}
                      onChange={(e) => setFormData({ ...formData, parentOccupation: e.target.value })}
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Secondary Contact */}
            <Collapsible open={secondaryContactOpen} onOpenChange={setSecondaryContactOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 border rounded-lg hover:bg-accent">
                <span className="font-semibold">Secondary Contact</span>
                {secondaryContactOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-4 p-4 border rounded-lg">
                <div>
                  <Label htmlFor="secondaryContactName">Name</Label>
                  <Input
                    id="secondaryContactName"
                    value={formData.secondaryContactName || ''}
                    onChange={(e) => setFormData({ ...formData, secondaryContactName: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="secondaryContactPhone">Phone</Label>
                    <Input
                      id="secondaryContactPhone"
                      value={formData.secondaryContactPhone || ''}
                      onChange={(e) => setFormData({ ...formData, secondaryContactPhone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="secondaryContactRelationship">Relationship</Label>
                    <Input
                      id="secondaryContactRelationship"
                      value={formData.secondaryContactRelationship || ''}
                      onChange={(e) => setFormData({ ...formData, secondaryContactRelationship: e.target.value })}
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Emergency Contact */}
            <Collapsible open={emergencyOpen} onOpenChange={setEmergencyOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 border rounded-lg hover:bg-accent">
                <span className="font-semibold">Emergency Contact</span>
                {emergencyOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-4 p-4 border rounded-lg">
                <div>
                  <Label htmlFor="emergencyContactName">Name</Label>
                  <Input
                    id="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emergencyContactPhone">Phone</Label>
                    <Input
                      id="emergencyContactPhone"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergencyContactRelationship">Relationship</Label>
                    <Input
                      id="emergencyContactRelationship"
                      value={formData.emergencyContactRelationship}
                      onChange={(e) => setFormData({ ...formData, emergencyContactRelationship: e.target.value })}
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Medical Information */}
            <Collapsible open={medicalOpen} onOpenChange={setMedicalOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 border rounded-lg hover:bg-accent">
                <span className="font-semibold">Medical Information</span>
                {medicalOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-4 p-4 border rounded-lg">
                <div>
                  <Label htmlFor="medicalConditions">Medical Conditions</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="medicalConditions"
                      placeholder="Enter condition and press Enter"
                      value={medicalInput}
                      onChange={(e) => setMedicalInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addMedicalCondition();
                        }
                      }}
                    />
                    <Button type="button" onClick={addMedicalCondition}>
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {medicalConditions.map((condition, index) => (
                      <Badge key={index} variant="secondary">
                        {condition}
                        <X
                          className="h-3 w-3 ml-1 cursor-pointer"
                          onClick={() => removeMedicalCondition(index)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="allergies">Allergies</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="allergies"
                      placeholder="Enter allergy and press Enter"
                      value={allergyInput}
                      onChange={(e) => setAllergyInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addAllergy();
                        }
                      }}
                    />
                    <Button type="button" onClick={addAllergy}>
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {allergies.map((allergy, index) => (
                      <Badge key={index} variant="secondary">
                        {allergy}
                        <X
                          className="h-3 w-3 ml-1 cursor-pointer"
                          onClick={() => removeAllergy(index)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </ScrollArea>

        <DialogFooter className="shrink-0 mt-4 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || isUploadingPhoto || isUploadingDoc}>
            {isSubmitting ? 'Updating...' : 'Update Student'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

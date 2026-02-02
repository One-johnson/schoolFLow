'use client';

import { useState, useEffect, JSX } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
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
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  ChevronDown,
  ChevronUp,
  Upload,
  X,
  Save,
  Trash2,
  FileText,
  Loader2,
} from 'lucide-react';

interface AddStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormData {
  firstName: string;
  lastName: string;
  middleName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other' | '';
  nationality: string;
  religion: string;
  email: string;
  phone: string;
  address: string;
  classId: string;
  rollNumber: string;
  admissionDate: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  parentOccupation: string;
  relationship: 'father' | 'mother' | 'guardian' | '';
  secondaryContactName: string;
  secondaryContactPhone: string;
  secondaryContactRelationship: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
}

const DRAFT_KEY = 'student_form_draft';

export function AddStudentDialog({ open, onOpenChange }: AddStudentDialogProps): React.JSX.Element {
  const { user } = useAuth();
  const addStudent = useMutation(api.students.addStudent);
  const generateUploadUrl = useMutation(api.photos.generateUploadUrl);
  const createPhotoRecord = useMutation(api.photos.createPhotoRecord);
  const updatePhotoEntityId = useMutation(api.photos.updatePhotoEntityId);
  const classes = useQuery(api.classes.getClassesBySchool, {
    schoolId: user?.schoolId || '',
  });

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    middleName: '',
    dateOfBirth: '',
    gender: '',
    nationality: '',
    religion: '',
    email: '',
    phone: '',
    address: '',
    classId: '',
    rollNumber: '',
    admissionDate: new Date().toISOString().split('T')[0],
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    parentOccupation: '',
    relationship: '',
    secondaryContactName: '',
    secondaryContactPhone: '',
    secondaryContactRelationship: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
  });

  const [medicalConditions, setMedicalConditions] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [medicalInput, setMedicalInput] = useState<string>('');
  const [allergyInput, setAllergyInput] = useState<string>('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState<string>('');
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

  // Load draft on mount
  useEffect(() => {
    if (open) {
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          setFormData(draft.formData || formData);
          setMedicalConditions(draft.medicalConditions || []);
          setAllergies(draft.allergies || []);
        } catch (error) {
          console.error('Failed to load draft:', error);
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Auto-save draft (excluding photos)
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        const draftData = {
          formData,
          medicalConditions,
          allergies,
        };
        try {
          localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
        } catch (error) {
          console.error('Failed to save draft:', error);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [formData, medicalConditions, allergies, open]);

  const calculateProgress = (): number => {
    const requiredFields = [
      formData.firstName,
      formData.lastName,
      formData.dateOfBirth,
      formData.gender,
      formData.address,
      formData.classId,
      formData.admissionDate,
      formData.parentName,
      formData.parentEmail,
      formData.parentPhone,
      formData.relationship,
      formData.emergencyContactName,
      formData.emergencyContactPhone,
      formData.emergencyContactRelationship,
    ];

    const filledFields = requiredFields.filter((field) => field !== '').length;
    return Math.round((filledFields / requiredFields.length) * 100);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
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
    }
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Document size must be less than 10MB');
        return;
      }

      setDocumentFile(file);
      setDocumentName(file.name);
      toast.success('Document selected');
    }
  };

  const uploadFileToConvex = async (file: File): Promise<string> => {
    // Generate upload URL
    const uploadUrl = await generateUploadUrl();

    // Upload file
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

  const handleSaveDraft = (): void => {
    const draftData = {
      formData,
      medicalConditions,
      allergies,
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
    toast.success('Draft saved successfully');
  };

  const handleDeleteDraft = (): void => {
    localStorage.removeItem(DRAFT_KEY);
    toast.success('Draft deleted');
  };

  const handleClearAll = (): void => {
    setFormData({
      firstName: '',
      lastName: '',
      middleName: '',
      dateOfBirth: '',
      gender: '',
      nationality: '',
      religion: '',
      email: '',
      phone: '',
      address: '',
      classId: '',
      rollNumber: '',
      admissionDate: new Date().toISOString().split('T')[0],
      parentName: '',
      parentEmail: '',
      parentPhone: '',
      parentOccupation: '',
      relationship: '',
      secondaryContactName: '',
      secondaryContactPhone: '',
      secondaryContactRelationship: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelationship: '',
    });
    setMedicalConditions([]);
    setAllergies([]);
    setPhotoFile(null);
    setPhotoPreview('');
    setDocumentFile(null);
    setDocumentName('');
    toast.success('Form cleared');
  };

  const handleSubmit = async (): Promise<void> => {
    // Validation
    if (!formData.firstName || !formData.lastName) {
      toast.error('Please enter first and last name');
      return;
    }

    if (!formData.dateOfBirth) {
      toast.error('Please enter date of birth');
      return;
    }

    if (!formData.gender) {
      toast.error('Please select gender');
      return;
    }

    if (!formData.address) {
      toast.error('Please enter address');
      return;
    }

    if (!formData.classId) {
      toast.error('Please select a class');
      return;
    }

    if (!formData.parentName || !formData.parentEmail || !formData.parentPhone) {
      toast.error('Please enter parent/guardian information');
      return;
    }

    if (!formData.relationship) {
      toast.error('Please select parent/guardian relationship');
      return;
    }

    if (
      !formData.emergencyContactName ||
      !formData.emergencyContactPhone ||
      !formData.emergencyContactRelationship
    ) {
      toast.error('Please enter emergency contact information');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload photo if selected
      let photoStorageId: string | undefined;
      let photoRecordId: string | undefined;
      if (photoFile) {
        setIsUploadingPhoto(true);
        try {
          photoStorageId = await uploadFileToConvex(photoFile);
          // Create photo record in photos table
          if (photoStorageId) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            photoRecordId = await createPhotoRecord({
              storageId: photoStorageId,
              fileName: photoFile.name,
              fileSize: photoFile.size,
              mimeType: photoFile.type,
              entityType: 'student',
              entityId: '', // Will be updated after student is created
              fileType: 'photo',
              uploadedBy: user?.userId || '',
              schoolId: user?.schoolId,
            });
          }
        } catch (error) {
          toast.error('Failed to upload photo');
          console.error(error);
        } finally {
          setIsUploadingPhoto(false);
        }
      }

      // Upload document if selected
      let birthCertificateStorageId: string | undefined;
      let documentRecordId: string | undefined;
      if (documentFile) {
        setIsUploadingDoc(true);
        try {
          birthCertificateStorageId = await uploadFileToConvex(documentFile);
          // Create document record in photos table
          if (birthCertificateStorageId) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            documentRecordId = await createPhotoRecord({
              storageId: birthCertificateStorageId,
              fileName: documentFile.name,
              fileSize: documentFile.size,
              mimeType: documentFile.type,
              entityType: 'student',
              entityId: '', // Will be updated after student is created
              fileType: 'certificate',
              uploadedBy: user?.userId || '',
              schoolId: user?.schoolId,
            });
          }
        } catch (error) {
          toast.error('Failed to upload document');
          console.error(error);
        } finally {
          setIsUploadingDoc(false);
        }
      }

      const selectedClass = classes?.find((c) => c.classCode === formData.classId);

      const result = await addStudent({
        schoolId: user?.schoolId || '',
        firstName: formData.firstName,
        lastName: formData.lastName,
        middleName: formData.middleName || undefined,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender as 'male' | 'female' | 'other',
        nationality: formData.nationality || undefined,
        religion: formData.religion || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        address: formData.address,
        classId: formData.classId,
        className: selectedClass?.className || '',
        department: selectedClass?.department || 'primary',
        rollNumber: formData.rollNumber || undefined,
        admissionDate: formData.admissionDate,
        parentName: formData.parentName,
        parentEmail: formData.parentEmail,
        parentPhone: formData.parentPhone,
        parentOccupation: formData.parentOccupation || undefined,
        relationship: formData.relationship as 'father' | 'mother' | 'guardian',
        secondaryContactName: formData.secondaryContactName || undefined,
        secondaryContactPhone: formData.secondaryContactPhone || undefined,
        secondaryContactRelationship: formData.secondaryContactRelationship || undefined,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactPhone: formData.emergencyContactPhone,
        emergencyContactRelationship: formData.emergencyContactRelationship,
        medicalConditions: medicalConditions.length > 0 ? medicalConditions : undefined,
        allergies: allergies.length > 0 ? allergies : undefined,
        photoStorageId,
        birthCertificateStorageId,
        createdBy: user?.userId || '',
      });

      // Update photo records with the actual student ID
      if (photoStorageId && result?.studentId) {
        try {
          await updatePhotoEntityId({
            storageId: photoStorageId,
            entityId: result.studentId,
          });
        } catch (error) {
          console.error('Failed to update photo entityId:', error);
        }
      }

      if (birthCertificateStorageId && result?.studentId) {
        try {
          await updatePhotoEntityId({
            storageId: birthCertificateStorageId,
            entityId: result.studentId,
          });
        } catch (error) {
          console.error('Failed to update birth certificate entityId:', error);
        }
      }

      toast.success('Student added successfully');
      localStorage.removeItem(DRAFT_KEY);
      handleClearAll();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add student');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-2xl max-h-[90vh] flex flex-col overflow-y-auto">
        <DialogHeader className="shrink-0">
          <DialogTitle>Add New Student</DialogTitle>
          <DialogDescription>
            Enter student information. Fields marked with * are required.
          </DialogDescription>
          <div className="mt-2">
            <Progress value={calculateProgress()} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">{calculateProgress()}% complete</p>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 w-full">
          <div className="space-y-4 px-1">
            {/* Photo Upload */}
            <div className="flex items-center gap-4 p-3 border rounded-lg">
              <Avatar className="h-16 w-16">
                <AvatarImage src={photoPreview || undefined} />
                <AvatarFallback>
                  {formData.firstName.charAt(0)}
                  {formData.lastName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Label htmlFor="photo" className="cursor-pointer">
                  <div className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700">
                    {isUploadingPhoto ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    Upload Photo
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
                {photoPreview && (
                  <p className="text-xs text-muted-foreground mt-1">Photo selected</p>
                )}
              </div>
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
                    <Label htmlFor="firstName">
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">
                      Last Name <span className="text-red-500">*</span>
                    </Label>
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
                      value={formData.middleName}
                      onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dateOfBirth">
                      Date of Birth <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">
                      Gender <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => setFormData({ ...formData, gender: value as 'male' | 'female' | 'other' })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
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
                      value={formData.nationality}
                      onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="religion">Religion</Label>
                    <Input
                      id="religion"
                      value={formData.religion}
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
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">
                    Address <span className="text-red-500">*</span>
                  </Label>
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
                  <Label htmlFor="classId">
                    Class <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.classId}
                    onValueChange={(value) => setFormData({ ...formData, classId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rollNumber">Roll Number</Label>
                    <Input
                      id="rollNumber"
                      value={formData.rollNumber}
                      onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="admissionDate">
                      Admission Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="admissionDate"
                      type="date"
                      value={formData.admissionDate}
                      onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="birthCertificate">Birth Certificate (Optional)</Label>
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
                    {documentName && (
                      <Badge variant="outline">{documentName}</Badge>
                    )}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Parent/Guardian Information */}
            <Collapsible open={parentOpen} onOpenChange={setParentOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 border rounded-lg hover:bg-accent">
                <span className="font-semibold">Parent/Guardian Information</span>
                {parentOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-4 p-4 border rounded-lg">
                <div>
                  <Label htmlFor="parentName">
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="parentName"
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="parentEmail">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="parentEmail"
                      type="email"
                      value={formData.parentEmail}
                      onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="parentPhone">
                      Phone <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="parentPhone"
                      value={formData.parentPhone}
                      onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="relationship">
                      Relationship <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.relationship}
                      onValueChange={(value) => setFormData({ ...formData, relationship: value as 'father' | 'mother' | 'guardian' })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
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
                      value={formData.parentOccupation}
                      onChange={(e) => setFormData({ ...formData, parentOccupation: e.target.value })}
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Secondary Contact */}
            <Collapsible open={secondaryContactOpen} onOpenChange={setSecondaryContactOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 border rounded-lg hover:bg-accent">
                <span className="font-semibold">Secondary Contact (Optional)</span>
                {secondaryContactOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-4 p-4 border rounded-lg">
                <div>
                  <Label htmlFor="secondaryContactName">Name</Label>
                  <Input
                    id="secondaryContactName"
                    value={formData.secondaryContactName}
                    onChange={(e) => setFormData({ ...formData, secondaryContactName: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="secondaryContactPhone">Phone</Label>
                    <Input
                      id="secondaryContactPhone"
                      value={formData.secondaryContactPhone}
                      onChange={(e) => setFormData({ ...formData, secondaryContactPhone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="secondaryContactRelationship">Relationship</Label>
                    <Input
                      id="secondaryContactRelationship"
                      value={formData.secondaryContactRelationship}
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
                  <Label htmlFor="emergencyContactName">
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emergencyContactPhone">
                      Phone <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="emergencyContactPhone"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergencyContactRelationship">
                      Relationship <span className="text-red-500">*</span>
                    </Label>
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
                <span className="font-semibold">Medical Information (Optional)</span>
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
          <div className="flex justify-between w-full">
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleClearAll}>
                Clear All
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleDeleteDraft}>
                <Trash2 className="h-4 w-4 mr-1" />
                Delete Draft
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleSaveDraft}>
                <Save className="h-4 w-4 mr-1" />
                Save Draft
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting || isUploadingPhoto || isUploadingDoc}>
                {isSubmitting ? 'Adding...' : 'Add Student'}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

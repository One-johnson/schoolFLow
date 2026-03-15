'use client';

import {  useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import type { Id } from '@/../convex/_generated/dataModel';
import { api } from '@/../convex/_generated/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { 
  X, 
  Upload, 
  User, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle,
  Save,
  Trash2,
  CheckCircle2,
  Info
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DatePicker } from '@/components/ui/date-picker';
import Image from 'next/image';

interface AddTeacherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  createdBy: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  employmentDate?: string;
  salary?: string;
  qualifications?: string;
  subjects?: string;
}

const DRAFT_KEY = 'teacher_form_draft';

export function AddTeacherDialog({
  open,
  onOpenChange,
  schoolId,
  createdBy,
}: AddTeacherDialogProps): React.JSX.Element {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [showDraftRestoreDialog, setShowDraftRestoreDialog] = useState<boolean>(false);
  const [pendingDraft, setPendingDraft] = useState<{
    selectedDepartmentId?: string;
    formData: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      address: string;
      dateOfBirth: string;
      gender: 'male' | 'female' | 'other';
      employmentType: 'full_time' | 'part_time' | 'contract';
      employmentDate: string;
      salary: string;
      emergencyContact: string;
      emergencyContactName: string;
      emergencyContactRelationship: string;
    };
    qualifications: string[];
    subjects: string[];
    photoUrl: string;
    photoPreview: string;
  } | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  
  // Section collapse states
  const [photoOpen, setPhotoOpen] = useState<boolean>(true);
  const [personalOpen, setPersonalOpen] = useState<boolean>(true);
  const [professionalOpen, setProfessionalOpen] = useState<boolean>(true);
  const [emergencyOpen, setEmergencyOpen] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    gender: 'male' as 'male' | 'female' | 'other',
    employmentType: 'full_time' as 'full_time' | 'part_time' | 'contract',
    employmentDate: '',
    salary: '',
    emergencyContact: '',
    emergencyContactName: '',
    emergencyContactRelationship: '',
  });
  const [qualifications, setQualifications] = useState<string[]>([]);
  const [qualificationInput, setQualificationInput] = useState<string>('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [subjectInput, setSubjectInput] = useState<string>('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [selectedHouseId, setSelectedHouseId] = useState<string>('');

  const addTeacher = useMutation(api.teachers.addTeacher);

  const departments = useQuery(
    api.departments.getDepartmentsBySchool,
    schoolId ? { schoolId } : 'skip'
  );
  const houses = useQuery(
    api.houses.getHousesBySchool,
    schoolId ? { schoolId } : 'skip'
  );
  const schoolSubjects = useQuery(
    api.subjects.getSubjectsByDepartment,
    schoolId && selectedDepartmentId
      ? { schoolId, departmentId: selectedDepartmentId as Id<'departments'> }
      : 'skip'
  );
  const selectedDepartment = departments?.find((d) => d._id === selectedDepartmentId);

  // Calculate form completion percentage
  const calculateProgress = (): number => {
    const requiredFields = [
      formData.firstName,
      formData.lastName,
      formData.email,
      formData.phone,
      formData.address,
      formData.dateOfBirth,
      formData.employmentDate,
      qualifications.length > 0,
      subjects.length > 0,
    ];
    const completed = requiredFields.filter(Boolean).length;
    return Math.round((completed / requiredFields.length) * 100);
  };

  // Check for draft when dialog opens
  useEffect(() => {
    if (open) {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        try {
          const parsed = JSON.parse(draft) as {
            formData?: Record<string, unknown>;
            qualifications?: string[];
            subjects?: string[];
            selectedDepartmentId?: string;
            photoUrl?: string;
            photoPreview?: string;
          };
          if (parsed.formData) {
            const fd = parsed.formData;
            setPendingDraft({
              formData: {
                firstName: String(fd.firstName ?? ''),
                lastName: String(fd.lastName ?? ''),
                email: String(fd.email ?? ''),
                phone: String(fd.phone ?? ''),
                address: String(fd.address ?? ''),
                dateOfBirth: String(fd.dateOfBirth ?? ''),
                gender: (fd.gender === 'female' || fd.gender === 'other' ? fd.gender : 'male') as 'male' | 'female' | 'other',
                employmentType: (fd.employmentType === 'part_time' || fd.employmentType === 'contract' ? fd.employmentType : 'full_time') as 'full_time' | 'part_time' | 'contract',
                employmentDate: String(fd.employmentDate ?? ''),
                salary: String(fd.salary ?? ''),
                emergencyContact: String(fd.emergencyContact ?? ''),
                emergencyContactName: String(fd.emergencyContactName ?? ''),
                emergencyContactRelationship: String(fd.emergencyContactRelationship ?? ''),
              },
              qualifications: parsed.qualifications || [],
              subjects: parsed.subjects || [],
              selectedDepartmentId: parsed.selectedDepartmentId || '',
              photoUrl: parsed.photoUrl || '',
              photoPreview: parsed.photoPreview || '',
            });
            setShowDraftRestoreDialog(true);
          }
        } catch (error) {
          console.error('Failed to parse draft:', error);
        }
      }
    } else {
      setShowDraftRestoreDialog(false);
      setPendingDraft(null);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      const draftData = {
        formData,
        qualifications,
        subjects,
        selectedDepartmentId,
        photoUrl,
        photoPreview,
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
    }
  }, [formData, qualifications, subjects, selectedDepartmentId, photoUrl, photoPreview, open]);

  // Validation functions
  const validateEmail = (email: string): string | undefined => {
    if (!email) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Invalid email format';
    return undefined;
  };

  const validatePhone = (phone: string): string | undefined => {
    if (!phone) return 'Phone is required';
    const phoneRegex = /^[+]?[\d\s-()]+$/;
    if (!phoneRegex.test(phone)) return 'Invalid phone format';
    if (phone.replace(/\D/g, '').length < 10) return 'Phone must be at least 10 digits';
    return undefined;
  };

  const validateSalary = (salary: string): string | undefined => {
    if (salary && isNaN(parseFloat(salary))) return 'Invalid salary amount';
    if (salary && parseFloat(salary) < 0) return 'Salary cannot be negative';
    return undefined;
  };

  const validateField = (field: string, value: string): string | undefined => {
    switch (field) {
      case 'firstName':
        return !value ? 'First name is required' : undefined;
      case 'lastName':
        return !value ? 'Last name is required' : undefined;
      case 'email':
        return validateEmail(value);
      case 'phone':
        return validatePhone(value);
      case 'address':
        return !value ? 'Address is required' : undefined;
      case 'dateOfBirth':
        return !value ? 'Date of birth is required' : undefined;
      case 'employmentDate':
        return !value ? 'Employment date is required' : undefined;
      case 'salary':
        return validateSalary(value);
      default:
        return undefined;
    }
  };

  const handleInputChange = (field: string, value: string): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setTouchedFields((prev) => new Set(prev).add(field));
    
    // Real-time validation
    const error = validateField(field, value);
    setErrors((prev) => ({
      ...prev,
      [field]: error,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
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
    }
  };

  const removeImage = (): void => {
    setPhotoUrl('');
    setPhotoPreview('');
  };

  const addQualification = (): void => {
    if (qualificationInput.trim() && !qualifications.includes(qualificationInput.trim())) {
      setQualifications([...qualifications, qualificationInput.trim()]);
      setQualificationInput('');
      setErrors((prev) => ({ ...prev, qualifications: undefined }));
    }
  };

  const removeQualification = (qual: string): void => {
    setQualifications(qualifications.filter((q) => q !== qual));
  };

  const addSubject = (): void => {
    const trimmed = subjectInput.trim();
    if (!trimmed) return;
    const valueToAdd =
      selectedDepartment && trimmed
        ? `${selectedDepartment.name} - ${trimmed}`
        : trimmed;
    if (!subjects.includes(valueToAdd)) {
      setSubjects([...subjects, valueToAdd]);
      setSubjectInput('');
      setErrors((prev) => ({ ...prev, subjects: undefined }));
    }
  };

  const addSubjectFromDepartment = (subjectName: string): void => {
    if (!selectedDepartment) return;
    const valueToAdd = `${selectedDepartment.name} - ${subjectName}`;
    if (!subjects.includes(valueToAdd)) {
      setSubjects([...subjects, valueToAdd]);
      setErrors((prev) => ({ ...prev, subjects: undefined }));
    }
  };

  const removeSubject = (subject: string): void => {
    setSubjects(subjects.filter((s) => s !== subject));
  };

  const clearDraft = (): void => {
    localStorage.removeItem(DRAFT_KEY);
    toast.success('Draft cleared');
  };

  const resetForm = (): void => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      dateOfBirth: '',
      gender: 'male',
      employmentType: 'full_time',
      employmentDate: '',
      salary: '',
      emergencyContact: '',
      emergencyContactName: '',
      emergencyContactRelationship: '',
    });
    setQualifications([]);
    setSubjects([]);
    setSelectedDepartmentId('');
    setSelectedHouseId('');
    setPhotoUrl('');
    setPhotoPreview('');
    setErrors({});
    setTouchedFields(new Set());
    clearDraft();
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    // Required field validations
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key as keyof typeof formData]);
      if (error) {
        newErrors[key as keyof FormErrors] = error;
        isValid = false;
      }
    });

    if (qualifications.length === 0) {
      newErrors.qualifications = 'At least one qualification is required';
      isValid = false;
    }

    if (subjects.length === 0) {
      newErrors.subjects = 'At least one subject is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix all errors before submitting');
      return;
    }

    setShowConfirmDialog(true);
  };

  const confirmSubmit = async (): Promise<void> => {
    setIsSubmitting(true);

    try {
      const result = await addTeacher({
        schoolId,
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
        photoUrl: photoUrl || undefined,
        emergencyContact: formData.emergencyContact || undefined,
        emergencyContactName: formData.emergencyContactName || undefined,
        emergencyContactRelationship: formData.emergencyContactRelationship || undefined,
        houseId: selectedHouseId ? (selectedHouseId as Id<'houses'>) : undefined,
        createdBy,
      });

      toast.success(`Teacher added successfully! ID: ${result.generatedTeacherId}`);
      resetForm();
      setShowConfirmDialog(false);
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add teacher');
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = calculateProgress();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Add New Teacher</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearDraft}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Clear saved draft</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </DialogTitle>
            <DialogDescription>
              Fill in the details to add a new teacher. Required fields are
              marked with an asterisk (*).
            </DialogDescription>
          </DialogHeader>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Form Completion</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Photo Upload Section */}
            <Collapsible open={photoOpen} onOpenChange={setPhotoOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted rounded-lg hover:bg-muted/80">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Profile Photo
                </h3>
                {photoOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 shrink-0">
                    {photoPreview ? (
                      <Image
                        src={photoUrl}
                        alt="Teacher photo"
                        width={96}
                        height={96}
                        className="h-full w-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <User className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="photo" className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-muted w-fit">
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
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={removeImage}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Max file size: 5MB. Formats: JPG, PNG
                    </p>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Personal Information Section */}
            <Collapsible open={personalOpen} onOpenChange={setPersonalOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted rounded-lg hover:bg-muted/80">
                <h3 className="text-sm font-semibold">Personal Information</h3>
                {personalOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* First Name */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="firstName"
                      className="flex items-center gap-1"
                    >
                      First Name <span className="text-red-500">*</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Teacher&apos;s legal first name</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) =>
                        handleInputChange("firstName", e.target.value)
                      }
                      className={
                        errors.firstName && touchedFields.has("firstName")
                          ? "border-red-500"
                          : ""
                      }
                    />
                    {errors.firstName && touchedFields.has("firstName") && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.firstName}
                      </p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div className="space-y-2">
                    <Label htmlFor="lastName">
                      Last Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) =>
                        handleInputChange("lastName", e.target.value)
                      }
                      className={
                        errors.lastName && touchedFields.has("lastName")
                          ? "border-red-500"
                          : ""
                      }
                    />
                    {errors.lastName && touchedFields.has("lastName") && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.lastName}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      className={
                        errors.email && touchedFields.has("email")
                          ? "border-red-500"
                          : ""
                      }
                      placeholder="teacher@example.com"
                    />
                    {errors.email && touchedFields.has("email") && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      Phone <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      className={
                        errors.phone && touchedFields.has("phone")
                          ? "border-red-500"
                          : ""
                      }
                      placeholder="+1 234 567 8900"
                    />
                    {errors.phone && touchedFields.has("phone") && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">
                      Date of Birth <span className="text-red-500">*</span>
                    </Label>
                    <DatePicker
                      id="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={(v) => handleInputChange("dateOfBirth", v)}
                      placeholder="Select date of birth"
                      error={!!(errors.dateOfBirth && touchedFields.has("dateOfBirth"))}
                      disableFuture
                    />
                    {errors.dateOfBirth && touchedFields.has("dateOfBirth") && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.dateOfBirth}
                      </p>
                    )}
                  </div>

                  {/* Gender */}
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) =>
                        handleInputChange("gender", value)
                      }
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

                  {/* Address */}
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="address">
                      Address <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) =>
                        handleInputChange("address", e.target.value)
                      }
                      rows={3}
                      placeholder="Enter full address"
                      className={
                        errors.address && touchedFields.has("address")
                          ? "border-red-500"
                          : ""
                      }
                    />
                    {errors.address && touchedFields.has("address") && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.address}
                      </p>
                    )}
                  </div>

                  {/* House (optional) */}
                  <div className="space-y-2">
                    <Label htmlFor="houseId">House (optional)</Label>
                    <Select
                      value={selectedHouseId || 'none'}
                      onValueChange={(value) => setSelectedHouseId(value === 'none' ? '' : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select house" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {houses?.map((house) => (
                          <SelectItem key={house._id} value={house._id}>
                            {house.name} ({house.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Professional Information Section */}
            <Collapsible
              open={professionalOpen}
              onOpenChange={setProfessionalOpen}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted rounded-lg hover:bg-muted/80">
                <h3 className="text-sm font-semibold">
                  Professional Information
                </h3>
                {professionalOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Employment Type */}
                  <div className="space-y-2">
                    <Label htmlFor="employmentType">Employment Type</Label>
                    <Select
                      value={formData.employmentType}
                      onValueChange={(value) =>
                        handleInputChange("employmentType", value)
                      }
                    >
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

                  {/* Employment Date */}
                  <div className="space-y-2">
                    <Label htmlFor="employmentDate">
                      Employment Date <span className="text-red-500">*</span>
                    </Label>
                    <DatePicker
                      id="employmentDate"
                      value={formData.employmentDate}
                      onChange={(v) => handleInputChange("employmentDate", v)}
                      placeholder="Select employment date"
                      error={!!(errors.employmentDate && touchedFields.has("employmentDate"))}
                      disableFuture={false}
                    />
                    {errors.employmentDate &&
                      touchedFields.has("employmentDate") && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.employmentDate}
                        </p>
                      )}
                  </div>

                  {/* Salary */}
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="salary">Salary (Optional)</Label>
                    <Input
                      id="salary"
                      type="number"
                      value={formData.salary}
                      onChange={(e) =>
                        handleInputChange("salary", e.target.value)
                      }
                      className={
                        errors.salary && touchedFields.has("salary")
                          ? "border-red-500"
                          : ""
                      }
                      placeholder="Enter annual salary"
                    />
                    {errors.salary && touchedFields.has("salary") && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.salary}
                      </p>
                    )}
                  </div>

                  {/* Qualifications */}
                  <div className="space-y-2 col-span-2">
                    <Label>
                      Qualifications <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={qualificationInput}
                        onChange={(e) => setQualificationInput(e.target.value)}
                        placeholder="Enter qualification (e.g., M.Ed, Ph.D)"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addQualification();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={addQualification}
                        size="sm"
                        disabled={!qualificationInput.trim()}
                      >
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {qualifications.map((qual) => (
                        <Badge
                          key={qual}
                          variant="secondary"
                          className="text-sm"
                        >
                          {qual}
                          <X
                            className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive"
                            onClick={() => removeQualification(qual)}
                          />
                        </Badge>
                      ))}
                    </div>
                    {errors.qualifications && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.qualifications}
                      </p>
                    )}
                  </div>

                  {/* Subjects */}
                  <div className="space-y-2 col-span-2">
                    <Label>
                      Subjects <span className="text-red-500">*</span>
                    </Label>
                    <div className="space-y-2">
                      <Label htmlFor="subjectDepartment" className="text-xs text-muted-foreground">
                        Select department to add subjects
                      </Label>
                      <Select
                        value={selectedDepartmentId}
                        onValueChange={setSelectedDepartmentId}
                      >
                        <SelectTrigger id="subjectDepartment">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments?.map((d) => (
                            <SelectItem key={d._id} value={d._id}>
                              {d.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {selectedDepartment && schoolSubjects && schoolSubjects.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {schoolSubjects
                          .filter(
                            (s) =>
                              !subjects.includes(
                                `${selectedDepartment.name} - ${s.subjectName}`
                              )
                          )
                          .map((s) => (
                            <Badge
                              key={s._id}
                              variant="outline"
                              className="cursor-pointer hover:bg-primary/10"
                              onClick={() => addSubjectFromDepartment(s.subjectName)}
                            >
                              + {s.subjectName}
                            </Badge>
                          ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Input
                        value={subjectInput}
                        onChange={(e) => setSubjectInput(e.target.value)}
                        placeholder={
                          selectedDepartment
                            ? `Or type custom subject for ${selectedDepartment.name}`
                            : "Select department or type custom subject"
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addSubject();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={addSubject}
                        size="sm"
                        disabled={!subjectInput.trim()}
                      >
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {subjects.map((subject) => (
                        <Badge
                          key={subject}
                          variant="secondary"
                          className="text-sm"
                        >
                          {subject}
                          <X
                            className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive"
                            onClick={() => removeSubject(subject)}
                          />
                        </Badge>
                      ))}
                    </div>
                    {errors.subjects && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.subjects}
                      </p>
                    )}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Emergency Contact Section */}
            <Collapsible open={emergencyOpen} onOpenChange={setEmergencyOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted rounded-lg hover:bg-muted/80">
                <h3 className="text-sm font-semibold">
                  Emergency Contact (Optional)
                </h3>
                {emergencyOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactName">Contact Name</Label>
                    <Input
                      id="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={(e) =>
                        handleInputChange(
                          "emergencyContactName",
                          e.target.value,
                        )
                      }
                      placeholder="Full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContact">Contact Phone</Label>
                    <Input
                      id="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={(e) =>
                        handleInputChange("emergencyContact", e.target.value)
                      }
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="emergencyContactRelationship">
                      Relationship
                    </Label>
                    <Input
                      id="emergencyContactRelationship"
                      value={formData.emergencyContactRelationship}
                      onChange={(e) =>
                        handleInputChange(
                          "emergencyContactRelationship",
                          e.target.value,
                        )
                      }
                      placeholder="e.g., Spouse, Parent, Sibling"
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Submit Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm();
                  onOpenChange(false);
                }}
              >
                Cancel
              </Button>
              <div className="flex gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          clearDraft();
                          toast.success("Draft saved");
                        }}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Draft
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Save your progress</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <Button type="submit" disabled={isSubmitting || progress < 100}>
                  {isSubmitting ? "Adding..." : "Add Teacher"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Draft Restore Dialog */}
      <AlertDialog
        open={showDraftRestoreDialog}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDraft(null);
          }
          setShowDraftRestoreDialog(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Draft?</AlertDialogTitle>
            <AlertDialogDescription>
              Found an unsaved draft. Would you like to restore it?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                clearDraft();
                setPendingDraft(null);
              }}
            >
              Discard
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDraft) {
                  setFormData(pendingDraft.formData);
                  setQualifications(pendingDraft.qualifications);
                  setSubjects(pendingDraft.subjects);
                  setSelectedDepartmentId(pendingDraft.selectedDepartmentId || '');
                  setPhotoUrl(pendingDraft.photoUrl);
                  setPhotoPreview(pendingDraft.photoPreview);
                  toast.success('Draft restored');
                }
                setShowDraftRestoreDialog(false);
                setPendingDraft(null);
              }}
            >
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Teacher Addition</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-muted-foreground text-sm space-y-2">
              <p>Please review the teacher details:</p>
              <div className="bg-muted p-4 rounded-lg space-y-1 text-sm">
                <p>
                  <strong>Name:</strong> {formData.firstName}{" "}
                  {formData.lastName}
                </p>
                <p>
                  <strong>Email:</strong> {formData.email}
                </p>
                <p>
                  <strong>Phone:</strong> {formData.phone}
                </p>
                <p>
                  <strong>Qualifications:</strong> {qualifications.join(", ")}
                </p>
                <p>
                  <strong>Subjects:</strong> {subjects.join(", ")}
                </p>
              </div>
              <p>Are you sure you want to add this teacher?</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmSubmit();
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="mr-2">Adding...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Confirm
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
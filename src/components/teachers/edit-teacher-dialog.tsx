'use client';

import { useState, useEffect, JSX } from 'react';
import { useMutation, useQuery } from 'convex/react';
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
import { X, Upload, User, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { DatePicker } from '@/components/ui/date-picker';
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
}: EditTeacherDialogProps): React.JSX.Element {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [photoUrl, setPhotoUrl] = useState<string>(teacher.photoUrl || '');
  const [photoPreview, setPhotoPreview] = useState<string>(teacher.photoUrl || '');
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
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [selectedHouseId, setSelectedHouseId] = useState<string>(teacher.houseId || '');
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  const [photoOpen, setPhotoOpen] = useState(true);
  const [personalOpen, setPersonalOpen] = useState(true);
  const [contactOpen, setContactOpen] = useState(true);
  const [employmentOpen, setEmploymentOpen] = useState(true);
  const [emergencyOpen, setEmergencyOpen] = useState(false);

  const updateTeacher = useMutation(api.teachers.updateTeacher);
  const departments = useQuery(
    api.departments.getDepartmentsBySchool,
    teacher.schoolId ? { schoolId: teacher.schoolId } : 'skip'
  );
  const houses = useQuery(
    api.houses.getHousesBySchool,
    teacher.schoolId ? { schoolId: teacher.schoolId } : 'skip'
  );
  const departmentSubjects = useQuery(
    api.subjects.getSubjectsByDepartment,
    teacher.schoolId && selectedDepartmentId
      ? { schoolId: teacher.schoolId, departmentId: selectedDepartmentId as Id<'departments'> }
      : 'skip'
  );
  const selectedDepartment = departments?.find((d) => d._id === selectedDepartmentId);

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
        if (value && (isNaN(parseFloat(value)) || parseFloat(value) < 0))
          return 'Invalid salary amount';
        return undefined;
      default:
        return undefined;
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload a valid image file');
        return;
      }

      // Create preview
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
    setSelectedDepartmentId('');
    setSelectedHouseId(teacher.houseId || '');
    setPhotoUrl(teacher.photoUrl || '');
    setPhotoPreview(teacher.photoUrl || '');
    setErrors({});
    setTouchedFields(new Set());
  }, [teacher]);

  const handleInputChange = (field: string, value: string): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setTouchedFields((prev) => new Set(prev).add(field));
    const error = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: error }));
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string | undefined> = {};
    (Object.keys(formData) as (keyof typeof formData)[]).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });
    if (qualifications.length === 0) newErrors.qualifications = 'At least one qualification is required';
    if (subjects.length === 0) newErrors.subjects = 'At least one subject is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix all errors before submitting');
      return;
    }
    setIsSubmitting(true);

    try {
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
        photoUrl: photoUrl || undefined,
        emergencyContact: formData.emergencyContact || undefined,
        emergencyContactName: formData.emergencyContactName || undefined,
        emergencyContactRelationship: formData.emergencyContactRelationship || undefined,
        houseId: selectedHouseId ? (selectedHouseId as Id<'houses'>) : undefined,
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Teacher</DialogTitle>
          <DialogDescription>
            Update the teacher&apos;s information. Teacher ID: {teacher.teacherId}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Photo Upload */}
          <Collapsible open={photoOpen} onOpenChange={setPhotoOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted rounded-lg hover:bg-muted/80">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile Photo (Optional)
              </h3>
              {photoOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 shrink-0">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor="photo" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-accent w-fit">
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
            </CollapsibleContent>
          </Collapsible>

          {/* Personal Information */}
          <Collapsible open={personalOpen} onOpenChange={setPersonalOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted rounded-lg hover:bg-muted/80">
              <h3 className="text-sm font-semibold">Personal Information</h3>
              {personalOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={errors.firstName && touchedFields.has('firstName') ? 'border-red-500' : ''}
                  />
                  {errors.firstName && touchedFields.has('firstName') && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.firstName}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={errors.lastName && touchedFields.has('lastName') ? 'border-red-500' : ''}
                  />
                  {errors.lastName && touchedFields.has('lastName') && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.lastName}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth <span className="text-red-500">*</span></Label>
                  <DatePicker
                    id="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={(v) => handleInputChange('dateOfBirth', v)}
                    placeholder="Select date of birth"
                    error={!!(errors.dateOfBirth && touchedFields.has('dateOfBirth'))}
                    disableFuture
                  />
                  {errors.dateOfBirth && touchedFields.has('dateOfBirth') && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.dateOfBirth}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={formData.gender} onValueChange={(v) => handleInputChange('gender', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Contact Information */}
          <Collapsible open={contactOpen} onOpenChange={setContactOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted rounded-lg hover:bg-muted/80">
              <h3 className="text-sm font-semibold">Contact Information</h3>
              {contactOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={errors.email && touchedFields.has('email') ? 'border-red-500' : ''}
                  />
                  {errors.email && touchedFields.has('email') && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.email}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone <span className="text-red-500">*</span></Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={errors.phone && touchedFields.has('phone') ? 'border-red-500' : ''}
                  />
                  {errors.phone && touchedFields.has('phone') && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.phone}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address <span className="text-red-500">*</span></Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  rows={3}
                  className={errors.address && touchedFields.has('address') ? 'border-red-500' : ''}
                />
                {errors.address && touchedFields.has('address') && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.address}
                  </p>
                )}
              </div>
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
                        <span className="flex items-center gap-2">
                          {house.color && (
                            <span
                              className="h-3 w-3 shrink-0 rounded-full border border-border"
                              style={{ backgroundColor: house.color }}
                            />
                          )}
                          {house.name} ({house.code})
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Employment Information */}
          <Collapsible open={employmentOpen} onOpenChange={setEmploymentOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted rounded-lg hover:bg-muted/80">
              <h3 className="text-sm font-semibold">Employment Information</h3>
              {employmentOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employmentType">Employment Type</Label>
                  <Select value={formData.employmentType} onValueChange={(v) => handleInputChange('employmentType', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_time">Full Time</SelectItem>
                      <SelectItem value="part_time">Part Time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employmentDate">Employment Date <span className="text-red-500">*</span></Label>
                  <DatePicker
                    id="employmentDate"
                    value={formData.employmentDate}
                    onChange={(v) => handleInputChange('employmentDate', v)}
                    placeholder="Select employment date"
                    error={!!(errors.employmentDate && touchedFields.has('employmentDate'))}
                    disableFuture={false}
                  />
                  {errors.employmentDate && touchedFields.has('employmentDate') && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.employmentDate}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary">Salary (Optional)</Label>
                <Input
                  id="salary"
                  type="number"
                  placeholder="Enter annual salary"
                  value={formData.salary}
                  onChange={(e) => handleInputChange('salary', e.target.value)}
                  className={errors.salary && touchedFields.has('salary') ? 'border-red-500' : ''}
                />
                {errors.salary && touchedFields.has('salary') && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.salary}
                  </p>
                )}
              </div>

              {/* Qualifications */}
              <div className="space-y-2">
                <Label>Qualifications <span className="text-red-500">*</span></Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., Bachelor of Education"
                    value={qualificationInput}
                    onChange={(e) => setQualificationInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addQualification();
                      }
                    }}
                  />
                  <Button type="button" onClick={addQualification}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {qualifications.map((qual) => (
                    <Badge key={qual} variant="secondary" className="flex items-center gap-1">
                      {qual}
                      <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => removeQualification(qual)} />
                    </Badge>
                  ))}
                </div>
                {errors.qualifications && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.qualifications}
                  </p>
                )}
              </div>

              {/* Subjects */}
              <div className="space-y-2">
                <Label>Subjects Taught <span className="text-red-500">*</span></Label>
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
                {selectedDepartment && departmentSubjects && departmentSubjects.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {departmentSubjects
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
                    placeholder={
                      selectedDepartment
                        ? `Or type custom subject for ${selectedDepartment.name}`
                        : "Select department or type custom subject"
                    }
                    value={subjectInput}
                    onChange={(e) => setSubjectInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSubject();
                      }
                    }}
                  />
                  <Button type="button" onClick={addSubject}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {subjects.map((subject) => (
                    <Badge key={subject} variant="secondary" className="flex items-center gap-1">
                      {subject}
                      <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => removeSubject(subject)} />
                    </Badge>
                  ))}
                </div>
                {errors.subjects && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.subjects}
                  </p>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Emergency Contact */}
          <Collapsible open={emergencyOpen} onOpenChange={setEmergencyOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted rounded-lg hover:bg-muted/80">
              <h3 className="text-sm font-semibold">Emergency Contact (Optional)</h3>
              {emergencyOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyContactName">Contact Name</Label>
                <Input
                  id="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">Contact Phone</Label>
                  <Input
                    id="emergencyContact"
                    type="tel"
                    value={formData.emergencyContact}
                    onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactRelationship">Relationship</Label>
                  <Input
                    id="emergencyContactRelationship"
                    placeholder="e.g., Spouse, Parent"
                    value={formData.emergencyContactRelationship}
                    onChange={(e) => handleInputChange('emergencyContactRelationship', e.target.value)}
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

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

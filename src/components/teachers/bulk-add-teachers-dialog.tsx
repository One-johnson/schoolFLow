"use client";

import { useState, useEffect, useRef, useCallback, JSX } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  X,
  Upload,
  User,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  Info,
  Trash2,
  FileSpreadsheet,
  UserPlus,
  Download,
  Eye,
} from "lucide-react";
import Papa from "papaparse";

interface BulkAddTeachersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  createdBy: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  employmentType: "full_time" | "part_time" | "contract";
  employmentDate: string;
  salary: string;
  emergencyContact: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
}

interface FormErrors {
  [key: string]: string;
}

interface CSVTeacher {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  qualifications: string[];
  subjects: string[];
  employmentType: "full_time" | "part_time" | "contract";
  employmentDate: string;
  salary?: number;
  emergencyContactName?: string;
  emergencyContact?: string;
  emergencyContactRelationship?: string;
}

const DRAFT_KEY = "bulk_teacher_form_draft";
const COMMON_QUALIFICATIONS = [
  "Bachelor of Education",
  "Master of Education",
  "PhD in Education",
  "Bachelor of Arts",
  "Bachelor of Science",
  "PGCE",
  "Teaching Diploma",
];
const COMMON_SUBJECTS = [
  "Mathematics",
  "English",
  "Science",
  "Physics",
  "Chemistry",
  "Biology",
  "History",
  "Geography",
  "Computer Science",
  "Physical Education",
  "Art",
  "Music",
];

export function BulkAddTeachersDialog({
  open,
  onOpenChange,
  schoolId,
  createdBy,
}: BulkAddTeachersDialogProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<string>("manual");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);

  // Manual entry state
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    dateOfBirth: "",
    gender: "male",
    employmentType: "full_time",
    employmentDate: "",
    salary: "",
    emergencyContact: "",
    emergencyContactName: "",
    emergencyContactRelationship: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [qualifications, setQualifications] = useState<string[]>([]);
  const [qualificationInput, setQualificationInput] = useState<string>("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [subjectInput, setSubjectInput] = useState<string>("");
  const [showQualificationSuggestions, setShowQualificationSuggestions] =
    useState<boolean>(false);
  const [showSubjectSuggestions, setShowSubjectSuggestions] =
    useState<boolean>(false);

  // CSV upload state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedTeachers, setParsedTeachers] = useState<CSVTeacher[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);

  // Collapsible sections state
  const [personalOpen, setPersonalOpen] = useState<boolean>(true);
  const [contactOpen, setContactOpen] = useState<boolean>(true);
  const [professionalOpen, setProfessionalOpen] = useState<boolean>(true);
  const [emergencyOpen, setEmergencyOpen] = useState<boolean>(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const addTeacher = useMutation(api.teachers.addTeacher);
  const existingTeachers = useQuery(
    api.teachers.getTeachersBySchool,
    schoolId ? { schoolId } : "skip"
  );

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
    const filledFields = requiredFields.filter(Boolean).length;
    return Math.round((filledFields / requiredFields.length) * 100);
  };

  // Auto-save draft (excluding photos)
  useEffect(() => {
    if (open && activeTab === "manual") {
      const timer = setTimeout(() => {
        const draftData = {
          formData,
          qualifications,
          subjects,
        };
        try {
          localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
        } catch (e) {
          // Silently fail if localStorage is full
          console.error("Failed to save draft:", e);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [formData, qualifications, subjects, open, activeTab]);

  // Load draft on mount
  useEffect(() => {
    if (open) {
      try {
        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved) {
          const draft = JSON.parse(saved);
          setFormData(draft.formData || formData);
          setQualifications(draft.qualifications || []);
          setSubjects(draft.subjects || []);
          toast.info("Draft restored");
        }
      } catch (e) {
        console.error("Failed to load draft:", e);
      }
    }
  }, [open]);

  // Real-time validation
  const validateField = (field: keyof FormData, value: string): string => {
    switch (field) {
      case "email":
        if (!value) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          return "Invalid email format";
        if (existingTeachers?.some((t) => t.email === value))
          return "Email already exists";
        return "";
      case "phone":
        if (!value) return "Phone is required";
        if (!/^\+?[\d\s-()]{10,}$/.test(value)) return "Invalid phone format";
        return "";
      case "salary":
        if (value && parseFloat(value) < 0) return "Salary must be positive";
        return "";
      case "firstName":
      case "lastName":
        if (!value)
          return `${field === "firstName" ? "First" : "Last"} name is required`;
        if (value.length < 2) return "Must be at least 2 characters";
        return "";
      case "address":
        if (!value) return "Address is required";
        return "";
      case "dateOfBirth":
        if (!value) return "Date of birth is required";
        return "";
      case "employmentDate":
        if (!value) return "Employment date is required";
        return "";
      default:
        return "";
    }
  };

  const handleInputChange = (field: keyof FormData, value: string): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    const error = validateField(field, value);
    setFormErrors((prev) => ({ ...prev, [field]: error }));
  };

  // Image handling with drag & drop
  const handleImageChange = (file: File): void => {
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file");
      return;
    }

    setPhotoFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent): void => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (): void => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent): void => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageChange(file);
  };

  const removeImage = (): void => {
    setPhotoUrl("");
    setPhotoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Qualification handling with autocomplete
  const addQualification = (qual?: string): void => {
    const qualToAdd = qual || qualificationInput.trim();
    if (qualToAdd && !qualifications.includes(qualToAdd)) {
      setQualifications([...qualifications, qualToAdd]);
      setQualificationInput("");
      setShowQualificationSuggestions(false);
    }
  };

  const removeQualification = (qual: string): void => {
    setQualifications(qualifications.filter((q) => q !== qual));
  };

  // Subject handling with autocomplete
  const addSubject = (subj?: string): void => {
    const subjToAdd = subj || subjectInput.trim();
    if (subjToAdd && !subjects.includes(subjToAdd)) {
      setSubjects([...subjects, subjToAdd]);
      setSubjectInput("");
      setShowSubjectSuggestions(false);
    }
  };

  const removeSubject = (subject: string): void => {
    setSubjects(subjects.filter((s) => s !== subject));
  };

  // Clear all
  const handleClearAll = (): void => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      dateOfBirth: "",
      gender: "male",
      employmentType: "full_time",
      employmentDate: "",
      salary: "",
      emergencyContact: "",
      emergencyContactName: "",
      emergencyContactRelationship: "",
    });
    setQualifications([]);
    setSubjects([]);
    setPhotoUrl("");
    setPhotoFile(null);
    setFormErrors({});
    toast.success("Form cleared");
  };

  // Save draft manually
  const handleSaveDraft = (): void => {
    const draftData = {
      formData,
      qualifications,
      subjects,
    };
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
      toast.success("Draft saved successfully");
    } catch (e) {
      toast.error("Failed to save draft");
      console.error("Failed to save draft:", e);
    }
  };

  // Delete draft
  const handleDeleteDraft = (): void => {
    try {
      localStorage.removeItem(DRAFT_KEY);
      toast.success("Draft deleted");
    } catch (e) {
      toast.error("Failed to delete draft");
      console.error("Failed to delete draft:", e);
    }
  };

  // CSV handling
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    setCsvErrors([]);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const errors: string[] = [];
        const teachers: CSVTeacher[] = [];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        results.data.forEach((row: any, index: number) => {
          const rowNum = index + 2; // +2 for header and 0-indexing

          // Validate required fields
          if (!row.firstName) errors.push(`Row ${rowNum}: Missing first name`);
          if (!row.lastName) errors.push(`Row ${rowNum}: Missing last name`);
          if (!row.email) errors.push(`Row ${rowNum}: Missing email`);
          if (!row.phone) errors.push(`Row ${rowNum}: Missing phone`);
          if (!row.dateOfBirth)
            errors.push(`Row ${rowNum}: Missing date of birth`);
          if (!row.employmentDate)
            errors.push(`Row ${rowNum}: Missing employment date`);

          // Validate email format
          if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
            errors.push(`Row ${rowNum}: Invalid email format`);
          }

          // Check for duplicate emails
          if (existingTeachers?.some((t) => t.email === row.email)) {
            errors.push(`Row ${rowNum}: Email already exists`);
          }

          // Parse qualifications and subjects
          const qualifications = row.qualifications
            ? row.qualifications.split(";").map((q: string) => q.trim())
            : [];
          const subjects = row.subjects
            ? row.subjects.split(";").map((s: string) => s.trim())
            : [];

          if (qualifications.length === 0) {
            errors.push(`Row ${rowNum}: Missing qualifications`);
          }
          if (subjects.length === 0) {
            errors.push(`Row ${rowNum}: Missing subjects`);
          }

          // Only add valid teachers
          if (
            row.firstName &&
            row.lastName &&
            row.email &&
            row.phone &&
            row.dateOfBirth &&
            row.employmentDate &&
            qualifications.length > 0 &&
            subjects.length > 0
          ) {
            teachers.push({
              firstName: row.firstName,
              lastName: row.lastName,
              email: row.email,
              phone: row.phone,
              address: row.address || "",
              dateOfBirth: row.dateOfBirth,
              gender: (row.gender || "male") as "male" | "female" | "other",
              qualifications,
              subjects,
              employmentType: (row.employmentType || "full_time") as
                | "full_time"
                | "part_time"
                | "contract",
              employmentDate: row.employmentDate,
              salary: row.salary ? parseFloat(row.salary) : undefined,
              emergencyContactName: row.emergencyContactName || undefined,
              emergencyContact: row.emergencyContact || undefined,
              emergencyContactRelationship:
                row.emergencyContactRelationship || undefined,
            });
          }
        });

        setCsvErrors(errors);
        setParsedTeachers(teachers);

        if (errors.length === 0) {
          toast.success(`Successfully parsed ${teachers.length} teachers`);
        } else {
          toast.error(`Found ${errors.length} errors in CSV`);
        }
      },
      error: (error) => {
        toast.error("Failed to parse CSV file");
        console.error(error);
      },
    });
  };

  const downloadTemplate = (): void => {
    const template = `firstName,lastName,email,phone,address,dateOfBirth,gender,qualifications,subjects,employmentType,employmentDate,salary,emergencyContactName,emergencyContact,emergencyContactRelationship
John,Doe,john.doe@example.com,+1234567890,123 Main St,1985-05-15,male,Bachelor of Education;Master of Education,Mathematics;Physics,full_time,2023-01-15,50000,Jane Doe,+1234567891,Spouse`;

    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "teachers_template.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Template downloaded");
  };

  // Submit manual entry
  const handleManualSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    // Validate all fields
    const errors: FormErrors = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(
        key as keyof FormData,
        formData[key as keyof FormData]
      );
      if (error) errors[key] = error;
    });

    if (qualifications.length === 0) {
      toast.error("Please add at least one qualification");
      return;
    }

    if (subjects.length === 0) {
      toast.error("Please add at least one subject");
      return;
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Please fix all errors before submitting");
      return;
    }

    setShowConfirmation(true);
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
        emergencyContactRelationship:
          formData.emergencyContactRelationship || undefined,
        createdBy,
      });

      toast.success(
        `Teacher added successfully! ID: ${result.generatedTeacherId}`
      );
      localStorage.removeItem(DRAFT_KEY);
      handleClearAll();
      setShowConfirmation(false);
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add teacher"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit CSV bulk upload
  const handleCSVSubmit = async (): Promise<void> => {
    if (parsedTeachers.length === 0) {
      toast.error("No valid teachers to add");
      return;
    }

    setIsSubmitting(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const teacher of parsedTeachers) {
        try {
          await addTeacher({
            schoolId,
            ...teacher,
            createdBy,
          });
          successCount++;
        } catch (error) {
          failCount++;
          console.error(`Failed to add teacher ${teacher.email}:`, error);
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully added ${successCount} teachers`);
      }
      if (failCount > 0) {
        toast.error(`Failed to add ${failCount} teachers`);
      }

      if (successCount > 0) {
        setCsvFile(null);
        setParsedTeachers([]);
        setCsvErrors([]);
        onOpenChange(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = calculateProgress();

  // Filtered suggestions
  const filteredQualifications = COMMON_QUALIFICATIONS.filter(
    (q) =>
      q.toLowerCase().includes(qualificationInput.toLowerCase()) &&
      !qualifications.includes(q)
  );
  const filteredSubjects = COMMON_SUBJECTS.filter(
    (s) =>
      s.toLowerCase().includes(subjectInput.toLowerCase()) &&
      !subjects.includes(s)
  );

  return (
    <>
      <Dialog open={open && !showConfirmation} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Add Teachers</DialogTitle>
            <DialogDescription>
              Add teachers manually or upload a CSV file to add multiple
              teachers at once.
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">
                <UserPlus className="h-4 w-4 mr-2" />
                Manual Entry
              </TabsTrigger>
              <TabsTrigger value="csv">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                CSV Upload
              </TabsTrigger>
            </TabsList>

            {/* Manual Entry Tab */}
            <TabsContent
              value="manual"
              className="flex-1 flex flex-col overflow-hidden"
            >
              <ScrollArea className="flex-1 w-full pr-4">
                <form onSubmit={handleManualSubmit} className="space-y-6">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">
                        Form Completion
                      </Label>
                      <span className="text-sm text-muted-foreground">
                        {progress}%
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {/* Photo Upload with Drag & Drop - Compact */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">
                      Profile Photo (Optional)
                    </Label>
                    <div
                      className={`border-2 border-dashed rounded-lg p-3 text-center transition-colors ${
                        isDragging
                          ? "border-primary bg-primary/5"
                          : "border-gray-300"
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      {photoUrl ? (
                        <div className="flex items-center gap-3">
                          <img
                            src={photoUrl}
                            alt="Preview"
                            className="h-16 w-16 rounded-full object-cover"
                          />
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium">
                              Photo uploaded
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Ready to submit
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={removeImage}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                            <Upload className="h-6 w-6 text-gray-400" />
                          </div>
                          <div className="flex-1 text-left">
                            <Label
                              htmlFor="photo"
                              className="cursor-pointer text-sm text-primary hover:underline"
                            >
                              Click to upload
                            </Label>
                            <span className="text-xs text-muted-foreground">
                              {" "}
                              or drag and drop (PNG, JPG up to 5MB)
                            </span>
                          </div>
                          <Input
                            ref={fileInputRef}
                            id="photo"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageChange(file);
                            }}
                            className="hidden"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Personal Information Section */}
                  <Collapsible
                    open={personalOpen}
                    onOpenChange={setPersonalOpen}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-between"
                      >
                        <span className="font-semibold">
                          Personal Information *
                        </span>
                        {personalOpen ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-4 pt-4">
                      <div className="grid grid-cols-2 gap-4">
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
                                  <p>
                                    Enter the teacher&apos;s legal first name
                                  </p>
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
                              formErrors.firstName ? "border-red-500" : ""
                            }
                            maxLength={50}
                          />
                          {formErrors.firstName && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {formErrors.firstName}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {formData.firstName.length}/50
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="lastName"
                            className="flex items-center gap-1"
                          >
                            Last Name <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="lastName"
                            value={formData.lastName}
                            onChange={(e) =>
                              handleInputChange("lastName", e.target.value)
                            }
                            className={
                              formErrors.lastName ? "border-red-500" : ""
                            }
                            maxLength={50}
                          />
                          {formErrors.lastName && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {formErrors.lastName}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {formData.lastName.length}/50
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="dateOfBirth">
                            Date of Birth{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="dateOfBirth"
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={(e) =>
                              handleInputChange("dateOfBirth", e.target.value)
                            }
                            className={
                              formErrors.dateOfBirth ? "border-red-500" : ""
                            }
                          />
                          {formErrors.dateOfBirth && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {formErrors.dateOfBirth}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="gender">
                            Gender <span className="text-red-500">*</span>
                          </Label>
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
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  <Separator />

                  {/* Contact Information Section */}
                  <Collapsible open={contactOpen} onOpenChange={setContactOpen}>
                    <CollapsibleTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-between"
                      >
                        <span className="font-semibold">
                          Contact Information *
                        </span>
                        {contactOpen ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-4 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label
                            htmlFor="email"
                            className="flex items-center gap-1"
                          >
                            Email <span className="text-red-500">*</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-3 w-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    Must be a valid and unique email address
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                              handleInputChange("email", e.target.value)
                            }
                            className={formErrors.email ? "border-red-500" : ""}
                          />
                          {formErrors.email && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {formErrors.email}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="phone"
                            className="flex items-center gap-1"
                          >
                            Phone <span className="text-red-500">*</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-3 w-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Format: +1234567890 or (123) 456-7890</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) =>
                              handleInputChange("phone", e.target.value)
                            }
                            className={formErrors.phone ? "border-red-500" : ""}
                            placeholder="+1234567890"
                          />
                          {formErrors.phone && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {formErrors.phone}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address">
                          Address <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                          id="address"
                          value={formData.address}
                          onChange={(e) =>
                            handleInputChange("address", e.target.value)
                          }
                          className={formErrors.address ? "border-red-500" : ""}
                          maxLength={200}
                        />
                        {formErrors.address && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {formErrors.address}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {formData.address.length}/200
                        </p>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  <Separator />

                  {/* Professional Information Section */}
                  <Collapsible
                    open={professionalOpen}
                    onOpenChange={setProfessionalOpen}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-between"
                      >
                        <span className="font-semibold">
                          Professional Information *
                        </span>
                        {professionalOpen ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-4 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="employmentType">
                            Employment Type{" "}
                            <span className="text-red-500">*</span>
                          </Label>
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
                              <SelectItem value="full_time">
                                Full Time
                              </SelectItem>
                              <SelectItem value="part_time">
                                Part Time
                              </SelectItem>
                              <SelectItem value="contract">Contract</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="employmentDate">
                            Employment Date{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="employmentDate"
                            type="date"
                            value={formData.employmentDate}
                            onChange={(e) =>
                              handleInputChange(
                                "employmentDate",
                                e.target.value
                              )
                            }
                            className={
                              formErrors.employmentDate ? "border-red-500" : ""
                            }
                          />
                          {formErrors.employmentDate && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {formErrors.employmentDate}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="salary"
                          className="flex items-center gap-1"
                        >
                          Monthly Salary (Optional)
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3 w-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Enter the monthly salary amount</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </Label>
                        <Input
                          id="salary"
                          type="number"
                          placeholder="Enter monthly salary"
                          value={formData.salary}
                          onChange={(e) =>
                            handleInputChange("salary", e.target.value)
                          }
                          className={formErrors.salary ? "border-red-500" : ""}
                        />
                        {formErrors.salary && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {formErrors.salary}
                          </p>
                        )}
                      </div>

                      {/* Qualifications with Autocomplete */}
                      <div className="space-y-2">
                        <Label>
                          Qualifications <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <div className="flex gap-2">
                            <Input
                              placeholder="e.g., Bachelor of Education"
                              value={qualificationInput}
                              onChange={(e) => {
                                setQualificationInput(e.target.value);
                                setShowQualificationSuggestions(
                                  e.target.value.length > 0
                                );
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  addQualification();
                                }
                                if (e.key === "Escape") {
                                  setShowQualificationSuggestions(false);
                                }
                              }}
                            />
                            <Button
                              type="button"
                              onClick={() => addQualification()}
                            >
                              Add
                            </Button>
                          </div>
                          {showQualificationSuggestions &&
                            filteredQualifications.length > 0 && (
                              <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-auto">
                                {filteredQualifications.map((qual) => (
                                  <div
                                    key={qual}
                                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                    onClick={() => addQualification(qual)}
                                  >
                                    {qual}
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2 min-h-[32px]">
                          {qualifications.map((qual, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              {qual}
                              <X
                                className="h-3 w-3 cursor-pointer hover:text-red-500"
                                onClick={() => removeQualification(qual)}
                              />
                            </Badge>
                          ))}
                        </div>
                        {qualifications.length === 0 && (
                          <p className="text-xs text-muted-foreground">
                            Press Enter or click Add to add qualifications
                          </p>
                        )}
                      </div>

                      {/* Subjects with Autocomplete */}
                      <div className="space-y-2">
                        <Label>
                          Subjects Taught{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <div className="flex gap-2">
                            <Input
                              placeholder="e.g., Mathematics"
                              value={subjectInput}
                              onChange={(e) => {
                                setSubjectInput(e.target.value);
                                setShowSubjectSuggestions(
                                  e.target.value.length > 0
                                );
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  addSubject();
                                }
                                if (e.key === "Escape") {
                                  setShowSubjectSuggestions(false);
                                }
                              }}
                            />
                            <Button type="button" onClick={() => addSubject()}>
                              Add
                            </Button>
                          </div>
                          {showSubjectSuggestions &&
                            filteredSubjects.length > 0 && (
                              <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-auto">
                                {filteredSubjects.map((subj) => (
                                  <div
                                    key={subj}
                                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                    onClick={() => addSubject(subj)}
                                  >
                                    {subj}
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2 min-h-[32px]">
                          {subjects.map((subject, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              {subject}
                              <X
                                className="h-3 w-3 cursor-pointer hover:text-red-500"
                                onClick={() => removeSubject(subject)}
                              />
                            </Badge>
                          ))}
                        </div>
                        {subjects.length === 0 && (
                          <p className="text-xs text-muted-foreground">
                            Press Enter or click Add to add subjects
                          </p>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  <Separator />

                  {/* Emergency Contact Section */}
                  <Collapsible
                    open={emergencyOpen}
                    onOpenChange={setEmergencyOpen}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-between"
                      >
                        <span className="font-semibold">
                          Emergency Contact (Optional)
                        </span>
                        {emergencyOpen ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="emergencyContactName">
                          Contact Name
                        </Label>
                        <Input
                          id="emergencyContactName"
                          value={formData.emergencyContactName}
                          onChange={(e) =>
                            handleInputChange(
                              "emergencyContactName",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="emergencyContact">
                            Contact Phone
                          </Label>
                          <Input
                            id="emergencyContact"
                            type="tel"
                            value={formData.emergencyContact}
                            onChange={(e) =>
                              handleInputChange(
                                "emergencyContact",
                                e.target.value
                              )
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="emergencyContactRelationship">
                            Relationship
                          </Label>
                          <Input
                            id="emergencyContactRelationship"
                            placeholder="e.g., Spouse, Parent"
                            value={formData.emergencyContactRelationship}
                            onChange={(e) =>
                              handleInputChange(
                                "emergencyContactRelationship",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </form>
              </ScrollArea>

              {/* Footer - Always Visible */}
              <DialogFooter className="flex justify-between pt-4 mt-4 border-t flex-shrink-0">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClearAll}
                    disabled={isSubmitting}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDeleteDraft}
                    disabled={isSubmitting}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Draft
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSaveDraft}
                    disabled={isSubmitting}
                  >
                    Save Draft
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleManualSubmit} disabled={isSubmitting}>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview & Submit
                  </Button>
                </div>
              </DialogFooter>
            </TabsContent>

            {/* CSV Upload Tab */}
            <TabsContent
              value="csv"
              className="flex-1 flex flex-col overflow-hidden"
            >
              <ScrollArea className="flex-1 w-full pr-4">
                <div className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Upload a CSV file with teacher information. Make sure your
                      CSV includes all required fields.
                    </AlertDescription>
                  </Alert>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={downloadTemplate}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Template
                    </Button>
                    <Button
                      type="button"
                      onClick={() => csvInputRef.current?.click()}
                      className="flex-1"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload CSV
                    </Button>
                    <Input
                      ref={csvInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleCSVUpload}
                      className="hidden"
                    />
                  </div>

                  {csvFile && (
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg bg-gray-50">
                        <p className="text-sm font-medium">
                          Selected File: {csvFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {parsedTeachers.length} valid teachers found
                        </p>
                      </div>

                      {csvErrors.length > 0 && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            <p className="font-semibold mb-2">
                              Found {csvErrors.length} error(s):
                            </p>
                            <ScrollArea className="h-32">
                              <ul className="space-y-1 text-xs">
                                {csvErrors.map((error, index) => (
                                  <li key={index}>• {error}</li>
                                ))}
                              </ul>
                            </ScrollArea>
                          </AlertDescription>
                        </Alert>
                      )}

                      {parsedTeachers.length > 0 && (
                        <div className="space-y-2">
                          <Label className="font-semibold">
                            Teachers to be added:
                          </Label>
                          <ScrollArea className="h-64 border rounded-lg p-4">
                            <div className="space-y-2">
                              {parsedTeachers.map((teacher, index) => (
                                <div
                                  key={index}
                                  className="p-3 border rounded-lg bg-white"
                                >
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span className="font-medium">
                                      {teacher.firstName} {teacher.lastName}
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {teacher.email} •{" "}
                                    {teacher.subjects.join(", ")}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </ScrollArea>

              <DialogFooter className="pt-4 mt-4 border-t flex-shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCSVSubmit}
                  disabled={
                    isSubmitting ||
                    parsedTeachers.length === 0 ||
                    csvErrors.length > 0
                  }
                >
                  {isSubmitting
                    ? "Adding Teachers..."
                    : `Add ${parsedTeachers.length} Teachers`}
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Confirm Teacher Details</DialogTitle>
            <DialogDescription>
              Please review the teacher information before submitting.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {photoUrl && (
                <div className="flex justify-center">
                  <img
                    src={photoUrl}
                    alt="Teacher"
                    className="h-32 w-32 rounded-full object-cover"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Full Name
                  </Label>
                  <p className="font-medium">
                    {formData.firstName} {formData.lastName}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="font-medium">{formData.email}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  <p className="font-medium">{formData.phone}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Date of Birth
                  </Label>
                  <p className="font-medium">{formData.dateOfBirth}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Gender
                  </Label>
                  <p className="font-medium capitalize">{formData.gender}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Employment Type
                  </Label>
                  <p className="font-medium">
                    {formData.employmentType.replace("_", " ").toUpperCase()}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Employment Date
                  </Label>
                  <p className="font-medium">{formData.employmentDate}</p>
                </div>
                {formData.salary && (
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Monthly Salary
                    </Label>
                    <p className="font-medium">${formData.salary}</p>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Address</Label>
                <p className="font-medium">{formData.address}</p>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">
                  Qualifications
                </Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {qualifications.map((qual, index) => (
                    <Badge key={index} variant="secondary">
                      {qual}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">
                  Subjects
                </Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {subjects.map((subject, index) => (
                    <Badge key={index} variant="secondary">
                      {subject}
                    </Badge>
                  ))}
                </div>
              </div>

              {(formData.emergencyContactName ||
                formData.emergencyContact ||
                formData.emergencyContactRelationship) && (
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Emergency Contact
                  </Label>
                  <div className="mt-1 space-y-1">
                    {formData.emergencyContactName && (
                      <p className="text-sm">
                        Name: {formData.emergencyContactName}
                      </p>
                    )}
                    {formData.emergencyContact && (
                      <p className="text-sm">
                        Phone: {formData.emergencyContact}
                      </p>
                    )}
                    {formData.emergencyContactRelationship && (
                      <p className="text-sm">
                        Relationship: {formData.emergencyContactRelationship}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowConfirmation(false)}
              disabled={isSubmitting}
            >
              Go Back
            </Button>
            <Button onClick={confirmSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Adding Teacher..." : "Confirm & Add Teacher"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

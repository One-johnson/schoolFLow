/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Download, Upload, CheckCircle, AlertCircle, Info } from 'lucide-react';
import Papa from 'papaparse';
import { AddStudentDialog } from './add-student-dialog';

interface BulkAddStudentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ParsedStudent {
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
}

export function BulkAddStudentsDialog({ open, onOpenChange }: BulkAddStudentsDialogProps): React.JSX.Element {
  const { user } = useAuth();
  const addStudent = useMutation(api.students.addStudent);
  const classes = useQuery(api.classes.getClassesBySchool, {
    schoolId: user?.schoolId || '',
  });

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedStudents, setParsedStudents] = useState<ParsedStudent[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [manualDialogOpen, setManualDialogOpen] = useState<boolean>(false);

  const downloadTemplate = (): void => {
    const template = `firstName,lastName,middleName,dateOfBirth,gender,email,phone,address,classId,rollNumber,admissionDate,parentName,parentEmail,parentPhone,parentOccupation,relationship,secondaryContactName,secondaryContactPhone,secondaryContactRelationship,emergencyContactName,emergencyContactPhone,emergencyContactRelationship,medicalConditions,allergies
John,Doe,,2015-05-15,male,john.doe@example.com,+1234567890,123 Main St,CLS123456,001,2024-01-10,Jane Doe,jane.doe@example.com,+0987654321,Engineer,mother,Bob Smith,+1122334455,uncle,Mary Johnson,+5566778899,grandmother,Asthma,Peanuts;Shellfish`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success('Template downloaded');
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const errors: string[] = [];
        const students: ParsedStudent[] = [];

        results.data.forEach((row: any, index) => {
          const rowNum = index + 2;

          // Required field validation
          if (!row.firstName) errors.push(`Row ${rowNum}: Missing first name`);
          if (!row.lastName) errors.push(`Row ${rowNum}: Missing last name`);
          if (!row.dateOfBirth) errors.push(`Row ${rowNum}: Missing date of birth`);
          if (!row.gender) errors.push(`Row ${rowNum}: Missing gender`);
          if (!row.address) errors.push(`Row ${rowNum}: Missing address`);
          if (!row.classId) errors.push(`Row ${rowNum}: Missing class ID`);
          if (!row.admissionDate) errors.push(`Row ${rowNum}: Missing admission date`);
          if (!row.parentName) errors.push(`Row ${rowNum}: Missing parent name`);
          if (!row.parentEmail) errors.push(`Row ${rowNum}: Missing parent email`);
          if (!row.parentPhone) errors.push(`Row ${rowNum}: Missing parent phone`);
          if (!row.relationship) errors.push(`Row ${rowNum}: Missing relationship`);
          if (!row.emergencyContactName) errors.push(`Row ${rowNum}: Missing emergency contact name`);
          if (!row.emergencyContactPhone) errors.push(`Row ${rowNum}: Missing emergency contact phone`);
          if (!row.emergencyContactRelationship) errors.push(`Row ${rowNum}: Missing emergency contact relationship`);

          // Email format validation
          if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
            errors.push(`Row ${rowNum}: Invalid email format`);
          }
          if (row.parentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.parentEmail)) {
            errors.push(`Row ${rowNum}: Invalid parent email format`);
          }

          // Gender validation
          if (row.gender && !['male', 'female', 'other'].includes(row.gender.toLowerCase())) {
            errors.push(`Row ${rowNum}: Invalid gender (must be male, female, or other)`);
          }

          // Relationship validation
          if (row.relationship && !['father', 'mother', 'guardian'].includes(row.relationship.toLowerCase())) {
            errors.push(`Row ${rowNum}: Invalid relationship (must be father, mother, or guardian)`);
          }

          // Class validation
          const selectedClass = classes?.find((c) => c.classCode === row.classId);
          if (!selectedClass && row.classId) {
            errors.push(`Row ${rowNum}: Class ID ${row.classId} not found`);
          }

          // Parse medical conditions and allergies (semicolon separated)
          const medicalConditions = row.medicalConditions
            ? row.medicalConditions.split(';').map((c: string) => c.trim()).filter((c: string) => c)
            : [];

          const allergies = row.allergies
            ? row.allergies.split(';').map((a: string) => a.trim()).filter((a: string) => a)
            : [];

          // Build student object if all required fields are present
          if (
            row.firstName &&
            row.lastName &&
            row.dateOfBirth &&
            row.gender &&
            row.address &&
            row.classId &&
            selectedClass &&
            row.admissionDate &&
            row.parentName &&
            row.parentEmail &&
            row.parentPhone &&
            row.relationship &&
            row.emergencyContactName &&
            row.emergencyContactPhone &&
            row.emergencyContactRelationship
          ) {
            students.push({
              firstName: row.firstName,
              lastName: row.lastName,
              middleName: row.middleName || undefined,
              dateOfBirth: row.dateOfBirth,
              gender: row.gender.toLowerCase() as 'male' | 'female' | 'other',
              nationality: row.nationality || undefined,
              religion: row.religion || undefined,
              email: row.email || undefined,
              phone: row.phone || undefined,
              address: row.address,
              classId: row.classId,
              className: selectedClass.className,
              department: selectedClass.department,
              rollNumber: row.rollNumber || undefined,
              admissionDate: row.admissionDate,
              parentName: row.parentName,
              parentEmail: row.parentEmail,
              parentPhone: row.parentPhone,
              parentOccupation: row.parentOccupation || undefined,
              relationship: row.relationship.toLowerCase() as 'father' | 'mother' | 'guardian',
              secondaryContactName: row.secondaryContactName || undefined,
              secondaryContactPhone: row.secondaryContactPhone || undefined,
              secondaryContactRelationship: row.secondaryContactRelationship || undefined,
              emergencyContactName: row.emergencyContactName,
              emergencyContactPhone: row.emergencyContactPhone,
              emergencyContactRelationship: row.emergencyContactRelationship,
              medicalConditions: medicalConditions.length > 0 ? medicalConditions : undefined,
              allergies: allergies.length > 0 ? allergies : undefined,
            });
          }
        });

        setCsvErrors(errors);
        setParsedStudents(students);

        if (errors.length === 0 && students.length > 0) {
          toast.success(`Parsed ${students.length} students successfully`);
        } else if (errors.length > 0) {
          toast.error(`Found ${errors.length} errors in CSV`);
        }
      },
      error: (error) => {
        toast.error(`Failed to parse CSV: ${error.message}`);
      },
    });
  };

  const handleCSVSubmit = async (): Promise<void> => {
    if (parsedStudents.length === 0) {
      toast.error('No students to add');
      return;
    }

    setIsSubmitting(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const student of parsedStudents) {
        try {
          await addStudent({
            schoolId: user?.schoolId || '',
            ...student,
            createdBy: user?.userId || '',
          });
          successCount++;
        } catch (error) {
          failCount++;
          console.error(`Failed to add student ${student.firstName} ${student.lastName}:`, error);
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully added ${successCount} students`);
      }
      if (failCount > 0) {
        toast.error(`Failed to add ${failCount} students`);
      }

      if (successCount === parsedStudents.length) {
        setParsedStudents([]);
        setCsvFile(null);
        setCsvErrors([]);
        onOpenChange(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-y-auto">
          <DialogHeader className="shrink-0">
            <DialogTitle>Bulk Add Students</DialogTitle>
            <DialogDescription>
              Add multiple students at once via manual entry or CSV upload
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="manual" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-2 shrink-0">
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              <TabsTrigger value="csv">CSV Upload</TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="flex-1 flex flex-col overflow-hidden mt-4">
              <div className="flex items-center justify-center py-8">
                <Button onClick={() => setManualDialogOpen(true)} size="lg">
                  Open Manual Entry Form
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="csv" className="flex-1 flex flex-col overflow-y-auto mt-4">
              <ScrollArea className="flex-1">
                <div className="space-y-4 px-1">
                  {/* Photo Upload Notice */}
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-semibold mb-1">Note about Photos & Documents</div>
                      <p className="text-sm">
                        Student photos and birth certificates cannot be uploaded via CSV. After importing students,
                        you can edit each student record individually to add their photo and documents.
                      </p>
                    </AlertDescription>
                  </Alert>

                  {/* Download Template */}
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <Download className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">Step 1: Download Template</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Download the CSV template with example data and headers
                    </p>
                    <Button onClick={downloadTemplate} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download Template
                    </Button>
                  </div>

                  {/* Upload CSV */}
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">Step 2: Upload CSV File</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Upload your filled CSV file with student data
                    </p>
                    <label htmlFor="csv-upload">
                      <Button variant="outline" asChild>
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload CSV
                        </span>
                      </Button>
                      <input
                        id="csv-upload"
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={handleCSVUpload}
                      />
                    </label>
                    {csvFile && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Selected: {csvFile.name}
                      </p>
                    )}
                  </div>

                  {/* Errors */}
                  {csvErrors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="font-semibold mb-2">Found {csvErrors.length} errors:</div>
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

                  {/* Preview */}
                  {parsedStudents.length > 0 && (
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold">Students to be added</h3>
                          <p className="text-sm text-muted-foreground">
                            {parsedStudents.length} students ready to add
                          </p>
                        </div>
                        <Button onClick={handleCSVSubmit} disabled={isSubmitting}>
                          {isSubmitting ? 'Adding...' : `Add ${parsedStudents.length} Students`}
                        </Button>
                      </div>

                      <ScrollArea className="h-64">
                        <div className="space-y-2">
                          {parsedStudents.map((student, index) => (
                            <div
                              key={index}
                              className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent"
                            >
                              <CheckCircle className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium">
                                  {student.firstName} {student.lastName}
                                  {student.middleName && ` ${student.middleName}`}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {student.className} • {student.parentEmail}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  {/* Instructions */}
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-semibold mb-2">CSV Format Instructions:</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Required fields: firstName, lastName, dateOfBirth, gender, address, classId, admissionDate</li>
                      <li>• Required parent fields: parentName, parentEmail, parentPhone, relationship</li>
                      <li>• Required emergency contact fields: emergencyContactName, emergencyContactPhone, emergencyContactRelationship</li>
                      <li>• Gender: male, female, or other</li>
                      <li>• Relationship: father, mother, or guardian</li>
                      <li>• Multiple medical conditions/allergies: separate with semicolons (;)</li>
                      <li>• Date format: YYYY-MM-DD</li>
                      <li>• Class ID: Use the exact classCode from your classes (e.g., CLS123456)</li>
                      <li>• Photos and documents must be added individually after import</li>
                    </ul>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Manual Entry Dialog */}
      <AddStudentDialog open={manualDialogOpen} onOpenChange={setManualDialogOpen} />
    </>
  );
}

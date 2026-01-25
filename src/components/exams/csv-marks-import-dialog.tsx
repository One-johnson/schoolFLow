'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, FileText, AlertCircle, CheckCircle2, X } from 'lucide-react';
import Papa from 'papaparse';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CSVMarksImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjects: Array<{ name: string; maxMarks: number }>;
  students: Array<{ studentId: string; studentName: string }>;
  onImport: (data: Array<{ studentId: string; subjects: Record<string, { classScore: number; examScore: number }> }>) => void;
  examName?: string;
  className?: string;
}

interface ParsedRow {
  studentName: string;
  subjects: Record<string, { classScore: number; examScore: number }>;
  errors: string[];
}

interface ValidationError {
  row: number;
  studentName: string;
  errors: string[];
}

export function CSVMarksImportDialog({
  open,
  onOpenChange,
  subjects,
  students,
  onImport,
  examName,
  className,
}: CSVMarksImportDialogProps) {
  const { toast } = useToast();
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleDownloadTemplate = (): void => {
    if (students.length === 0) {
      toast({
        title: 'No Students',
        description: 'Please load students first in the main marks entry dialog',
        variant: 'destructive',
      });
      return;
    }

    // Create CSV header
    const headers = ['Student Name'];
    subjects.forEach((subject) => {
      headers.push(`${subject.name} - Class Score`, `${subject.name} - Exam Score`);
    });

    // Create CSV rows with student names
    const rows = students.map((student) => {
      const row = [student.studentName];
      subjects.forEach(() => {
        row.push('0', '0'); // Default values
      });
      return row;
    });

    // Combine headers and rows
    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marks-template-${examName}-${className}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Template Downloaded',
      description: 'Fill in the marks and upload the CSV file',
    });
  };

  const validateAndParseCSV = (csvData: Array<Record<string, string>>): void => {
    const errors: ValidationError[] = [];
    const parsed: ParsedRow[] = [];

    csvData.forEach((row, index) => {
      const rowNumber = index + 2; // +2 because index starts at 0 and CSV has header row
      const rowErrors: string[] = [];
      const studentName = row['Student Name']?.trim();

      if (!studentName) {
        rowErrors.push('Missing student name');
      }

      // Find matching student
      const matchingStudent = students.find(
        (s) => s.studentName.toLowerCase() === studentName?.toLowerCase()
      );

      if (!matchingStudent && studentName) {
        rowErrors.push(`Student "${studentName}" not found in selected class`);
      }

      const subjectsData: Record<string, { classScore: number; examScore: number }> = {};

      subjects.forEach((subject) => {
        const classScoreKey = `${subject.name} - Class Score`;
        const examScoreKey = `${subject.name} - Exam Score`;

        const classScoreStr = row[classScoreKey]?.trim() || '0';
        const examScoreStr = row[examScoreKey]?.trim() || '0';

        const classScore = parseFloat(classScoreStr);
        const examScore = parseFloat(examScoreStr);

        if (isNaN(classScore)) {
          rowErrors.push(`Invalid class score for ${subject.name}: "${classScoreStr}"`);
        }

        if (isNaN(examScore)) {
          rowErrors.push(`Invalid exam score for ${subject.name}: "${examScoreStr}"`);
        }

        const maxCA = subject.maxMarks * 0.4;
        const maxExam = subject.maxMarks * 0.6;

        if (classScore > maxCA) {
          rowErrors.push(`${subject.name} class score (${classScore}) exceeds max (${maxCA})`);
        }

        if (examScore > maxExam) {
          rowErrors.push(`${subject.name} exam score (${examScore}) exceeds max (${maxExam})`);
        }

        if (classScore < 0) {
          rowErrors.push(`${subject.name} class score cannot be negative`);
        }

        if (examScore < 0) {
          rowErrors.push(`${subject.name} exam score cannot be negative`);
        }

        subjectsData[subject.name] = {
          classScore: isNaN(classScore) ? 0 : classScore,
          examScore: isNaN(examScore) ? 0 : examScore,
        };
      });

      if (rowErrors.length > 0) {
        errors.push({
          row: rowNumber,
          studentName: studentName || 'Unknown',
          errors: rowErrors,
        });
      }

      parsed.push({
        studentName: studentName || '',
        subjects: subjectsData,
        errors: rowErrors,
      });
    });

    setParsedData(parsed);
    setValidationErrors(errors);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setParsedData([]);
    setValidationErrors([]);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        validateAndParseCSV(results.data as Array<Record<string, string>>);
        setIsProcessing(false);
        toast({
          title: 'CSV Parsed',
          description: `Processed ${results.data.length} rows`,
        });
      },
      error: (error) => {
        setIsProcessing(false);
        toast({
          title: 'Parse Error',
          description: error.message,
          variant: 'destructive',
        });
      },
    });

    // Reset input
    event.target.value = '';
  };

  const handleImport = (): void => {
    if (validationErrors.length > 0) {
      toast({
        title: 'Validation Errors',
        description: `Please fix ${validationErrors.length} error(s) before importing`,
        variant: 'destructive',
      });
      return;
    }

    // Map parsed data to student IDs
    const importData = parsedData
      .map((row) => {
        const student = students.find(
          (s) => s.studentName.toLowerCase() === row.studentName.toLowerCase()
        );
        if (!student) return null;

        return {
          studentId: student.studentId,
          subjects: row.subjects,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    onImport(importData);
    onOpenChange(false);

    toast({
      title: 'Import Successful',
      description: `Marks imported for ${importData.length} students`,
    });

    // Reset state
    setParsedData([]);
    setValidationErrors([]);
  };

  const validRows = parsedData.filter((row) => row.errors.length === 0).length;
  const totalRows = parsedData.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Marks from CSV</DialogTitle>
          <DialogDescription>
            Download the template, fill in marks, and upload the completed CSV file
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
          {/* Step 1: Download Template */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                1
              </span>
              Download CSV Template
            </h3>
            <Alert>
              <Download className="h-4 w-4" />
              <AlertDescription>
                Download a pre-filled template with student names and subject columns. 
                Fill in the class scores and exam scores in Excel or Google Sheets.
              </AlertDescription>
            </Alert>
            <Button onClick={handleDownloadTemplate} variant="outline" className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Download Template CSV
            </Button>
          </div>

          {/* Step 2: Upload Filled CSV */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                2
              </span>
              Upload Filled CSV
            </h3>
            <Alert>
              <Upload className="h-4 w-4" />
              <AlertDescription>
                After filling in the marks, upload the CSV file. The system will validate the data 
                and show any errors before importing.
              </AlertDescription>
            </Alert>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
                disabled={isProcessing}
              />
              <label htmlFor="csv-upload" className="flex-1">
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={isProcessing}
                  asChild
                >
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    {isProcessing ? 'Processing...' : 'Upload CSV File'}
                  </span>
                </Button>
              </label>
            </div>
          </div>

          {/* Step 3: Review and Import */}
          {parsedData.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                  3
                </span>
                Review and Import
              </h3>

              <div className="flex items-center gap-2">
                <Badge variant={validationErrors.length === 0 ? 'default' : 'destructive'}>
                  {validationErrors.length === 0 ? (
                    <>
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      All Valid
                    </>
                  ) : (
                    <>
                      <AlertCircle className="mr-1 h-3 w-3" />
                      {validationErrors.length} Error(s)
                    </>
                  )}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {validRows}/{totalRows} rows valid
                </span>
              </div>

              {validationErrors.length > 0 && (
                <ScrollArea className="h-[300px] rounded-lg border bg-destructive/5 p-4">
                  <div className="space-y-3">
                    {validationErrors.map((error, index) => (
                      <div key={index} className="rounded-lg border border-destructive/50 bg-background p-3">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="font-medium text-sm">
                              Row {error.row}: {error.studentName}
                            </div>
                            <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                              {error.errors.map((err, i) => (
                                <li key={i}>• {err}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {validationErrors.length === 0 && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    All data validated successfully! Click "Import Marks" to apply the data to the marks entry grid.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          </div>
        </ScrollArea>

        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            variant="ghost"
            onClick={() => {
              setParsedData([]);
              setValidationErrors([]);
            }}
            disabled={parsedData.length === 0}
          >
            <X className="mr-2 h-4 w-4" />
            Clear
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={parsedData.length === 0 || validationErrors.length > 0}
            >
              <FileText className="mr-2 h-4 w-4" />
              Import Marks
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

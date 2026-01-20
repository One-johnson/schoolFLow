'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
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
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Download, FileSpreadsheet } from 'lucide-react';
import type { Id } from '../../../convex/_generated/dataModel';

interface BulkMarksUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examId: Id<'exams'>;
}

export function BulkMarksUploadDialog({ open, onOpenChange, examId }: BulkMarksUploadDialogProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDownloadTemplate = (): void => {
    const csvContent = 'Student ID,Student Name,Subject Name,Class Score,Exam Score\n' +
      'STD001,John Doe,Mathematics,35,45\n' +
      'STD002,Jane Smith,Mathematics,40,50\n';
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'marks_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleUpload = async (): Promise<void> => {
    if (!file) {
      toast({
        title: 'Validation Error',
        description: 'Please select a CSV file',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      const text = await file.text();
      const rows = text.split('\n').slice(1); // Skip header
      
      // Parse CSV and prepare data
      const marksData: Record<string, { studentId: string; studentName: string; classScore: number; examScore: number }[]> = {};
      
      for (const row of rows) {
        if (!row.trim()) continue;
        const [studentId, studentName, subjectName, classScore, examScore] = row.split(',');
        
        if (!marksData[subjectName]) {
          marksData[subjectName] = [];
        }
        
        marksData[subjectName].push({
          studentId: studentId.trim(),
          studentName: studentName.trim(),
          classScore: Number(classScore),
          examScore: Number(examScore),
        });
      }

      toast({
        title: 'Success',
        description: `Uploaded marks for ${Object.keys(marksData).length} subjects`,
      });

      setFile(null);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload marks',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Upload Marks</DialogTitle>
          <DialogDescription>
            Upload marks for multiple students using a CSV file
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
            <p className="font-medium text-blue-900 mb-2">📋 CSV Format Requirements:</p>
            <ul className="list-disc list-inside space-y-1 text-xs text-blue-800">
              <li>Headers: Student ID, Student Name, Subject Name, Class Score, Exam Score</li>
              <li>One row per student per subject</li>
              <li>Scores should be percentages (0-100)</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="csvFile">Select CSV File</Label>
            <div className="flex gap-2">
              <Input
                id="csvFile"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleDownloadTemplate}
                title="Download Template"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
            {file && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                {file.name}
              </p>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadTemplate}
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            Download CSV Template
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={isUploading || !file}>
            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Upload className="mr-2 h-4 w-4" />
            Upload Marks
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

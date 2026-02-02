'use client';

import { useState, useCallback, JSX } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileDown, AlertCircle, CheckCircle } from 'lucide-react';
import Papa from 'papaparse';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface BulkUploadCSVDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  collectedBy: string;
  collectedByName: string;
}

interface ParsedPayment {
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  categoryId: string;
  categoryName: string;
  amountDue: number;
  amountPaid: number;
  paymentMethod: 'cash' | 'bank_transfer' | 'mobile_money' | 'check' | 'other';
  transactionReference?: string;
  paymentDate: string;
  paidBy?: string;
  notes?: string;
}

export function BulkUploadCSVDialog({
  open,
  onOpenChange,
  schoolId,
  collectedBy,
  collectedByName,
}: BulkUploadCSVDialogProps): React.JSX.Element {
  const [csvData, setCsvData] = useState<ParsedPayment[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);

  const bulkImport = useMutation(api.bulkPayments.bulkImportPayments);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const validationErrors: string[] = [];
        const parsedData: ParsedPayment[] = [];

        results.data.forEach((row: any, index: number) => {
          try {
            // Validate required fields
            if (!row.studentId || !row.studentName || !row.categoryName) {
              validationErrors.push(`Row ${index + 1}: Missing required fields`);
              return;
            }

            // Parse and validate payment
            const amountDue = parseFloat(row.amountDue);
            const amountPaid = parseFloat(row.amountPaid);

            if (isNaN(amountDue) || isNaN(amountPaid)) {
              validationErrors.push(`Row ${index + 1}: Invalid amount`);
              return;
            }

            const validMethods = ['cash', 'bank_transfer', 'mobile_money', 'check', 'other'];
            const paymentMethod = row.paymentMethod?.toLowerCase() || 'cash';

            if (!validMethods.includes(paymentMethod)) {
              validationErrors.push(`Row ${index + 1}: Invalid payment method`);
              return;
            }

            parsedData.push({
              studentId: row.studentId,
              studentName: row.studentName,
              classId: row.classId || '',
              className: row.className || '',
              categoryId: row.categoryId || '',
              categoryName: row.categoryName,
              amountDue,
              amountPaid,
              paymentMethod: paymentMethod as 'cash' | 'bank_transfer' | 'mobile_money' | 'check' | 'other',
              transactionReference: row.transactionReference,
              paymentDate: row.paymentDate || new Date().toISOString().split('T')[0],
              paidBy: row.paidBy,
              notes: row.notes,
            });
          } catch (error) {
            validationErrors.push(`Row ${index + 1}: Parsing error`);
          }
        });

        setCsvData(parsedData);
        setErrors(validationErrors);

        if (parsedData.length > 0) {
          toast.success(`Parsed ${parsedData.length} payment records`);
        }

        if (validationErrors.length > 0) {
          toast.error(`Found ${validationErrors.length} validation errors`);
        }
      },
      error: (error) => {
        toast.error('Failed to parse CSV file');
        console.error(error);
      },
    });
  }, []);

  const handleUpload = useCallback(async (): Promise<void> => {
    if (csvData.length === 0) {
      toast.error('No data to upload');
      return;
    }

    setUploading(true);

    try {
      const result = await bulkImport({
        schoolId,
        payments: csvData,
        collectedBy,
        collectedByName,
      });

      toast.success(`Successfully imported ${result.successCount} payments`);

      if (result.failCount > 0) {
        toast.error(`Failed to import ${result.failCount} payments`);
      }

      setCsvData([]);
      setErrors([]);
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to import payments');
      console.error(error);
    } finally {
      setUploading(false);
    }
  }, [csvData, schoolId, collectedBy, collectedByName, bulkImport, onOpenChange]);

  const downloadTemplate = useCallback((): void => {
    const template = `studentId,studentName,classId,className,categoryId,categoryName,amountDue,amountPaid,paymentMethod,transactionReference,paymentDate,paidBy,notes
JD123456,John Doe,CLS001,Grade 1A,FEE001,Tuition,5000,5000,cash,TXN001,2024-01-15,Parent Name,Payment note`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'payment_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success('Template downloaded');
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Upload Payments (CSV)</DialogTitle>
          <DialogDescription>
            Upload a CSV file containing multiple payment records
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Download */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium">Download CSV Template</p>
              <p className="text-sm text-muted-foreground">Get the correct format for bulk import</p>
            </div>
            <Button variant="outline" onClick={downloadTemplate}>
              <FileDown className="mr-2 h-4 w-4" />
              Download Template
            </Button>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="csv-file">Upload CSV File</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
            />
          </div>

          {/* Validation Errors */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-2">Found {errors.length} validation errors:</div>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {errors.slice(0, 5).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                  {errors.length > 5 && <li>...and {errors.length - 5} more</li>}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Preview Table */}
          {csvData.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <p className="font-medium">Preview: {csvData.length} records ready for import</p>
              </div>

              <div className="border rounded-lg max-h-64 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Amount Due</TableHead>
                      <TableHead>Amount Paid</TableHead>
                      <TableHead>Method</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csvData.slice(0, 10).map((payment, index) => (
                      <TableRow key={index}>
                        <TableCell>{payment.studentId}</TableCell>
                        <TableCell>{payment.studentName}</TableCell>
                        <TableCell>{payment.categoryName}</TableCell>
                        <TableCell>GHS {payment.amountDue.toFixed(2)}</TableCell>
                        <TableCell>GHS {payment.amountPaid.toFixed(2)}</TableCell>
                        <TableCell className="capitalize">{payment.paymentMethod.replace('_', ' ')}</TableCell>
                      </TableRow>
                    ))}
                    {csvData.length > 10 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          ...and {csvData.length - 10} more records
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={csvData.length === 0 || uploading}
            >
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? 'Uploading...' : `Upload ${csvData.length} Payments`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

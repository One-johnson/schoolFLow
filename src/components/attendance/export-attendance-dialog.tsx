'use client';

import { useState, JSX } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Award, BarChart3, AlertCircle, Calendar } from 'lucide-react';

interface ExportAttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectReportType: (type: 'daily' | 'summary' | 'certificate' | 'performance' | 'absentee') => void;
}

export function ExportAttendanceDialog({
  open,
  onOpenChange,
  onSelectReportType
}: ExportAttendanceDialogProps): React.JSX.Element {
  const [selectedType, setSelectedType] = useState<string>('');

  const handleProceed = (): void => {
    if (selectedType) {
      onSelectReportType(selectedType as any);
      onOpenChange(false);
      setSelectedType('');
    }
  };

  const reportTypes = [
    {
      value: 'daily',
      label: 'Daily Attendance Register',
      description: 'Printable register for a specific class and date',
      icon: FileText
    },
    {
      value: 'summary',
      label: 'Attendance Summary',
      description: 'Weekly/monthly summary with student statistics',
      icon: Calendar
    },
    {
      value: 'certificate',
      label: 'Student Certificate',
      description: 'Individual student attendance certificate',
      icon: Award
    },
    {
      value: 'performance',
      label: 'Class Performance Report',
      description: 'Compare attendance across multiple classes',
      icon: BarChart3
    },
    {
      value: 'absentee',
      label: 'Absentee Report',
      description: 'List of absent students on specific date(s)',
      icon: AlertCircle
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Export Attendance Report</DialogTitle>
          <DialogDescription>
            Select the type of report you want to generate
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Report Type</Label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Choose report type" />
              </SelectTrigger>
              <SelectContent>
                {reportTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className="h-4 w-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Report type descriptions */}
          {selectedType && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              {reportTypes.map((type) => {
                if (type.value === selectedType) {
                  const Icon = type.icon;
                  return (
                    <div key={type.value} className="flex gap-3">
                      <Icon className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-900">{type.label}</p>
                        <p className="text-sm text-blue-700 mt-1">{type.description}</p>
                      </div>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleProceed} disabled={!selectedType}>
              Continue
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

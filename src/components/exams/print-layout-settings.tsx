'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Settings2, Download, Printer } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';

export interface PrintLayoutOptions {
  includePhoto: boolean;
  includeChart: boolean;
  includeGradingScale: boolean;
  includeAttendance: boolean;
  includePosition: boolean;
  includeConduct: boolean;
  includeAttitude: boolean;
  includeInterest: boolean;
  includeComments: boolean;
  includeSignatures: boolean;
}

interface PrintLayoutSettingsProps {
  onDownload: (options: PrintLayoutOptions) => void;
  onPrint: (options: PrintLayoutOptions) => void;
}

export function PrintLayoutSettings({ onDownload, onPrint }: PrintLayoutSettingsProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [options, setOptions] = useState<PrintLayoutOptions>({
    includePhoto: true,
    includeChart: false,
    includeGradingScale: true,
    includeAttendance: true,
    includePosition: true,
    includeConduct: true,
    includeAttitude: true,
    includeInterest: true,
    includeComments: true,
    includeSignatures: true,
  });

  const handleOptionChange = (key: keyof PrintLayoutOptions, value: boolean): void => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  const handleDownload = (): void => {
    onDownload(options);
    setOpen(false);
  };

  const handlePrint = (): void => {
    onPrint(options);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="h-4 w-4 mr-2" />
          Print Options
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Print Layout Customization</DialogTitle>
          <DialogDescription>
            Choose which sections to include in the report card
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Visual Elements</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="photo"
                  checked={options.includePhoto}
                  onCheckedChange={(checked) => handleOptionChange('includePhoto', checked as boolean)}
                />
                <Label htmlFor="photo" className="text-sm font-normal cursor-pointer">
                  Student Photo
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="chart"
                  checked={options.includeChart}
                  onCheckedChange={(checked) => handleOptionChange('includeChart', checked as boolean)}
                />
                <Label htmlFor="chart" className="text-sm font-normal cursor-pointer">
                  Performance Chart
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="gradingScale"
                  checked={options.includeGradingScale}
                  onCheckedChange={(checked) => handleOptionChange('includeGradingScale', checked as boolean)}
                />
                <Label htmlFor="gradingScale" className="text-sm font-normal cursor-pointer">
                  Grading Scale
                </Label>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Student Information</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="attendance"
                  checked={options.includeAttendance}
                  onCheckedChange={(checked) => handleOptionChange('includeAttendance', checked as boolean)}
                />
                <Label htmlFor="attendance" className="text-sm font-normal cursor-pointer">
                  Attendance
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="position"
                  checked={options.includePosition}
                  onCheckedChange={(checked) => handleOptionChange('includePosition', checked as boolean)}
                />
                <Label htmlFor="position" className="text-sm font-normal cursor-pointer">
                  Position in Class
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="conduct"
                  checked={options.includeConduct}
                  onCheckedChange={(checked) => handleOptionChange('includeConduct', checked as boolean)}
                />
                <Label htmlFor="conduct" className="text-sm font-normal cursor-pointer">
                  Conduct
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="attitude"
                  checked={options.includeAttitude}
                  onCheckedChange={(checked) => handleOptionChange('includeAttitude', checked as boolean)}
                />
                <Label htmlFor="attitude" className="text-sm font-normal cursor-pointer">
                  Attitude
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="interest"
                  checked={options.includeInterest}
                  onCheckedChange={(checked) => handleOptionChange('includeInterest', checked as boolean)}
                />
                <Label htmlFor="interest" className="text-sm font-normal cursor-pointer">
                  Interest
                </Label>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Additional Sections</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="comments"
                  checked={options.includeComments}
                  onCheckedChange={(checked) => handleOptionChange('includeComments', checked as boolean)}
                />
                <Label htmlFor="comments" className="text-sm font-normal cursor-pointer">
                  Teacher Comments
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="signatures"
                  checked={options.includeSignatures}
                  onCheckedChange={(checked) => handleOptionChange('includeSignatures', checked as boolean)}
                />
                <Label htmlFor="signatures" className="text-sm font-normal cursor-pointer">
                  Signature Section
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handlePrint} className="flex-1">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button onClick={handleDownload} className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

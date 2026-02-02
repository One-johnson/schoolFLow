'use client';

import { useState, useEffect, JSX } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface AttendanceSettingsDialogProps {
  schoolId: string;
  adminId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AttendanceSettingsDialog({
  schoolId,
  adminId,
  open,
  onOpenChange,
}: AttendanceSettingsDialogProps): React.JSX.Element {
  const [enableMorningSession, setEnableMorningSession] = useState<boolean>(true);
  const [enableAfternoonSession, setEnableAfternoonSession] = useState<boolean>(false);
  const [morningStartTime, setMorningStartTime] = useState<string>('08:00');
  const [morningEndTime, setMorningEndTime] = useState<string>('12:00');
  const [afternoonStartTime, setAfternoonStartTime] = useState<string>('13:00');
  const [afternoonEndTime, setAfternoonEndTime] = useState<string>('17:00');
  const [lateThresholdMinutes, setLateThresholdMinutes] = useState<number>(15);
  const [autoLockAttendance, setAutoLockAttendance] = useState<boolean>(false);
  const [lockAfterHours, setLockAfterHours] = useState<number>(24);
  const [requireAdminApproval, setRequireAdminApproval] = useState<boolean>(false);
  const [notifyParentsOnAbsence, setNotifyParentsOnAbsence] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const settings = useQuery(api.attendance.getAttendanceSettings, { schoolId });
  const saveSettings = useMutation(api.attendance.saveAttendanceSettings);

  useEffect(() => {
    if (settings) {
      setEnableMorningSession(settings.enableMorningSession);
      setEnableAfternoonSession(settings.enableAfternoonSession);
      setMorningStartTime(settings.morningStartTime || '08:00');
      setMorningEndTime(settings.morningEndTime || '12:00');
      setAfternoonStartTime(settings.afternoonStartTime || '13:00');
      setAfternoonEndTime(settings.afternoonEndTime || '17:00');
      setLateThresholdMinutes(settings.lateThresholdMinutes || 15);
      setAutoLockAttendance(settings.autoLockAttendance);
      setLockAfterHours(settings.lockAfterHours || 24);
      setRequireAdminApproval(settings.requireAdminApproval);
      setNotifyParentsOnAbsence(settings.notifyParentsOnAbsence);
    }
  }, [settings]);

  const handleSave = async (): Promise<void> => {
    setIsSubmitting(true);

    try {
      await saveSettings({
        schoolId,
        updatedBy: adminId,
        enableMorningSession,
        enableAfternoonSession,
        morningStartTime,
        morningEndTime,
        afternoonStartTime,
        afternoonEndTime,
        lateThresholdMinutes,
        autoLockAttendance,
        lockAfterHours,
        requireAdminApproval,
        notifyParentsOnAbsence,
      });

      toast.success('Settings saved successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Attendance Settings</DialogTitle>
          <DialogDescription>
            Configure attendance tracking preferences for your school
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Session Settings */}
          <div className="space-y-4">
            <h3 className="font-semibold">Session Configuration</h3>

            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Morning Session</Label>
                <p className="text-sm text-muted-foreground">
                  Allow marking attendance for morning session
                </p>
              </div>
              <Switch
                checked={enableMorningSession}
                onCheckedChange={setEnableMorningSession}
              />
            </div>

            {enableMorningSession && (
              <div className="grid gap-4 md:grid-cols-2 pl-6 border-l-2">
                <div className="space-y-2">
                  <Label>Morning Start Time</Label>
                  <Input
                    type="time"
                    value={morningStartTime}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMorningStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Morning End Time</Label>
                  <Input
                    type="time"
                    value={morningEndTime}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMorningEndTime(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Afternoon Session</Label>
                <p className="text-sm text-muted-foreground">
                  Allow marking attendance for afternoon session
                </p>
              </div>
              <Switch
                checked={enableAfternoonSession}
                onCheckedChange={setEnableAfternoonSession}
              />
            </div>

            {enableAfternoonSession && (
              <div className="grid gap-4 md:grid-cols-2 pl-6 border-l-2">
                <div className="space-y-2">
                  <Label>Afternoon Start Time</Label>
                  <Input
                    type="time"
                    value={afternoonStartTime}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAfternoonStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Afternoon End Time</Label>
                  <Input
                    type="time"
                    value={afternoonEndTime}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAfternoonEndTime(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Late Threshold */}
          <div className="space-y-2">
            <Label>Late Threshold (minutes)</Label>
            <Input
              type="number"
              value={lateThresholdMinutes}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLateThresholdMinutes(Number(e.target.value))}
              min={0}
              max={60}
            />
            <p className="text-sm text-muted-foreground">
              Minutes after start time before marking as late
            </p>
          </div>

          {/* Auto Lock */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-Lock Attendance</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically lock attendance after specified hours
                </p>
              </div>
              <Switch
                checked={autoLockAttendance}
                onCheckedChange={setAutoLockAttendance}
              />
            </div>

            {autoLockAttendance && (
              <div className="space-y-2 pl-6 border-l-2">
                <Label>Lock After (hours)</Label>
                <Input
                  type="number"
                  value={lockAfterHours}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLockAfterHours(Number(e.target.value))}
                  min={1}
                  max={168}
                />
                <p className="text-sm text-muted-foreground">
                  Hours after marking before auto-lock
                </p>
              </div>
            )}
          </div>

          {/* Additional Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Require Admin Approval</Label>
                <p className="text-sm text-muted-foreground">
                  Attendance must be approved by admin
                </p>
              </div>
              <Switch
                checked={requireAdminApproval}
                onCheckedChange={setRequireAdminApproval}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Notify Parents on Absence</Label>
                <p className="text-sm text-muted-foreground">
                  Send notifications when student is absent
                </p>
              </div>
              <Switch
                checked={notifyParentsOnAbsence}
                onCheckedChange={setNotifyParentsOnAbsence}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Settings'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

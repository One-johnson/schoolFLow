'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ClipboardCheck, 
  Plus,
  Calendar,
  TrendingUp,
  Users,
  AlertCircle,
  Download
} from 'lucide-react';
import { StatsCard } from '@/components/school-admin/stats-card';
import { MarkAttendanceDialog } from '@/components/attendance/mark-attendance-dialog';
import { BulkMarkAttendanceDialog } from '@/components/attendance/bulk-mark-attendance-dialog';
import { AttendanceRecordsTab } from '@/components/attendance/attendance-records-tab';
import { StudentReportsTab } from '@/components/attendance/student-reports-tab';
import { ClassAnalyticsTab } from '@/components/attendance/class-analytics-tab';
import { AttendanceSettingsDialog } from '@/components/attendance/attendance-settings-dialog';
import { ExportAttendanceDialog } from '@/components/attendance/export-attendance-dialog';
import { DailyRegisterExportDialog } from '@/components/attendance/daily-register-export-dialog';
import { StudentCertificateDialog } from '@/components/attendance/student-certificate-dialog';
import { ClassPerformanceDialog } from '@/components/attendance/class-performance-dialog';
import { AbsenteeReportDialog } from '@/components/attendance/absentee-report-dialog';

export default function AttendancePage(): React.JSX.Element {
  const router = useRouter();
  const { user } = useAuth();
  const [showMarkDialog, setShowMarkDialog] = useState<boolean>(false);
  const [showBulkMarkDialog, setShowBulkMarkDialog] = useState<boolean>(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState<boolean>(false);
  const [showExportDialog, setShowExportDialog] = useState<boolean>(false);
  const [showDailyRegisterDialog, setShowDailyRegisterDialog] = useState<boolean>(false);
  const [showStudentCertificateDialog, setShowStudentCertificateDialog] = useState<boolean>(false);
  const [showClassPerformanceDialog, setShowClassPerformanceDialog] = useState<boolean>(false);
  const [showAbsenteeReportDialog, setShowAbsenteeReportDialog] = useState<boolean>(false);

  const handleSelectReportType = (type: 'daily' | 'summary' | 'certificate' | 'performance' | 'absentee'): void => {
    switch (type) {
      case 'daily':
        setShowDailyRegisterDialog(true);
        break;
      case 'certificate':
        setShowStudentCertificateDialog(true);
        break;
      case 'performance':
        setShowClassPerformanceDialog(true);
        break;
      case 'absentee':
        setShowAbsenteeReportDialog(true);
        break;
    }
  };
  
  const currentAdmin = useQuery(
    api.schoolAdmins.getByEmail,
    user?.email ? { email: user.email } : 'skip'
  );

  const school = useQuery(
    api.schools.getById,
    currentAdmin?.schoolId ? { id: currentAdmin.schoolId } : 'skip'
  );

  const attendanceStats = useQuery(
    api.attendance.getAttendanceStats,
    currentAdmin?.schoolId ? { schoolId: currentAdmin.schoolId } : 'skip'
  );

  const todayAttendance = useQuery(
    api.attendance.getTodayAttendance,
    currentAdmin?.schoolId ? { schoolId: currentAdmin.schoolId } : 'skip'
  );

  const pendingClasses = useQuery(
    api.attendance.getPendingAttendance,
    currentAdmin?.schoolId ? { schoolId: currentAdmin.schoolId } : 'skip'
  );

  useEffect(() => {
    if (currentAdmin && !currentAdmin.hasActiveSubscription) {
      router.push('/school-admin/subscription');
    }
  }, [currentAdmin, router]);

  if (currentAdmin === undefined) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <div>
            <h2 className="text-2xl font-bold mb-2">Loading Attendance</h2>
            <p className="text-muted-foreground">Please wait...</p>
          </div>
        </div>
      </div>
    );
  }

  if (currentAdmin === null || !currentAdmin.schoolId) {
    router.push('/school-admin/create-school');
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <div>
            <h2 className="text-2xl font-bold mb-2">Setting Up</h2>
            <p className="text-muted-foreground">Redirecting...</p>
          </div>
        </div>
      </div>
    );
  }

  const todayMarkedCount = todayAttendance?.length || 0;
  const pendingCount = pendingClasses?.length || 0;
  
  // Calculate today's attendance rate
  const todayTotalPresent = todayAttendance?.reduce((sum, a) => sum + a.presentCount, 0) || 0;
  const todayTotalStudents = todayAttendance?.reduce((sum, a) => sum + a.totalStudents, 0) || 0;
  const todayAttendanceRate = todayTotalStudents > 0 
    ? Math.round((todayTotalPresent / todayTotalStudents) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardCheck className="h-8 w-8" />
            Attendance Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Track and manage student attendance across all classes
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => setShowExportDialog(true)}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" onClick={() => setShowSettingsDialog(true)}>
            Settings
          </Button>
          <Button variant="outline" onClick={() => setShowBulkMarkDialog(true)}>
            <ClipboardCheck className="mr-2 h-4 w-4" />
            Bulk Mark
          </Button>
          <Button onClick={() => setShowMarkDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Mark Attendance
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Today's Attendance Rate"
          value={`${todayAttendanceRate}%`}
          icon={TrendingUp}
          description="Present students today"
          colorClass="text-green-600"
        />
        <StatsCard
          title="Marked Today"
          value={todayMarkedCount}
          icon={ClipboardCheck}
          description="Classes with attendance"
          colorClass="text-blue-600"
        />
        <StatsCard
          title="Pending Classes"
          value={pendingCount}
          icon={AlertCircle}
          description="Without attendance today"
          colorClass="text-orange-600"
        />
        <StatsCard
          title="Overall Rate"
          value={`${attendanceStats?.attendanceRate || 0}%`}
          icon={Users}
          description="All-time attendance"
          colorClass="text-purple-600"
        />
      </div>

      {/* Pending Classes Alert */}
      {pendingCount > 0 && (
        <Card className="border-orange-500 bg-orange-50">
          <CardContent className="flex items-center gap-4 p-4">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <div className="flex-1">
              <p className="font-medium text-orange-900">
                {pendingCount} {pendingCount === 1 ? 'class' : 'classes'} without attendance today
              </p>
              <p className="text-sm text-orange-700">
                Mark attendance to keep records up to date
              </p>
            </div>
            <Button 
              onClick={() => setShowMarkDialog(true)}
              size="sm" 
              className="bg-orange-600 hover:bg-orange-700"
            >
              Mark Now
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="records" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="records">Records</TabsTrigger>
          <TabsTrigger value="students">Student Reports</TabsTrigger>
          <TabsTrigger value="analytics">Class Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="records">
          <AttendanceRecordsTab 
            schoolId={currentAdmin.schoolId}
            adminId={currentAdmin._id}
            adminName={currentAdmin.name}
          />
        </TabsContent>

        <TabsContent value="students">
          <StudentReportsTab schoolId={currentAdmin.schoolId} />
        </TabsContent>

        <TabsContent value="analytics">
          <ClassAnalyticsTab schoolId={currentAdmin.schoolId} />
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Settings</CardTitle>
              <CardDescription>
                Configure attendance tracking preferences for your school
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setShowSettingsDialog(true)}>
                Configure Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {showMarkDialog && (
        <MarkAttendanceDialog
          schoolId={currentAdmin.schoolId}
          adminId={currentAdmin._id}
          adminName={currentAdmin.name}
          open={showMarkDialog}
          onOpenChange={setShowMarkDialog}
        />
      )}

      {showBulkMarkDialog && (
        <BulkMarkAttendanceDialog
          schoolId={currentAdmin.schoolId}
          adminId={currentAdmin._id}
          adminName={currentAdmin.name}
          open={showBulkMarkDialog}
          onOpenChange={setShowBulkMarkDialog}
        />
      )}

      {showSettingsDialog && (
        <AttendanceSettingsDialog
          schoolId={currentAdmin.schoolId}
          adminId={currentAdmin._id}
          open={showSettingsDialog}
          onOpenChange={setShowSettingsDialog}
        />
      )}

      {/* Export Dialogs */}
      {showExportDialog && (
        <ExportAttendanceDialog
          open={showExportDialog}
          onOpenChange={setShowExportDialog}
          onSelectReportType={handleSelectReportType}
        />
      )}

      {showDailyRegisterDialog && (
        <DailyRegisterExportDialog
          open={showDailyRegisterDialog}
          onOpenChange={setShowDailyRegisterDialog}
          schoolId={currentAdmin.schoolId}
          schoolName={school?.name || ''}
        />
      )}

      {showStudentCertificateDialog && (
        <StudentCertificateDialog
          open={showStudentCertificateDialog}
          onOpenChange={setShowStudentCertificateDialog}
          schoolId={currentAdmin.schoolId}
          schoolName={school?.name || ''}
        />
      )}

      {showClassPerformanceDialog && (
        <ClassPerformanceDialog
          open={showClassPerformanceDialog}
          onOpenChange={setShowClassPerformanceDialog}
          schoolId={currentAdmin.schoolId}
          schoolName={school?.name || ''}
        />
      )}

      {showAbsenteeReportDialog && (
        <AbsenteeReportDialog
          open={showAbsenteeReportDialog}
          onOpenChange={setShowAbsenteeReportDialog}
          schoolId={currentAdmin.schoolId}
          schoolName={school?.name || ''}
        />
      )}
    </div>
  );
}

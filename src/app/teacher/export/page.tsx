'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useTeacherAuth } from '@/hooks/useTeacherAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  FileText,
  Download,
  Users,
  ClipboardCheck,
  BarChart3,
  Calendar,
  Loader2,
  Printer,
  FileSpreadsheet,
} from 'lucide-react';
import type { Id } from '../../../../convex/_generated/dataModel';

type ReportType = 'attendance' | 'grades' | 'class-summary' | 'student-profile';

export default function ExportPage() {
  const { teacher } = useTeacherAuth();
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('attendance');
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('week');
  const [isGenerating, setIsGenerating] = useState(false);

  const classId = teacher?.classIds?.[0];

  // Queries
  const students = useQuery(
    api.students.getStudentsByClassId,
    classId ? { classId } : 'skip'
  );

  const exams = useQuery(
    api.exams.getExamsBySchool,
    teacher ? { schoolId: teacher.schoolId } : 'skip'
  );

  const attendanceStats = useQuery(
    api.attendance.getClassAttendanceStats,
    teacher && classId
      ? {
          schoolId: teacher.schoolId,
          classId,
          days: dateRange === 'week' ? 7 : dateRange === 'month' ? 30 : 90,
        }
      : 'skip'
  );

  const classSummary = useQuery(
    api.marks.getClassGradeSummary,
    teacher && classId
      ? {
          schoolId: teacher.schoolId,
          classId,
          examId: selectedExamId ? (selectedExamId as Id<'exams'>) : undefined,
        }
      : 'skip'
  );

  const activeExams = exams?.filter(
    (e) => e.status === 'completed' || e.status === 'published'
  );

  const generatePDF = async () => {
    if (!teacher) return;

    setIsGenerating(true);
    try {
      let content = '';
      let filename = '';

      switch (selectedReportType) {
        case 'attendance':
          content = generateAttendanceReport();
          filename = `attendance-report-${new Date().toISOString().split('T')[0]}.html`;
          break;
        case 'grades':
          content = generateGradesReport();
          filename = `grades-report-${new Date().toISOString().split('T')[0]}.html`;
          break;
        case 'class-summary':
          content = generateClassSummaryReport();
          filename = `class-summary-${new Date().toISOString().split('T')[0]}.html`;
          break;
        case 'student-profile':
          if (!selectedStudentId) {
            toast.error('Please select a student');
            return;
          }
          content = generateStudentProfileReport();
          filename = `student-profile-${new Date().toISOString().split('T')[0]}.html`;
          break;
      }

      // Create printable HTML and trigger print dialog
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(content);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.print();
        };
      }

      toast.success('Report generated successfully');
    } catch (error) {
      toast.error('Failed to generate report');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAttendanceReport = () => {
    const stats = attendanceStats;
    const className = teacher?.classNames?.[0] || 'Unknown';
    const teacherName = `${teacher?.firstName} ${teacher?.lastName}`;
    const dateRangeLabel = dateRange === 'week' ? 'Last 7 Days' : dateRange === 'month' ? 'Last 30 Days' : 'Last 90 Days';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Attendance Report - ${className}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .header h1 { font-size: 24px; margin-bottom: 10px; }
          .header p { color: #666; font-size: 14px; }
          .meta { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 14px; }
          .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
          .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; text-align: center; }
          .stat-value { font-size: 28px; font-weight: bold; color: #333; }
          .stat-label { font-size: 12px; color: #666; margin-top: 5px; }
          .stat-present .stat-value { color: #22c55e; }
          .stat-absent .stat-value { color: #ef4444; }
          .stat-late .stat-value { color: #f59e0b; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background: #f5f5f5; font-weight: 600; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 12px; color: #666; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Attendance Report</h1>
          <p>${className} - ${dateRangeLabel}</p>
        </div>

        <div class="meta">
          <div><strong>Class Teacher:</strong> ${teacherName}</div>
          <div><strong>Generated:</strong> ${new Date().toLocaleDateString()}</div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${stats?.totalRecords || 0}</div>
            <div class="stat-label">Total Records</div>
          </div>
          <div class="stat-card stat-present">
            <div class="stat-value">${stats?.attendanceRate ? Math.round(stats.attendanceRate) : 0}%</div>
            <div class="stat-label">Attendance Rate</div>
          </div>
          <div class="stat-card stat-absent">
            <div class="stat-value">${stats?.totalAbsent || 0}</div>
            <div class="stat-label">Total Absent</div>
          </div>
          <div class="stat-card stat-late">
            <div class="stat-value">${stats?.totalLate || 0}</div>
            <div class="stat-label">Total Late</div>
          </div>
        </div>

        <h3>Daily Breakdown</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Present</th>
              <th>Absent</th>
              <th>Late</th>
              <th>Rate</th>
            </tr>
          </thead>
          <tbody>
            ${(stats?.dailyData || []).map((day: { date: string; present: number; absent: number; late: number; rate: number }) => `
              <tr>
                <td>${new Date(day.date).toLocaleDateString()}</td>
                <td>${day.present}</td>
                <td>${day.absent}</td>
                <td>${day.late}</td>
                <td>${Math.round(day.rate)}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>Generated by SchoolFlow Teacher Portal</p>
        </div>
      </body>
      </html>
    `;
  };

  const generateGradesReport = () => {
    const grades = classSummary || [];
    const className = teacher?.classNames?.[0] || 'Unknown';
    const teacherName = `${teacher?.firstName} ${teacher?.lastName}`;
    const examName = activeExams?.find((e) => e._id === selectedExamId)?.examName || 'All Exams';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Grades Report - ${className}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .header h1 { font-size: 24px; margin-bottom: 10px; }
          .header p { color: #666; font-size: 14px; }
          .meta { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 14px; }
          .summary { background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
          .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
          .summary-item { text-align: center; }
          .summary-value { font-size: 24px; font-weight: bold; }
          .summary-label { font-size: 12px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background: #f5f5f5; font-weight: 600; }
          .position { font-weight: bold; }
          .grade-excellent { color: #22c55e; }
          .grade-good { color: #3b82f6; }
          .grade-average { color: #f59e0b; }
          .grade-poor { color: #ef4444; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 12px; color: #666; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Class Grades Report</h1>
          <p>${className} - ${examName}</p>
        </div>

        <div class="meta">
          <div><strong>Class Teacher:</strong> ${teacherName}</div>
          <div><strong>Generated:</strong> ${new Date().toLocaleDateString()}</div>
        </div>

        <div class="summary">
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-value">${grades.length}</div>
              <div class="summary-label">Total Students</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${grades.length > 0 ? Math.round(grades.reduce((sum, s) => sum + s.average, 0) / grades.length) : 0}%</div>
              <div class="summary-label">Class Average</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${grades.filter((s) => s.average >= 50).length}</div>
              <div class="summary-label">Pass Rate</div>
            </div>
          </div>
        </div>

        <h3>Student Rankings</h3>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Student Name</th>
              <th>Total Score</th>
              <th>Average</th>
              <th>Subjects</th>
            </tr>
          </thead>
          <tbody>
            ${grades.map((student, index) => {
              const gradeClass = student.average >= 80 ? 'grade-excellent' : student.average >= 60 ? 'grade-good' : student.average >= 50 ? 'grade-average' : 'grade-poor';
              return `
                <tr>
                  <td class="position">${index + 1}</td>
                  <td>${student.studentName}</td>
                  <td>${student.totalScore}/${student.maxScore}</td>
                  <td class="${gradeClass}">${Math.round(student.average)}%</td>
                  <td>${student.subjectCount}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>Generated by SchoolFlow Teacher Portal</p>
        </div>
      </body>
      </html>
    `;
  };

  const generateClassSummaryReport = () => {
    const className = teacher?.classNames?.[0] || 'Unknown';
    const teacherName = `${teacher?.firstName} ${teacher?.lastName}`;
    const totalStudents = students?.length || 0;
    const activeStudents = students?.filter((s) => s.status === 'active' || s.status === 'continuing' || s.status === 'fresher').length || 0;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Class Summary - ${className}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .header h1 { font-size: 24px; margin-bottom: 10px; }
          .section { margin-bottom: 30px; }
          .section h3 { margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #ddd; }
          .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .info-item { padding: 10px; background: #f9f9f9; border-radius: 4px; }
          .info-label { font-size: 12px; color: #666; }
          .info-value { font-size: 16px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #f5f5f5; font-weight: 600; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 12px; color: #666; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Class Summary Report</h1>
          <p>${className}</p>
        </div>

        <div class="section">
          <h3>Class Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Class Teacher</div>
              <div class="info-value">${teacherName}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Total Students</div>
              <div class="info-value">${totalStudents}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Active Students</div>
              <div class="info-value">${activeStudents}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Generated</div>
              <div class="info-value">${new Date().toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h3>Student List</h3>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Student ID</th>
                <th>Name</th>
                <th>Gender</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${(students || []).map((student, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${student.studentId}</td>
                  <td>${student.firstName} ${student.lastName}</td>
                  <td>${student.gender}</td>
                  <td>${student.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <p>Generated by SchoolFlow Teacher Portal</p>
        </div>
      </body>
      </html>
    `;
  };

  const generateStudentProfileReport = () => {
    const student = students?.find((s) => s._id === selectedStudentId);
    if (!student) return '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Student Profile - ${student.firstName} ${student.lastName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .header h1 { font-size: 24px; margin-bottom: 10px; }
          .section { margin-bottom: 30px; }
          .section h3 { margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #ddd; }
          .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .info-item { padding: 10px; background: #f9f9f9; border-radius: 4px; }
          .info-label { font-size: 12px; color: #666; }
          .info-value { font-size: 14px; font-weight: bold; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 12px; color: #666; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Student Profile</h1>
          <p>${student.firstName} ${student.lastName}</p>
        </div>

        <div class="section">
          <h3>Personal Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Student ID</div>
              <div class="info-value">${student.studentId}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Admission Number</div>
              <div class="info-value">${student.admissionNumber}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Date of Birth</div>
              <div class="info-value">${new Date(student.dateOfBirth).toLocaleDateString()}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Gender</div>
              <div class="info-value">${student.gender}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Class</div>
              <div class="info-value">${student.className}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Status</div>
              <div class="info-value">${student.status}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h3>Contact Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Address</div>
              <div class="info-value">${student.address}</div>
            </div>
            ${student.phone ? `
            <div class="info-item">
              <div class="info-label">Phone</div>
              <div class="info-value">${student.phone}</div>
            </div>
            ` : ''}
            ${student.email ? `
            <div class="info-item">
              <div class="info-label">Email</div>
              <div class="info-value">${student.email}</div>
            </div>
            ` : ''}
          </div>
        </div>

        <div class="section">
          <h3>Parent/Guardian Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Name</div>
              <div class="info-value">${student.parentName}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Relationship</div>
              <div class="info-value">${student.relationship}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Phone</div>
              <div class="info-value">${student.parentPhone}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Email</div>
              <div class="info-value">${student.parentEmail}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h3>Emergency Contact</h3>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Name</div>
              <div class="info-value">${student.emergencyContactName}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Phone</div>
              <div class="info-value">${student.emergencyContactPhone}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Relationship</div>
              <div class="info-value">${student.emergencyContactRelationship}</div>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>Generated by SchoolFlow Teacher Portal on ${new Date().toLocaleDateString()}</p>
        </div>
      </body>
      </html>
    `;
  };

  if (!teacher) {
    return (
      <div className="space-y-4 py-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileSpreadsheet className="h-6 w-6" />
          Report Generation
        </h1>
        <p className="text-sm text-muted-foreground">
          Generate and export reports for {teacher.classNames?.join(', ')}
        </p>
      </div>

      {/* Report Type Selection */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { type: 'attendance', icon: ClipboardCheck, label: 'Attendance', color: 'bg-green-100 text-green-700' },
          { type: 'grades', icon: BarChart3, label: 'Grades', color: 'bg-blue-100 text-blue-700' },
          { type: 'class-summary', icon: Users, label: 'Class Summary', color: 'bg-purple-100 text-purple-700' },
          { type: 'student-profile', icon: FileText, label: 'Student Profile', color: 'bg-amber-100 text-amber-700' },
        ].map((item) => (
          <Card
            key={item.type}
            className={`cursor-pointer transition-all ${
              selectedReportType === item.type ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
            }`}
            onClick={() => setSelectedReportType(item.type as ReportType)}
          >
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className={`p-3 rounded-lg ${item.color} mb-2`}>
                <item.icon className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium">{item.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configure Report</CardTitle>
          <CardDescription>
            Select options for your {selectedReportType.replace('-', ' ')} report
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedReportType === 'attendance' && (
            <div>
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                  <SelectItem value="quarter">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedReportType === 'grades' && (
            <div>
              <label className="text-sm font-medium mb-2 block">Select Exam</label>
              <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                <SelectTrigger>
                  <SelectValue placeholder="All exams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Exams</SelectItem>
                  {activeExams?.map((exam) => (
                    <SelectItem key={exam._id} value={exam._id}>
                      {exam.examName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedReportType === 'student-profile' && (
            <div>
              <label className="text-sm font-medium mb-2 block">Select Student</label>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a student..." />
                </SelectTrigger>
                <SelectContent>
                  {students?.map((student) => (
                    <SelectItem key={student._id} value={student._id}>
                      {student.firstName} {student.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="pt-4 flex gap-3">
            <Button onClick={generatePDF} disabled={isGenerating} className="flex-1">
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Printer className="h-4 w-4 mr-2" />
                  Generate & Print
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Preview Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Report Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 rounded-lg p-6 text-center">
            {selectedReportType === 'attendance' && (
              <>
                <ClipboardCheck className="h-12 w-12 mx-auto mb-3 text-green-600" />
                <h3 className="font-medium">Attendance Report</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Includes attendance statistics, daily breakdown, and trends for{' '}
                  {dateRange === 'week' ? 'the last 7 days' : dateRange === 'month' ? 'the last 30 days' : 'the last 90 days'}
                </p>
              </>
            )}
            {selectedReportType === 'grades' && (
              <>
                <BarChart3 className="h-12 w-12 mx-auto mb-3 text-blue-600" />
                <h3 className="font-medium">Grades Report</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Includes student rankings, class average, and individual scores
                  {selectedExamId ? ' for the selected exam' : ' across all exams'}
                </p>
              </>
            )}
            {selectedReportType === 'class-summary' && (
              <>
                <Users className="h-12 w-12 mx-auto mb-3 text-purple-600" />
                <h3 className="font-medium">Class Summary Report</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Complete class roster with student details and contact information
                </p>
              </>
            )}
            {selectedReportType === 'student-profile' && (
              <>
                <FileText className="h-12 w-12 mx-auto mb-3 text-amber-600" />
                <h3 className="font-medium">Student Profile Report</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedStudentId
                    ? `Detailed profile for ${students?.find((s) => s._id === selectedStudentId)?.firstName || 'selected student'}`
                    : 'Select a student to generate their profile report'}
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

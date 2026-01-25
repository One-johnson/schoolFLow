'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Search, FileText, Award, BookOpen, Upload } from 'lucide-react';
import { AddExamDialog } from '@/components/exams/add-exam-dialog';
import { EditExamDialog } from '@/components/exams/edit-exam-dialog';
import { ViewExamDialog } from '@/components/exams/view-exam-dialog';
import { DeleteExamDialog } from '@/components/exams/delete-exam-dialog';
import { MarksEntryDialog } from '@/components/exams/marks-entry-dialog';
import { GradingScaleDialog } from '@/components/exams/grading-scale-dialog';
import { GradingScaleCard } from '@/components/exams/grading-scale-card';
import { GenerateReportCardsDialog } from '@/components/exams/generate-report-cards-dialog';
import { ReportCardPreview } from '@/components/exams/report-card-preview';
import { BulkMarksUploadDialog } from '@/components/exams/bulk-marks-upload-dialog';
import { ExamCard } from '@/components/exams/exam-card';
import { ViewMarksDialog } from '@/components/exams/view-marks-dialog';
import type { Id } from '../../../../convex/_generated/dataModel';

export default function ExamsPage() {
  const { user } = useAuth();
  
  const currentAdmin = useQuery(
    api.schoolAdmins.getByEmail,
    user?.email ? { email: user.email } : 'skip'
  );
  
  const schoolId = currentAdmin?.schoolId;

  const exams = useQuery(api.exams.getExamsBySchool, schoolId ? { schoolId } : 'skip');
  const gradingScales = useQuery(api.grading.getGradingScalesBySchool, schoolId ? { schoolId } : 'skip');
  const reportCards = useQuery(api.reportCards.getReportCardsBySchool, schoolId ? { schoolId } : 'skip');

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddExam, setShowAddExam] = useState<boolean>(false);
  const [showEditExam, setShowEditExam] = useState<boolean>(false);
  const [showViewExam, setShowViewExam] = useState<boolean>(false);
  const [showDeleteExam, setShowDeleteExam] = useState<boolean>(false);
  const [showMarksEntry, setShowMarksEntry] = useState<boolean>(false);
  const [showGradingScale, setShowGradingScale] = useState<boolean>(false);
  const [showGenerateReports, setShowGenerateReports] = useState<boolean>(false);
  const [showBulkUpload, setShowBulkUpload] = useState<boolean>(false);
  const [showViewMarks, setShowViewMarks] = useState<boolean>(false);
  const [selectedExamId, setSelectedExamId] = useState<Id<'exams'> | null>(null);
  const [selectedExamName, setSelectedExamName] = useState<string>('');
  const [selectedReportCardId, setSelectedReportCardId] = useState<Id<'reportCards'> | null>(null);

  const filteredExams = exams?.filter((exam) =>
    exam.examName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exam.examCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: exams?.length || 0,
    scheduled: exams?.filter((e) => e.status === 'scheduled').length || 0,
    ongoing: exams?.filter((e) => e.status === 'ongoing').length || 0,
    completed: exams?.filter((e) => e.status === 'completed').length || 0,
  };

  const handleViewExam = (examId: Id<'exams'>): void => {
    setSelectedExamId(examId);
    setShowViewExam(true);
  };

  const handleEditExam = (examId: Id<'exams'>): void => {
    setSelectedExamId(examId);
    setShowEditExam(true);
  };

  const handleDeleteExam = (examId: Id<'exams'>): void => {
    const exam = exams?.find((e) => e._id === examId);
    setSelectedExamId(examId);
    setSelectedExamName(exam?.examName || '');
    setShowDeleteExam(true);
  };

  const handleEnterMarks = (examId: Id<'exams'>): void => {
    setSelectedExamId(examId);
    setShowMarksEntry(true);
  };

  const handleViewMarks = (examId: Id<'exams'>): void => {
    setSelectedExamId(examId);
    setShowViewMarks(true);
  };

  if (!schoolId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Exams & Assessments</h1>
          <p className="text-muted-foreground">
            Manage exams, record marks, and generate report cards
          </p>
        </div>
        <Button onClick={() => setShowAddExam(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Exam
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.scheduled}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ongoing</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ongoing}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="exams" className="space-y-4">
        <TabsList>
          <TabsTrigger value="exams">Exams</TabsTrigger>
          <TabsTrigger value="marks">Marks Entry</TabsTrigger>
          <TabsTrigger value="reports">Report Cards</TabsTrigger>
          <TabsTrigger value="grading">Grading Scales</TabsTrigger>
        </TabsList>

        {/* Exams Tab */}
        <TabsContent value="exams" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search exams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {filteredExams && filteredExams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredExams.map((exam) => (
                <ExamCard
                  key={exam._id}
                  exam={exam}
                  onView={handleViewExam}
                  onEdit={handleEditExam}
                  onDelete={handleDeleteExam}
                  onEnterMarks={handleEnterMarks}
                  onViewMarks={handleViewMarks}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No exams yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first exam to get started
                </p>
                <Button onClick={() => setShowAddExam(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Exam
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Marks Entry Tab */}
        <TabsContent value="marks" className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowBulkUpload(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Bulk Upload
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Enter Marks</CardTitle>
              <CardDescription>
                Select an exam and class to enter student marks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {exams?.map((exam) => (
                  <Button
                    key={exam._id}
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-start"
                    onClick={() => handleEnterMarks(exam._id)}
                  >
                    <span className="font-semibold">{exam.examName}</span>
                    <span className="text-sm text-muted-foreground">{exam.examCode}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Report Cards Tab */}
        <TabsContent value="reports" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowGenerateReports(true)}>
              <FileText className="h-4 w-4 mr-2" />
              Generate Report Cards
            </Button>
          </div>

          {reportCards && reportCards.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {reportCards.slice(0, 5).map((report) => (
                <Card key={report._id} className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedReportCardId(report._id)}>
                  <CardHeader>
                    <CardTitle>{report.studentName}</CardTitle>
                    <CardDescription>
                      {report.className} - {report.reportCode}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between text-sm">
                      <span>Percentage: {report.percentage.toFixed(1)}%</span>
                      <span>Grade: {report.overallGrade}</span>
                      <span>Position: {report.position}/{report.totalStudents}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Award className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No report cards generated</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Generate report cards after entering exam marks
                </p>
                <Button onClick={() => setShowGenerateReports(true)}>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report Cards
                </Button>
              </CardContent>
            </Card>
          )}

          {selectedReportCardId && (
            <ReportCardPreview reportCardId={selectedReportCardId} />
          )}
        </TabsContent>

        {/* Grading Scales Tab */}
        <TabsContent value="grading" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowGradingScale(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Grading Scale
            </Button>
          </div>

          {gradingScales && gradingScales.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gradingScales.map((scale) => (
                <GradingScaleCard key={scale._id} scale={scale} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Award className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No grading scales configured</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create a grading scale to calculate student grades
                </p>
                <Button onClick={() => setShowGradingScale(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Grading Scale
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {schoolId && (
        <>
          <AddExamDialog
            open={showAddExam}
            onOpenChange={setShowAddExam}
            schoolId={schoolId}
          />

          {selectedExamId && (
            <>
              <EditExamDialog
                open={showEditExam}
                onOpenChange={setShowEditExam}
                examId={selectedExamId}
                schoolId={schoolId}
              />

              <ViewExamDialog
                open={showViewExam}
                onOpenChange={setShowViewExam}
                examId={selectedExamId}
              />

              <DeleteExamDialog
                open={showDeleteExam}
                onOpenChange={setShowDeleteExam}
                examId={selectedExamId}
                examName={selectedExamName}
              />

              <MarksEntryDialog
                open={showMarksEntry}
                onOpenChange={setShowMarksEntry}
                examId={selectedExamId}
                schoolId={schoolId}
              />

              <BulkMarksUploadDialog
                open={showBulkUpload}
                onOpenChange={setShowBulkUpload}
                examId={selectedExamId}
              />

              <ViewMarksDialog
                open={showViewMarks}
                onOpenChange={setShowViewMarks}
                examId={selectedExamId}
                schoolId={schoolId}
              />
            </>
          )}

          <GradingScaleDialog
            open={showGradingScale}
            onOpenChange={setShowGradingScale}
            schoolId={schoolId}
          />

          <GenerateReportCardsDialog
            open={showGenerateReports}
            onOpenChange={setShowGenerateReports}
            schoolId={schoolId}
          />
        </>
      )}
    </div>
  );
}

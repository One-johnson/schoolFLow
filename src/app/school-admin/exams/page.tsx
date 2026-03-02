"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Search, FileText, Award, BookOpen, Upload } from "lucide-react";
import { AddExamDialog } from "@/components/exams/add-exam-dialog";
import { EditExamDialog } from "@/components/exams/edit-exam-dialog";
import { ViewExamDialog } from "@/components/exams/view-exam-dialog";
import { DeleteExamDialog } from "@/components/exams/delete-exam-dialog";
import { MarksEntryDialog } from "@/components/exams/marks-entry-dialog";
import { GradingScaleDialog } from "@/components/exams/grading-scale-dialog";
import { GradingScaleCard } from "@/components/exams/grading-scale-card";
import { GenerateReportCardsDialog } from "@/components/exams/generate-report-cards-dialog";
import { ReportCardSheet } from "@/components/exams/report-card-sheet";
import { DeleteReportCardDialog } from "@/components/exams/delete-report-card-dialog";
import { BulkDeleteReportCardsDialog } from "@/components/exams/bulk-delete-report-cards-dialog";
import {
  exportReportCardToPDF,
  bulkExportReportCardsToPDF,
  type PrintLayoutOptions,
} from "@/lib/pdf-utils";
import { useConvex } from "convex/react";
import { BulkMarksUploadDialog } from "@/components/exams/bulk-marks-upload-dialog";
import { ExamCard } from "@/components/exams/exam-card";
import { ViewMarksDialog } from "@/components/exams/view-marks-dialog";
import { PerformanceAnalyticsDashboard } from "@/components/exams/performance-analytics-dashboard";
import { ReportCardReviewDialog } from "@/components/exams/report-card-review-dialog";
import { UpdateExamStatusDialog } from "@/components/exams/update-exam-status-dialog";
import { UnlockExamDialog } from "@/components/exams/unlock-exam-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { BarChart3, CheckCircle, Eye, Trash2, Download } from "lucide-react";
import type { Id, Doc } from "../../../../convex/_generated/dataModel";

export default function ExamsPage() {
  const { user } = useAuth();
  const convex = useConvex();

  const currentAdmin = useQuery(
    api.schoolAdmins.getByEmail,
    user?.email ? { email: user.email } : "skip",
  );

  const schoolId = currentAdmin?.schoolId;

  const exams = useQuery(
    api.exams.getExamsBySchool,
    schoolId ? { schoolId } : "skip",
  );
  const gradingScales = useQuery(
    api.grading.getGradingScalesBySchool,
    schoolId ? { schoolId } : "skip",
  );
  const reportCards = useQuery(
    api.reportCards.getReportCardsBySchool,
    schoolId ? { schoolId } : "skip",
  );
  const classes = useQuery(
    api.classes.getClassesBySchool,
    schoolId ? { schoolId } : "skip",
  );
  const terms = useQuery(
    api.terms.getTermsBySchool,
    schoolId ? { schoolId } : "skip",
  );
  const academicYears = useQuery(
    api.academicYears.getYearsBySchool,
    schoolId ? { schoolId } : "skip",
  );

  const [selectedAnalyticsExamId, setSelectedAnalyticsExamId] =
    useState<Id<"exams"> | null>(null);
  const analyticsData = useQuery(
    api.examAnalytics.getExamAnalytics,
    selectedAnalyticsExamId ? { examId: selectedAnalyticsExamId } : "skip",
  );

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showAddExam, setShowAddExam] = useState<boolean>(false);
  const [showEditExam, setShowEditExam] = useState<boolean>(false);
  const [showViewExam, setShowViewExam] = useState<boolean>(false);
  const [showDeleteExam, setShowDeleteExam] = useState<boolean>(false);
  const [showMarksEntry, setShowMarksEntry] = useState<boolean>(false);
  const [showGradingScale, setShowGradingScale] = useState<boolean>(false);
  const [showGenerateReports, setShowGenerateReports] =
    useState<boolean>(false);
  const [showBulkUpload, setShowBulkUpload] = useState<boolean>(false);
  const [showViewMarks, setShowViewMarks] = useState<boolean>(false);
  const [showReviewDialog, setShowReviewDialog] = useState<boolean>(false);
  const [showUpdateStatus, setShowUpdateStatus] = useState<boolean>(false);
  const [showUnlockDialog, setShowUnlockDialog] = useState<boolean>(false);
  const [selectedExamId, setSelectedExamId] = useState<Id<"exams"> | null>(
    null,
  );
  const [selectedExamName, setSelectedExamName] = useState<string>("");
  const [selectedExamStatus, setSelectedExamStatus] = useState<
    "draft" | "scheduled" | "ongoing" | "completed" | "published"
  >("draft");
  const [selectedExamUnlocked, setSelectedExamUnlocked] =
    useState<boolean>(false);
  const [selectedReportCardId, setSelectedReportCardId] =
    useState<Id<"reportCards"> | null>(null);
  const [reviewFilterClass, setReviewFilterClass] = useState<string>("");
  const [reviewFilterTerm, setReviewFilterTerm] = useState<string>("");
  const [reportFilterClass, setReportFilterClass] = useState<string>("");
  const [reportFilterDepartment, setReportFilterDepartment] =
    useState<string>("");
  const [selectedReportCards, setSelectedReportCards] = useState<
    Id<"reportCards">[]
  >([]);
  const [showDeleteReport, setShowDeleteReport] = useState<boolean>(false);
  const [showBulkDeleteReports, setShowBulkDeleteReports] =
    useState<boolean>(false);
  const [showReportSheet, setShowReportSheet] = useState<boolean>(false);
  const [deleteReportName, setDeleteReportName] = useState<string>("");

  const filteredExams = exams?.filter(
    (exam) =>
      exam.examName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.examCode.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const stats = {
    total: exams?.length || 0,
    scheduled: exams?.filter((e) => e.status === "scheduled").length || 0,
    ongoing: exams?.filter((e) => e.status === "ongoing").length || 0,
    completed: exams?.filter((e) => e.status === "completed").length || 0,
  };

  const handleViewExam = (examId: Id<"exams">): void => {
    setSelectedExamId(examId);
    setShowViewExam(true);
  };

  const handleEditExam = (examId: Id<"exams">): void => {
    setSelectedExamId(examId);
    setShowEditExam(true);
  };

  const handleDeleteExam = (examId: Id<"exams">): void => {
    const exam = exams?.find((e) => e._id === examId);
    setSelectedExamId(examId);
    setSelectedExamName(exam?.examName || "");
    setShowDeleteExam(true);
  };

  const handleEnterMarks = (examId: Id<"exams">): void => {
    setSelectedExamId(examId);
    setShowMarksEntry(true);
  };

  const handleViewMarks = (examId: Id<"exams">): void => {
    setSelectedExamId(examId);
    setShowViewMarks(true);
  };

  const handleChangeStatus = (examId: Id<"exams">): void => {
    const exam = exams?.find((e) => e._id === examId);
    setSelectedExamId(examId);
    setSelectedExamName(exam?.examName || "");
    setSelectedExamStatus(exam?.status || "draft");
    setShowUpdateStatus(true);
  };

  const handleUnlock = (examId: Id<"exams">): void => {
    const exam = exams?.find((e) => e._id === examId);
    setSelectedExamId(examId);
    setSelectedExamName(exam?.examName || "");
    setSelectedExamStatus(exam?.status || "draft");
    setSelectedExamUnlocked(exam?.unlocked || false);
    setShowUnlockDialog(true);
  };

  // Helper function to enrich report card with academic year, term names, and grading scale data
  type EnrichedReport = Doc<"reportCards"> & {
    gradingScaleData?: string;
    academicYearName?: string;
    termName?: string;
    photoUrl?: string;
  };

  const enrichReportCard = async (
    report: Doc<"reportCards">,
  ): Promise<EnrichedReport> => {
    const enrichedReport: EnrichedReport = { ...report };

    // Fetch academic year name if not present (match by _id, not yearCode)
    if (!report.academicYearName && report.academicYearId) {
      const academicYear = academicYears?.find(
        (y) => y._id === report.academicYearId,
      );
      if (academicYear) {
        enrichedReport.academicYearName = academicYear.yearName;
      }
    }

    // Fetch term name if not present (match by _id, not termCode)
    if (!report.termName && report.termId) {
      const term = terms?.find((t) => t._id === report.termId);
      if (term) {
        enrichedReport.termName = term.termName;
      }
    }

    // Fetch grading scale data if report has a grading scale ID
    if (report.gradingScaleId) {
      const gradingScale = gradingScales?.find(
        (g) => g._id === report.gradingScaleId,
      );
      if (gradingScale && gradingScale.grades) {
        enrichedReport.gradingScaleData = gradingScale.grades; // Store the JSON string of grades
      }
    }

    return enrichedReport;
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
          <TabsTrigger value="review">
            <CheckCircle className="h-4 w-4 mr-2" />
            Review Reports
          </TabsTrigger>
          <TabsTrigger value="grading">Grading Scales</TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
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
                  onChangeStatus={handleChangeStatus}
                  onUnlock={handleUnlock}
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
                    <span className="text-sm text-muted-foreground">
                      {exam.examCode}
                    </span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Report Cards Tab */}
        <TabsContent value="reports" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              {selectedReportCards.length > 0 && (
                <>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowBulkDeleteReports(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete {selectedReportCards.length} Report(s)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const selectedReports = reportCards?.filter((r) =>
                        selectedReportCards.includes(r._id),
                      );
                      if (selectedReports) {
                        // Fetch photo URLs for selected students
                        const enrichedReports = await Promise.all(
                          selectedReports.map(async (report) => {
                            const enriched = await enrichReportCard(report);
                            // Fetch student photo if available
                            try {
                              const studentData = await convex.query(
                                api.students.getStudentByStudentId,
                                { studentId: report.studentId },
                              );
                              if (studentData?.photoStorageId) {
                                const photoUrl = await convex.query(
                                  api.students.getStudentPhotoUrl,
                                  { storageId: studentData.photoStorageId },
                                );
                                enriched.photoUrl = photoUrl || undefined;
                              }
                            } catch (error) {
                              console.error("Error fetching photo:", error);
                            }
                            return enriched;
                          }),
                        );
                        bulkExportReportCardsToPDF(enrichedReports);
                      }
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export {selectedReportCards.length} PDF(s)
                  </Button>
                </>
              )}
            </div>
            <Button onClick={() => setShowGenerateReports(true)}>
              <FileText className="h-4 w-4 mr-2" />
              Generate Report Cards
            </Button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="report-class-filter">Filter by Class</Label>
              <Select
                value={reportFilterClass}
                onValueChange={setReportFilterClass}
              >
                <SelectTrigger id="report-class-filter">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes?.map((cls) => (
                    <SelectItem key={cls._id} value={cls.classCode}>
                      {cls.className}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-department-filter">
                Filter by Department
              </Label>
              <Select
                value={reportFilterDepartment}
                onValueChange={setReportFilterDepartment}
              >
                <SelectTrigger id="report-department-filter">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="creche">Creche</SelectItem>
                  <SelectItem value="kindergarten">Kindergarten</SelectItem>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="junior_high">Junior High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {reportCards && reportCards.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {reportCards
                .filter(
                  (r) =>
                    !reportFilterClass ||
                    reportFilterClass === "all" ||
                    r.classId === reportFilterClass,
                )
                .filter((r) => {
                  if (
                    !reportFilterDepartment ||
                    reportFilterDepartment === "all"
                  )
                    return true;
                  const classDoc = classes?.find(
                    (c) => c.classCode === r.classId,
                  );
                  return classDoc?.department === reportFilterDepartment;
                })
                .map((report) => (
                  <Card
                    key={report._id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <Checkbox
                          checked={selectedReportCards.includes(report._id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedReportCards([
                                ...selectedReportCards,
                                report._id,
                              ]);
                            } else {
                              setSelectedReportCards(
                                selectedReportCards.filter(
                                  (id) => id !== report._id,
                                ),
                              );
                            }
                          }}
                        />
                        <div className="flex-1 ml-2">
                          <CardTitle className="text-sm">
                            {report.studentName}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {report.className}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Percentage:
                          </span>
                          <span className="font-medium">
                            {report.percentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Grade:</span>
                          <span className="font-medium">
                            {report.overallGrade}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Position:
                          </span>
                          <span className="font-medium">
                            {report.position}/{report.totalStudents}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setSelectedReportCardId(report._id);
                            setShowReportSheet(true);
                          }}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            const enriched = await enrichReportCard(report);
                            exportReportCardToPDF(enriched);
                          }}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedReportCardId(report._id);
                            setDeleteReportName(report.studentName);
                            setShowDeleteReport(true);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Award className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No report cards generated
                </h3>
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
        </TabsContent>

        {/* Review Reports Tab */}
        <TabsContent value="review" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Review Report Cards</CardTitle>
              <CardDescription>
                Review and approve draft report cards before publishing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="review-class-filter">Filter by Class</Label>
                  <Select
                    value={reviewFilterClass}
                    onValueChange={setReviewFilterClass}
                  >
                    <SelectTrigger id="review-class-filter">
                      <SelectValue placeholder="All Classes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      {classes?.map((cls) => (
                        <SelectItem key={cls._id} value={cls.classCode}>
                          {cls.className}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="review-term-filter">Filter by Term</Label>
                  <Select
                    value={reviewFilterTerm}
                    onValueChange={setReviewFilterTerm}
                  >
                    <SelectTrigger id="review-term-filter">
                      <SelectValue placeholder="All Terms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Terms</SelectItem>
                      {terms?.map((term) => (
                        <SelectItem key={term._id} value={term.termCode}>
                          {term.termName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Draft Report Cards List */}
              {reportCards &&
              reportCards.filter((r) => r.status === "draft").length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {reportCards
                    .filter((r) => r.status === "draft")
                    .filter(
                      (r) =>
                        !reviewFilterClass ||
                        reviewFilterClass === "all" ||
                        r.classId === reviewFilterClass,
                    )
                    .filter(
                      (r) =>
                        !reviewFilterTerm ||
                        reviewFilterTerm === "all" ||
                        r.termId === reviewFilterTerm,
                    )
                    .map((report) => (
                      <Card
                        key={report._id}
                        className="hover:shadow-md transition-shadow"
                      >
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <h3 className="font-semibold text-lg">
                                {report.studentName}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {report.className} • {report.termName || "N/A"}
                              </p>
                              <div className="flex gap-4 text-sm mt-2">
                                <span>
                                  Percentage:{" "}
                                  <span className="font-medium">
                                    {report.percentage.toFixed(1)}%
                                  </span>
                                </span>
                                <span>
                                  Grade:{" "}
                                  <span className="font-medium">
                                    {report.overallGrade}
                                  </span>
                                </span>
                                <span>
                                  Position:{" "}
                                  <span className="font-medium">
                                    {report.position}/{report.totalStudents}
                                  </span>
                                </span>
                              </div>
                              {report.verifiedByClassTeacher && (
                                <div className="flex items-center gap-2 mt-2">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                  <span className="text-sm text-green-600">
                                    Approved by {report.reviewedByName}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setSelectedReportCardId(report._id)
                                }
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedReportCardId(report._id);
                                  setShowReviewDialog(true);
                                }}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Review
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No draft report cards
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    All report cards have been reviewed or none have been
                    generated yet
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
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
                <h3 className="text-lg font-semibold mb-2">
                  No grading scales configured
                </h3>
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

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
              <CardDescription>
                Select an exam to view detailed performance analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-w-md">
                <Select
                  value={selectedAnalyticsExamId || ""}
                  onValueChange={(value: string) => {
                    if (value) {
                      setSelectedAnalyticsExamId(value as Id<"exams">);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an exam to analyze" />
                  </SelectTrigger>
                  <SelectContent>
                    {exams
                      ?.filter(
                        (exam) =>
                          exam.status === "completed" ||
                          exam.status === "published",
                      )
                      .map((exam) => (
                        <SelectItem key={exam._id} value={exam._id}>
                          {exam.examName} ({exam.examCode})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {analyticsData ? (
            <PerformanceAnalyticsDashboard data={analyticsData} />
          ) : selectedAnalyticsExamId ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Loading analytics...</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select an Exam</h3>
                <p className="text-sm text-muted-foreground">
                  Choose a completed exam from the dropdown above to view
                  detailed analytics
                </p>
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
                adminId={currentAdmin._id}
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
                adminId={currentAdmin._id}
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

              <UpdateExamStatusDialog
                open={showUpdateStatus}
                onOpenChange={setShowUpdateStatus}
                examId={selectedExamId}
                examName={selectedExamName}
                currentStatus={selectedExamStatus}
                adminId={currentAdmin._id}
              />

              {currentAdmin && (
                <UnlockExamDialog
                  open={showUnlockDialog}
                  onOpenChange={setShowUnlockDialog}
                  examId={selectedExamId}
                  examName={selectedExamName}
                  examStatus={selectedExamStatus}
                  adminId={currentAdmin._id}
                  adminName={currentAdmin.name}
                  isUnlocked={selectedExamUnlocked}
                />
              )}
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
            adminId={currentAdmin._id}
          />

          {selectedReportCardId && showReviewDialog && currentAdmin && (
            <ReportCardReviewDialog
              open={showReviewDialog}
              onOpenChange={setShowReviewDialog}
              reportCardId={selectedReportCardId}
              reviewedBy={currentAdmin._id}
              reviewedByName={currentAdmin.name}
              onReviewComplete={() => {
                setShowReviewDialog(false);
                setSelectedReportCardId(null);
              }}
            />
          )}

          {selectedReportCardId && (
            <>
              <ReportCardSheet
                open={showReportSheet}
                onOpenChange={setShowReportSheet}
                reportCardId={selectedReportCardId}
              />

              <DeleteReportCardDialog
                open={showDeleteReport}
                onOpenChange={setShowDeleteReport}
                reportCardId={selectedReportCardId}
                studentName={deleteReportName}
                adminId={currentAdmin._id}
              />
            </>
          )}

          <BulkDeleteReportCardsDialog
            open={showBulkDeleteReports}
            onOpenChange={setShowBulkDeleteReports}
            reportCardIds={selectedReportCards}
            onDeleteComplete={() => {
              setSelectedReportCards([]);
            }}
            adminId={currentAdmin._id}
          />
        </>
      )}
    </div>
  );
}

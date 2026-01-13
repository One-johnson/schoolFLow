'use client';

import { useState, useMemo, useCallback, JSX } from 'react';
import { useQuery, useConvex } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Search,
  Download,
  Trash2,
  Clock,
  Filter,
  FileText,
  Users,
  GraduationCap,
  Save,
  Copy,
  Layout,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Id } from '../../../../convex/_generated/dataModel';
import { AddTimetableDialog } from '@/components/timetable/add-timetable-dialog';
import { DeleteTimetableDialog } from '@/components/timetable/delete-timetable-dialog';
import { BulkDeleteTimetablesDialog } from '@/components/timetable/bulk-delete-timetables-dialog';
import { TimetableView } from '@/components/timetable/timetable-view';
import { SaveAsTemplateDialog } from '@/components/timetable/save-as-template-dialog';
import { CloneTimetableDialog } from '@/components/timetable/clone-timetable-dialog';
import { ApplyTemplateDialog } from '@/components/timetable/apply-template-dialog';
import { 
  exportClassTimetablePDF, 
  exportTeacherSchedulePDF, 
  exportMasterTimetablePDF 
} from '@/lib/timetable-export';

interface Timetable {
  _id: Id<'timetables'>;
  _creationTime: number;
  schoolId: string;
  classId: string;
  className: string;
  academicYearId?: string;
  termId?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

interface Class {
  _id: Id<'classes'>;
  className: string;
  status: 'active' | 'inactive';
}

interface Teacher {
  _id: Id<'teachers'>;
  teacherId: string;
  firstName: string;
  lastName: string;
  status: 'active' | 'on_leave' | 'inactive';
}

interface Period {
  _id: Id<'periods'>;
  timetableId: Id<'timetables'>;
  periodName: string;
  startTime: string;
  endTime: string;
  periodType: 'class' | 'break';
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';
}

interface Assignment {
  _id: Id<'timetableAssignments'>;
  periodId: Id<'periods'>;
  subjectName: string;
  teacherName: string;
  subjectColor?: string;
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';
  className: string;
  startTime: string;
  endTime: string;
}

export default function TimetablePage(): JSX.Element {
  const { user } = useAuth();
  const convex = useConvex();
  const schoolId = user?.schoolId || '';

  // Get current admin to fetch school information
  const currentAdmin = useQuery(
    api.schoolAdmins.getByEmail,
    user?.email ? { email: user.email } : 'skip'
  );

  const schoolCreationRequests = useQuery(
    api.schoolCreationRequests.getByAdmin,
    currentAdmin ? { schoolAdminId: currentAdmin._id } : 'skip'
  );

  const approvedSchool = schoolCreationRequests?.find((req: { status: string }) => req.status === 'approved');

  // Queries
  const timetables = useQuery(
    api.timetables.getTimetables,
    schoolId ? { schoolId } : 'skip'
  ) as Timetable[] | undefined;

  const classes = useQuery(
    api.classes.getClassesBySchool,
    schoolId ? { schoolId } : 'skip'
  ) as Class[] | undefined;

  const teachers = useQuery(
    api.teachers.getTeachersBySchool,
    schoolId ? { schoolId } : 'skip'
  ) as Teacher[] | undefined;

  // State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedTimetable, setSelectedTimetable] = useState<Id<'timetables'> | null>(null);
  const [exportingClass, setExportingClass] = useState<Id<'timetables'> | null>(null);
  const [exportingTeacher, setExportingTeacher] = useState<Id<'teachers'> | null>(null);
  const [exportingMaster, setExportingMaster] = useState<boolean>(false);

  // Dialogs
  const [showAddDialog, setShowAddDialog] = useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState<boolean>(false);
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState<boolean>(false);
  const [showCloneDialog, setShowCloneDialog] = useState<boolean>(false);
  const [showApplyTemplateDialog, setShowApplyTemplateDialog] = useState<boolean>(false);
  const [selectedTimetableForTemplate, setSelectedTimetableForTemplate] = useState<Id<'timetables'> | null>(null);

  // Selected rows for bulk operations
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});

  // Filter timetables
  const filteredTimetables = useMemo(() => {
    if (!timetables) return [];

    return timetables.filter((timetable) => {
      const matchesSearch = 
        timetable.className.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesClass = selectedClass === 'all' || timetable.classId === selectedClass;

      return matchesSearch && matchesClass;
    });
  }, [timetables, searchQuery, selectedClass]);

  // Group timetables by class (should be one timetable per class now)
  const groupedTimetables = useMemo(() => {
    const grouped: Record<string, Timetable[]> = {};
    
    filteredTimetables.forEach((timetable) => {
      if (!grouped[timetable.classId]) {
        grouped[timetable.classId] = [];
      }
      grouped[timetable.classId].push(timetable);
    });

    return grouped;
  }, [filteredTimetables]);

  // Get selected timetable IDs for bulk operations
  const selectedTimetableIds = useMemo(() => {
    return Object.keys(selectedRows).filter(id => selectedRows[id]) as Id<'timetables'>[];
  }, [selectedRows]);

  // Get classes that don't have timetables yet
  const availableClasses = useMemo(() => {
    const classesWithTimetables = new Set(
      timetables?.map(t => t.classId) || []
    );
    return classes?.filter(c => 
      c.status === 'active' && !classesWithTimetables.has(c._id)
    ) || [];
  }, [classes, timetables]);

  // Export class timetable handler
  const handleExportClassTimetable = useCallback(async (timetableId: Id<'timetables'>) => {
    setExportingClass(timetableId);
    
    try {
      // Fetch timetable data using Convex client
      const timetableData = await convex.query(api.timetables.getTimetable, { timetableId });
      
      if (!timetableData) {
        toast.error('Timetable not found');
        return;
      }

      const { timetable, periodsByDay } = timetableData;

      // Flatten periods from all days
      const periods: Period[] = [];
      Object.values(periodsByDay as Record<string, Period[]>).forEach(dayPeriods => {
        periods.push(...dayPeriods);
      });

      // Fetch assignments using Convex client
      const assignments = await convex.query(api.timetables.getAssignments, { timetableId }) as Assignment[];

      // Prepare data for export
      const exportData = {
        className: timetable.className,
        schoolName: approvedSchool?.schoolName,
        periods: periods.map(p => ({
          periodName: p.periodName,
          startTime: p.startTime,
          endTime: p.endTime,
          periodType: p.periodType,
          day: p.day,
        })),
        assignments: assignments.map(a => ({
          periodId: `${periods.find(p => p._id === a.periodId)?.periodName}_${a.day}`,
          subjectName: a.subjectName,
          teacherName: a.teacherName,
          subjectColor: a.subjectColor,
          day: a.day,
        })),
      };

      exportClassTimetablePDF(exportData);
      toast.success(`${timetable.className} timetable exported successfully`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export timetable');
    } finally {
      setExportingClass(null);
    }
  }, [convex, approvedSchool]);

  // Export teacher schedule handler
  const handleExportTeacherSchedule = useCallback(async (teacherId: Id<'teachers'>) => {
    setExportingTeacher(teacherId);
    
    try {
      const teacher = teachers?.find(t => t._id === teacherId);
      if (!teacher) {
        toast.error('Teacher not found');
        return;
      }

      // Fetch all assignments for this teacher using Convex client
      const assignments = await convex.query(api.timetableAssignments.getAssignmentsByTeacher, {
        schoolId,
        teacherId: teacher.teacherId
      }) as Assignment[];

      if (assignments.length === 0) {
        toast.error('No assignments found for this teacher');
        return;
      }

      // Prepare data for export
      const exportData = {
        teacherName: `${teacher.firstName} ${teacher.lastName}`,
        schoolName: approvedSchool?.schoolName,
        assignments: assignments.map(a => ({
          periodId: a.periodId,
          subjectName: a.subjectName,
          teacherName: a.teacherName,
          className: a.className,
          day: a.day,
          startTime: a.startTime,
          endTime: a.endTime,
        })),
      };

      exportTeacherSchedulePDF(exportData);
      toast.success(`${teacher.firstName} ${teacher.lastName}'s schedule exported successfully`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export teacher schedule');
    } finally {
      setExportingTeacher(null);
    }
  }, [convex, teachers, schoolId, approvedSchool]);

  // Export master timetable handler
  const handleExportMasterTimetable = useCallback(async () => {
    setExportingMaster(true);
    
    try {
      if (!filteredTimetables.length) {
        toast.error('No timetables to export');
        return;
      }

      // Fetch all timetables data
      const timetablesData = [];
      
      for (const timetable of filteredTimetables) {
        // Fetch timetable data using Convex client
        const timetableData = await convex.query(api.timetables.getTimetable, { 
          timetableId: timetable._id 
        });
        
        if (!timetableData) {
          continue;
        }

        const { timetable: timetableInfo, periodsByDay } = timetableData;

        // Flatten periods from all days
        const periods: Period[] = [];
        Object.values(periodsByDay as Record<string, Period[]>).forEach(dayPeriods => {
          periods.push(...dayPeriods);
        });

        // Fetch assignments using Convex client
        const assignments = await convex.query(api.timetables.getAssignments, { 
          timetableId: timetable._id 
        }) as Assignment[];

        // Prepare data for export
        timetablesData.push({
          className: timetableInfo.className,
          schoolName: approvedSchool?.schoolName,
          periods: periods.map(p => ({
            periodName: p.periodName,
            startTime: p.startTime,
            endTime: p.endTime,
            periodType: p.periodType,
            day: p.day,
          })),
          assignments: assignments.map(a => ({
            periodId: `${periods.find(p => p._id === a.periodId)?.periodName}_${a.day}`,
            subjectName: a.subjectName,
            teacherName: a.teacherName,
            subjectColor: a.subjectColor,
            day: a.day,
          })),
        });
      }

      exportMasterTimetablePDF(
        timetablesData,
        approvedSchool?.schoolName
      );
      
      toast.success('Master timetable exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export master timetable');
    } finally {
      setExportingMaster(false);
    }
  }, [convex, filteredTimetables, approvedSchool]);

  const handleDeleteClick = useCallback((timetableId: Id<'timetables'>): void => {
    setSelectedTimetable(timetableId);
    setShowDeleteDialog(true);
  }, []);

  const handleBulkDelete = useCallback((): void => {
    if (selectedTimetableIds.length === 0) {
      toast.error('No timetables selected');
      return;
    }
    setShowBulkDeleteDialog(true);
  }, [selectedTimetableIds]);

  const activeClasses = useMemo(() => {
    return classes?.filter(c => c.status === 'active') || [];
  }, [classes]);

  const activeTeachers = useMemo(() => {
    return teachers?.filter(t => t.status === 'active') || [];
  }, [teachers]);

  if (!user || !approvedSchool) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-lg font-medium">Loading timetable...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Timetable Management</h2>
            <p className="text-muted-foreground">
              Manage class schedules and teacher assignments
            </p>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Layout className="mr-2 h-4 w-4" />
                  Templates
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowApplyTemplateDialog(true)}>
                  <Layout className="mr-2 h-4 w-4" />
                  Apply Template
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setShowCloneDialog(true)}
                  disabled={filteredTimetables.length === 0}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Clone Timetable
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button onClick={() => setShowAddDialog(true)} disabled={availableClasses.length === 0}>
              <Plus className="mr-2 h-4 w-4" />
              Create Timetable
            </Button>
          </div>
        </div>

        {/* Filters and Actions */}
        <Card className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by class..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {activeClasses.map((cls) => (
                    <SelectItem key={cls._id} value={cls._id}>
                      {cls.className}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Export Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={exportingMaster}>
                    <Download className="mr-2 h-4 w-4" />
                    {exportingMaster ? 'Exporting...' : 'Export'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem 
                    onClick={handleExportMasterTimetable}
                    disabled={filteredTimetables.length === 0 || exportingMaster}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Master Timetable (All Classes)
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Individual Class
                  </DropdownMenuLabel>
                  
                  {filteredTimetables.length === 0 ? (
                    <DropdownMenuItem disabled>
                      <GraduationCap className="mr-2 h-4 w-4" />
                      No classes available
                    </DropdownMenuItem>
                  ) : (
                    filteredTimetables.map((timetable) => (
                      <DropdownMenuItem
                        key={timetable._id}
                        onClick={() => handleExportClassTimetable(timetable._id)}
                        disabled={exportingClass === timetable._id}
                      >
                        <GraduationCap className="mr-2 h-4 w-4" />
                        {exportingClass === timetable._id ? 'Exporting...' : timetable.className}
                      </DropdownMenuItem>
                    ))
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Teacher Schedule
                  </DropdownMenuLabel>
                  
                  {activeTeachers.length === 0 ? (
                    <DropdownMenuItem disabled>
                      <Users className="mr-2 h-4 w-4" />
                      No teachers available
                    </DropdownMenuItem>
                  ) : (
                    activeTeachers.slice(0, 10).map((teacher) => (
                      <DropdownMenuItem
                        key={teacher._id}
                        onClick={() => handleExportTeacherSchedule(teacher._id)}
                        disabled={exportingTeacher === teacher._id}
                      >
                        <Users className="mr-2 h-4 w-4" />
                        {exportingTeacher === teacher._id 
                          ? 'Exporting...' 
                          : `${teacher.firstName} ${teacher.lastName}`
                        }
                      </DropdownMenuItem>
                    ))
                  )}
                  
                  {activeTeachers.length > 10 && (
                    <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                      + {activeTeachers.length - 10} more teachers...
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Bulk Delete */}
              {selectedTimetableIds.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Selected ({selectedTimetableIds.length})
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Timetable View */}
        {Object.keys(groupedTimetables).length === 0 ? (
          <Card className="flex h-[400px] flex-col items-center justify-center p-8">
            <Clock className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No timetables created yet</h3>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Get started by creating your first class timetable
            </p>
            <Button 
              className="mt-4" 
              onClick={() => setShowAddDialog(true)}
              disabled={availableClasses.length === 0}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Timetable
            </Button>
            {availableClasses.length === 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                All classes already have timetables
              </p>
            )}
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedTimetables).map(([classId, classTimetables]) => {
              const className = classTimetables[0]?.className || 'Unknown Class';
              const timetableId = classTimetables[0]?._id;
              
              return (
                <Card key={classId} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">{className}</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedTimetableForTemplate(timetableId);
                          setShowSaveTemplateDialog(true);
                        }}
                      >
                        <Save className="mr-2 h-4 w-4" />
                        Save as Template
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => timetableId && handleExportClassTimetable(timetableId)}
                        disabled={exportingClass === timetableId}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        {exportingClass === timetableId ? 'Exporting...' : 'Export PDF'}
                      </Button>
                    </div>
                  </div>
                  
                  <TimetableView
                    timetables={classTimetables}
                    classId={classId}
                    className={className}
                    schoolId={schoolId}
                    teachers={activeTeachers}
                    onDelete={handleDeleteClick}
                  />
                </Card>
              );
            })}
          </div>
        )}

        {/* Dialogs */}
        <AddTimetableDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          schoolId={schoolId}
          classes={availableClasses}
        />

        <DeleteTimetableDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          timetableId={selectedTimetable}
        />

        <BulkDeleteTimetablesDialog
          open={showBulkDeleteDialog}
          onOpenChange={setShowBulkDeleteDialog}
          timetableIds={selectedTimetableIds}
          onSuccess={() => setSelectedRows({})}
        />

        {selectedTimetableForTemplate && (
          <SaveAsTemplateDialog
            open={showSaveTemplateDialog}
            onOpenChange={setShowSaveTemplateDialog}
            timetableId={selectedTimetableForTemplate}
            className={filteredTimetables.find(t => t._id === selectedTimetableForTemplate)?.className || ''}
            schoolId={schoolId}
            createdBy={user.userId || ''}
          />
        )}

        <CloneTimetableDialog
          open={showCloneDialog}
          onOpenChange={setShowCloneDialog}
          timetables={filteredTimetables}
          availableClasses={availableClasses}
          schoolId={schoolId}
          createdBy={user.userId || ''}
        />

        <ApplyTemplateDialog
          open={showApplyTemplateDialog}
          onOpenChange={setShowApplyTemplateDialog}
          availableClasses={availableClasses}
          schoolId={schoolId}
          createdBy={user.userId || ''}
        />
      </div>
  );
}

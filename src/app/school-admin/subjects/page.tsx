'use client';

import { JSX, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  BookOpen,
  Grid3x3,
  List,
  FileDown,
  GraduationCap,
  Award,
  Lightbulb,
  Baby,
} from 'lucide-react';
import { AddSubjectDialog } from '@/components/subjects/add-subject-dialog';
import { EditSubjectDialog } from '@/components/subjects/edit-subject-dialog';
import { ViewSubjectDialog } from '@/components/subjects/view-subject-dialog';
import { DeleteSubjectDialog } from '@/components/subjects/delete-subject-dialog';
import { BulkAddSubjectsDialog } from '@/components/subjects/bulk-add-subjects-dialog';
import { DataTable, createSortableHeader, createSelectColumn } from '@/components/ui/data-table';
import type { ColumnDef } from '@tanstack/react-table';
import { exportToCSV, exportToPDF } from '../../../lib/exports';

interface Subject {
  _id: Id<'subjects'>;
  schoolId: string;
  subjectCode: string;
  subjectName: string;
  description?: string;
  category: 'core' | 'elective' | 'extracurricular';
  department: 'creche' | 'kindergarten' | 'primary' | 'junior_high';
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export default function SubjectsPage(): React.JSX.Element {
  const { user } = useAuth();
  const [showAddDialog, setShowAddDialog] = useState<boolean>(false);
  const [showBulkAddDialog, setShowBulkAddDialog] = useState<boolean>(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [showEditDialog, setShowEditDialog] = useState<boolean>(false);
  const [showViewDialog, setShowViewDialog] = useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('table');

  // Fetch school data
  const schoolAdmin = useQuery(
    api.schoolAdmins.getByEmail,
    user?.email ? { email: user.email } : 'skip'
  );

  const school = useQuery(
    api.schools.getBySchoolId,
    schoolAdmin?.schoolId ? { schoolId: schoolAdmin.schoolId } : 'skip'
  );

  // Fetch subjects data
  const subjects = useQuery(
    api.subjects.getSubjectsBySchool,
    schoolAdmin?.schoolId ? { schoolId: schoolAdmin.schoolId } : 'skip'
  );

  const subjectStats = useQuery(
    api.subjects.getSubjectStats,
    schoolAdmin?.schoolId ? { schoolId: schoolAdmin.schoolId } : 'skip'
  );

  const updateSubjectStatus = useMutation(api.subjects.updateSubjectStatus);

  // Show loading only while data is being fetched
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If user exists but no schoolAdmin found, show error
  if (schoolAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">No school admin profile found</p>
        </div>
      </div>
    );
  }

  // If schoolAdmin exists but no school found, show error
  if (schoolAdmin && school !== undefined && !school) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">School not found</p>
        </div>
      </div>
    );
  }

  // If still loading schoolAdmin or school, show loading
  if (!schoolAdmin || !school) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Filter subjects based on status, department, and category
  const filteredSubjects = subjects?.filter(
    (subject: Subject) => {
      const statusMatch = statusFilter === 'all' || subject.status === statusFilter;
      const departmentMatch = departmentFilter === 'all' || subject.department === departmentFilter;
      const categoryMatch = categoryFilter === 'all' || subject.category === categoryFilter;
      return statusMatch && departmentMatch && categoryMatch;
    }
  ) || [];

  const getDepartmentBadge = (department: string): React.JSX.Element => {
    switch (department) {
      case 'creche':
        return <Badge className="bg-orange-500">Creche</Badge>;
      case 'kindergarten':
        return <Badge className="bg-pink-500">Kindergarten</Badge>;
      case 'primary':
        return <Badge className="bg-blue-500">Primary</Badge>;
      case 'junior_high':
        return <Badge className="bg-purple-500">Junior High</Badge>;
      default:
        return <Badge>{department}</Badge>;
    }
  };

  const getCategoryBadge = (category: string): React.JSX.Element => {
    switch (category) {
      case 'core':
        return <Badge className="bg-green-600">Core</Badge>;
      case 'elective':
        return <Badge className="bg-blue-600">Elective</Badge>;
      case 'extracurricular':
        return <Badge className="bg-purple-600">Extracurricular</Badge>;
      default:
        return <Badge>{category}</Badge>;
    }
  };

  const getStatusBadge = (status: string): React.JSX.Element => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-500">Inactive</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleStatusChange = async (subjectId: Id<'subjects'>, newStatus: 'active' | 'inactive'): Promise<void> => {
    try {
      await updateSubjectStatus({
        subjectId,
        status: newStatus,
        updatedBy: schoolAdmin._id,
      });
      toast.success(`Subject status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update subject status');
      console.error(error);
    }
  };

  // Export handlers
  const handleExportSingle = (subject: Subject, format: 'csv' | 'pdf'): void => {
    const exportData = [{
      subjectCode: subject.subjectCode,
      subjectName: subject.subjectName,
      category: subject.category,
      department: subject.department,
      description: subject.description || 'N/A',
      status: subject.status,
    }];

    if (format === 'csv') {
      exportToCSV(exportData, `subject_${subject.subjectCode}`);
      toast.success('Subject exported as CSV');
    } else {
      exportToPDF(exportData, `subject_${subject.subjectCode}`, `Subject: ${subject.subjectName}`);
      toast.success('Subject exported as PDF');
    }
  };

  const handleExportBulk = (subjectsToExport: Subject[], format: 'csv' | 'pdf'): void => {
    const exportData = subjectsToExport.map(subject => ({
      subjectCode: subject.subjectCode,
      subjectName: subject.subjectName,
      category: subject.category,
      department: subject.department,
      description: subject.description || 'N/A',
      status: subject.status,
    }));

    if (format === 'csv') {
      exportToCSV(exportData, 'subjects');
      toast.success(`${subjectsToExport.length} subjects exported as CSV`);
    } else {
      exportToPDF(exportData, 'subjects', 'Subjects Report');
      toast.success(`${subjectsToExport.length} subjects exported as PDF`);
    }
  };

  // Define columns for DataTable
  const columns: ColumnDef<Subject>[] = [
    createSelectColumn<Subject>(),
    {
      accessorKey: 'subjectCode',
      header: createSortableHeader('Subject Code'),
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue('subjectCode')}</span>
      ),
    },
    {
      accessorKey: 'subjectName',
      header: createSortableHeader('Subject Name'),
      cell: ({ row }) => (
        <span className="font-semibold">{row.getValue('subjectName')}</span>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => getCategoryBadge(row.getValue('category')),
    },
    {
      accessorKey: 'department',
      header: 'Department',
      cell: ({ row }) => getDepartmentBadge(row.getValue('department')),
    },
    {
      accessorKey: 'status',
      header: createSortableHeader('Status'),
      cell: ({ row }) => getStatusBadge(row.getValue('status')),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const subject = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedSubject(subject);
                setShowViewDialog(true);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedSubject(subject);
                    setShowEditDialog(true);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Export</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleExportSingle(subject, 'csv')}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportSingle(subject, 'pdf')}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => handleStatusChange(subject._id, 'active')}
                  disabled={subject.status === 'active'}
                >
                  Set Active
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleStatusChange(subject._id, 'inactive')}
                  disabled={subject.status === 'inactive'}
                >
                  Set Inactive
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedSubject(subject);
                    setShowDeleteDialog(true);
                  }}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Subjects Management</h1>
          <p className="text-muted-foreground">
            Manage your school&apos;s subjects and curriculum
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowBulkAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Bulk Add
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Subject
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subjectStats?.total || 0}</div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subjects</CardTitle>
            <Award className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subjectStats?.active || 0}</div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Core Subjects</CardTitle>
            <GraduationCap className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subjectStats?.core || 0}</div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Electives</CardTitle>
            <Lightbulb className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subjectStats?.elective || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Department Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Creche</CardTitle>
            <Baby className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subjectStats?.creche || 0}</div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kindergarten</CardTitle>
            <Baby className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subjectStats?.kindergarten || 0}</div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Primary</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subjectStats?.primary || 0}</div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Junior High</CardTitle>
            <GraduationCap className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subjectStats?.juniorHigh || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Subjects Table/Card View */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>All Subjects</CardTitle>
                <CardDescription>
                  View and manage all subjects
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                >
                  <List className="h-4 w-4 mr-2" />
                  Table
                </Button>
                <Button
                  variant={viewMode === 'card' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('card')}
                >
                  <Grid3x3 className="h-4 w-4 mr-2" />
                  Card
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!subjects || subjects.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No subjects found</h3>
              <p className="text-muted-foreground">
                Get started by adding your first subject
              </p>
              <Button onClick={() => setShowAddDialog(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Add Subject
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Filters Row */}
              <div className="flex flex-wrap gap-2">
                <div className="flex-1 min-w-[160px]">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Filter by Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex-1 min-w-[160px]">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Filter by Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="core">Core</SelectItem>
                      <SelectItem value="elective">Elective</SelectItem>
                      <SelectItem value="extracurricular">Extracurricular</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex-1 min-w-[160px]">
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Filter by Department" />
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

              {viewMode === 'table' ? (
                <DataTable
                  columns={columns}
                  data={filteredSubjects}
                  searchKey="subjectName"
                  searchPlaceholder="Search by subject name..."
                  exportFormats={['csv', 'pdf']}
                  onExport={(rows, format) => handleExportBulk(rows, format as "csv" | "pdf")}
                />
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredSubjects.map((subject) => (
                    <Card key={subject._id} className="transition-all duration-200 hover:shadow-lg cursor-pointer">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-lg">{subject.subjectName}</CardTitle>
                            <p className="text-sm text-muted-foreground">{subject.subjectCode}</p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setSelectedSubject(subject); setShowViewDialog(true); }}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setSelectedSubject(subject); setShowEditDialog(true); }}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setSelectedSubject(subject); setShowDeleteDialog(true); }} className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Category:</span>
                          {getCategoryBadge(subject.category)}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Department:</span>
                          {getDepartmentBadge(subject.department)}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Status:</span>
                          {getStatusBadge(subject.status)}
                        </div>
                        {subject.description && (
                          <div className="pt-2">
                            <p className="text-sm text-muted-foreground line-clamp-2">{subject.description}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddSubjectDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        schoolId={schoolAdmin.schoolId}
        createdBy={schoolAdmin._id}
      />

      <BulkAddSubjectsDialog
        open={showBulkAddDialog}
        onOpenChange={setShowBulkAddDialog}
        schoolId={schoolAdmin.schoolId}
        createdBy={schoolAdmin._id}
      />

      {selectedSubject && (
        <>
          <EditSubjectDialog
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            subjectData={selectedSubject}
            updatedBy={schoolAdmin._id}
          />

          <ViewSubjectDialog
            open={showViewDialog}
            onOpenChange={setShowViewDialog}
            subjectData={selectedSubject}
          />

          <DeleteSubjectDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            subjectData={selectedSubject}
            deletedBy={schoolAdmin._id}
            onDeleted={() => setSelectedSubject(null)}
          />
        </>
      )}
    </div>
  );
}

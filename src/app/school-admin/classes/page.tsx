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
  School,
  Users,
  Grid3x3,
  List,
  FileDown,
  BookOpen,
  GraduationCap,
  Baby,
} from 'lucide-react';
import { AddClassDialog } from '@/components/classes/add-class-dialog';
import { EditClassDialog } from '@/components/classes/edit-class-dialog';
import { ViewClassDialog } from '@/components/classes/view-class-dialog';
import { DeleteClassDialog } from '@/components/classes/delete-class-dialog';
import { BulkAddClassesDialog } from '@/components/classes/bulk-add-classes-dialog';
import { DataTable, createSortableHeader, createSelectColumn } from '@/components/ui/data-table';
import type { ColumnDef } from '@tanstack/react-table';
import { exportToCSV, exportToPDF } from '../../../lib/exports';

interface Class {
  _id: Id<'classes'>;
  schoolId: string;
  classCode: string;
  className: string;
  grade: string;
  section?: string;
  department: 'creche' | 'kindergarten' | 'primary' | 'junior_high';
  classTeacherId?: string;
  capacity?: number;
  currentStudentCount: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export default function ClassesPage(): React.JSX.Element {
  const { user } = useAuth();
  const [showAddDialog, setShowAddDialog] = useState<boolean>(false);
  const [showBulkAddDialog, setShowBulkAddDialog] = useState<boolean>(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [showEditDialog, setShowEditDialog] = useState<boolean>(false);
  const [showViewDialog, setShowViewDialog] = useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
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

  // Fetch classes data
  const classes = useQuery(
    api.classes.getClassesBySchool,
    schoolAdmin?.schoolId ? { schoolId: schoolAdmin.schoolId } : 'skip'
  );

  const classStats = useQuery(
    api.classes.getClassStats,
    schoolAdmin?.schoolId ? { schoolId: schoolAdmin.schoolId } : 'skip'
  );

  const updateClassStatus = useMutation(api.classes.updateClassStatus);

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

  // Filter classes based on status and department
  const filteredClasses = classes?.filter(
    (classData: Class) => {
      const statusMatch = statusFilter === 'all' || classData.status === statusFilter;
      const departmentMatch = departmentFilter === 'all' || classData.department === departmentFilter;
      return statusMatch && departmentMatch;
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

  const handleStatusChange = async (classId: Id<'classes'>, newStatus: 'active' | 'inactive'): Promise<void> => {
    try {
      await updateClassStatus({
        classId,
        status: newStatus,
        updatedBy: schoolAdmin._id,
      });
      toast.success(`Class status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update class status');
      console.error(error);
    }
  };

  // Export handlers
  const handleExportSingle = (classData: Class, format: 'csv' | 'pdf'): void => {
    const exportData = [{
      classCode: classData.classCode,
      className: classData.className,
      grade: classData.grade,
      section: classData.section || 'N/A',
      department: classData.department,
      capacity: classData.capacity || 0,
      currentStudents: classData.currentStudentCount,
      status: classData.status,
    }];

    if (format === 'csv') {
      exportToCSV(exportData, `class_${classData.classCode}`);
      toast.success('Class exported as CSV');
    } else {
      exportToPDF(exportData, `class_${classData.classCode}`, `Class: ${classData.className}`);
      toast.success('Class exported as PDF');
    }
  };

  const handleExportBulk = (classesToExport: Class[], format: 'csv' | 'pdf'): void => {
    const exportData = classesToExport.map(classData => ({
      classCode: classData.classCode,
      className: classData.className,
      grade: classData.grade,
      section: classData.section || 'N/A',
      department: classData.department,
      capacity: classData.capacity || 0,
      currentStudents: classData.currentStudentCount,
      status: classData.status,
    }));

    if (format === 'csv') {
      exportToCSV(exportData, 'classes');
      toast.success(`${classesToExport.length} classes exported as CSV`);
    } else {
      exportToPDF(exportData, 'classes', 'Classes Report');
      toast.success(`${classesToExport.length} classes exported as PDF`);
    }
  };

  // Define columns for DataTable
  const columns: ColumnDef<Class>[] = [
    createSelectColumn<Class>(),
    {
      accessorKey: 'classCode',
      header: createSortableHeader('Class Code'),
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue('classCode')}</span>
      ),
    },
    {
      accessorKey: 'className',
      header: createSortableHeader('Class Name'),
      cell: ({ row }) => (
        <span className="font-semibold">{row.getValue('className')}</span>
      ),
    },
    {
      accessorKey: 'grade',
      header: createSortableHeader('Grade'),
    },
    {
      accessorKey: 'section',
      header: 'Section',
      cell: ({ row }) => row.getValue('section') || 'N/A',
    },
    {
      accessorKey: 'department',
      header: 'Department',
      cell: ({ row }) => getDepartmentBadge(row.getValue('department')),
    },
    {
      accessorKey: 'currentStudentCount',
      header: createSortableHeader('Students'),
      cell: ({ row }) => {
        const count = row.getValue('currentStudentCount') as number;
        const capacity = row.original.capacity;
        return (
          <span className={capacity && count > capacity ? 'text-red-500 font-semibold' : ''}>
            {count}{capacity ? ` / ${capacity}` : ''}
          </span>
        );
      },
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
        const classData = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedClass(classData);
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
                    setSelectedClass(classData);
                    setShowEditDialog(true);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Export</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleExportSingle(classData, 'csv')}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportSingle(classData, 'pdf')}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => handleStatusChange(classData._id, 'active')}
                  disabled={classData.status === 'active'}
                >
                  Set Active
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleStatusChange(classData._id, 'inactive')}
                  disabled={classData.status === 'inactive'}
                >
                  Set Inactive
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedClass(classData);
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
          <h1 className="text-3xl font-bold">Classes Management</h1>
          <p className="text-muted-foreground">
            Manage your school&apos;s classes and grades
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowBulkAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Bulk Add
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Class
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classStats?.total || 0}</div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classStats?.active || 0}</div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classStats?.totalStudents || 0}</div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
            <GraduationCap className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classStats?.totalCapacity || 0}</div>
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
            <div className="text-2xl font-bold">{classStats?.creche || 0}</div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kindergarten</CardTitle>
            <Baby className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classStats?.kindergarten || 0}</div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Primary</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classStats?.primary || 0}</div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Junior High</CardTitle>
            <GraduationCap className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classStats?.juniorHigh || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Classes Table/Card View */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>All Classes</CardTitle>
                <CardDescription>
                  View and manage all classes
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
          {!classes || classes.length === 0 ? (
            <div className="text-center py-12">
              <School className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No classes found</h3>
              <p className="text-muted-foreground">
                Get started by adding your first class
              </p>
              <Button onClick={() => setShowAddDialog(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Add Class
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Filters Row */}
              <div className="flex flex-wrap gap-2">
                <div className="flex-1 min-w-[180px]">
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
                
                <div className="flex-1 min-w-[180px]">
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
                  data={filteredClasses}
                  searchKey="className"
                  searchPlaceholder="Search by class name..."
                  exportFormats={['csv', 'pdf']}
                  onExport={(rows, format) => handleExportBulk(rows, format as "csv" | "pdf")}
                />
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredClasses.map((classData) => (
                    <Card key={classData._id} className="transition-all duration-200 hover:shadow-lg cursor-pointer">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-lg">{classData.className}</CardTitle>
                            <p className="text-sm text-muted-foreground">{classData.classCode}</p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setSelectedClass(classData); setShowViewDialog(true); }}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setSelectedClass(classData); setShowEditDialog(true); }}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setSelectedClass(classData); setShowDeleteDialog(true); }} className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Department:</span>
                          {getDepartmentBadge(classData.department)}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Grade:</span>
                          <span className="font-medium">{classData.grade}{classData.section ? ` - ${classData.section}` : ''}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Students:</span>
                          <span className={classData.capacity && classData.currentStudentCount > classData.capacity ? 'text-red-500 font-semibold' : 'font-medium'}>
                            {classData.currentStudentCount}{classData.capacity ? ` / ${classData.capacity}` : ''}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Status:</span>
                          {getStatusBadge(classData.status)}
                        </div>
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
      <AddClassDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        schoolId={schoolAdmin.schoolId}
        createdBy={schoolAdmin._id}
      />

      <BulkAddClassesDialog
        open={showBulkAddDialog}
        onOpenChange={setShowBulkAddDialog}
        schoolId={schoolAdmin.schoolId}
        createdBy={schoolAdmin._id}
      />

      {selectedClass && (
        <>
          <EditClassDialog
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            classData={selectedClass}
            updatedBy={schoolAdmin._id}
          />

          <ViewClassDialog
            open={showViewDialog}
            onOpenChange={setShowViewDialog}
            classData={selectedClass}
          />

          <DeleteClassDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            classData={selectedClass}
            deletedBy={schoolAdmin._id}
            onDeleted={() => setSelectedClass(null)}
          />
        </>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
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
  UserCheck,
  UserX,
  Edit,
  Trash2,
  Users,
  UserPlus,
  Clock,
  FileDown,
  Eye,
  User,
} from 'lucide-react';
import type { Teacher } from '@/types';
import { AddTeacherDialog } from '@/components/teachers/add-teacher-dialog';
import { EditTeacherDialog } from '@/components/teachers/edit-teacher-dialog';
import { ViewTeacherDialog } from '@/components/teachers/view-teacher-dialog';
import { DeleteTeacherDialog } from '@/components/teachers/delete-teacher-dialog';
import { BulkAddTeachersDialog } from '@/components/teachers/bulk-add-teachers-dialog';
import { DataTable, createSortableHeader, createSelectColumn } from '../../../components/ui/data-table';
import type { ColumnDef } from '@tanstack/react-table';
import { exportToCSV, exportToPDF } from '../../../lib/exports';
import Image from 'next/image';

export default function TeachersPage(): React.JSX.Element {
  const { user } = useAuth();
  const [showAddDialog, setShowAddDialog] = useState<boolean>(false);
    const [showBulkAddTeachersDialog, setShowBulkAddTeachersDialog] = useState<boolean>(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [showEditDialog, setShowEditDialog] = useState<boolean>(false);
  const [showViewDialog, setShowViewDialog] = useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [employmentFilter, setEmploymentFilter] = useState<string>('all');

  // Fetch school data
  const schoolAdmin = useQuery(
    api.schoolAdmins.getByEmail,
    user?.email ? { email: user.email } : 'skip'
  );

  const school = useQuery(
    api.schools.getBySchoolId,
    schoolAdmin?.schoolId ? { schoolId: schoolAdmin.schoolId } : 'skip'
  );

  // Fetch teachers data
  const teachers = useQuery(
    api.teachers.getTeachersBySchool,
    schoolAdmin?.schoolId ? { schoolId: schoolAdmin.schoolId } : 'skip'
  );

  const teacherStats = useQuery(
    api.teachers.getTeacherStats,
    schoolAdmin?.schoolId ? { schoolId: schoolAdmin.schoolId } : 'skip'
  );

  const updateTeacherStatus = useMutation(api.teachers.updateTeacherStatus);

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

  // Filter teachers based on status and employment type
  const filteredTeachers = teachers?.filter(
    (teacher: Teacher) => {
      const statusMatch = statusFilter === 'all' || teacher.status === statusFilter;
      const employmentMatch = employmentFilter === 'all' || teacher.employmentType === employmentFilter;
      return statusMatch && employmentMatch;
    }
  ) || [];

  const handleStatusChange = async (teacherId: Id<'teachers'>, newStatus: 'active' | 'on_leave' | 'inactive'): Promise<void> => {
    try {
      await updateTeacherStatus({
        teacherId,
        status: newStatus,
        updatedBy: schoolAdmin._id,
      });
      toast.success(`Teacher status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update teacher status');
      console.error(error);
    }
  };

  const getStatusBadge = (status: string): React.JSX.Element => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'on_leave':
        return <Badge className="bg-yellow-500">On Leave</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-500">Inactive</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getEmploymentTypeBadge = (type: string): React.JSX.Element => {
    switch (type) {
      case 'full_time':
        return <Badge variant="outline">Full Time</Badge>;
      case 'part_time':
        return <Badge variant="outline">Part Time</Badge>;
      case 'contract':
        return <Badge variant="outline">Contract</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  // Export handlers
  const handleExportSingle = (teacher: Teacher, format: 'csv' | 'pdf'): void => {
    const exportData = [{
      teacherId: teacher.teacherId,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      email: teacher.email,
      phone: teacher.phone,
      employmentType: teacher.employmentType,
      status: teacher.status,
      subjects: teacher.subjects.join(', '),
      qualifications: teacher.qualifications.join(', '),
      dateOfBirth: teacher.dateOfBirth,
      address: teacher.address,
      emergencyContact: teacher.emergencyContact,
      emergencyPhone: teacher.emergencyContact,
    }];

    if (format === 'csv') {
      exportToCSV(exportData, `teacher_${teacher.teacherId}`);
      toast.success('Teacher exported as CSV');
    } else {
      exportToPDF(exportData, `teacher_${teacher.teacherId}`, `Teacher: ${teacher.firstName} ${teacher.lastName}`);
      toast.success('Teacher exported as PDF');
    }
  };

  const handleExportBulk = (teachersToExport: Teacher[], format: 'csv' | 'pdf'): void => {
    const exportData = teachersToExport.map(teacher => ({
      teacherId: teacher.teacherId,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      email: teacher.email,
      phone: teacher.phone,
      employmentType: teacher.employmentType,
      status: teacher.status,
      subjects: teacher.subjects.join(', '),
      qualifications: teacher.qualifications.join(', '),
      dateOfBirth: teacher.dateOfBirth,
      address: teacher.address,
      emergencyContact: teacher.emergencyContact,
      emergencyPhone: teacher.emergencyContact,
    }));

    if (format === 'csv') {
      exportToCSV(exportData, 'teachers');
      toast.success(`${teachersToExport.length} teachers exported as CSV`);
    } else {
      exportToPDF(exportData, 'teachers', 'Teachers Report');
      toast.success(`${teachersToExport.length} teachers exported as PDF`);
    }
  };

  // Define columns for DataTable
  const columns: ColumnDef<Teacher>[] = [
    createSelectColumn<Teacher>(),
    {
      accessorKey: 'photoUrl',
      header: 'Photo',
      cell: ({ row }) => {
        const photoUrl = row.original.photoUrl;
        return (
          <div className="flex items-center justify-center">
            {photoUrl ? (
              <Image
                src={photoUrl}
                alt={`${row.original.firstName} ${row.original.lastName}`}
                width={100}
                height={100}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="h-5 w-5 text-gray-500" />
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'teacherId',
      header: createSortableHeader('Teacher ID'),
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue('teacherId')}</span>
      ),
    },
    {
      accessorKey: 'firstName',
      header: createSortableHeader('First Name'),
    },
    {
      accessorKey: 'lastName',
      header: createSortableHeader('Last Name'),
    },
    {
      accessorKey: 'email',
      header: createSortableHeader('Email'),
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
    },
    {
      accessorKey: 'employmentType',
      header: 'Employment Type',
      cell: ({ row }) => getEmploymentTypeBadge(row.getValue('employmentType')),
    },
    {
      accessorKey: 'subjects',
      header: 'Subjects',
      cell: ({ row }) => {
        const subjects = row.getValue('subjects') as string[];
        return (
          <div className="flex flex-wrap gap-1">
            {subjects.slice(0, 2).map((subject: string, index: number) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {subject}
              </Badge>
            ))}
            {subjects.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{subjects.length - 2}
              </Badge>
            )}
          </div>
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
        const teacher = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedTeacher(teacher);
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
                    setSelectedTeacher(teacher);
                    setShowEditDialog(true);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Export</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleExportSingle(teacher, 'csv')}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportSingle(teacher, 'pdf')}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => handleStatusChange(teacher._id as Id<'teachers'>, 'active')}
                  disabled={teacher.status === 'active'}
                >
                  <UserCheck className="mr-2 h-4 w-4 text-green-500" />
                  Set Active
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleStatusChange(teacher._id as Id<'teachers'>, 'on_leave')}
                  disabled={teacher.status === 'on_leave'}
                >
                  <Clock className="mr-2 h-4 w-4 text-yellow-500" />
                  Set On Leave
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleStatusChange(teacher._id as Id<'teachers'>, 'inactive')}
                  disabled={teacher.status === 'inactive'}
                >
                  <UserX className="mr-2 h-4 w-4 text-gray-500" />
                  Set Inactive
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedTeacher(teacher);
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
          <h1 className="text-3xl font-bold">Teachers Management</h1>
          <p className="text-muted-foreground">
            Manage your school&apos;s teaching staff
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowBulkAddTeachersDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Bulk Add
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Teacher
        </Button>
        </div>
      </div>

      {/* Statistics Cards with Hover Effects */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teacherStats?.total || 0}</div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teacherStats?.active || 0}</div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Leave</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teacherStats?.onLeave || 0}</div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <UserX className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teacherStats?.inactive || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Employment Type Stats with Hover Effects */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Full Time</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teacherStats?.fullTime || 0}</div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Part Time</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teacherStats?.partTime || 0}</div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contract</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teacherStats?.contract || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Teachers Table with Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>All Teachers</CardTitle>
                <CardDescription>
                  View and manage all teaching staff
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!teachers || teachers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No teachers found</h3>
              <p className="text-muted-foreground">
                Get started by adding your first teacher
              </p>
              <Button onClick={() => setShowAddDialog(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Add Teacher
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Filters Row */}
              <div className="flex flex-wrap gap-2">
                <div className="flex-1 min-w-45">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Filter by Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on_leave">On Leave</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex-1 min-w-45">
                  <Select value={employmentFilter} onValueChange={setEmploymentFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Filter by Employment Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="full_time">Full Time</SelectItem>
                      <SelectItem value="part_time">Part Time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DataTable
                columns={columns}
                data={filteredTeachers}
                searchKey="firstName"
                searchPlaceholder="Search by first name..."
                exportFormats={['csv', 'pdf']}
                onExport={(rows, format) => handleExportBulk(rows, format as 'csv' | 'pdf')}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddTeacherDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        schoolId={schoolAdmin.schoolId}
        createdBy={schoolAdmin._id}
      />
      <BulkAddTeachersDialog
      open={showBulkAddTeachersDialog}
      onOpenChange={setShowBulkAddTeachersDialog}
      schoolId = {schoolAdmin.schoolId}
      createdBy={schoolAdmin._id}
      />

      {selectedTeacher && (
        <>
          <EditTeacherDialog
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            teacher={selectedTeacher}
            updatedBy={schoolAdmin._id}
          />

          <ViewTeacherDialog
            open={showViewDialog}
            onOpenChange={setShowViewDialog}
            teacher={selectedTeacher}
          />

          <DeleteTeacherDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            teacher={selectedTeacher}
            deletedBy={schoolAdmin._id}
            onDeleted={() => setSelectedTeacher(null)}
          />
        </>
      )}
    </div>
  );
}

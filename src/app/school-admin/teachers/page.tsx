'use client';

import { JSX, useEffect, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  MoreVertical,
  UserCheck,
  UserX,
  Edit,
  Trash2,
  Users,
  UserPlus,
  Clock,
} from 'lucide-react';
import type { Teacher, TeacherStats } from '@/types';
import { AddTeacherDialog } from '@/components/teachers/add-teacher-dialog';
import { EditTeacherDialog } from '@/components/teachers/edit-teacher-dialog';
import { ViewTeacherDialog } from '@/components/teachers/view-teacher-dialog';
import { DeleteTeacherDialog } from '@/components/teachers/delete-teacher-dialog';

export default function TeachersPage(): JSX.Element {
  const { user } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showAddDialog, setShowAddDialog] = useState<boolean>(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [showEditDialog, setShowEditDialog] = useState<boolean>(false);
  const [showViewDialog, setShowViewDialog] = useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);

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

  // Filter teachers based on search term
  const filteredTeachers = teachers?.filter(
    (teacher: Teacher) =>
      teacher.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.teacherId.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const getStatusBadge = (status: string): JSX.Element => {
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

  const getEmploymentTypeBadge = (type: string): JSX.Element => {
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
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Teacher
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teacherStats?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teacherStats?.active || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Leave</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teacherStats?.onLeave || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <UserX className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teacherStats?.inactive || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Employment Type Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Full Time</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teacherStats?.fullTime || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Part Time</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teacherStats?.partTime || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contract</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teacherStats?.contract || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Teachers Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>All Teachers</CardTitle>
              <CardDescription>
                View and manage all teaching staff
              </CardDescription>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search teachers..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
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
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Teacher ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Employment Type</TableHead>
                    <TableHead>Subjects</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeachers?.map((teacher: Teacher) => (
                    <TableRow key={teacher._id}>
                      <TableCell className="font-medium">
                        {teacher.teacherId}
                      </TableCell>
                      <TableCell>
                        {teacher.firstName} {teacher.lastName}
                      </TableCell>
                      <TableCell>{teacher.email}</TableCell>
                      <TableCell>{teacher.phone}</TableCell>
                      <TableCell>
                        {getEmploymentTypeBadge(teacher.employmentType)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {teacher.subjects.slice(0, 2).map((subject: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {subject}
                            </Badge>
                          ))}
                          {teacher.subjects.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{teacher.subjects.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(teacher.status)}</TableCell>
                      <TableCell className="text-right">
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
                                setShowViewDialog(true);
                              }}
                            >
                              View Details
                            </DropdownMenuItem>
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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

'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
import { useAuth } from '@/hooks/useAuth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Award, Users, Eye, FileDown } from 'lucide-react';
import { ViewStudentDialog } from '@/components/students/view-student-dialog';
import { PhotoCell } from '@/components/students/photo-cell';
import {
  DataTable,
  createSortableHeader,
} from '@/components/ui/data-table';
import type { ColumnDef } from '@tanstack/react-table';
import { exportToCSV, exportToPDF } from '@/lib/exports';
import { toast } from 'sonner';

interface AlumniStudent {
  _id: string;
  createdAt: string;
  updatedAt: string;
  studentId: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  className: string;
  departmentId: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  photoStorageId?: string;
  status: 'graduated';
}

export default function AlumniPage(): React.JSX.Element {
  const { user } = useAuth();
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<Id<'students'> | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');

  const schoolAdmin = useQuery(
    api.schoolAdmins.getById,
    user?.userId ? { id: user.userId as Id<'schoolAdmins'> } : 'skip'
  );

  const alumni = useQuery(
    api.students.getGraduatesBySchool,
    schoolAdmin?.schoolId ? { schoolId: schoolAdmin.schoolId } : 'skip'
  ) as AlumniStudent[] | undefined;

  const departments = useQuery(
    api.departments.getDepartmentsBySchool,
    schoolAdmin?.schoolId ? { schoolId: schoolAdmin.schoolId } : 'skip'
  );

  const selectedStudentFull = useQuery(
    api.students.getStudentById,
    selectedStudentId ? { studentId: selectedStudentId } : 'skip'
  );

  const uniqueClasses = useMemo(() => {
    if (!alumni) return [];
    const names = alumni.map((s) => s.className);
    return Array.from(new Set(names)).sort();
  }, [alumni]);

  const filteredAlumni = useMemo(
    () =>
      alumni?.filter((student) => {
        const deptMatch = departmentFilter === 'all' || student.departmentId === departmentFilter;
        const classMatch = classFilter === 'all' || student.className?.trim() === classFilter?.trim();
        return deptMatch && classMatch;
      }) ?? [],
    [alumni, departmentFilter, classFilter]
  );

  const getDepartmentBadge = useCallback(
    (departmentId: string) => {
      const dept = departments?.find((d) => d._id === departmentId);
      return <Badge variant="outline">{dept?.name ?? departmentId}</Badge>;
    },
    [departments]
  );

  const handleExportBulk = useCallback(
    (rows: AlumniStudent[], format: 'csv' | 'pdf') => {
      const exportData = rows.map((student) => ({
        studentId: student.studentId,
        admissionNumber: student.admissionNumber,
        firstName: student.firstName,
        lastName: student.lastName,
        middleName: student.middleName ?? '',
        className: student.className,
        department: departments?.find((d) => d._id === student.departmentId)?.name ?? student.departmentId,
        parentName: student.parentName,
        parentEmail: student.parentEmail,
        parentPhone: student.parentPhone,
      }));

      if (format === 'csv') {
        exportToCSV(exportData, 'alumni');
        toast.success(`${rows.length} alumni exported as CSV`);
      } else {
        exportToPDF(exportData, 'alumni', 'Alumni / Graduates');
        toast.success(`${rows.length} alumni exported as PDF`);
      }
    },
    [departments]
  );

  const columns: ColumnDef<AlumniStudent>[] = useMemo(
    () => [
      {
        accessorKey: 'photoStorageId',
        header: 'Photo',
        cell: ({ row }) => (
          <PhotoCell
            photoStorageId={row.original.photoStorageId as Id<'_storage'> | undefined}
            firstName={row.original.firstName}
            lastName={row.original.lastName}
          />
        ),
      },
      {
        accessorKey: 'studentId',
        header: createSortableHeader('Student ID'),
        cell: ({ row }) => (
          <span className="font-medium">{row.getValue('studentId')}</span>
        ),
      },
      {
        accessorKey: 'admissionNumber',
        header: createSortableHeader('Admission No.'),
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
        accessorKey: 'className',
        header: createSortableHeader('Last Class'),
      },
      {
        accessorKey: 'departmentId',
        header: 'Department',
        cell: ({ row }) => getDepartmentBadge(row.getValue('departmentId')),
      },
      {
        accessorKey: 'parentName',
        header: 'Parent / Guardian',
        cell: ({ row }) => (
          <div className="text-sm">
            <div>{row.getValue('parentName')}</div>
            <div className="text-muted-foreground">{row.original.parentPhone}</div>
          </div>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedStudentId(row.original._id as Id<'students'>);
              setViewDialogOpen(true);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    [getDepartmentBadge]
  );

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (schoolAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">No school admin profile found</p>
      </div>
    );
  }

  if (!schoolAdmin?.schoolId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">No school found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Award className="h-8 w-8" />
          Alumni
        </h1>
        <p className="text-muted-foreground">
          Graduated students (e.g. after Basic 9). View and export alumni records.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Alumni</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{alumni?.length ?? 0}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Students marked as graduated
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle>Graduates</CardTitle>
              <CardDescription>
                Filter and export alumni. To mark students as graduated, use Students → Change status → Set Graduated.
              </CardDescription>
            </div>
            {filteredAlumni.length > 0 && (
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportBulk(filteredAlumni, 'csv')}
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  Export all (CSV)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportBulk(filteredAlumni, 'pdf')}
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  Export all (PDF)
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!alumni || alumni.length === 0 ? (
            <div className="text-center py-12">
              <Award className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No alumni yet</h3>
              <p className="text-muted-foreground">
                Graduated students will appear here. Mark Basic 9 leavers as &quot;Graduated&quot; on the Students page.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="h-9 w-[180px]">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments?.map((dept) => (
                      <SelectItem key={dept._id} value={dept._id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger className="h-9 w-[180px]">
                    <SelectValue placeholder="Last Class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {uniqueClasses.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <DataTable
                storageKey="alumni"
                columns={columns}
                data={filteredAlumni}
                searchKey="firstName"
                searchPlaceholder="Search by name or class..."
                additionalSearchKeys={['lastName', 'className', 'studentId']}
                exportFormats={['csv', 'pdf']}
                initialPageSize={25}
                onExport={(rows, format) =>
                  handleExportBulk(rows, format as 'csv' | 'pdf')
                }
              />
            </div>
          )}
        </CardContent>
      </Card>

      {selectedStudentFull && (
        <ViewStudentDialog
          student={{
            ...selectedStudentFull,
            _id: selectedStudentFull._id,
            createdAt: selectedStudentFull.createdAt ?? '',
            updatedAt: selectedStudentFull.updatedAt ?? '',
          }}
          open={viewDialogOpen}
          onOpenChange={(open) => {
            setViewDialogOpen(open);
            if (!open) setSelectedStudentId(null);
          }}
        />
      )}
    </div>
  );
}

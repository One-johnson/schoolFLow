'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { Plus, MoreVertical, Edit, Trash2, Layers } from 'lucide-react';
import { AddDepartmentDialog } from '@/components/departments/add-department-dialog';
import { EditDepartmentDialog } from '@/components/departments/edit-department-dialog';
import { DeleteDepartmentDialog } from '@/components/departments/delete-department-dialog';

interface Department {
  _id: Id<'departments'>;
  schoolId: string;
  name: string;
  code: string;
  sortOrder?: number;
}

export default function DepartmentsPage(): React.JSX.Element {
  const { user } = useAuth();
  const [showAddDialog, setShowAddDialog] = useState<boolean>(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [showEditDialog, setShowEditDialog] = useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);

  const schoolAdmin = useQuery(
    api.schoolAdmins.getById,
    user?.userId ? { id: user.userId as import('@/../convex/_generated/dataModel').Id<'schoolAdmins'> } : 'skip'
  );

  const departments = useQuery(
    api.departments.getDepartmentsBySchool,
    schoolAdmin?.schoolId ? { schoolId: schoolAdmin.schoolId } : 'skip'
  );

  const seedDefaultDepartments = useMutation(api.departments.seedDefaultDepartments);

  // Seed default departments when school has none
  useEffect(() => {
    if (schoolAdmin?.schoolId && schoolAdmin._id && departments && departments.length === 0) {
      seedDefaultDepartments({
        schoolId: schoolAdmin.schoolId,
        createdBy: schoolAdmin._id,
      }).catch(() => {
        // Ignore - may already have been seeded
      });
    }
  }, [schoolAdmin?.schoolId, schoolAdmin?._id, departments?.length, seedDefaultDepartments]);

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

  const schoolId = schoolAdmin?.schoolId ?? '';
  const createdBy = schoolAdmin?._id ?? undefined;

  if (!schoolId || !createdBy) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">No school or school admin profile found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
        <p className="text-muted-foreground">
          Manage your school&apos;s departments. Departments are used for classes, students, and subjects.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Departments</CardTitle>
            <CardDescription>
              Add and manage departments for your school
            </CardDescription>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Department
          </Button>
        </CardHeader>
        <CardContent>
          {!departments || departments.length === 0 ? (
            <div className="text-center py-12 border rounded-lg border-dashed">
              <Layers className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No departments yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Default departments (Creche, Kindergarten, Primary, Junior High) are being created...
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                If this message persists, click Add Department to create your first department.
              </p>
              <Button className="mt-4" onClick={() => setShowAddDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Department
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {departments.map((dept) => (
                <div
                  key={dept._id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{dept.name}</p>
                    <p className="text-sm text-muted-foreground">Code: {dept.code}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedDepartment(dept);
                          setShowEditDialog(true);
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedDepartment(dept);
                          setShowDeleteDialog(true);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddDepartmentDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        schoolId={schoolId as Id<'schools'>}
        createdBy={createdBy as Id<'schoolAdmins'>}
      />
      <EditDepartmentDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        department={selectedDepartment}
        updatedBy={createdBy as Id<'schoolAdmins'>}
      />
      <DeleteDepartmentDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        department={selectedDepartment}
      />
    </div>
  );
}

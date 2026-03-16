'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
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
import { Plus, MoreVertical, Edit, Trash2, Home } from 'lucide-react';
import { AddHouseDialog } from '@/components/houses/add-house-dialog';
import { EditHouseDialog } from '@/components/houses/edit-house-dialog';
import { DeleteHouseDialog } from '@/components/houses/delete-house-dialog';

interface House {
  _id: Id<'houses'>;
  schoolId: string;
  name: string;
  code: string;
  color?: string;
  sortOrder?: number;
}

export default function HousesPage(): React.JSX.Element {
  const { user } = useAuth();
  const [showAddDialog, setShowAddDialog] = useState<boolean>(false);
  const [selectedHouse, setSelectedHouse] = useState<House | null>(null);
  const [showEditDialog, setShowEditDialog] = useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);

  const schoolAdmin = useQuery(
    api.schoolAdmins.getById,
    user?.userId ? { id: user.userId as Id<'schoolAdmins'> } : 'skip'
  );

  const houses = useQuery(
    api.houses.getHousesBySchool,
    schoolAdmin?.schoolId ? { schoolId: schoolAdmin.schoolId } : 'skip'
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
        <h1 className="text-3xl font-bold tracking-tight">Houses</h1>
        <p className="text-muted-foreground">
          Manage houses for your school. Students and teachers can be assigned to a house (e.g., for competitions or pastoral groups).
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Houses</CardTitle>
            <CardDescription>
              Add and manage houses. Assign students and teachers when adding or editing them.
            </CardDescription>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add House
          </Button>
        </CardHeader>
        <CardContent>
          {!houses || houses.length === 0 ? (
            <div className="text-center py-12 border rounded-lg border-dashed">
              <Home className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No houses yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Create houses to assign students and teachers (e.g., Jubilee, Ambassadors).
              </p>
              <Button className="mt-4" onClick={() => setShowAddDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add House
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {houses.map((house) => (
                <div
                  key={house._id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    {house.color && (
                      <span
                        className="h-6 w-6 shrink-0 rounded-full border border-border"
                        style={{ backgroundColor: house.color }}
                        aria-hidden
                      />
                    )}
                    <div>
                      <p className="font-medium">{house.name}</p>
                      <p className="text-sm text-muted-foreground">Code: {house.code}</p>
                    </div>
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
                          setSelectedHouse(house);
                          setShowEditDialog(true);
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedHouse(house);
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

      <AddHouseDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        schoolId={schoolId}
        createdBy={createdBy}
      />
      <EditHouseDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        house={selectedHouse}
        updatedBy={createdBy}
      />
      <DeleteHouseDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        house={selectedHouse}
        deletedBy={createdBy}
      />
    </div>
  );
}

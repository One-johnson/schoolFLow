"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, MoreHorizontal, Trash2, Pencil } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDatabase } from "@/hooks/use-database";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";


type Teacher = {
  id: string;
  name: string;
  department: string;
  email: string;
  status: "Active" | "On Leave" | "Retired";
};

// Function to generate a teacher ID
const generateTeacherId = (department: string): string => {
    const year = new Date().getFullYear().toString().slice(-2);
    const classType = 'T'; // for Teacher
    const deptChar = department.length > 0 ? department.charAt(0).toUpperCase() : 'X';
    const randomPart = Math.random().toString().slice(2, 8);
    return `${year}${classType}${deptChar}${randomPart}`;
};

export default function TeachersPage() {
  const { data: teachers, addDataWithId: addTeacher, deleteData: deleteTeacher } = useDatabase<Teacher>('teachers');
  const { addData: addNotification } = useDatabase('notifications');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTeacherName, setNewTeacherName] = useState("");
  const [newTeacherDept, setNewTeacherDept] = useState("");
  const [newTeacherEmail, setNewTeacherEmail] = useState("");
  const { toast } = useToast();

  const handleAddTeacher = async () => {
    if (!newTeacherName.trim() || !newTeacherDept.trim() || !newTeacherEmail.trim()) {
      toast({ title: "Error", description: "All fields are required.", variant: "destructive" });
      return;
    }
    try {
       const teacherId = generateTeacherId(newTeacherDept);
      await addTeacher(teacherId, {
        name: newTeacherName,
        department: newTeacherDept,
        email: newTeacherEmail,
        status: 'Active',
      });
      await addNotification({
        type: 'teacher_added',
        message: `New teacher "${newTeacherName}" was added.`,
        read: false,
      });
      toast({ title: "Success", description: "Teacher added." });
      setNewTeacherName("");
      setNewTeacherDept("");
      setNewTeacherEmail("");
      setIsDialogOpen(false);
    } catch (error) {
      toast({ title: "Error", description: "Failed to add teacher.", variant: "destructive" });
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    try {
      await deleteTeacher(id);
      toast({ title: "Success", description: "Teacher deleted." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete teacher.", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Teacher Directory</CardTitle>
          <CardDescription>Manage teacher profiles and information.</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Teacher
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Teacher</DialogTitle>
              <DialogDescription>Fill in the details to add a new teacher to the system.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" placeholder="Full Name" className="col-span-3" value={newTeacherName} onChange={(e) => setNewTeacherName(e.target.value)} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="department" className="text-right">Department</Label>
                <Input id="department" placeholder="e.g., Science" className="col-span-3" value={newTeacherDept} onChange={(e) => setNewTeacherDept(e.target.value)} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">Email</Label>
                <Input id="email" type="email" placeholder="teacher@school.edu" className="col-span-3" value={newTeacherEmail} onChange={(e) => setNewTeacherEmail(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleAddTeacher}>Save Teacher</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teachers.map((teacher) => (
              <TableRow key={teacher.id}>
                <TableCell className="font-mono text-xs">{teacher.id}</TableCell>
                <TableCell className="font-medium">{teacher.name}</TableCell>
                <TableCell>{teacher.department}</TableCell>
                <TableCell>{teacher.email}</TableCell>
                <TableCell>
                  <Badge variant={
                    teacher.status === 'Active' ? 'default' : teacher.status === 'On Leave' ? 'secondary' : 'outline'
                  } className={
                    teacher.status === 'Active' ? 'bg-green-500/20 text-green-700' : ''
                  }>
                    {teacher.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem disabled>
                         <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeleteTeacher(teacher.id)}>
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
      </CardContent>
    </Card>
  );
}

    
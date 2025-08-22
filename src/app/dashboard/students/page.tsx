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

type Student = {
  id: string;
  name: string;
  grade: number;
  email: string;
  status: "Active" | "Suspended" | "Withdrawn";
};

// Function to generate a student ID
const generateStudentId = (grade: string): string => {
    const year = new Date().getFullYear().toString().slice(-2);
    const classType = 'S'; // for Student
    const gradeChar = grade.padStart(1, '0');
    const randomPart = Math.random().toString().slice(2, 8);
    return `${year}${classType}${gradeChar}${randomPart}`;
};


export default function StudentsPage() {
  const { data: students, addDataWithId: addStudent, deleteData: deleteStudent } = useDatabase<Student>('students');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentGrade, setNewStudentGrade] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const { toast } = useToast();

  const handleAddStudent = async () => {
    if (!newStudentName.trim() || !newStudentGrade.trim() || !newStudentEmail.trim()) {
      toast({ title: "Error", description: "All fields are required.", variant: "destructive" });
      return;
    }
    try {
      const studentId = generateStudentId(newStudentGrade);
      await addStudent(studentId, {
        name: newStudentName,
        grade: parseInt(newStudentGrade, 10),
        email: newStudentEmail,
        status: 'Active',
      });
      toast({ title: "Success", description: "Student added." });
      setNewStudentName("");
      setNewStudentGrade("");
      setNewStudentEmail("");
      setIsDialogOpen(false);
    } catch (error) {
      toast({ title: "Error", description: "Failed to add student.", variant: "destructive" });
    }
  };

  const handleDeleteStudent = async (id: string) => {
    try {
      await deleteStudent(id);
      toast({ title: "Success", description: "Student deleted." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete student.", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Student Directory</CardTitle>
          <CardDescription>Manage student profiles and information.</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Student
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
              <DialogDescription>Fill in the details to add a new student to the system.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" placeholder="Full Name" className="col-span-3" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="grade" className="text-right">Grade</Label>
                <Input id="grade" type="number" placeholder="10" className="col-span-3" value={newStudentGrade} onChange={(e) => setNewStudentGrade(e.target.value)} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">Email</Label>
                <Input id="email" type="email" placeholder="student@school.edu" className="col-span-3" value={newStudentEmail} onChange={(e) => setNewStudentEmail(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleAddStudent}>Save Student</Button>
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
              <TableHead>Grade</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-mono text-xs">{student.id}</TableCell>
                <TableCell className="font-medium">{student.name}</TableCell>
                <TableCell>{student.grade}</TableCell>
                <TableCell>{student.email}</TableCell>
                <TableCell>
                  <Badge variant={
                    student.status === 'Active' ? 'default' : student.status === 'Suspended' ? 'destructive' : 'secondary'
                  } className={
                    student.status === 'Active' ? 'bg-green-500/20 text-green-700' : ''
                  }>
                    {student.status}
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
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeleteStudent(student.id)}>
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

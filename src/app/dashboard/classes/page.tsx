"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Trash2, UserPlus, BookOpen, ChevronsUpDown, Check } from "lucide-react";
import { useDatabase } from "@/hooks/use-database";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils"

type Student = {
  id: string;
  name: string;
  grade: number;
  email: string;
  status: "Active" | "Suspended" | "Withdrawn";
};

type Teacher = {
  id: string;
  name: string;
  department: string;
  email: string;
  status: "Active" | "On Leave" | "Retired";
};

type Class = {
  id: string;
  name: string;
  teacherId?: string;
  studentIds?: Record<string, boolean>;
};

// Function to generate a class ID
const generateClassId = (className: string): string => {
    const year = new Date().getFullYear().toString().slice(-2);
    const classType = 'C'; // for Class
    const nameChar = className.length > 0 ? className.charAt(0).toUpperCase() : 'X';
    const randomPart = Math.random().toString().slice(2, 8);
    return `${year}${classType}${nameChar}${randomPart}`;
};

export default function ClassesPage() {
  const { data: classes, addDataWithId: addClass, updateData: updateClass, deleteData: deleteClass } = useDatabase<Class>('classes');
  const { data: students } = useDatabase<Student>('students');
  const { data: teachers } = useDatabase<Teacher>('teachers');
  const { addData: addNotification } = useDatabase('notifications');
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

  const [newClassName, setNewClassName] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | undefined>(undefined);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  
  const { toast } = useToast();

  const teachersMap = useMemo(() => new Map(teachers.map(t => [t.id, t])), [teachers]);
  const studentsMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);

  const handleCreateClass = async () => {
    if (!newClassName.trim()) {
      toast({ title: "Error", description: "Class name is required.", variant: "destructive" });
      return;
    }
    try {
      const classId = generateClassId(newClassName);
      await addClass(classId, { name: newClassName });
      await addNotification({
          type: 'class_created',
          message: `New class "${newClassName}" was created.`,
          read: false,
      });
      toast({ title: "Success", description: "Class created." });
      setNewClassName("");
      setIsCreateDialogOpen(false);
    } catch (error) {
      toast({ title: "Error", description: "Failed to create class.", variant: "destructive" });
    }
  };

  const handleDeleteClass = async (id: string) => {
    try {
      await deleteClass(id);
      toast({ title: "Success", description: "Class deleted." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete class.", variant: "destructive" });
    }
  };
  
  const openAssignDialog = (cls: Class) => {
    setSelectedClass(cls);
    setSelectedTeacherId(cls.teacherId);
    setSelectedStudentIds(cls.studentIds ? Object.keys(cls.studentIds) : []);
    setIsAssignDialogOpen(true);
  };

  const handleAssign = async () => {
    if (!selectedClass) return;

    const studentIdsObject = selectedStudentIds.reduce((acc, id) => {
      acc[id] = true;
      return acc;
    }, {} as Record<string, boolean>);

    try {
      await updateClass(selectedClass.id, {
        teacherId: selectedTeacherId,
        studentIds: studentIdsObject
      });
      toast({ title: "Success", description: "Assignments updated." });
      setIsAssignDialogOpen(false);
      setSelectedClass(null);
    } catch (error) {
      toast({ title: "Error", description: "Failed to update assignments.", variant: "destructive" });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Class Management</h1>
          <p className="text-muted-foreground">
            Create, manage, and assign students and teachers to classes.
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Class
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Class</DialogTitle>
              <DialogDescription>Enter a name for the new class.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Class Name</Label>
                <Input id="name" placeholder="e.g., Grade 10 Math" className="col-span-3" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleCreateClass}>Create Class</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {classes.map((cls) => (
          <Card key={cls.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                   <div className="bg-primary text-primary-foreground p-3 rounded-full">
                    <BookOpen className="h-6 w-6" />
                   </div>
                  <div>
                    <CardTitle>{cls.name}</CardTitle>
                    <CardDescription>
                      ID: {cls.id}
                    </CardDescription>
                     <CardDescription className="pt-1">
                      Teacher: {cls.teacherId ? teachersMap.get(cls.teacherId)?.name : 'Unassigned'}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm font-medium mb-2">Students ({cls.studentIds ? Object.keys(cls.studentIds).length : 0})</p>
              <div className="flex flex-wrap gap-1">
                {cls.studentIds && Object.keys(cls.studentIds).map(id => (
                  <Badge key={id} variant="secondary">{studentsMap.get(id)?.name}</Badge>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => openAssignDialog(cls)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Assign
              </Button>
              <Button variant="destructive" size="icon" onClick={() => handleDeleteClass(cls.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Assign to {selectedClass?.name}</DialogTitle>
            <DialogDescription>
              Assign a teacher and select students for this class.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="teacher" className="text-right">
                Teacher
              </Label>
              <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map(teacher => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
             <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Students</Label>
              <div className="col-span-3">
                <MultiSelectPopover 
                  options={students.map(s => ({ value: s.id, label: s.name }))}
                  selected={selectedStudentIds}
                  onChange={setSelectedStudentIds}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleAssign}>Save Assignments</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


// A helper component for multi-select with a search popover
function MultiSelectPopover({ options, selected, onChange }: { 
    options: { value: string, label: string }[], 
    selected: string[], 
    onChange: (selected: string[]) => void 
}) {
  const [open, setOpen] = useState(false)

  const handleSelect = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value]
    onChange(newSelected)
  }

  const selectedLabels = selected.map(value => options.find(opt => opt.value === value)?.label).filter(Boolean);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <span className="truncate">
             {selectedLabels.length > 0 ? selectedLabels.join(", ") : "Select students..."}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search students..." />
          <CommandList>
            <CommandEmpty>No students found.</CommandEmpty>
            <CommandGroup>
              <ScrollArea className="h-48">
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => handleSelect(option.value)}
                  value={option.label}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selected.includes(option.value) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
              </ScrollArea>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

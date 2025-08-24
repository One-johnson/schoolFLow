
"use client";

import * as React from "react";
import { useDatabase } from "@/hooks/use-database";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PlusCircle,
  Loader2,
  FileText,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Data types
type Term = {
  id: string;
  name: string;
};

type Exam = {
  id: string;
  name: string;
  termId: string;
  status: "Upcoming" | "Ongoing" | "Grading" | "Published";
};

export default function ExamSetupPage() {
  const { data: exams, addData, updateData, deleteData, loading } = useDatabase<Exam>("exams");
  const { data: terms, loading: termsLoading } = useDatabase<Term>("terms");
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [selectedExam, setSelectedExam] = React.useState<Exam | null>(null);
  
  const [newExam, setNewExam] = React.useState<{ name: string; termId: string }>({ name: "", termId: "" });
  const [editExam, setEditExam] = React.useState<Partial<Exam>>({});
  
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const termsMap = React.useMemo(() => new Map(terms.map(t => [t.id, t.name])), [terms]);

  const handleCreateExam = async () => {
    if (!newExam.name.trim() || !newExam.termId) {
      toast({ title: "Error", description: "Exam name and term are required.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      await addData({ 
          name: newExam.name, 
          termId: newExam.termId, 
          status: "Upcoming" 
      } as Omit<Exam, 'id'>);
      toast({ title: "Success", description: "Examination created." });
      setNewExam({ name: "", termId: "" });
      setIsCreateDialogOpen(false);
    } catch (error) {
      toast({ title: "Error", description: "Failed to create examination.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (exam: Exam) => {
    setSelectedExam(exam);
    setEditExam(exam);
    setIsEditDialogOpen(true);
  };

  const handleUpdateExam = async () => {
    if (!selectedExam || !editExam.name || !editExam.termId || !editExam.status) return;
    setIsLoading(true);
    try {
        await updateData(selectedExam.id, { 
            name: editExam.name, 
            termId: editExam.termId,
            status: editExam.status
        });
        toast({ title: "Success", description: "Examination updated." });
        setIsEditDialogOpen(false);
        setSelectedExam(null);
    } catch (error) {
        toast({ title: "Error", description: "Failed to update examination.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  const handleDeleteExam = async (id: string) => {
    setIsLoading(true);
    try {
        await deleteData(id);
        toast({ title: "Success", description: "Examination deleted." });
    } catch (error) {
        toast({ title: "Error", description: "Failed to delete examination.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle>Exam Setup</CardTitle>
            <CardDescription>
              Create and manage examination periods (e.g., Mid-Term, Final Exams).
            </CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Exam
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Examination</DialogTitle>
                <DialogDescription>Define a new examination period for the school.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Exam Name</Label>
                  <Input id="name" placeholder="e.g., Final Exams 2024" className="col-span-3" value={newExam.name} onChange={(e) => setNewExam({...newExam, name: e.target.value})} disabled={isLoading} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="term" className="text-right">Academic Term</Label>
                  <Select value={newExam.termId} onValueChange={(value) => setNewExam({...newExam, termId: value})} disabled={isLoading || termsLoading}>
                      <SelectTrigger className="col-span-3">
                          <SelectValue placeholder={termsLoading ? "Loading terms..." : "Select a term"} />
                      </SelectTrigger>
                      <SelectContent>
                          {terms.map(term => <SelectItem key={term.id} value={term.id}>{term.name}</SelectItem>)}
                      </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleCreateExam} disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading ? <p>Loading examinations...</p> :
            exams.map((exam) => (
            <Card key={exam.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-full text-primary"><FileText className="h-6 w-6"/></div>
                    <div>
                      <CardTitle className="text-lg">{exam.name}</CardTitle>
                      <CardDescription>{termsMap.get(exam.termId) || 'Unknown Term'}</CardDescription>
                    </div>
                  </div>
                  <AlertDialog>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                         <DropdownMenuItem onSelect={() => openEditDialog(exam)}><Pencil className="mr-2 h-4 w-4"/>Edit</DropdownMenuItem>
                         <DropdownMenuSeparator />
                         <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem>
                         </AlertDialogTrigger>
                      </DropdownMenuContent>
                    </DropdownMenu>
                     <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the examination period and all related data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteExam(exam.id)} disabled={isLoading} className="bg-destructive hover:bg-destructive/90">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
              <CardFooter>
                 <Badge>{exam.status}</Badge>
              </CardFooter>
            </Card>
          ))}
        </CardContent>
      </Card>
      
       {/* Edit Exam Dialog */}
       <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Examination</DialogTitle>
              <DialogDescription>Update the details for this examination period.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">Exam Name</Label>
                <Input id="edit-name" className="col-span-3" value={editExam.name} onChange={(e) => setEditExam({...editExam, name: e.target.value})} disabled={isLoading} />
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-term" className="text-right">Academic Term</Label>
                <Select value={editExam.termId} onValueChange={(value) => setEditExam({...editExam, termId: value})} disabled={isLoading || termsLoading}>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder={termsLoading ? "Loading terms..." : "Select a term"} />
                    </SelectTrigger>
                    <SelectContent>
                        {terms.map(term => <SelectItem key={term.id} value={term.id}>{term.name}</SelectItem>)}
                    </SelectContent>
                </Select>
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-status" className="text-right">Status</Label>
                 <Select value={editExam.status} onValueChange={(value: Exam["status"]) => setEditExam(prev => ({...prev, status: value}))} disabled={isLoading}>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Upcoming">Upcoming</SelectItem>
                        <SelectItem value="Ongoing">Ongoing</SelectItem>
                        <SelectItem value="Grading">Grading</SelectItem>
                        <SelectItem value="Published">Published</SelectItem>
                    </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleUpdateExam} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </>
  );
}

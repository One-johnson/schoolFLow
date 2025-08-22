
"use client"

import * as React from "react"
import {
  MoreHorizontal,
  PlusCircle,
  Trash2,
  Pencil,
  Loader2,
  CalendarClock,
  Calendar as CalendarIcon
} from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDatabase } from "@/hooks/use-database"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

type Term = {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  status: "Active" | "Inactive" | "Completed";
}

export default function TermsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [selectedTerm, setSelectedTerm] = React.useState<Term | null>(null)
  const [isLoading, setIsLoading] = React.useState(false);
  
  const [newTerm, setNewTerm] = React.useState<Partial<Omit<Term, 'id' | 'status'>>>({});
  const [editTerm, setEditTerm] = React.useState<Partial<Term>>({});

  const [startDate, setStartDate] = React.useState<Date | undefined>();
  const [endDate, setEndDate] = React.useState<Date | undefined>();

  const { data: terms, addData, updateData, deleteData } = useDatabase<Term>("terms")
  const { toast } = useToast()
  
  const resetForm = () => {
    setNewTerm({});
    setEditTerm({});
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const handleAddTerm = async () => {
    if (!newTerm.name?.trim()) {
      toast({ title: "Error", description: "Term name is required.", variant: "destructive" })
      return
    }
    setIsLoading(true);
    try {
      await addData({
          ...newTerm,
          status: 'Inactive',
          startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
          endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
      } as Omit<Term, "id">)
      toast({ title: "Success", description: "Term added." })
      resetForm()
      setIsCreateDialogOpen(false)
    } catch (error) {
      toast({ title: "Error", description: "Failed to add term.", variant: "destructive" })
    } finally {
      setIsLoading(false);
    }
  }

  const openEditDialog = (term: Term) => {
    setSelectedTerm(term);
    setEditTerm(term);
    setStartDate(term.startDate ? new Date(term.startDate) : undefined);
    setEndDate(term.endDate ? new Date(term.endDate) : undefined);
    setIsEditDialogOpen(true);
  }

  const handleUpdateTerm = async () => {
    if (!selectedTerm || !editTerm) return;
    setIsLoading(true);
    try {
      await updateData(selectedTerm.id, {
          ...editTerm,
          startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
          endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
      })
      toast({ title: "Success", description: "Term updated." })
      setIsEditDialogOpen(false)
      resetForm();
      setSelectedTerm(null);
    } catch (error) {
      toast({ title: "Error", description: "Failed to update term.", variant: "destructive" })
    } finally {
      setIsLoading(false);
    }
  }

  const handleDeleteTerm = async (id: string) => {
    setIsLoading(true);
    try {
      await deleteData(id)
      toast({ title: "Success", description: "Term deleted." })
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete term.", variant: "destructive" })
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Terms Management</h1>
          <p className="text-muted-foreground">
            Define and manage academic terms and sessions.
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Term
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Term</DialogTitle>
              <DialogDescription>Fill in the details for the new academic term.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Term Name</Label>
                <Input id="name" placeholder="e.g., First Term 2024/2025" className="col-span-3" value={newTerm.name || ""} onChange={(e) => setNewTerm(p => ({ ...p, name: e.target.value }))} disabled={isLoading} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Start Date</Label>
                <Popover>
                    <PopoverTrigger asChild>
                    <Button variant={"outline"} className={cn("col-span-3 justify-start text-left font-normal",!startDate && "text-muted-foreground")} disabled={isLoading}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus /></PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">End Date</Label>
                <Popover>
                    <PopoverTrigger asChild>
                    <Button variant={"outline"} className={cn("col-span-3 justify-start text-left font-normal",!endDate && "text-muted-foreground")} disabled={isLoading}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus /></PopoverContent>
                </Popover>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleAddTerm} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Add Term
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {terms.map((term) => (
          <Card key={term.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                   <div className="bg-primary text-primary-foreground p-3 rounded-full">
                    <CalendarClock className="h-6 w-6" />
                   </div>
                  <div>
                    <CardTitle>{term.name}</CardTitle>
                    <CardDescription>
                      {term.startDate ? format(new Date(term.startDate), "MMM d, yyyy") : 'N/A'} - {term.endDate ? format(new Date(term.endDate), "MMM d, yyyy") : 'N/A'}
                    </CardDescription>
                  </div>
                </div>
                 <AlertDialog>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button aria-haspopup="true" size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /><span className="sr-only">Toggle menu</span></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => openEditDialog(term)}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem></AlertDialogTrigger>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action will permanently delete this term.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteTerm(term.id)} disabled={isLoading} className="bg-destructive hover:bg-destructive/90">{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete"}</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                 </AlertDialog>
              </div>
            </CardHeader>
            <CardFooter>
                <Badge variant={term.status === "Active" ? "default" : "secondary"}>{term.status}</Badge>
            </CardFooter>
          </Card>
        ))}
      </div>

       {/* Edit Term Dialog */}
       <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Term</DialogTitle>
              <DialogDescription>Update the term details.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Term Name</Label>
                <Input id="name" className="col-span-3" value={editTerm.name || ''} onChange={(e) => setEditTerm(p => ({...p, name: e.target.value}))} disabled={isLoading} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Start Date</Label>
                <Popover>
                    <PopoverTrigger asChild>
                    <Button variant={"outline"} className={cn("col-span-3 justify-start text-left font-normal",!startDate && "text-muted-foreground")} disabled={isLoading}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus /></PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">End Date</Label>
                <Popover>
                    <PopoverTrigger asChild>
                    <Button variant={"outline"} className={cn("col-span-3 justify-start text-left font-normal",!endDate && "text-muted-foreground")} disabled={isLoading}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus /></PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">Status</Label>
                 <Select value={editTerm?.status} onValueChange={(value: "Active" | "Inactive" | "Completed") => setEditTerm(p => ({...p, status: value}))} disabled={isLoading}>
                    <SelectTrigger className="col-span-3"><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleUpdateTerm} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  )
}

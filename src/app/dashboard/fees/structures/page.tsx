
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
  PlusCircle,
  Loader2,
  DollarSign,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { ref, remove } from "firebase/database";
import { database } from "@/lib/firebase";

// Data types
type FeeStructure = {
  id: string;
  name: string;
  amount: number;
  createdAt: number;
};

type StudentFee = {
  id: string; // studentId_feeId
  feeId: string;
}

// Main component
export default function FeeStructuresPage() {
  const { data: feeStructures, addData, updateData, deleteData, loading } = useDatabase<FeeStructure>("feeStructures");
  const { data: studentFees } = useDatabase<StudentFee>("studentFees");
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [selectedFee, setSelectedFee] = React.useState<FeeStructure | null>(null);
  
  const [newFee, setNewFee] = React.useState<{ name: string; amount: string }>({ name: "", amount: "" });
  const [editFee, setEditFee] = React.useState<{ name: string; amount: string }>({ name: "", amount: "" });
  
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const handleCreateFee = async () => {
    if (!newFee.name.trim() || !newFee.amount) {
      toast({ title: "Error", description: "Fee name and amount are required.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      await addData({ name: newFee.name, amount: parseFloat(newFee.amount) } as Omit<FeeStructure, 'id'>);
      toast({ title: "Success", description: "Fee structure created." });
      setNewFee({ name: "", amount: "" });
      setIsCreateDialogOpen(false);
    } catch (error) {
      toast({ title: "Error", description: "Failed to create fee structure.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (fee: FeeStructure) => {
    setSelectedFee(fee);
    setEditFee({ name: fee.name, amount: fee.amount.toString() });
    setIsEditDialogOpen(true);
  };

  const handleUpdateFee = async () => {
    if (!selectedFee || !editFee.name.trim() || !editFee.amount) return;
    setIsLoading(true);
    try {
        await updateData(selectedFee.id, { name: editFee.name, amount: parseFloat(editFee.amount) });
        toast({ title: "Success", description: "Fee structure updated." });
        setIsEditDialogOpen(false);
        setSelectedFee(null);
    } catch (error) {
        toast({ title: "Error", description: "Failed to update fee structure.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  const handleDeleteFee = async (id: string) => {
    setIsLoading(true);
    try {
      // Find all studentFees associated with this fee structure
      const associatedStudentFees = studentFees.filter(sf => sf.feeId === id);
      const deletionPromises = associatedStudentFees.map(sf => remove(ref(database, `studentFees/${sf.id}`)));
      
      // Delete the fee structure itself
      deletionPromises.push(deleteData(id));
      
      await Promise.all(deletionPromises);

      toast({ title: "Success", description: "Fee structure and all associated payment records have been deleted." });
    } catch (error) {
      console.error("Fee deletion error:", error);
      toast({ title: "Error", description: "Failed to delete fee structure and its records.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <div>
            <CardTitle>Fee Structures</CardTitle>
            <CardDescription>
              Manage all fee categories for the school.
            </CardDescription>
        </div>
         <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Fee Structure
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Fee Structure</DialogTitle>
              <DialogDescription>Add a new type of fee that can be assigned to students.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Fee Name</Label>
                <Input id="name" placeholder="e.g., Tuition Fee 2024/25" className="col-span-3" value={newFee.name} onChange={(e) => setNewFee({...newFee, name: e.target.value})} disabled={isLoading} />
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">Amount (GH₵)</Label>
                <Input id="amount" type="number" placeholder="e.g., 1200" className="col-span-3" value={newFee.amount} onChange={(e) => setNewFee({...newFee, amount: e.target.value})} disabled={isLoading} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleCreateFee} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? <p>Loading...</p> :
          feeStructures.map((fee) => (
          <Card key={fee.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-full text-primary"><DollarSign className="h-6 w-6"/></div>
                  <div>
                    <CardTitle className="text-lg">{fee.name}</CardTitle>
                    <CardDescription>Created on {new Date(fee.createdAt).toLocaleDateString()}</CardDescription>
                  </div>
                </div>
                <AlertDialog>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                       <DropdownMenuItem onSelect={() => openEditDialog(fee)}><Pencil className="mr-2 h-4 w-4"/>Edit</DropdownMenuItem>
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
                          This will permanently delete the fee structure and all associated student payment records. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteFee(fee.id)} disabled={isLoading} className="bg-destructive hover:bg-destructive/90">
                          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">GH₵{fee.amount.toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </CardContent>

       {/* Edit Fee Dialog */}
       <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Fee Structure</DialogTitle>
              <DialogDescription>Update the details for this fee.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">Fee Name</Label>
                <Input id="edit-name" className="col-span-3" value={editFee.name} onChange={(e) => setEditFee({...editFee, name: e.target.value})} disabled={isLoading} />
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-amount" className="text-right">Amount (GH₵)</Label>
                <Input id="edit-amount" type="number" className="col-span-3" value={editFee.amount} onChange={(e) => setEditFee({...editFee, amount: e.target.value})} disabled={isLoading} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleUpdateFee} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </Card>
  );
}

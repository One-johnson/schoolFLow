
"use client";

import * as React from "react";
import { useDatabase } from "@/hooks/use-database";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { MultiSelectPopover } from "@/components/ui/multi-select-popover";

type Student = { id: string; name: string; };
type FeeStructure = { id: string; name: string; amount: number; };
type Class = { id: string; name: string; studentIds?: Record<string, boolean>; };


export default function AssignFeesPage() {
  const { data: students } = useDatabase<Student>("students");
  const { data: feeStructures } = useDatabase<FeeStructure>("feeStructures");
  const { data: classes } = useDatabase<Class>("classes");
  const { addDataWithId } = useDatabase("studentFees");
  const { addData: addNotification } = useDatabase("notifications");
  const { toast } = useToast();

  const [selectedFeeId, setSelectedFeeId] = React.useState<string | undefined>();
  const [selectedStudentIds, setSelectedStudentIds] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedClassId, setSelectedClassId] = React.useState<string | undefined>();

  React.useEffect(() => {
    if (!selectedClassId || selectedClassId === "none") {
      setSelectedStudentIds([]);
      return;
    }
    const selectedClass = classes.find(c => c.id === selectedClassId);
    if (selectedClass && selectedClass.studentIds) {
      setSelectedStudentIds(Object.keys(selectedClass.studentIds));
    } else {
      setSelectedStudentIds([]);
    }
  }, [selectedClassId, classes]);

  const handleAssignFees = async () => {
    if (!selectedFeeId || selectedStudentIds.length === 0) {
      toast({
        title: "Error",
        description: "Please select a fee structure and at least one student.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);

    const fee = feeStructures.find(f => f.id === selectedFeeId);
    if (!fee) {
      toast({ title: "Error", description: "Selected fee structure not found.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    try {
      const assignmentPromises = selectedStudentIds.map(studentId => {
        const recordId = `${studentId}_${fee.id}`;
        const feePromise = addDataWithId(recordId, {
          studentId,
          feeId: fee.id,
          amountDue: fee.amount,
          amountPaid: 0,
          status: "Unpaid"
        });
        
        const notificationPromise = addNotification({
            type: 'fee_assigned',
            message: `A new fee has been assigned: ${fee.name} (GH₵${fee.amount})`,
            read: false,
            recipientId: studentId
        } as any);

        return Promise.all([feePromise, notificationPromise]);
      });
      
      await Promise.all(assignmentPromises);

      toast({ title: "Success", description: `${fee.name} assigned to ${selectedStudentIds.length} student(s).` });
      setSelectedFeeId(undefined);
      setSelectedStudentIds([]);
      setSelectedClassId(undefined);
    } catch (error) {
      console.error("Fee assignment error:", error);
      toast({ title: "Error", description: "Failed to assign fees.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assign Fees to Students</CardTitle>
        <CardDescription>
          Select a fee structure and either an entire class or individual students to assign it to.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
                <Label>Fee Structure</Label>
                <Select value={selectedFeeId} onValueChange={setSelectedFeeId} disabled={isLoading}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a fee structure" />
                    </SelectTrigger>
                    <SelectContent>
                        {feeStructures.map(fee => (
                            <SelectItem key={fee.id} value={fee.id}>{fee.name} (GH₵{fee.amount})</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>Assign to a Class (Optional)</Label>
                 <Select value={selectedClassId} onValueChange={setSelectedClassId} disabled={isLoading}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent>
                         <SelectItem value="none">None (Select students manually)</SelectItem>
                        {classes.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>Students</Label>
                <MultiSelectPopover 
                    options={students.map(s => ({ value: s.id, label: s.name }))}
                    selected={selectedStudentIds}
                    onChange={setSelectedStudentIds}
                    disabled={isLoading || !!selectedClassId}
                />
                 {selectedClassId && selectedClassId !== "none" && (
                  <p className="text-xs text-muted-foreground">Student list is managed by class selection. To select manually, set class to "None".</p>
                )}
            </div>
        </div>
        <Button onClick={handleAssignFees} disabled={isLoading || !selectedFeeId || selectedStudentIds.length === 0}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Assign Fees
        </Button>
      </CardContent>
    </Card>
  );
}

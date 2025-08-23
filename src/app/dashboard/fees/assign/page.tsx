
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
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

type Student = { id: string; name: string; };
type FeeStructure = { id: string; name: string; amount: number; };

export default function AssignFeesPage() {
  const { data: students } = useDatabase<Student>("students");
  const { data: feeStructures } = useDatabase<FeeStructure>("feeStructures");
  const { addDataWithId } = useDatabase("studentFees");
  const { toast } = useToast();

  const [selectedFeeId, setSelectedFeeId] = React.useState<string | undefined>();
  const [selectedStudentIds, setSelectedStudentIds] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

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
        return addDataWithId(recordId, {
          studentId,
          feeId: fee.id,
          amountDue: fee.amount,
          amountPaid: 0,
          status: "Unpaid"
        });
      });
      
      await Promise.all(assignmentPromises);

      toast({ title: "Success", description: `${fee.name} assigned to ${selectedStudentIds.length} student(s).` });
      setSelectedFeeId(undefined);
      setSelectedStudentIds([]);
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
          Select a fee structure and the students you want to assign it to.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label>Fee Structure</Label>
                <Select value={selectedFeeId} onValueChange={setSelectedFeeId} disabled={isLoading}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a fee structure" />
                    </SelectTrigger>
                    <SelectContent>
                        {feeStructures.map(fee => (
                            <SelectItem key={fee.id} value={fee.id}>{fee.name} (${fee.amount})</SelectItem>
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
                    disabled={isLoading}
                />
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

function MultiSelectPopover({ options, selected, onChange, disabled }: { 
    options: { value: string, label: string }[], 
    selected: string[], 
    onChange: (selected: string[]) => void,
    disabled?: boolean
}) {
  const [open, setOpen] = React.useState(false)

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
          className="w-full justify-between font-normal"
          disabled={disabled}
        >
          <span className="truncate">
             {selectedLabels.length > 0 ? `${selectedLabels.length} selected` : "Select students..."}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
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

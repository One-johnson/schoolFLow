
"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useDatabase } from "@/hooks/use-database";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Loader2, DollarSign, AlertCircle } from "lucide-react";

// Data types
type Student = { id: string; name: string };
type FeeStructure = { id: string; name: string; amount: number };
type StudentFee = {
  id: string; // Composite key studentId_feeId
  studentId: string;
  feeId: string;
  amountDue: number;
  amountPaid: number;
  status: "Paid" | "Unpaid" | "Partial";
};

type EnrichedStudentFee = StudentFee & {
  studentName: string;
  feeName: string;
};

const HIGH_PRIORITY_THRESHOLD = 500;

export default function StudentPaymentsPage() {
  const { data: students, loading: studentsLoading } = useDatabase<Student>("students");
  const { data: feeStructures, loading: feesLoading } = useDatabase<FeeStructure>("feeStructures");
  const { data: studentFees, updateData, loading: studentFeesLoading } = useDatabase<StudentFee>("studentFees");
  
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = React.useState(false);
  const [selectedFee, setSelectedFee] = React.useState<EnrichedStudentFee | null>(null);
  const [paymentAmount, setPaymentAmount] = React.useState("");

  const studentsMap = React.useMemo(() => new Map(students.map(s => [s.id, s.name])), [students]);
  const feesMap = React.useMemo(() => new Map(feeStructures.map(f => [f.id, f.name])), [feeStructures]);

  const enrichedData: EnrichedStudentFee[] = React.useMemo(() => {
    return studentFees.map(sf => ({
      ...sf,
      studentName: studentsMap.get(sf.studentId) || "Unknown Student",
      feeName: feesMap.get(sf.feeId) || "Unknown Fee",
    }));
  }, [studentFees, studentsMap, feesMap]);

  const openPaymentDialog = (fee: EnrichedStudentFee) => {
    setSelectedFee(fee);
    setPaymentAmount("");
    setIsPaymentDialogOpen(true);
  };

  const handleRecordPayment = async () => {
    if (!selectedFee || !paymentAmount) {
        toast({ title: "Error", description: "Payment amount is required.", variant: "destructive" });
        return;
    }
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
        toast({ title: "Error", description: "Please enter a valid payment amount.", variant: "destructive" });
        return;
    }
    
    setIsLoading(true);
    try {
        const newAmountPaid = selectedFee.amountPaid + amount;
        const newStatus = newAmountPaid >= selectedFee.amountDue ? "Paid" : "Partial";

        await updateData(selectedFee.id, {
            amountPaid: newAmountPaid,
            status: newStatus
        });
        toast({ title: "Success", description: "Payment recorded successfully." });
        setIsPaymentDialogOpen(false);
        setSelectedFee(null);
    } catch (error) {
        toast({ title: "Error", description: "Failed to record payment.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  }

  const columns: ColumnDef<EnrichedStudentFee>[] = [
    { accessorKey: "studentName", header: "Student Name" },
    { accessorKey: "feeName", header: "Fee" },
    { accessorKey: "amountDue", header: "Amount Due", cell: ({ row }) => `GH₵${row.original.amountDue.toLocaleString()}`},
    { accessorKey: "amountPaid", header: "Amount Paid", cell: ({ row }) => `GH₵${row.original.amountPaid.toLocaleString()}`},
    { accessorKey: "balance", header: "Balance", cell: ({ row }) => {
        const balance = row.original.amountDue - row.original.amountPaid;
        const isHighPriority = balance > HIGH_PRIORITY_THRESHOLD;
        return (
            <div className={cn("font-semibold", isHighPriority && "text-destructive")}>
                GH₵{balance.toLocaleString()}
                {isHighPriority && (
                    <Badge variant="destructive" className="ml-2">High Priority</Badge>
                )}
            </div>
        );
    }},
    { accessorKey: "status", header: "Status", cell: ({ row }) => {
        const status = row.original.status;
        const className = {
            "Paid": "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
            "Unpaid": "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
            "Partial": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
        }[status];
        return <Badge className={cn("border-transparent", className)}>{status}</Badge>
    }},
    {
      id: "actions",
      cell: ({ row }) => (
        <Button variant="outline" size="sm" onClick={() => openPaymentDialog(row.original)} disabled={row.original.status === 'Paid'}>
          <DollarSign className="mr-2 h-4 w-4" /> Record Payment
        </Button>
      ),
    },
  ];

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data: enrichedData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting, columnFilters },
  });
  
  const loading = studentsLoading || feesLoading || studentFeesLoading;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Student Payments</CardTitle>
          <CardDescription>
            View and manage student fee payment status. Balances over GH₵{HIGH_PRIORITY_THRESHOLD} are flagged.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center py-4">
            <Input
              placeholder="Filter by student name..."
              value={(table.getColumn("studentName")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("studentName")?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No payment records found. Assign fees to students to begin.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Record Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Payment for {selectedFee?.studentName}</DialogTitle>
              <DialogDescription>
                Fee: {selectedFee?.feeName} | Balance: GH₵{(selectedFee?.amountDue ?? 0) - (selectedFee?.amountPaid ?? 0)}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="payment-amount" className="text-right">Amount</Label>
                <Input 
                    id="payment-amount" 
                    type="number"
                    className="col-span-3" 
                    value={paymentAmount} 
                    onChange={(e) => setPaymentAmount(e.target.value)} 
                    disabled={isLoading}
                    placeholder="Enter amount paid"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleRecordPayment} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Payment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </>
  );
}


"use client";

import * as React from "react";
import { useDatabase } from "@/hooks/use-database";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Send, DollarSign, TrendingUp, TrendingDown, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


// Data Types
type Student = { id: string; name: string; email?: string };
type Class = { id: string; studentIds?: Record<string, boolean>; teacherId?: string; name: string; };
type StudentFee = { id: string; studentId: string; feeId: string; amountDue: number; amountPaid: number; status: "Paid" | "Unpaid" | "Partial"; };
type FeeStructure = { id: string; name: string; };
type EnrichedFeeRecord = StudentFee & { studentName: string; studentEmail?: string; feeName: string; };

const generateInvoice = (fee: EnrichedFeeRecord, student: Student, toast: (options: any) => void) => {
    try {
        const doc = new jsPDF();
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("SchoolFlow", 105, 20, { align: "center" });
        doc.setFontSize(16);
        doc.text("Fee Invoice", 105, 30, { align: "center" });
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Bill To:", 20, 50);
        doc.setFont("helvetica", "normal");
        doc.text(student.name, 20, 57);
        if (student.email) doc.text(student.email, 20, 64);
        doc.setFont("helvetica", "bold");
        doc.text("Invoice #:", 150, 50);
        doc.setFont("helvetica", "normal");
        doc.text(fee.id.substring(0, 10), 175, 50);
        doc.text("Date:", 150, 57);
        doc.text(new Date().toLocaleDateString(), 175, 57);
        
        (doc as any).autoTable({
            startY: 80,
            head: [["Description", "Amount Due", "Amount Paid", "Balance"]],
            body: [[fee.feeName, `GH₵${fee.amountDue}`, `GH₵${fee.amountPaid}`, `GH₵${fee.amountDue - fee.amountPaid}`]],
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185] }
        });

        doc.setFontSize(10);
        doc.text("Thank you for your timely payment.", 105, (doc as any).lastAutoTable.finalY + 20, { align: 'center' });
        doc.save(`invoice-${fee.studentName}-${fee.feeName}.pdf`);
        toast({ title: "Invoice Generated", description: `PDF for ${fee.studentName} has been downloaded.` });
    } catch(e) {
        console.error(e);
        toast({ title: "Error Generating Invoice", variant: "destructive" });
    }
};

export default function ClassFeesPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: classes, loading: classesLoading } = useDatabase<Class>("classes");
  const { data: students, loading: studentsLoading } = useDatabase<Student>("students");
  const { data: allStudentFees, loading: studentFeesLoading } = useDatabase<StudentFee>("studentFees");
  const { data: feeStructures, loading: feesLoading } = useDatabase<FeeStructure>("feeStructures");
  const { addData: addNotification } = useDatabase("notifications");


  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  const teacherClasses = React.useMemo(() => {
    if (!user) return [];
    return classes.filter(c => c.teacherId === user.uid);
  }, [classes, user]);

  const classStudentIds = React.useMemo(() => {
    const studentIdSet = new Set<string>();
    teacherClasses.forEach(c => {
      if (c.studentIds) {
        Object.keys(c.studentIds).forEach(id => studentIdSet.add(id));
      }
    });
    return Array.from(studentIdSet);
  }, [teacherClasses]);

  const studentsMap = React.useMemo(() => new Map(students.map(s => [s.id, s])), [students]);
  const feesMap = React.useMemo(() => new Map(feeStructures.map(f => [f.id, f.name])), [feeStructures]);

  const classFeeRecords = React.useMemo<EnrichedFeeRecord[]>(() => {
    if (!classStudentIds.length) return [];
    return allStudentFees
      .filter(sf => classStudentIds.includes(sf.studentId))
      .map(sf => {
          const student = studentsMap.get(sf.studentId);
          return {
            ...sf,
            studentName: student?.name || "Unknown Student",
            studentEmail: student?.email,
            feeName: feesMap.get(sf.feeId) || "Unknown Fee",
          };
      })
      .sort((a,b) => a.studentName.localeCompare(b.studentName));
  }, [allStudentFees, classStudentIds, studentsMap, feesMap]);

  const financialSummary = React.useMemo(() => {
    return classFeeRecords.reduce((acc, item) => {
        acc.totalDue += item.amountDue;
        acc.totalPaid += item.amountPaid;
        if(item.status !== 'Paid') {
            acc.totalOutstanding += item.amountDue - item.amountPaid;
        }
        return acc;
    }, { totalDue: 0, totalPaid: 0, totalOutstanding: 0 });
  }, [classFeeRecords]);

  const handleSendReminder = async (fee: EnrichedFeeRecord) => {
    const balance = fee.amountDue - fee.amountPaid;
    if (balance <= 0) {
      toast({ title: "No outstanding balance", variant: "default" });
      return;
    }
    
    try {
        await addNotification({
            type: 'fee_reminder',
            message: `Reminder: You have an outstanding balance of GH₵${balance.toFixed(2)} for ${fee.feeName}.`,
            read: false,
            recipientId: fee.studentId
        } as any);

        toast({
        title: "Reminder Sent!",
        description: `A fee reminder has been sent to ${fee.studentName}.`,
        });
    } catch (error) {
        console.error("Failed to send reminder:", error);
        toast({ title: "Error", description: "Could not send reminder.", variant: "destructive" });
    }
  };
  
  const columns: ColumnDef<EnrichedFeeRecord>[] = [
    { accessorKey: "studentName", header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Student <ArrowUpDown className="ml-2 h-4 w-4" /></Button> },
    { accessorKey: "feeName", header: "Fee Description" },
    { accessorKey: "balance", header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Balance <ArrowUpDown className="ml-2 h-4 w-4" /></Button>, cell: ({ row }) => `GH₵${(row.original.amountDue - row.original.amountPaid).toLocaleString()}` },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <Badge className={cn("border-transparent", { "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300": row.original.status === 'Paid', "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300": row.original.status === 'Unpaid', "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300": row.original.status === 'Partial' })}>{row.original.status}</Badge>},
    { id: "actions", cell: ({ row }) => {
        const fee = row.original;
        const student = studentsMap.get(fee.studentId);
        return (
             <div className="text-right space-x-2">
                <Button variant="outline" size="sm" onClick={() => handleSendReminder(fee)}>
                    <Send className="mr-2 h-4 w-4" /> Reminder
                </Button>
                <Button variant="outline" size="sm" onClick={() => student && generateInvoice(fee, student, toast)}>
                    <FileText className="mr-2 h-4 w-4" /> Invoice
                </Button>
            </div>
        )
    }}
  ];
  
  const table = useReactTable({
    data: classFeeRecords,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting, columnFilters },
  });

  const loading = classesLoading || studentsLoading || studentFeesLoading || feesLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Class Fee Status</CardTitle>
        <CardDescription>
          Overview of fee payments for students in your classes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-blue-50 dark:bg-blue-900/30">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-300">Total Fees Due</CardTitle>
                    <DollarSign className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-800 dark:text-blue-300">GH₵{financialSummary.totalDue.toLocaleString()}</div>
                </CardContent>
            </Card>
            <Card className="bg-green-50 dark:bg-green-900/30">
                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-green-800 dark:text-green-300">Total Paid</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-800 dark:text-green-300">GH₵{financialSummary.totalPaid.toLocaleString()}</div>
                </CardContent>
            </Card>
            <Card className="bg-red-50 dark:bg-red-900/30">
                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-red-800 dark:text-red-300">Total Outstanding</CardTitle>
                    <TrendingDown className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-800 dark:text-red-300">GH₵{financialSummary.totalOutstanding.toLocaleString()}</div>
                </CardContent>
            </Card>
        </div>
        
        <div className="flex items-center gap-4">
            <Input
              placeholder="Filter by student name..."
              value={(table.getColumn("studentName")?.getFilterValue() as string) ?? ""}
              onChange={(event) => table.getColumn("studentName")?.setFilterValue(event.target.value)}
              className="max-w-sm"
            />
            <Select value={(table.getColumn("status")?.getFilterValue() as string) ?? "all"} onValueChange={(value) => table.getColumn("status")?.setFilterValue(value === "all" ? null : value)}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Unpaid">Unpaid</SelectItem>
                    <SelectItem value="Partial">Partial</SelectItem>
                </SelectContent>
            </Select>
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No fee records found for students in your classes.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

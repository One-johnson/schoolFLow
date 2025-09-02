
"use client";

import * as React from "react";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { useDatabase } from "@/hooks/use-database";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
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
import { cn } from "@/lib/utils";
import { Loader2, FileText, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";


type StudentFee = {
  id: string; // Composite key studentId_feeId
  studentId: string;
  feeId: string;
  amountDue: number;
  amountPaid: number;
  status: "Paid" | "Unpaid" | "Partial";
};

type FeeStructure = { id: string; name: string; amount: number };

type EnrichedStudentFee = StudentFee & {
  feeName: string;
};

export default function MyFeesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { data: allStudentFees, loading: studentFeesLoading } = useDatabase<StudentFee>("studentFees");
  const { data: feeStructures, loading: feesLoading } = useDatabase<FeeStructure>("feeStructures");

  const feesMap = React.useMemo(() => new Map(feeStructures.map(f => [f.id, f.name])), [feeStructures]);

  const myFees: EnrichedStudentFee[] = React.useMemo(() => {
    if (!user) return [];
    return allStudentFees
      .filter(sf => sf.studentId === user.uid)
      .map(sf => ({
        ...sf,
        feeName: feesMap.get(sf.feeId) || "Unknown Fee",
      }));
  }, [allStudentFees, feesMap, user]);

  const financialSummary = React.useMemo(() => {
    return myFees.reduce((acc, item) => {
        acc.totalDue += item.amountDue;
        acc.totalPaid += item.amountPaid;
        acc.totalOutstanding += item.amountDue - item.amountPaid;
        return acc;
    }, { totalDue: 0, totalPaid: 0, totalOutstanding: 0 });
  }, [myFees]);
  
  const handleGenerateInvoice = (fee: EnrichedStudentFee) => {
    if (!user) return;

    try {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("SchoolFlow", 105, 20, { align: "center" });
        doc.setFontSize(16);
        doc.setFont("helvetica", "normal");
        doc.text("Fee Invoice", 105, 30, { align: "center" });

        // Student Info
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Bill To:", 20, 50);
        doc.setFont("helvetica", "normal");
        doc.text(user.displayName || "Student", 20, 57);
        doc.text(user.email || "", 20, 64);

        // Invoice Info
        doc.setFont("helvetica", "bold");
        doc.text("Invoice #:", 150, 50);
        doc.setFont("helvetica", "normal");
        doc.text(fee.id.substring(0, 10), 175, 50);
        doc.setFont("helvetica", "bold");
        doc.text("Date:", 150, 57);
        doc.setFont("helvetica", "normal");
        doc.text(new Date().toLocaleDateString(), 175, 57);

        // Table
        (doc as any).autoTable({
            startY: 80,
            head: [["Description", "Amount Due", "Amount Paid", "Balance"]],
            body: [[
                fee.feeName, 
                `GH₵${fee.amountDue.toLocaleString()}`, 
                `GH₵${fee.amountPaid.toLocaleString()}`, 
                `GH₵${(fee.amountDue - fee.amountPaid).toLocaleString()}`
            ]],
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185] }
        });

        // Footer
        doc.setFontSize(10);
        doc.text("Thank you for your payment!", 105, (doc as any).lastAutoTable.finalY + 20, { align: 'center' });
        doc.text("Please contact support if you have any questions.", 105, (doc as any).lastAutoTable.finalY + 25, { align: 'center' });


        doc.save(`invoice-${fee.feeName.replace(/ /g, '_')}.pdf`);
        toast({
            title: "Invoice Generated",
            description: "Your PDF invoice has been downloaded."
        });
    } catch(e) {
        console.error(e);
        toast({
            title: "Error Generating Invoice",
            description: "Could not generate PDF. See console for details.",
            variant: "destructive"
        })
    }
  }

  const loading = studentFeesLoading || feesLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Fees</CardTitle>
        <CardDescription>
          Here is a summary of your fees and payment status.
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

        <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                    <TableHead>Fee Description</TableHead>
                    <TableHead className="text-right">Amount Due</TableHead>
                    <TableHead className="text-right">Amount Paid</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                    </TableCell>
                  </TableRow>
                ) : myFees.length > 0 ? (
                  myFees.map((fee) => (
                    <TableRow key={fee.id}>
                        <TableCell className="font-medium">{fee.feeName}</TableCell>
                        <TableCell className="text-right">GH₵{fee.amountDue.toLocaleString()}</TableCell>
                        <TableCell className="text-right">GH₵{fee.amountPaid.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-semibold">GH₵{(fee.amountDue - fee.amountPaid).toLocaleString()}</TableCell>
                        <TableCell className="text-center">
                             <Badge className={cn("border-transparent", {
                                "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300": fee.status === 'Paid',
                                "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300": fee.status === 'Unpaid',
                                "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300": fee.status === 'Partial'
                             })}>{fee.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={() => handleGenerateInvoice(fee)}>
                                <FileText className="mr-2 h-4 w-4" />
                                Invoice
                            </Button>
                        </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No fees have been assigned to you yet.
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

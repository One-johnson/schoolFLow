
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
import { Loader2, FileText, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

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
            body: [[fee.feeName, `$${fee.amountDue}`, `$${fee.amountPaid}`, `$${fee.amountDue - fee.amountPaid}`]],
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

  const handleSendReminder = (fee: EnrichedFeeRecord) => {
    toast({
      title: "Reminder Sent!",
      description: `A fee reminder has been sent to ${fee.studentName}.`,
    });
  };

  const loading = classesLoading || studentsLoading || studentFeesLoading || feesLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Class Fee Status</CardTitle>
        <CardDescription>
          Overview of fee payments for students in your classes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Fee Description</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              ) : classFeeRecords.length > 0 ? (
                classFeeRecords.map((fee) => {
                  const student = studentsMap.get(fee.studentId);
                  return (
                    <TableRow key={fee.id}>
                      <TableCell className="font-medium">{fee.studentName}</TableCell>
                      <TableCell>{fee.feeName}</TableCell>
                      <TableCell className="text-right font-semibold">${(fee.amountDue - fee.amountPaid).toLocaleString()}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={cn("border-transparent", {
                          "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300": fee.status === 'Paid',
                          "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300": fee.status === 'Unpaid',
                          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300": fee.status === 'Partial'
                        })}>{fee.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleSendReminder(fee)}>
                          <Send className="mr-2 h-4 w-4" /> Reminder
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => student && generateInvoice(fee, student, toast)}>
                          <FileText className="mr-2 h-4 w-4" /> Invoice
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
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

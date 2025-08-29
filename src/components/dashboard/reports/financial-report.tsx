
"use client"

import * as React from "react"
import { useDatabase } from "@/hooks/use-database"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, FileDown, Printer } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import jsPDF from "jspdf"
import "jspdf-autotable"

// Types
type Student = { id: string; name: string };
type Class = { id: string; name: string; studentIds?: Record<string, boolean>, teacherId?: string };
type FeeStructure = { id: string; name: string; };
type StudentFee = { id: string; studentId: string; feeId: string; amountDue: number; amountPaid: number; status: "Paid" | "Unpaid" | "Partial"; };
type EnrichedFeeRecord = StudentFee & { studentName: string; className: string; feeName: string; };

export default function FinancialReport() {
    const { user, role } = useAuth();
    const { data: students, loading: studentsLoading } = useDatabase<Student>("students");
    const { data: classes, loading: classesLoading } = useDatabase<Class>("classes");
    const { data: studentFees, loading: feesLoading } = useDatabase<StudentFee>("studentFees");
    const { data: feeStructures, loading: structuresLoading } = useDatabase<FeeStructure>("feeStructures");

    const [selectedClassId, setSelectedClassId] = React.useState<string>("all");
    const [selectedFeeStatus, setSelectedFeeStatus] = React.useState<"all" | "Paid" | "Unpaid" | "Partial">("all");

    const loading = studentsLoading || classesLoading || feesLoading || structuresLoading;

    // Mapped data for easy lookup
    const studentsMap = React.useMemo(() => new Map(students.map(s => [s.id, s.name])), [students]);
    const studentClassMap = React.useMemo(() => {
        const map = new Map<string, string>();
        classes.forEach(c => {
            if (c.studentIds) {
                Object.keys(c.studentIds).forEach(studentId => {
                    map.set(studentId, c.name);
                });
            }
        });
        return map;
    }, [classes]);
    const feeStructuresMap = React.useMemo(() => new Map(feeStructures.map(f => [f.id, f.name])), [feeStructures]);
    
    const teacherClasses = React.useMemo(() => {
        if(role !== 'teacher' || !user) return classes;
        return classes.filter(c => c.teacherId === user.uid);
    }, [classes, role, user]);
    
    const studentIdsInTeacherClasses = React.useMemo(() => {
        const ids = new Set<string>();
        if (role !== 'teacher') return ids;
        teacherClasses.forEach(c => {
            if (c.studentIds) Object.keys(c.studentIds).forEach(id => ids.add(id));
        });
        return ids;
    }, [teacherClasses, role]);


    const filteredData = React.useMemo<EnrichedFeeRecord[]>(() => {
        let data: EnrichedFeeRecord[] = studentFees.map(fee => ({
            ...fee,
            studentName: studentsMap.get(fee.studentId) || 'Unknown Student',
            className: studentClassMap.get(fee.studentId) || 'N/A',
            feeName: feeStructuresMap.get(fee.feeId) || 'Unknown Fee',
        }));

        if (role === 'teacher') {
            data = data.filter(d => studentIdsInTeacherClasses.has(d.studentId));
        }

        if (selectedClassId !== 'all') {
            const classStudents = new Set(Object.keys(classes.find(c => c.id === selectedClassId)?.studentIds || {}));
            data = data.filter(d => classStudents.has(d.studentId));
        }
        if (selectedFeeStatus !== 'all') {
            data = data.filter(d => d.status === selectedFeeStatus);
        }
        
        return data;
    }, [studentFees, studentsMap, studentClassMap, feeStructuresMap, role, studentIdsInTeacherClasses, selectedClassId, selectedFeeStatus, classes]);

    const financialSummary = React.useMemo(() => {
        return filteredData.reduce((acc, item) => {
            acc.totalDue += item.amountDue;
            acc.totalPaid += item.amountPaid;
            if(item.status !== 'Paid') {
              acc.totalOutstanding += item.amountDue - item.amountPaid;
            }
            return acc;
        }, { totalDue: 0, totalPaid: 0, totalOutstanding: 0 });
    }, [filteredData]);

     const handlePrint = () => {
        const doc = new jsPDF();
        doc.text("Financial Report", 14, 16);
        (doc as any).autoTable({
          startY: 20,
          head: [['Student', 'Class', 'Fee', 'Amount Due', 'Amount Paid', 'Balance', 'Status']],
          body: filteredData.map(r => [
              r.studentName,
              r.className, 
              r.feeName, 
              `GH₵${r.amountDue.toFixed(2)}`,
              `GH₵${r.amountPaid.toFixed(2)}`,
              `GH₵${(r.amountDue - r.amountPaid).toFixed(2)}`,
              r.status
            ]),
        });
        doc.save('financial-report.pdf');
    };

    const handleExport = () => {
        const headers = ["Student", "Class", "Fee", "Amount Due", "Amount Paid", "Balance", "Status"];
        const csvContent = [
            headers.join(','),
            ...filteredData.map(r => [
                r.studentName,
                r.className, 
                r.feeName, 
                r.amountDue,
                r.amountPaid,
                r.amountDue - r.amountPaid,
                r.status
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'financial-report.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Financial Report</CardTitle>
                <CardDescription>Filter and view student fee payment information.</CardDescription>
                <div className="flex flex-wrap gap-4 pt-4">
                    <Select onValueChange={setSelectedClassId} value={selectedClassId}>
                        <SelectTrigger className="w-[180px]"><SelectValue placeholder="Select Class" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Classes</SelectItem>
                            {teacherClasses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select onValueChange={(v) => setSelectedFeeStatus(v as any)} value={selectedFeeStatus}>
                        <SelectTrigger className="w-[180px]"><SelectValue placeholder="Select Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="Paid">Paid</SelectItem>
                            <SelectItem value="Unpaid">Unpaid</SelectItem>
                            <SelectItem value="Partial">Partial</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
             <CardContent>
                <div className="grid gap-4 md:grid-cols-3 mb-6">
                    <Card className="bg-blue-50 dark:bg-blue-900/30">
                        <CardHeader>
                            <CardTitle className="text-blue-800 dark:text-blue-300">Total Amount Due</CardTitle>
                            <CardDescription>Total fees invoiced to selected students.</CardDescription>
                            <p className="text-2xl font-bold text-blue-800 dark:text-blue-300">GH₵{financialSummary.totalDue.toLocaleString()}</p>
                        </CardHeader>
                    </Card>
                    <Card className="bg-green-50 dark:bg-green-900/30">
                         <CardHeader>
                            <CardTitle className="text-green-800 dark:text-green-300">Total Amount Paid</CardTitle>
                            <CardDescription>Total payments received from selected students.</CardDescription>
                            <p className="text-2xl font-bold text-green-800 dark:text-green-300">GH₵{financialSummary.totalPaid.toLocaleString()}</p>
                        </CardHeader>
                    </Card>
                    <Card className="bg-red-50 dark:bg-red-900/30">
                         <CardHeader>
                            <CardTitle className="text-red-800 dark:text-red-300">Total Outstanding</CardTitle>
                            <CardDescription>Total balance remaining to be paid.</CardDescription>
                            <p className="text-2xl font-bold text-red-800 dark:text-red-300">GH₵{financialSummary.totalOutstanding.toLocaleString()}</p>
                        </CardHeader>
                    </Card>
                </div>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Class</TableHead>
                                <TableHead>Fee</TableHead>
                                <TableHead className="text-right">Amount Due</TableHead>
                                <TableHead className="text-right">Amount Paid</TableHead>
                                <TableHead className="text-right">Balance</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                             {loading ? (
                                <TableRow><TableCell colSpan={7} className="h-24 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></TableCell></TableRow>
                            ) : filteredData.length > 0 ? (
                                filteredData.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.studentName}</TableCell>
                                        <TableCell>{item.className}</TableCell>
                                        <TableCell>{item.feeName}</TableCell>
                                        <TableCell className="text-right">GH₵{item.amountDue.toFixed(2)}</TableCell>
                                        <TableCell className="text-right">GH₵{item.amountPaid.toFixed(2)}</TableCell>
                                        <TableCell className="text-right font-semibold">GH₵{(item.amountDue - item.amountPaid).toFixed(2)}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge className={cn("border-transparent", {
                                            "bg-green-100 text-green-800": item.status === 'Paid',
                                            "bg-red-100 text-red-800": item.status === 'Unpaid',
                                            "bg-yellow-100 text-yellow-800": item.status === 'Partial'
                                            })}>{item.status}</Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={7} className="h-24 text-center">No financial records found for the selected filters.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 print-hidden">
                <Button variant="outline" onClick={handlePrint} disabled={filteredData.length === 0}><Printer className="mr-2 h-4 w-4"/> Print</Button>
                <Button onClick={handleExport} disabled={filteredData.length === 0}><FileDown className="mr-2 h-4 w-4"/> Export to CSV</Button>
            </CardFooter>
        </Card>
    );
}

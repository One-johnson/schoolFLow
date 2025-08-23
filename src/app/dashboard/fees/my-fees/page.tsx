
"use client";

import * as React from "react";
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
import { Loader2, FileText } from "lucide-react";
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
  
  // We fetch all student fees and then filter, which is not ideal for performance
  // but works for this demo. In a real app, you'd query Firebase directly for the user's fees.
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
  
  const handleGenerateInvoice = (fee: EnrichedStudentFee) => {
      toast({
          title: "Coming Soon!",
          description: "PDF invoice generation will be implemented in a future step."
      })
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
      <CardContent>
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
                        <TableCell className="text-right">${fee.amountDue.toLocaleString()}</TableCell>
                        <TableCell className="text-right">${fee.amountPaid.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-semibold">${(fee.amountDue - fee.amountPaid).toLocaleString()}</TableCell>
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

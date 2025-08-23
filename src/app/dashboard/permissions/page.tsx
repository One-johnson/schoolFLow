
"use client"

import * as React from "react"
import { useAuth } from "@/hooks/use-auth"
import { useDatabase } from "@/hooks/use-database"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  PlusCircle,
  Loader2,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Clock,
  Check,
  X,
  User,
  Building,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"

type User = {
    id: string;
    name: string;
    avatarUrl?: string;
}

type Class = {
  id: string;
  name: string;
  teacherId?: string;
  studentIds?: Record<string, boolean>;
};

type PermissionSlip = {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  teacherId?: string;
  reason: string;
  startDate: string;
  endDate: string;
  status: "Pending" | "Approved" | "Rejected";
  createdAt: number;
}

const statusConfig = {
    Pending: { icon: Clock, color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300" },
    Approved: { icon: CheckCircle2, color: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300" },
    Rejected: { icon: XCircle, color: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300" },
}


export default function PermissionsPage() {
  const { user, role } = useAuth();
  const { data: permissionSlips, addData, updateData, loading: slipsLoading } = useDatabase<PermissionSlip>("permissionSlips");
  const { data: classes, loading: classesLoading } = useDatabase<Class>('classes');
  const { data: users, loading: usersLoading } = useDatabase<User>("users");
  
  const [isRequestDialogOpen, setIsRequestDialogOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const usersMap = React.useMemo(() => new Map(users.map(u => [u.id, u])), [users]);

  const studentClass = React.useMemo(() => {
    if (role !== 'student' || !user) return null;
    return classes.find(c => c.studentIds && user.uid && c.studentIds[user.uid]);
  }, [classes, user, role]);

  const studentSlips = React.useMemo(() => {
      if (role !== 'student' || !user) return [];
      return permissionSlips
        .filter(slip => slip.studentId === user.uid)
        .sort((a,b) => b.createdAt - a.createdAt);
  }, [permissionSlips, user, role]);

  const teacherSlips = React.useMemo(() => {
      if (role !== 'teacher' || !user) return [];
      return permissionSlips
        .filter(slip => slip.teacherId === user.uid)
        .sort((a,b) => b.createdAt - a.createdAt);
  }, [permissionSlips, user, role]);
  
  const allSlipsSorted = React.useMemo(() => {
      return [...permissionSlips].sort((a, b) => b.createdAt - a.createdAt);
  }, [permissionSlips]);

  const handleRequestSubmit = async () => {
    if (!reason.trim() || !dateRange?.from || !dateRange?.to) {
        toast({ title: "Error", description: "Reason and date range are required.", variant: "destructive" });
        return;
    }
    if (!studentClass) {
        toast({ title: "Error", description: "You are not enrolled in any class.", variant: "destructive" });
        return;
    }

    setIsLoading(true);
    try {
        await addData({
            studentId: user!.uid,
            studentName: user!.displayName || "Unknown",
            classId: studentClass.id,
            className: studentClass.name,
            teacherId: studentClass.teacherId,
            reason,
            startDate: format(dateRange.from, "yyyy-MM-dd"),
            endDate: format(dateRange.to, "yyyy-MM-dd"),
            status: "Pending",
        } as Omit<PermissionSlip, 'id' | 'createdAt'>);
        toast({ title: "Success", description: "Your leave request has been submitted." });
        setReason("");
        setDateRange({ from: new Date(), to: new Date() });
        setIsRequestDialogOpen(false);
    } catch (error) {
        toast({ title: "Error", description: "Failed to submit request.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  }

  const handleUpdateRequestStatus = async (slipId: string, status: "Approved" | "Rejected") => {
      setIsLoading(true);
      try {
          await updateData(slipId, { status });
          toast({ title: "Success", description: `Request has been ${status.toLowerCase()}.` });
      } catch (error) {
           toast({ title: "Error", description: "Failed to update request.", variant: "destructive" });
      } finally {
          setIsLoading(false);
      }
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    const names = name.split(' ');
    if (names.length > 1) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
  
  const PermissionSlipCard = ({ slip }: { slip: PermissionSlip }) => {
    const StatusIcon = statusConfig[slip.status].icon;
    const studentUser = usersMap.get(slip.studentId);

    return (
         <Card>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                         <Avatar>
                            <AvatarImage src={studentUser?.avatarUrl} alt={slip.studentName} />
                            <AvatarFallback>{getInitials(slip.studentName)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-base">{slip.studentName}</CardTitle>
                            <CardDescription>{slip.className}</CardDescription>
                        </div>
                    </div>
                    <Badge className={cn("border-transparent", statusConfig[slip.status].color)}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {slip.status}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm font-semibold">{format(new Date(slip.startDate), "MMM d, yyyy")} - {format(new Date(slip.endDate), "MMM d, yyyy")}</p>
                <p className="text-sm text-muted-foreground mt-2">{slip.reason}</p>
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-2">
                 {role === 'teacher' && slip.status === 'Pending' && (
                    <div className="flex w-full gap-2">
                        <Button className="w-full" size="sm" onClick={() => handleUpdateRequestStatus(slip.id, 'Approved')} disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                            Approve
                        </Button>
                        <Button className="w-full" size="sm" variant="destructive" onClick={() => handleUpdateRequestStatus(slip.id, 'Rejected')} disabled={isLoading}>
                           {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
                            Reject
                        </Button>
                    </div>
                )}
                <p className="text-xs text-muted-foreground">Submitted on {format(new Date(slip.createdAt), "MMM d, yyyy")}</p>
            </CardFooter>
        </Card>
    )
  }


  const renderStudentView = () => (
    <>
        <div className="flex items-center justify-between">
            <p className="text-muted-foreground">View your leave requests or submit a new one.</p>
            <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
                <DialogTrigger asChild>
                    <Button><PlusCircle className="mr-2 h-4 w-4" /> Request Leave</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Request Leave of Absence</DialogTitle>
                        <DialogDescription>Fill out the form below. Your teacher will be notified to review it.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="date" className="text-right">Dates</Label>
                            <div className="col-span-3">
                               <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                    id="date"
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !dateRange && "text-muted-foreground"
                                    )}
                                    >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange?.from ? (
                                        dateRange.to ? (
                                        <>
                                            {format(dateRange.from, "LLL dd, y")} -{" "}
                                            {format(dateRange.to, "LLL dd, y")}
                                        </>
                                        ) : (
                                        format(dateRange.from, "LLL dd, y")
                                        )
                                    ) : (
                                        <span>Pick a date range</span>
                                    )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={dateRange?.from}
                                    selected={dateRange}
                                    onSelect={setDateRange}
                                    numberOfMonths={2}
                                    />
                                </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                         <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="reason" className="text-right pt-2">Reason</Label>
                            <Textarea id="reason" placeholder="Please provide a reason for your absence (e.g., Doctor's appointment)." className="col-span-3" value={reason} onChange={(e) => setReason(e.target.value)} disabled={isLoading} />
                        </div>
                    </div>
                     <DialogFooter>
                        <Button type="submit" onClick={handleRequestSubmit} disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Request
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
            {slipsLoading || usersLoading ? (
                <p>Loading requests...</p>
            ) : studentSlips.length > 0 ? (
                studentSlips.map(slip => <PermissionSlipCard key={slip.id} slip={slip} />)
            ) : (
                <p className="text-muted-foreground col-span-full text-center py-8">You have not submitted any leave requests.</p>
            )}
        </div>
    </>
  )

  const renderTeacherView = () => (
    <div>
        <p className="text-muted-foreground">Review and approve leave requests from your students.</p>
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
            {slipsLoading || usersLoading ? (
                <p>Loading requests...</p>
            ) : teacherSlips.length > 0 ? (
                teacherSlips.map(slip => <PermissionSlipCard key={slip.id} slip={slip} />)
            ) : (
                <p className="text-muted-foreground col-span-full text-center py-8">There are no pending leave requests from your students.</p>
            )}
        </div>
    </div>
  )

  const renderAdminView = () => {
    const pendingSlips = allSlipsSorted.filter(s => s.status === 'Pending');
    const processedSlips = allSlipsSorted.filter(s => s.status !== 'Pending');

    return (
        <div>
            <p className="text-muted-foreground">View all leave requests submitted across the school.</p>
             <Tabs defaultValue="pending" className="mt-4">
                <TabsList>
                    <TabsTrigger value="pending">Pending <Badge className="ml-2">{pendingSlips.length}</Badge></TabsTrigger>
                    <TabsTrigger value="processed">Processed</TabsTrigger>
                </TabsList>
                <TabsContent value="pending">
                     <ScrollArea className="h-[60vh] mt-4">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pr-4">
                            {slipsLoading || usersLoading ? (
                                <p>Loading requests...</p>
                            ) : pendingSlips.length > 0 ? (
                                pendingSlips.map(slip => <PermissionSlipCard key={slip.id} slip={slip} />)
                            ) : (
                                <div className="col-span-full text-center py-16">
                                    <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
                                    <p className="mt-4 text-muted-foreground">No pending requests to show.</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </TabsContent>
                <TabsContent value="processed">
                    <ScrollArea className="h-[60vh] mt-4">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pr-4">
                             {slipsLoading || usersLoading ? (
                                <p>Loading requests...</p>
                            ) : processedSlips.length > 0 ? (
                                processedSlips.map(slip => <PermissionSlipCard key={slip.id} slip={slip} />)
                            ) : (
                                <div className="col-span-full text-center py-16">
                                    <p className="mt-4 text-muted-foreground">No processed requests yet.</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </TabsContent>
             </Tabs>
        </div>
    )
  }


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        {role === 'student' && <User className="h-8 w-8" />}
        {role === 'teacher' && <User className="h-8 w-8" />}
        {role === 'admin' && <Building className="h-8 w-8" />}
        <div>
            <h1 className="text-3xl font-bold tracking-tight">
                {role === 'student' && "My Leave Requests"}
                {role === 'teacher' && "Student Leave Requests"}
                {role === 'admin' && "School-Wide Permissions"}
            </h1>
         </div>
      </div>
      
      {slipsLoading || classesLoading || usersLoading ? (
         <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
        <>
            {role === 'student' && renderStudentView()}
            {role === 'teacher' && renderTeacherView()}
            {role === 'admin' && renderAdminView()}
        </>
      )}
      
    </div>
  )
}

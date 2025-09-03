
"use client";

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDatabase } from '@/hooks/use-database';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, User, BookOpen, Briefcase, Calendar, Edit, ChevronDown, Save } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { update, ref, serverTimestamp } from 'firebase/database';
import { database } from '@/lib/firebase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';


type Teacher = { id: string; name: string; email: string; status: "Active" | "On Leave" | "Retired"; dateOfBirth?: string; academicQualification?: string; dateOfEmployment?: string; contact?: string; department?: string; employmentType?: "Full Time" | "Part Time" | "Contract"; gender?: "Male" | "Female" | "Other"; address?: string; avatarUrl?: string; teacherId?: string; };
type Class = { id: string; name: string; teacherId?: string };
type Subject = { id: string; name: string; teacherIds?: Record<string, boolean> };

const DetailItem = ({ label, value }: { label: string, value?: string | number | null }) => (
    <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium">{value || 'N/A'}</p>
    </div>
);

export default function TeacherProfilePage() {
    const params = useParams();
    const router = useRouter();
    const teacherId = params.id as string;
    const { user, role } = useAuth();
    const { toast } = useToast();

    const { data: teachers, updateData: updateTeacherData, loading: teachersLoading } = useDatabase<Teacher>('teachers');
    const { data: classes, loading: classesLoading } = useDatabase<Class>('classes');
    const { data: subjects, loading: subjectsLoading } = useDatabase<Subject>('subjects');

    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
    const [editState, setEditState] = React.useState<Partial<Teacher>>({});
    const [isUpdating, setIsUpdating] = React.useState(false);
    const [dob, setDob] = React.useState<Date | undefined>();
    const [doe, setDoe] = React.useState<Date | undefined>();

    const loading = teachersLoading || classesLoading || subjectsLoading;

    const teacher = React.useMemo(() => teachers.find(t => t.id === teacherId), [teachers, teacherId]);
    const assignedClass = React.useMemo(() => classes.find(c => c.teacherId === teacherId), [classes, teacherId]);
    const assignedSubjects = React.useMemo(() => subjects.filter(s => s.teacherIds && s.teacherIds[teacherId]), [subjects, teacherId]);
    
    const canEditProfile = role === 'admin' || (role === 'teacher' && user?.uid === teacherId);

    const openEditDialog = () => {
        if (teacher) {
            setEditState(teacher);
            setDob(teacher.dateOfBirth ? parseISO(teacher.dateOfBirth) : undefined);
            setDoe(teacher.dateOfEmployment ? parseISO(teacher.dateOfEmployment) : undefined);
            setIsEditDialogOpen(true);
        }
    };
    
     const handleStatusChange = async (status: Teacher['status']) => {
        if (!teacher) return;
        try {
            await updateTeacherData(teacher.id, { status });
            toast({ title: "Success", description: "Teacher status updated." });
        } catch(err) {
            toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
        }
    }
    
    const handleUpdateProfile = async () => {
        if (!teacher) return;
        setIsUpdating(true);
        try {
            const updates = {
                ...editState,
                dateOfBirth: dob ? format(dob, 'yyyy-MM-dd') : undefined,
                dateOfEmployment: doe ? format(doe, 'yyyy-MM-dd') : undefined,
                updatedAt: serverTimestamp()
            };
            await updateTeacherData(teacher.id, updates);
            await update(ref(database, `users/${teacher.id}`), { name: editState.name, email: editState.email });
            toast({ title: "Success", description: "Profile updated successfully." });
            setIsEditDialogOpen(false);
        } catch (error) {
            toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
        } finally {
            setIsUpdating(false);
        }
    };

    const getInitials = (name: string | null | undefined) => {
        if (!name) return "T";
        const names = name.split(' ');
        return (names[0][0] + (names.length > 1 ? names[names.length - 1][0] : '')).toUpperCase();
    }

    if (loading || !teacher) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }
    
    const statusOptions: Teacher['status'][] = ["Active", "On Leave", "Retired"];

    return (
        <>
            <div className="flex flex-col gap-6">
                <Card>
                    <CardHeader className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={teacher.avatarUrl} alt={teacher.name} />
                            <AvatarFallback className="text-3xl">{getInitials(teacher.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <CardTitle className="text-3xl">{teacher.name}</CardTitle>
                            <CardDescription className="flex items-center gap-4 mt-1">
                                <span>ID: {teacher.teacherId}</span>
                                <span>|</span>
                                <span>{teacher.email}</span>
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            {canEditProfile && <Button variant="outline" onClick={openEditDialog}><Edit className="mr-2 h-4 w-4"/> Edit Profile</Button>}
                             {role === 'admin' && (
                                <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-[160px] justify-between">
                                        {teacher.status}
                                        <ChevronDown className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-[160px]">
                                    {statusOptions.map(status => (
                                        <DropdownMenuItem key={status} onSelect={() => handleStatusChange(status)}>
                                            {status}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                            )}
                        </div>
                    </CardHeader>
                </Card>

                <Tabs defaultValue="professional">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="professional"><Briefcase className="mr-2" /> Professional</TabsTrigger>
                        <TabsTrigger value="personal"><User className="mr-2" /> Personal</TabsTrigger>
                        <TabsTrigger value="assignments"><BookOpen className="mr-2" /> Assignments</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="professional" className="mt-4">
                        <Card>
                            <CardHeader><CardTitle>Professional Information</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <DetailItem label="Department" value={teacher.department} />
                                <DetailItem label="Qualification" value={teacher.academicQualification} />
                                <DetailItem label="Employment Type" value={teacher.employmentType} />
                                <DetailItem label="Date of Employment" value={teacher.dateOfEmployment ? format(parseISO(teacher.dateOfEmployment), 'PPP') : 'N/A'} />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="personal" className="mt-4">
                        <Card>
                            <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <DetailItem label="Full Name" value={teacher.name} />
                                <DetailItem label="Email" value={teacher.email} />
                                <DetailItem label="Contact" value={teacher.contact} />
                                <DetailItem label="Gender" value={teacher.gender} />
                                <DetailItem label="Date of Birth" value={teacher.dateOfBirth ? format(parseISO(teacher.dateOfBirth), 'PPP') : 'N/A'} />
                                <DetailItem label="Address" value={teacher.address} />
                            </CardContent>
                        </Card>
                    </TabsContent>
                    
                    <TabsContent value="assignments" className="mt-4">
                        <Card>
                            <CardHeader><CardTitle>Assignments</CardTitle></CardHeader>
                            <CardContent>
                            <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="font-semibold mb-2">Class Teacher For</h3>
                                        {assignedClass ? (
                                            <p>{assignedClass.name}</p>
                                        ) : <p className="text-muted-foreground">Not assigned as a class teacher.</p>}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-2">Teaches Subjects</h3>
                                        {assignedSubjects.length > 0 ? (
                                            <ul className="list-disc pl-5 space-y-1">
                                                {assignedSubjects.map(s => <li key={s.id}>{s.name}</li>)}
                                            </ul>
                                        ) : <p className="text-muted-foreground">Not assigned to any subjects.</p>}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                </Tabs>
            </div>
            
            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Teacher Profile</DialogTitle>
                        <DialogDescription>Update the teacher's information below.</DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-[60vh] p-1">
                        <Tabs defaultValue="professional" className="p-4">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="professional">Professional</TabsTrigger>
                                <TabsTrigger value="personal">Personal</TabsTrigger>
                            </TabsList>
                            <TabsContent value="professional" className="mt-4">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1"><Label>Department</Label><Input value={editState.department || ''} onChange={(e) => setEditState(p => ({...p, department: e.target.value}))} disabled={isUpdating || role !== 'admin'} /></div>
                                        <div className="space-y-1"><Label>Qualification</Label><Input value={editState.academicQualification || ''} onChange={(e) => setEditState(p => ({...p, academicQualification: e.target.value}))} disabled={isUpdating} /></div>
                                        <div className="space-y-1"><Label>Employment Type</Label>
                                            <Select value={editState.employmentType} onValueChange={(v: Teacher['employmentType']) => setEditState(p => ({...p, employmentType: v}))} disabled={isUpdating || role !== 'admin'}>
                                                <SelectTrigger><SelectValue/></SelectTrigger>
                                                <SelectContent><SelectItem value="Full Time">Full Time</SelectItem><SelectItem value="Part Time">Part Time</SelectItem><SelectItem value="Contract">Contract</SelectItem></SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1"><Label>Date of Employment</Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal",!doe && "text-muted-foreground")} disabled={isUpdating || role !== 'admin'}><CalendarIcon className="mr-2 h-4 w-4" />{doe ? format(doe, "PPP") : <span>Pick a date</span>}</Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={doe} onSelect={setDoe} /></PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                            <TabsContent value="personal" className="mt-4">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1"><Label>Full Name</Label><Input value={editState.name || ''} onChange={(e) => setEditState(p => ({...p, name: e.target.value}))} disabled={isUpdating || role !== 'admin'} /></div>
                                        <div className="space-y-1"><Label>Email</Label><Input type="email" value={editState.email || ''} onChange={(e) => setEditState(p => ({...p, email: e.target.value}))} disabled={isUpdating || role !== 'admin'} /></div>
                                        <div className="space-y-1"><Label>Contact</Label><Input value={editState.contact || ''} onChange={(e) => setEditState(p => ({...p, contact: e.target.value}))} disabled={isUpdating} /></div>
                                        <div className="space-y-1"><Label>Gender</Label>
                                            <Select value={editState.gender} onValueChange={(v: Teacher['gender']) => setEditState(p => ({...p, gender: v}))} disabled={isUpdating || role !== 'admin'}>
                                                <SelectTrigger><SelectValue/></SelectTrigger>
                                                <SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1"><Label>Date of Birth</Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal",!dob && "text-muted-foreground")} disabled={isUpdating || role !== 'admin'}><CalendarIcon className="mr-2 h-4 w-4" />{dob ? format(dob, "PPP") : <span>Pick a date</span>}</Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dob} onSelect={setDob} /></PopoverContent>
                                            </Popover>
                                        </div>
                                        <div className="space-y-1"><Label>Address</Label><Input value={editState.address || ''} onChange={(e) => setEditState(p => ({...p, address: e.target.value}))} disabled={isUpdating} /></div>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </ScrollArea>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdateProfile} disabled={isUpdating}><Save className="mr-2 h-4 w-4"/>{isUpdating ? <Loader2 className="animate-spin"/> : 'Save Changes'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}


    

"use client";

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useDatabase } from '@/hooks/use-database';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, User, BookOpen, Briefcase, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';

type Teacher = { id: string; name: string; email: string; status: "Active" | "On Leave" | "Retired"; dateOfBirth?: string; academicQualification?: string; dateOfEmployment?: string; contact?: string; department?: string; employmentType?: "Full Time" | "Part Time" | "Contract"; gender?: "Male" | "Female" | "Other"; address?: string; avatarUrl?: string; };
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
    const teacherId = params.id as string;

    const { data: teachers, loading: teachersLoading } = useDatabase<Teacher>('teachers');
    const { data: classes, loading: classesLoading } = useDatabase<Class>('classes');
    const { data: subjects, loading: subjectsLoading } = useDatabase<Subject>('subjects');

    const loading = teachersLoading || classesLoading || subjectsLoading;

    const teacher = React.useMemo(() => teachers.find(t => t.id === teacherId), [teachers, teacherId]);
    
    const assignedClass = React.useMemo(() => classes.find(c => c.teacherId === teacherId), [classes, teacherId]);
    
    const assignedSubjects = React.useMemo(() => {
        return subjects.filter(s => s.teacherIds && s.teacherIds[teacherId]);
    }, [subjects, teacherId]);
    
    const getInitials = (name: string | null | undefined) => {
        if (!name) return "T";
        const names = name.split(' ');
        return (names[0][0] + (names.length > 1 ? names[names.length - 1][0] : '')).toUpperCase();
    }

    if (loading || !teacher) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }

    return (
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
                            <span>ID: {teacher.id}</span>
                            <span>|</span>
                            <span>{teacher.email}</span>
                        </CardDescription>
                    </div>
                     <CardDescription className="flex items-center gap-4 mt-1">
                        <span className="font-semibold">Status:</span>
                        <span>{teacher.status}</span>
                    </CardDescription>
                </CardHeader>
            </Card>

            <Tabs defaultValue="personal">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="personal"><User className="mr-2" /> Personal</TabsTrigger>
                    <TabsTrigger value="professional"><Briefcase className="mr-2" /> Professional</TabsTrigger>
                    <TabsTrigger value="assignments"><BookOpen className="mr-2" /> Assignments</TabsTrigger>
                </TabsList>

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
    );
}



"use client";

import * as React from "react";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TeacherAssignmentsView from "@/components/dashboard/assignments/teacher-view";
import StudentAssignmentsView from "@/components/dashboard/assignments/student-view";
import { Home } from "lucide-react";

export default function AssignmentsPage() {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = React.useState(role === 'student' ? 'student' : 'teacher');

  React.useEffect(() => {
      setActiveTab(role === 'student' ? 'student' : 'teacher');
  }, [role]);

  if (!role) return null;

  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center gap-4">
        <Home className="h-8 w-8" />
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
            <p className="text-muted-foreground">
              Manage, submit, and review class assignments.
            </p>
        </div>
      </div>
      
       {role === 'admin' ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="teacher">Teacher View</TabsTrigger>
                    <TabsTrigger value="student">Student View</TabsTrigger>
                </TabsList>
                <TabsContent value="teacher">
                    <TeacherAssignmentsView />
                </TabsContent>
                <TabsContent value="student">
                    <StudentAssignmentsView />
                </TabsContent>
            </Tabs>
        ) : role === 'teacher' ? (
             <TeacherAssignmentsView />
        ) : (
            <StudentAssignmentsView />
        )}
    </div>
  );
}

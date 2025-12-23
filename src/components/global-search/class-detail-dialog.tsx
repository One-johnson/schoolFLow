"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Calendar, BookOpen, GraduationCap } from "lucide-react";
import { format } from "date-fns";
import type { Id } from "../../../convex/_generated/dataModel";

interface ClassDetailDialogProps {
  open: boolean;
  onClose: () => void;
  classData: Record<string, unknown>;
}

export function ClassDetailDialog({
  open,
  onClose,
  classData,
}: ClassDetailDialogProps) {
  const classId = classData.id as Id<"classes">;
  const schoolId = classData.schoolId as Id<"schools">;

  // Get students in this class
  const students = useQuery(
    api.students.getSchoolStudents,
    open ? { schoolId, classId } : "skip"
  );

  // Get sections for this class
  const sections = useQuery(
    api.sections.getSections,
    open ? { classId } : "skip"
  );

  const name = classData.name as string;
  const level = classData.level as number;
  const academicYear = classData.academicYear as string;
  const description = classData.description as string | undefined;
  const createdAt = classData.createdAt as number;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Class Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Section */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                {level}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{name}</h2>
                <p className="text-sm text-gray-500">Level {level}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="outline">
                <Calendar className="h-3 w-3 mr-1" />
                {academicYear}
              </Badge>
              <Badge variant="secondary">
                <Users className="h-3 w-3 mr-1" />
                {students?.length || 0} Students
              </Badge>
              <Badge variant="secondary">
                <BookOpen className="h-3 w-3 mr-1" />
                {sections?.length || 0} Sections
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Description */}
          {description && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Sections */}
          {sections && sections.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Sections ({sections.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sections.map((section) => (
                    <div
                      key={section.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">Section {section.name}</h4>
                        <Badge variant="outline">
                          {section.studentCount || 0}/{section.capacity}
                        </Badge>
                      </div>
                      {section.room && (
                        <p className="text-sm text-gray-500">Room: {section.room}</p>
                      )}
                      {section.classTeacher && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-1">
                          <GraduationCap className="h-3 w-3" />
                          {typeof section.classTeacher === 'string'
                            ? section.classTeacher
                            : `${section.classTeacher.firstName} ${section.classTeacher.lastName}`}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Students */}
          {students && students.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Students ({students.length})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div>
                        <p className="font-medium">
                          {student.firstName} {student.lastName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {student.studentId} • {student.sectionName ? `Section ${student.sectionName}` : "No Section"}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          student.status === "fresher"
                            ? "bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-200"
                            : student.status === "continuing"
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                            : "bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-200"
                        }
                      >
                        {student.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Additional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Created</p>
                  <p className="font-medium">
                    {format(new Date(createdAt), "MMM dd, yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Academic Year</p>
                  <p className="font-medium">{academicYear}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

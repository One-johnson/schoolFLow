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
import { BookOpen, Users, GraduationCap, Award } from "lucide-react";
import { format } from "date-fns";
import type { Id } from "../../../convex/_generated/dataModel";

interface SubjectDetailDialogProps {
  open: boolean;
  onClose: () => void;
  subjectData: Record<string, unknown>;
}

export function SubjectDetailDialog({
  open,
  onClose,
  subjectData,
}: SubjectDetailDialogProps) {
  const subjectId = subjectData.id as Id<"subjects">;

  // Get enriched subject data
  const enrichedSubject = useQuery(
    api.subjects.getSubjectById,
    open ? { subjectId } : "skip"
  );

  const subjectCode = subjectData.subjectCode as string;
  const name = subjectData.name as string;
  const department = subjectData.department as string;
  const description = subjectData.description as string | undefined;
  const colorCode = subjectData.colorCode as string;
  const classIds = subjectData.classIds as Id<"classes">[] | undefined;
  const teacherIds = subjectData.teacherIds as Id<"users">[] | undefined;
  const credits = subjectData.credits as number | undefined;
  const isCore = subjectData.isCore as boolean;
  const status = subjectData.status as string;
  const createdAt = subjectData.createdAt as number;

  const getStatusColor = (status: string): string => {
    return status === "active"
      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Subject Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Section */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div
                className="h-12 w-12 rounded-lg flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: colorCode }}
              >
                {subjectCode.substring(0, 2)}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{name}</h2>
                <p className="text-sm text-gray-500 font-mono">{subjectCode}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge
                variant="outline"
                style={{ borderColor: colorCode, color: colorCode }}
              >
                {department}
              </Badge>
              <Badge variant={isCore ? "default" : "secondary"}>
                {isCore ? "Core Subject" : "Elective"}
              </Badge>
              <Badge className={getStatusColor(status)}>
                {status}
              </Badge>
              {credits && (
                <Badge variant="outline">
                  <Award className="h-3 w-3 mr-1" />
                  {credits} Credits
                </Badge>
              )}
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

          {/* Assigned Classes */}
          {classIds && classIds.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Assigned Classes ({classIds.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {classIds.map((classId) => (
                    <ClassBadge key={classId} classId={classId} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assigned Teachers */}
          {teacherIds && teacherIds.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Assigned Teachers ({teacherIds.length})
                </h3>
                <div className="space-y-2">
                  {teacherIds.map((teacherId) => (
                 
                    // Ensure that teacherId is of type Id<"teachers"> in your data model, or handle the mapping accordingly.
                    <TeacherCard key={teacherId as unknown as Id<"teachers">} teacherId={teacherId as unknown as Id<"teachers">} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Subject Information */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Subject Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Department</p>
                  <p className="font-medium">{department}</p>
                </div>
                <div>
                  <p className="text-gray-500">Type</p>
                  <p className="font-medium">{isCore ? "Core Subject" : "Elective"}</p>
                </div>
                {credits && (
                  <div>
                    <p className="text-gray-500">Credits</p>
                    <p className="font-medium">{credits}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-500">Status</p>
                  <p className="font-medium capitalize">{status}</p>
                </div>
                <div>
                  <p className="text-gray-500">Created</p>
                  <p className="font-medium">
                    {format(new Date(createdAt), "MMM dd, yyyy")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper component to display class badge
function ClassBadge({ classId }: { classId: Id<"classes"> }) {
  const classData = useQuery(api.classes.getClassById, { classId });

  if (!classData) {
    return <Badge variant="outline">Loading...</Badge>;
  }

  return (
    <Badge variant="outline" className="text-sm">
      {classData.name}
    </Badge>
  );
}

// Helper component to display teacher card
function TeacherCard({ teacherId }: { teacherId: Id<"teachers"> }) {
  const teacher = useQuery(api.teachers.getTeacherById, { teacherId });

  if (!teacher) {
    return (
      <div className="p-3 border rounded-lg">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      <div>
        <p className="font-medium">
          {teacher.firstName} {teacher.lastName}
        </p>
        <p className="text-sm text-gray-500">{teacher.employeeId}</p>
      </div>
      <Badge variant="secondary">{teacher.department}</Badge>
    </div>
  );
}

"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Briefcase, 
  BookOpen,
  AlertCircle,
  GraduationCap,
  Award
} from "lucide-react";
import { format } from "date-fns";

interface TeacherDetailDialogProps {
  open: boolean;
  onClose: () => void;
  teacherData: Record<string, unknown>;
}

interface Qualification {
  degree: string;
  subject: string;
  university: string;
  yearObtained: number;
}

export function TeacherDetailDialog({
  open,
  onClose,
  teacherData,
}: TeacherDetailDialogProps) {
  const getInitials = (firstName: string, lastName: string): string => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "on_leave":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "resigned":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const getEmploymentTypeColor = (type: string): string => {
    switch (type) {
      case "full_time":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "part_time":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "contract":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const firstName = teacherData.firstName as string;
  const lastName = teacherData.lastName as string;
  const email = teacherData.email as string;
  const phone = teacherData.phone as string | undefined;
  const photo = teacherData.photo as string | undefined;
  const employeeId = teacherData.employeeId as string;
  const department = teacherData.department as string;
  const employmentType = teacherData.employmentType as string;
  const status = teacherData.status as string;
  const qualifications = teacherData.qualifications as Qualification[];
  const subjectSpecializations = teacherData.subjectSpecializations as string[];
  const yearsOfExperience = teacherData.yearsOfExperience as number;
  const dateOfJoining = teacherData.dateOfJoining as number;
  const bio = teacherData.bio as string | undefined;
  const emergencyContact = teacherData.emergencyContact as {
    name: string;
    phone: string;
    relationship: string;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Teacher Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={photo} alt={`${firstName} ${lastName}`} />
              <AvatarFallback className="bg-purple-600 text-white text-lg">
                {getInitials(firstName, lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">
                {firstName} {lastName}
              </h2>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline" className="font-mono">
                  ID: {employeeId}
                </Badge>
                <Badge className={getEmploymentTypeColor(employmentType)}>
                  {employmentType.replace("_", " ")}
                </Badge>
                <Badge className={getStatusColor(status)}>
                  {status.replace("_", " ")}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <User className="h-4 w-4" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>{email}</span>
                </div>
                {phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{phone}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Professional Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Department</p>
                  <p className="font-medium">{department}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Years of Experience</p>
                  <p className="font-medium">{yearsOfExperience} years</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date of Joining</p>
                  <p className="font-medium">
                    {format(new Date(dateOfJoining), "MMM dd, yyyy")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subject Specializations */}
          {subjectSpecializations && subjectSpecializations.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Subject Specializations
                </h3>
                <div className="flex flex-wrap gap-2">
                  {subjectSpecializations.map((subject, index) => (
                    <Badge key={index} variant="secondary">
                      {subject}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Qualifications */}
          {qualifications && qualifications.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Qualifications
                </h3>
                <div className="space-y-4">
                  {qualifications.map((qual, index) => (
                    <div
                      key={index}
                      className="border-l-2 border-blue-500 pl-4 py-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{qual.degree}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {qual.subject}
                          </p>
                          <p className="text-sm text-gray-500">
                            {qual.university}
                          </p>
                        </div>
                        <Badge variant="outline">{qual.yearObtained}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bio */}
          {bio && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  About
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {bio}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Emergency Contact */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Emergency Contact
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{emergencyContact.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Relationship</p>
                  <p className="font-medium">{emergencyContact.relationship}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{emergencyContact.phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

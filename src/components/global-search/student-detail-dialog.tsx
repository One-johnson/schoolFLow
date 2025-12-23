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
  MapPin, 
  Heart, 
  FileText,
  AlertCircle,
  Users
} from "lucide-react";
import { format } from "date-fns";

interface StudentDetailDialogProps {
  open: boolean;
  onClose: () => void;
  studentData: Record<string, unknown>;
}

export function StudentDetailDialog({
  open,
  onClose,
  studentData,
}: StudentDetailDialogProps) {
  const getInitials = (firstName: string, lastName: string): string => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "fresher":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "continuing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "graduated":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const firstName = studentData.firstName as string;
  const lastName = studentData.lastName as string;
  const email = studentData.email as string;
  const phone = studentData.phone as string | undefined;
  const photo = studentData.photo as string | undefined;
  const studentId = studentData.studentId as string;
  const admissionNumber = studentData.admissionNumber as string;
  const className = studentData.className as string | undefined;
  const sectionName = studentData.sectionName as string | undefined;
  const rollNumber = studentData.rollNumber as string | undefined;
  const dateOfBirth = studentData.dateOfBirth as number;
  const bloodGroup = studentData.bloodGroup as string | undefined;
  const address = studentData.address as string;
  const emergencyContact = studentData.emergencyContact as {
    name: string;
    relationship: string;
    phone: string;
  };
  const medicalInfo = studentData.medicalInfo as string | undefined;
  const enrollmentDate = studentData.enrollmentDate as number;
  const status = studentData.status as string;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Student Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={photo} alt={`${firstName} ${lastName}`} />
              <AvatarFallback className="bg-blue-600 text-white text-lg">
                {getInitials(firstName, lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">
                {firstName} {lastName}
              </h2>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline" className="font-mono">
                  ID: {studentId}
                </Badge>
                <Badge variant="outline">
                  Admission: {admissionNumber}
                </Badge>
                <Badge className={getStatusColor(status)}>
                  {status}
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
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>{address}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Academic Information */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Academic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Class</p>
                  <p className="font-medium">{className || "Not Assigned"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Section</p>
                  <p className="font-medium">{sectionName || "Not Assigned"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Roll Number</p>
                  <p className="font-medium">{rollNumber || "Not Assigned"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Enrollment Date</p>
                  <p className="font-medium">
                    {format(new Date(enrollmentDate), "MMM dd, yyyy")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Date of Birth</p>
                  <p className="font-medium">
                    {format(new Date(dateOfBirth), "MMM dd, yyyy")}
                  </p>
                </div>
                {bloodGroup && (
                  <div>
                    <p className="text-sm text-gray-500">Blood Group</p>
                    <p className="font-medium flex items-center gap-2">
                      <Heart className="h-4 w-4 text-red-500" />
                      {bloodGroup}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

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

          {/* Medical Information */}
          {medicalInfo && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Medical Information
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {medicalInfo}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

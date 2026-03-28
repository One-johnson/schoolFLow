"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { StudentPageHeader } from "@/components/student/student-page-header";
import { StudentProfileAside } from "@/components/student/student-profile-aside";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Hash,
  School,
  Calendar,
  Phone,
  MapPin,
  Users,
  Shield,
  Heart,
  Pencil,
  IdCard,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Id } from "../../../../convex/_generated/dataModel";

function formatDisplayDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString(undefined, { dateStyle: "medium" });
}

function formatGender(g: "male" | "female" | "other"): string {
  return { male: "Male", female: "Female", other: "Other" }[g];
}

function formatRelationship(
  r: "father" | "mother" | "guardian",
): string {
  return { father: "Father", mother: "Mother", guardian: "Guardian" }[r];
}

function ProfileField({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-start gap-2 text-sm ${className ?? ""}`}>
      <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
      <div className="min-w-0">
        <p className="text-muted-foreground">{label}</p>
        <p className="font-medium break-words">{value}</p>
      </div>
    </div>
  );
}

export default function StudentProfilePage(): React.ReactNode {
  const { student, changePassword } = useStudentAuth();
  const profile = useQuery(
    api.students.getStudentPortalProfile,
    student?.id ? { studentId: student.id as Id<"students"> } : "skip",
  );
  const updateContact = useMutation(api.students.updateStudentPortalContact);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [showContactForm, setShowContactForm] = useState(false);
  const [contactData, setContactData] = useState({
    email: "",
    phone: "",
    address: "",
  });
  const [isSavingContact, setIsSavingContact] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setIsChangingPassword(true);
    try {
      const result = await changePassword(
        passwordData.currentPassword,
        passwordData.newPassword,
      );

      if (result.success) {
        toast.success("Password changed successfully");
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setShowPasswordForm(false);
      } else {
        toast.error(result.error ?? "Failed to change password");
      }
    } catch {
      toast.error("Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const openContactForm = () => {
    if (!profile) return;
    setContactData({
      email: profile.email ?? "",
      phone: profile.phone ?? "",
      address: profile.address ?? "",
    });
    setShowContactForm(true);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student?.id) return;
    const emailTrim = contactData.email.trim();
    if (emailTrim && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      toast.error("Please enter a valid email address");
      return;
    }
    const addr = contactData.address.trim();
    if (!addr) {
      toast.error("Address is required");
      return;
    }

    setIsSavingContact(true);
    try {
      await updateContact({
        schoolId: student.schoolId,
        studentId: student.id as Id<"students">,
        email: contactData.email,
        phone: contactData.phone,
        address: contactData.address,
      });
      toast.success("Contact details saved");
      setShowContactForm(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save changes");
    } finally {
      setIsSavingContact(false);
    }
  };

  if (!student) {
    return null;
  }

  const firstName = profile?.firstName ?? student.firstName;
  const lastName = profile?.lastName ?? student.lastName;
  const initials =
    `${firstName.charAt(0) || ""}${lastName.charAt(0) || ""}`.toUpperCase();
  const displayName = [firstName, profile?.middleName, lastName]
    .filter(Boolean)
    .join(" ");

  const hasSecondary =
    profile &&
    (profile.secondaryContactName ||
      profile.secondaryContactPhone ||
      profile.secondaryContactRelationship);
  const hasMedical =
    profile &&
    ((profile.medicalConditions?.length ?? 0) > 0 ||
      (profile.allergies?.length ?? 0) > 0);

  return (
    <div className="mx-auto w-full max-w-7xl py-4">
      <div className="flex flex-col gap-8 md:grid md:grid-cols-[minmax(0,1fr)_minmax(260px,300px)] md:gap-8 lg:gap-10 md:items-start">
        <div className="min-w-0 space-y-6 w-full max-w-2xl mx-auto md:mx-0 md:max-w-none">
      <StudentPageHeader
        icon={User}
        title="Profile"
        subtitle="Your school record, contact details, and password"
      />

      <Card className="border-violet-200/50 dark:border-violet-800/40 shadow-md shadow-violet-500/5 overflow-hidden">
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-16 w-16 ring-2 ring-violet-500/20 ring-offset-2 ring-offset-background">
            <AvatarImage
              src={profile?.photoUrl ?? undefined}
              alt={displayName || "Profile photo"}
            />
            <AvatarFallback className="text-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{displayName}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1 font-mono">
              {profile?.studentId ?? student.studentId}
            </p>
          </div>
        </CardHeader>
      </Card>

      <Card className="border-violet-200/50 dark:border-violet-800/40 shadow-md shadow-violet-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <IdCard className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            School and personal
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            From your school record (read only). Contact the office if something is wrong.
          </p>
        </CardHeader>
        <CardContent>
          {profile === undefined ? (
            <div className="grid gap-3 sm:grid-cols-2 animate-pulse">
              <div className="h-14 rounded-md bg-muted/60" />
              <div className="h-14 rounded-md bg-muted/60" />
              <div className="h-14 rounded-md bg-muted/60 sm:col-span-2" />
            </div>
          ) : profile === null ? (
            <p className="text-sm text-muted-foreground">Could not load profile.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <ProfileField
                icon={School}
                label="Class"
                value={profile.className}
              />
              <ProfileField
                icon={Hash}
                label="Admission number"
                value={profile.admissionNumber}
              />
              {profile.departmentName ? (
                <ProfileField
                  icon={School}
                  label="Department"
                  value={profile.departmentName}
                />
              ) : null}
              {profile.houseName ? (
                <ProfileField
                  icon={School}
                  label="House"
                  value={profile.houseName}
                />
              ) : null}
              <ProfileField
                icon={Calendar}
                label="Date of birth"
                value={formatDisplayDate(profile.dateOfBirth)}
              />
              <ProfileField
                icon={User}
                label="Gender"
                value={formatGender(profile.gender)}
              />
              {profile.rollNumber ? (
                <ProfileField
                  icon={Hash}
                  label="Roll number"
                  value={profile.rollNumber}
                />
              ) : null}
              <ProfileField
                icon={Calendar}
                label="Admission date"
                value={formatDisplayDate(profile.admissionDate)}
              />
              {profile.nationality ? (
                <ProfileField
                  icon={MapPin}
                  label="Nationality"
                  value={profile.nationality}
                />
              ) : null}
              {profile.religion ? (
                <ProfileField
                  icon={User}
                  label="Religion"
                  value={profile.religion}
                />
              ) : null}
              <div className="flex items-start gap-2 text-sm sm:col-span-2">
                <Shield className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant="secondary" className="mt-0.5 capitalize">
                    {profile.status.replace(/-/g, " ")}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-violet-200/50 dark:border-violet-800/40 shadow-md shadow-violet-500/5">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            Your contact details
          </CardTitle>
          {profile && !showContactForm ? (
            <Button variant="outline" size="sm" onClick={openContactForm}>
              <Pencil className="h-4 w-4 mr-1.5" />
              Edit
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {profile === undefined ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-10 rounded-md bg-muted/60" />
              <div className="h-10 rounded-md bg-muted/60" />
            </div>
          ) : profile === null ? null : showContactForm ? (
            <form onSubmit={handleSaveContact} className="space-y-4 max-w-lg">
              <p className="text-sm text-muted-foreground">
                Update the email and phone your school can reach you on. Address must stay filled in.
              </p>
              <div className="space-y-2">
                <Label htmlFor="contact-email">Email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  autoComplete="email"
                  value={contactData.email}
                  onChange={(e) =>
                    setContactData({ ...contactData, email: e.target.value })
                  }
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-phone">Phone</Label>
                <Input
                  id="contact-phone"
                  type="tel"
                  autoComplete="tel"
                  value={contactData.phone}
                  onChange={(e) =>
                    setContactData({ ...contactData, phone: e.target.value })
                  }
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-address">Address</Label>
                <Textarea
                  id="contact-address"
                  autoComplete="street-address"
                  value={contactData.address}
                  onChange={(e) =>
                    setContactData({ ...contactData, address: e.target.value })
                  }
                  rows={3}
                  required
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={isSavingContact}>
                  {isSavingContact ? "Saving…" : "Save changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSavingContact}
                  onClick={() => setShowContactForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid gap-4">
              <ProfileField
                icon={Mail}
                label="Email"
                value={profile.email?.trim() ? profile.email : "—"}
              />
              <ProfileField
                icon={Phone}
                label="Phone"
                value={profile.phone?.trim() ? profile.phone : "—"}
              />
              <ProfileField
                icon={MapPin}
                label="Address"
                value={profile.address?.trim() ? profile.address : "—"}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {profile && profile !== null ? (
        <Card className="border-violet-200/50 dark:border-violet-800/40 shadow-md shadow-violet-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              Family and emergency contacts
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              For school use. To change these, ask a parent or the office.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <ProfileField
                icon={Users}
                label="Parent / guardian"
                value={profile.parentName}
              />
              <ProfileField
                icon={User}
                label="Relationship"
                value={formatRelationship(profile.relationship)}
              />
              <ProfileField
                icon={Mail}
                label="Parent email"
                value={profile.parentEmail}
              />
              <ProfileField
                icon={Phone}
                label="Parent phone"
                value={profile.parentPhone}
              />
              {profile.parentOccupation ? (
                <ProfileField
                  icon={User}
                  label="Parent occupation"
                  value={profile.parentOccupation}
                  className="sm:col-span-2"
                />
              ) : null}
            </div>

            {hasSecondary ? (
              <div className="pt-2 border-t border-border/60">
                <p className="text-sm font-medium mb-3">Secondary contact</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {profile.secondaryContactName ? (
                    <ProfileField
                      icon={Users}
                      label="Name"
                      value={profile.secondaryContactName}
                    />
                  ) : null}
                  {profile.secondaryContactPhone ? (
                    <ProfileField
                      icon={Phone}
                      label="Phone"
                      value={profile.secondaryContactPhone}
                    />
                  ) : null}
                  {profile.secondaryContactRelationship ? (
                    <ProfileField
                      icon={User}
                      label="Relationship"
                      value={profile.secondaryContactRelationship}
                      className="sm:col-span-2"
                    />
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="pt-2 border-t border-border/60">
              <p className="text-sm font-medium mb-3">Emergency</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <ProfileField
                  icon={Shield}
                  label="Contact name"
                  value={profile.emergencyContactName}
                />
                <ProfileField
                  icon={Phone}
                  label="Phone"
                  value={profile.emergencyContactPhone}
                />
                <ProfileField
                  icon={User}
                  label="Relationship"
                  value={profile.emergencyContactRelationship}
                  className="sm:col-span-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {profile && profile !== null && hasMedical ? (
        <Card className="border-violet-200/50 dark:border-violet-800/40 shadow-md shadow-violet-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Heart className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              Health notes on file
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {(profile.medicalConditions?.length ?? 0) > 0 ? (
              <div>
                <p className="text-muted-foreground mb-1">Medical conditions</p>
                <ul className="list-disc pl-5 font-medium space-y-0.5">
                  {profile.medicalConditions!.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {(profile.allergies?.length ?? 0) > 0 ? (
              <div>
                <p className="text-muted-foreground mb-1">Allergies</p>
                <ul className="list-disc pl-5 font-medium space-y-0.5">
                  {profile.allergies!.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-violet-200/50 dark:border-violet-800/40 shadow-md shadow-violet-500/5">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            Password
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setShowPasswordForm(!showPasswordForm)}>
            {showPasswordForm ? "Cancel" : "Change"}
          </Button>
        </CardHeader>
        {showPasswordForm && (
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPasswords.current ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, currentPassword: e.target.value })
                    }
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() =>
                      setShowPasswords({ ...showPasswords, current: !showPasswords.current })
                    }
                  >
                    {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPasswords.new ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, newPassword: e.target.value })
                    }
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                  >
                    {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                    }
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() =>
                      setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })
                    }
                  >
                    {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={isChangingPassword}>
                {isChangingPassword ? "Updating…" : "Update password"}
              </Button>
            </form>
          </CardContent>
        )}
      </Card>
        </div>
        <StudentProfileAside studentId={student.id as Id<"students">} />
      </div>
    </div>
  );
}

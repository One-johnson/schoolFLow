"use client";

import { useMemo, useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  Building2,
  Home,
  Globe,
  Info,
  BookMarked,
  Check,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Id } from "../../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import {
  portalPasswordCriteriaMet,
  portalPasswordStrengthLabel,
  validatePortalPassword,
} from "@/lib/password-policy";

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

const linkClass =
  "font-medium text-violet-700 underline-offset-2 hover:underline dark:text-violet-300 break-all";

function MailtoValue({ email }: { email: string }) {
  return (
    <a href={`mailto:${encodeURIComponent(email)}`} className={linkClass}>
      {email}
    </a>
  );
}

function TelValue({ phone }: { phone: string }) {
  const href = phone.replace(/[\s()-]/g, "");
  return (
    <a href={`tel:${href}`} className={linkClass}>
      {phone}
    </a>
  );
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
    <div className={cn("flex items-start gap-2 text-sm", className)}>
      <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
      <div className="min-w-0">
        <p className="text-muted-foreground">{label}</p>
        <div className="font-medium break-words">{value}</div>
      </div>
    </div>
  );
}

function ProfileSectionNav({
  showFamily,
  showHealth,
}: {
  showFamily: boolean;
  showHealth: boolean;
}) {
  const items: { id: string; label: string }[] = [
    { id: "profile-school", label: "School" },
    { id: "profile-contact", label: "Contact" },
    ...(showFamily ? [{ id: "profile-family", label: "Family" }] : []),
    ...(showHealth ? [{ id: "profile-health", label: "Health" }] : []),
    { id: "profile-password", label: "Password" },
  ];

  return (
    <nav
      aria-label="Profile sections"
      className="sticky top-14 z-10 -mx-1 mb-2 border-b border-border/50 bg-background/90 py-2.5 backdrop-blur-md supports-[backdrop-filter]:bg-background/75"
    >
      <ul className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] md:flex-wrap md:overflow-visible [&::-webkit-scrollbar]:hidden">
        {items.map(({ id, label }) => (
          <li key={id} className="shrink-0 snap-start">
            <a
              href={`#${id}`}
              className="inline-flex items-center rounded-full border border-border/80 bg-muted/50 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-violet-300/60 hover:bg-violet-500/10 dark:hover:border-violet-700/50"
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function SchoolPersonalSkeleton(): React.JSX.Element {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex gap-2">
          <Skeleton className="mt-0.5 h-4 w-4 shrink-0 rounded-sm" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-full max-w-[12rem]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ContactSkeleton(): React.JSX.Element {
  return (
    <div className="grid gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-2">
          <Skeleton className="mt-0.5 h-4 w-4 shrink-0 rounded-sm" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-full max-w-xs" />
          </div>
        </div>
      ))}
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

  const passwordStrength = useMemo(
    () => portalPasswordStrengthLabel(passwordData.newPassword),
    [passwordData.newPassword],
  );

  const passwordCriteria = useMemo(
    () => portalPasswordCriteriaMet(passwordData.newPassword),
    [passwordData.newPassword],
  );

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    const validation = validatePortalPassword(passwordData.newPassword);
    if (!validation.valid) {
      toast.error(validation.message);
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

  const showFamilyInNav = Boolean(profile);
  const showHealthInNav = Boolean(hasMedical);

  return (
    <div className="mx-auto w-full max-w-7xl py-4">
      <div className="flex flex-col gap-8 md:grid md:grid-cols-[minmax(0,1fr)_minmax(260px,300px)] md:gap-8 lg:gap-10 md:items-start">
        <div className="min-w-0 space-y-6 w-full max-w-2xl mx-auto md:mx-0 md:max-w-none">
          <StudentPageHeader
            icon={User}
            title="Profile"
            subtitle="Your school record, contact details, and password"
          />

          <ProfileSectionNav
            showFamily={showFamilyInNav}
            showHealth={showHealthInNav}
          />

          <Card
            id="profile-hero"
            className="scroll-mt-28 overflow-hidden border-violet-200/50 shadow-md shadow-violet-500/5 dark:border-violet-800/40"
          >
            <div className="bg-gradient-to-r from-violet-600/12 via-fuchsia-600/8 to-transparent px-4 py-5 sm:px-6 dark:from-violet-500/18 dark:via-fuchsia-500/10">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Avatar className="h-20 w-20 ring-2 ring-violet-500/25 ring-offset-2 ring-offset-background shrink-0">
                  <AvatarImage
                    src={profile?.photoUrl ?? undefined}
                    alt={displayName || "Profile photo"}
                  />
                  <AvatarFallback className="text-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 space-y-2">
                  <div>
                    <CardTitle className="text-xl tracking-tight">{displayName}</CardTitle>
                    <p className="mt-1 font-mono text-sm text-muted-foreground">
                      {profile?.studentId ?? student.studentId}
                    </p>
                  </div>
                  {profile === undefined ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Skeleton className="h-6 w-24 rounded-full" />
                      <Skeleton className="h-6 w-28 rounded-full" />
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                  ) : profile === null ? (
                    <p className="text-sm text-muted-foreground">
                      Could not load full profile. Your login details still work—try again later or
                      contact the office.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Badge className="bg-violet-600/90 text-white hover:bg-violet-600 dark:bg-violet-600">
                        {profile.className}
                      </Badge>
                      <Badge variant="outline" className="font-mono text-xs">
                        #{profile.admissionNumber}
                      </Badge>
                      <Badge variant="secondary" className="capitalize">
                        {profile.status.replace(/-/g, " ")}
                      </Badge>
                      <Badge variant="outline" className="font-normal text-muted-foreground">
                        Member since {formatDisplayDate(profile.admissionDate)}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card
            id="profile-school"
            className="scroll-mt-28 border-violet-200/50 shadow-md shadow-violet-500/5 dark:border-violet-800/40"
          >
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
                <SchoolPersonalSkeleton />
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
                      icon={Building2}
                      label="Department"
                      value={profile.departmentName}
                    />
                  ) : null}
                  {profile.houseName ? (
                    <ProfileField icon={Home} label="House" value={profile.houseName} />
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
                      icon={Globe}
                      label="Nationality"
                      value={profile.nationality}
                    />
                  ) : null}
                  {profile.religion ? (
                    <ProfileField
                      icon={BookMarked}
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

          <Card
            id="profile-contact"
            className="scroll-mt-28 border-violet-200/50 shadow-md shadow-violet-500/5 dark:border-violet-800/40"
          >
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
                <ContactSkeleton />
              ) : profile === null ? null : showContactForm ? (
                <form onSubmit={handleSaveContact} className="space-y-4 max-w-lg">
                  <p className="text-sm text-muted-foreground">
                    Update the email and phone your school can reach you on. Address must stay
                    filled in.
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
                    value={
                      profile.email?.trim() ? (
                        <MailtoValue email={profile.email.trim()} />
                      ) : (
                        "—"
                      )
                    }
                  />
                  <ProfileField
                    icon={Phone}
                    label="Phone"
                    value={
                      profile.phone?.trim() ? (
                        <TelValue phone={profile.phone.trim()} />
                      ) : (
                        "—"
                      )
                    }
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
            <Card
              id="profile-family"
              className="scroll-mt-28 border-violet-200/50 shadow-md shadow-violet-500/5 dark:border-violet-800/40"
            >
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
                <Alert className="border-blue-200/80 bg-blue-500/[0.06] dark:border-blue-900/50 dark:bg-blue-500/10">
                  <Info className="text-blue-600 dark:text-blue-400" />
                  <AlertTitle>Emergency use</AlertTitle>
                  <AlertDescription>
                    Tap email or phone to start a message or call. Keep these details accurate for
                    your safety.
                  </AlertDescription>
                </Alert>
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
                    value={
                      profile.parentEmail?.trim() ? (
                        <MailtoValue email={profile.parentEmail.trim()} />
                      ) : (
                        "—"
                      )
                    }
                  />
                  <ProfileField
                    icon={Phone}
                    label="Parent phone"
                    value={
                      profile.parentPhone?.trim() ? (
                        <TelValue phone={profile.parentPhone.trim()} />
                      ) : (
                        "—"
                      )
                    }
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
                          value={
                            profile.secondaryContactPhone.trim() ? (
                              <TelValue phone={profile.secondaryContactPhone.trim()} />
                            ) : (
                              "—"
                            )
                          }
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
                      value={
                        profile.emergencyContactPhone?.trim() ? (
                          <TelValue phone={profile.emergencyContactPhone.trim()} />
                        ) : (
                          "—"
                        )
                      }
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
            <Card
              id="profile-health"
              className="scroll-mt-28 border-violet-200/50 shadow-md shadow-violet-500/5 dark:border-violet-800/40"
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Heart className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  Health notes on file
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <Alert className="border-amber-200/90 bg-amber-500/[0.07] dark:border-amber-900/55 dark:bg-amber-500/10">
                  <Heart className="text-amber-700 dark:text-amber-400" />
                  <AlertTitle>Shared with school staff</AlertTitle>
                  <AlertDescription>
                    Teachers and nurses use this to keep you safe. Ask the office to update it if
                    anything changes.
                  </AlertDescription>
                </Alert>
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

          <Card
            id="profile-password"
            className="scroll-mt-28 border-violet-200/50 shadow-md shadow-violet-500/5 dark:border-violet-800/40"
          >
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
                <form
                  onSubmit={handleChangePassword}
                  className="space-y-4 max-w-md rounded-lg border border-border/70 bg-muted/20 p-4 dark:bg-muted/10"
                  aria-describedby="password-requirements"
                >
                  <p id="password-requirements" className="text-xs text-muted-foreground">
                    Use at least 8 characters with uppercase, lowercase, a number, and one of{" "}
                    <span className="font-mono">!@#$%^&*</span>.
                  </p>
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
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        onClick={() =>
                          setShowPasswords({ ...showPasswords, current: !showPasswords.current })
                        }
                      >
                        {showPasswords.current ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="newPassword">New password</Label>
                      {passwordData.newPassword ? (
                        <span
                          className={cn(
                            "text-xs font-medium",
                            passwordStrength.score >= 5
                              ? "text-emerald-600 dark:text-emerald-400"
                              : passwordStrength.score >= 3
                                ? "text-amber-700 dark:text-amber-400"
                                : "text-muted-foreground",
                          )}
                        >
                          {passwordStrength.label}
                        </span>
                      ) : null}
                    </div>
                    <div
                      className="flex gap-1"
                      role="progressbar"
                      aria-valuenow={passwordStrength.score}
                      aria-valuemin={0}
                      aria-valuemax={5}
                      aria-label="Password strength"
                    >
                      {[1, 2, 3, 4, 5].map((step) => (
                        <span
                          key={step}
                          className={cn(
                            "h-1 flex-1 rounded-full bg-border transition-colors",
                            passwordStrength.score >= step &&
                              (passwordStrength.score >= 5
                                ? "bg-emerald-500"
                                : passwordStrength.score >= 4
                                  ? "bg-lime-500"
                                  : passwordStrength.score >= 3
                                    ? "bg-amber-500"
                                    : "bg-orange-500"),
                          )}
                        />
                      ))}
                    </div>
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
                        autoComplete="new-password"
                        aria-describedby="password-requirements password-criteria"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      >
                        {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <ul
                      id="password-criteria"
                      className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2"
                    >
                      {(
                        [
                          ["length", "8+ characters", passwordCriteria.length],
                          ["upper", "Uppercase letter", passwordCriteria.upper],
                          ["lower", "Lowercase letter", passwordCriteria.lower],
                          ["number", "A number", passwordCriteria.number],
                          ["special", "Special (!@#$%^&*)", passwordCriteria.special],
                        ] as const
                      ).map(([key, text, ok]) => (
                        <li key={key} className="flex items-center gap-1.5">
                          {ok ? (
                            <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
                          ) : (
                            <X className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" aria-hidden />
                          )}
                          <span className={ok ? "text-foreground/90" : undefined}>{text}</span>
                        </li>
                      ))}
                    </ul>
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
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        onClick={() =>
                          setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })
                        }
                      >
                        {showPasswords.confirm ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
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

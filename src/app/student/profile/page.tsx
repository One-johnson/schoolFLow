"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { StudentPageHeader } from "@/components/student/student-page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { User, Mail, Lock, Eye, EyeOff, Hash, School } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Id } from "../../../../convex/_generated/dataModel";

export default function StudentProfilePage(): React.ReactNode {
  const { student, changePassword } = useStudentAuth();
  const profile = useQuery(
    api.students.getStudentPortalProfile,
    student?.id ? { studentId: student.id as Id<"students"> } : "skip",
  );

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

  if (!student) {
    return null;
  }

  const initials = `${student.firstName.charAt(0) || ""}${student.lastName.charAt(0) || ""}`.toUpperCase();

  return (
    <div className="space-y-6 py-4 max-w-2xl">
      <StudentPageHeader icon={User} title="Profile" subtitle="Your details and password" />

      <Card className="border-violet-200/50 dark:border-violet-800/40 shadow-md shadow-violet-500/5 overflow-hidden">
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-16 w-16 ring-2 ring-violet-500/20 ring-offset-2 ring-offset-background">
            <AvatarFallback className="text-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>
              {student.firstName} {student.lastName}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{student.studentId}</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-2 text-sm">
              <Hash className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-muted-foreground">Student ID</p>
                <p className="font-medium">{profile?.studentId ?? student.studentId}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <School className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-muted-foreground">Class</p>
                <p className="font-medium">{profile?.className ?? student.className}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 text-sm sm:col-span-2">
              <Mail className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{profile?.email || "—"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
  );
}

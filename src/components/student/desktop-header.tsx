"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Moon, Sun, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { StudentNotificationBell } from "@/components/student/student-notification-bell";
import { toast } from "sonner";
import { useTheme } from "next-themes";

export function StudentDesktopHeader() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const { student, logout } = useStudentAuth();

  const handleLogout = async (): Promise<void> => {
    await logout();
    toast.success("Logged out successfully");
    router.push("/student/login");
  };

  const getInitials = (first: string, last: string): string => {
    const a = first.trim().charAt(0) || "";
    const b = last.trim().charAt(0) || "";
    return `${a}${b}`.toUpperCase() || "S";
  };

  const displayName = student
    ? `${student.firstName} ${student.lastName}`.trim()
    : "Student";

  return (
    <>
      <header className="sticky top-0 z-10 hidden h-14 items-center gap-4 border-b border-blue-200/60 bg-background/95 px-6 backdrop-blur-md dark:border-blue-900/50 md:flex">
        <SidebarTrigger />
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <StudentNotificationBell />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 cursor-pointer hover:bg-accent">
                <Avatar className="h-8 w-8 cursor-pointer">
                  {student?.photoUrl ? (
                    <AvatarImage
                      src={student.photoUrl}
                      alt=""
                      className="object-cover"
                    />
                  ) : null}
                  <AvatarFallback className="cursor-pointer bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                    {student
                      ? getInitials(student.firstName, student.lastName)
                      : "S"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium cursor-pointer">{displayName}</span>
                  <span className="text-xs text-muted-foreground">{student?.studentId}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <span className="font-medium">{displayName}</span>
                  <span className="text-xs text-muted-foreground">{student?.email || "—"}</span>
                  <span className="text-xs text-muted-foreground">Student</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                {theme === "dark" ? (
                  <Sun className="mr-2 h-4 w-4" />
                ) : (
                  <Moon className="mr-2 h-4 w-4" />
                )}
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/student/profile")}>
                <Settings className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowLogoutDialog(true)}
                className="text-red-600 dark:text-red-400"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to logout? You will be redirected to the login page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>Logout</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

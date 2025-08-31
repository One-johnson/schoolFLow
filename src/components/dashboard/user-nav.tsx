
"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/use-auth"
import { auth, database } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { updateProfile } from "firebase/auth"
import { ref, update } from "firebase/database"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import Link from "next/link";

export function UserNav() {
  const { user, role } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(user?.displayName || "");

  useEffect(() => {
    if(user?.displayName) {
        setName(user.displayName);
    }
  }, [user?.displayName]);


  const handleLogout = async () => {
    await auth.signOut();
    router.push("/");
  }
  
  const handleProfileUpdate = async () => {
    if (!user || !name.trim()) {
        toast({ title: "Error", description: "Name cannot be empty.", variant: "destructive" });
        return;
    }
    
    setIsLoading(true);
    try {
        // Update Firebase Auth profile
        await updateProfile(user, { displayName: name });

        // Update Realtime Database
        const userRef = ref(database, `users/${user.uid}`);
        await update(userRef, { name: name });

        toast({ title: "Success", description: "Profile updated successfully." });
        setIsProfileDialogOpen(false);
    } catch (error) {
        toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
        console.error("Profile update error:", error);
    } finally {
        setIsLoading(false);
    }
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "AD";
    const names = name.split(' ');
    if (names.length > 1) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  const getProfilePath = () => {
    if (!user || !role) return "/dashboard";
    switch (role) {
      case 'student':
        return `/dashboard/students/${user.uid}`;
      case 'teacher':
        return `/dashboard/teachers/${user.uid}`;
      default:
        return "#"; // Admins can edit from their own nav for now
    }
  }

  const profileMenuItem =
    role === "student" || role === "teacher" ? (
      <Link href={getProfilePath()}>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          Profile
          <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
        </DropdownMenuItem>
      </Link>
    ) : (
      <DropdownMenuItem onSelect={() => setIsProfileDialogOpen(true)}>
        Profile
        <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
      </DropdownMenuItem>
    );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user?.photoURL || ""} alt="User avatar" />
              <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user?.displayName || "Admin"}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email || "admin@schoolflow.com"}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
             {profileMenuItem}
            <DropdownMenuItem disabled>
              Settings
              <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <AlertDialog>
              <AlertDialogTrigger asChild>
                 <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    Log out
                    <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                  <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
                      <AlertDialogDescription>
                          You will be returned to the login page.
                      </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleLogout}>Log out</AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
                <DialogDescription>
                    Update your account information. Click save when you are done.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Name</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" disabled={isLoading} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">Email</Label>
                    <Input id="email" type="email" defaultValue={user?.email || ''} className="col-span-3" disabled />
                </div>
            </div>
            <DialogFooter>
                <Button onClick={handleProfileUpdate} disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

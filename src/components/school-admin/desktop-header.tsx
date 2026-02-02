'use client';

import { JSX, useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, LogOut, Moon, Sun, Settings, Search, User, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

// ─── Types ──────────────────────────────────────────────────────────────────

interface StudentResult {
  _id: string;
  firstName: string;
  lastName: string;
  admissionNumber?: string;
  className: string;
  department: string;
  gender: string;
  status: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  admissionDate?: string;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
}

interface TeacherResult {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  subjects?: string[];
  employmentType: string;
  status: string;
  qualifications?: string[];
}

type SelectedEntity =
  | { type: 'student'; data: StudentResult }
  | { type: 'teacher'; data: TeacherResult };

// ─── Helpers ────────────────────────────────────────────────────────────────

function capitalize(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function statusColor(status: string): string {
  switch (status) {
    case 'active':      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
    case 'inactive':    return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200';
    case 'on_leave':    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
    case 'fresher':     return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200';
    case 'graduated':   return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200';
    case 'transferred': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200';
    default:            return '';
  }
}

function DetailRow({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export function DesktopHeader(): React.JSX.Element {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [showLogoutDialog, setShowLogoutDialog] = useState<boolean>(false);
  const { user, logout } = useAuth();

  // Search state
  const [showSearch, setShowSearch]           = useState(false);
  const [searchQuery, setSearchQuery]         = useState('');
  const [selectedEntity, setSelectedEntity]   = useState<SelectedEntity | null>(null);
  const [showDetail, setShowDetail]           = useState(false);

  const notifications = useQuery(api.notifications.list);
  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  // Data for search
  const students = useQuery(api.students.getStudentsBySchool, { schoolId: user?.schoolId || '' });
  const teachers = useQuery(api.teachers.getTeachersBySchool, { schoolId: user?.schoolId || '' });

  // ⌘K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Filtered results — only populate when query is non-empty
  const filteredStudents = useMemo(() => {
    if (!students || !searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return (students as StudentResult[]).filter((s) => {
      const name = `${s.firstName} ${s.lastName}`.toLowerCase();
      return name.includes(q) || (s.admissionNumber?.toLowerCase().includes(q) ?? false);
    });
  }, [students, searchQuery]);

  const filteredTeachers = useMemo(() => {
    if (!teachers || !searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return (teachers as TeacherResult[]).filter((t) => {
      const name = `${t.firstName} ${t.lastName}`.toLowerCase();
      return name.includes(q) || t.email.toLowerCase().includes(q);
    });
  }, [teachers, searchQuery]);

  const handleLogout = async (): Promise<void> => {
    await logout();
    toast.success('Logged out successfully');
  };

  const getInitials = (email: string): string => {
    return email
      .split('@')[0]
      .split('.')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const openDetail = (entity: SelectedEntity): void => {
    setSelectedEntity(entity);
    setShowSearch(false);
    setShowDetail(true);
  };

  return (
    <>
      <header className="hidden md:flex h-14 items-center gap-4 border-b bg-background px-6 sticky top-0 z-10">
        <SidebarTrigger />
        <div className="flex-1 flex items-center gap-4">
          <Button
            variant="outline"
            className="flex-1 max-w-md text-muted-foreground justify-start gap-2 font-normal"
            onClick={() => setShowSearch(true)}
          >
            <Search className="h-4 w-4" />
            <span className="flex-1 text-left">Search...</span>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border bg-muted px-1.5 text-xs font-light text-muted-foreground">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadCount}
              </Badge>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 cursor-pointer hover:bg-accent">
                <Avatar className="h-8 w-8 cursor-pointer">
                  <AvatarFallback className="cursor-pointer">{user?.email ? getInitials(user.email) : 'SA'}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium cursor-pointer">{user?.email}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <span className="font-medium">School Admin</span>
                  <span className="text-xs text-muted-foreground">{user?.email}</span>
                  <span className="text-xs text-muted-foreground">School ID: {user?.schoolId || 'Not Assigned'}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                {theme === 'dark' ? (
                  <Sun className="mr-2 h-4 w-4" />
                ) : (
                  <Moon className="mr-2 h-4 w-4" />
                )}
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/school-admin/profile')}>
                <Settings className="mr-2 h-4 w-4" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowLogoutDialog(true)} className="text-red-600 dark:text-red-400">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* ─── Search Command Dialog ─────────────────────────────────────────── */}
      <Dialog open={showSearch} onOpenChange={(open) => { setShowSearch(open); if (!open) setSearchQuery(''); }}>
        <DialogContent className="overflow-hidden p-0 sm:max-w-lg" showCloseButton={false}>
          <DialogHeader className="sr-only">
            <DialogTitle>Search</DialogTitle>
            <DialogDescription>Search for students and teachers by name or ID</DialogDescription>
          </DialogHeader>
          <Command
            filter={() => 1}
            className="**:[[cmdk-group-heading]]:text-muted-foreground **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group]]:px-2 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 **:[[cmdk-input]]:h-12 **:[[cmdk-item]]:px-2 **:[[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5"
          >
            <CommandInput
              placeholder="Search students, teachers..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>
                {!searchQuery.trim()
                  ? 'Type a name or ID to search...'
                  : 'No results found.'}
              </CommandEmpty>

              {filteredStudents.length > 0 && (
                <CommandGroup heading="Students">
                  {filteredStudents.map((student) => (
                    <CommandItem
                      key={`student:${student._id}`}
                      value={`student:${student._id}`}
                      onSelect={() => openDetail({ type: 'student', data: student })}
                    >
                      <User className="h-4 w-4 text-blue-500" />
                      <span className="flex-1">{student.firstName} {student.lastName}</span>
                      <span className="text-xs text-muted-foreground">
                        {student.admissionNumber || student.className}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {filteredTeachers.length > 0 && (
                <CommandGroup heading="Teachers">
                  {filteredTeachers.map((teacher) => (
                    <CommandItem
                      key={`teacher:${teacher._id}`}
                      value={`teacher:${teacher._id}`}
                      onSelect={() => openDetail({ type: 'teacher', data: teacher })}
                    >
                      <UserCheck className="h-4 w-4 text-purple-500" />
                      <span className="flex-1">{teacher.firstName} {teacher.lastName}</span>
                      <span className="text-xs text-muted-foreground">
                        {capitalize(teacher.employmentType)}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>

      {/* ─── Detail Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedEntity?.type === 'student' ? 'Student Details' : 'Teacher Details'}
            </DialogTitle>
          </DialogHeader>

          {/* Student Detail */}
          {selectedEntity?.type === 'student' && (() => {
            const s = selectedEntity.data;
            return (
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarFallback className="text-lg bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      {s.firstName[0]}{s.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold">{s.firstName} {s.lastName}</h3>
                    <p className="text-sm text-muted-foreground">{s.admissionNumber || '—'}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize shrink-0 ${statusColor(s.status)}`}>
                    {s.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <DetailRow label="Class"      value={s.className} />
                  <DetailRow label="Department" value={capitalize(s.department)} />
                  <DetailRow label="Gender"     value={capitalize(s.gender)} />
                  {s.dateOfBirth   && <DetailRow label="Date of Birth" value={formatDate(s.dateOfBirth)} />}
                  {s.email         && <DetailRow label="Email"         value={s.email} />}
                  {s.phone         && <DetailRow label="Phone"         value={s.phone} />}
                  {s.admissionDate && <DetailRow label="Admitted"      value={formatDate(s.admissionDate)} />}
                </div>

                {(s.parentName || s.parentEmail || s.parentPhone) && (
                  <div className="border-t pt-3 mt-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Parent / Guardian
                    </p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                      {s.parentName  && <DetailRow label="Name"  value={s.parentName} />}
                      {s.parentEmail && <DetailRow label="Email" value={s.parentEmail} />}
                      {s.parentPhone && <DetailRow label="Phone" value={s.parentPhone} />}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Teacher Detail */}
          {selectedEntity?.type === 'teacher' && (() => {
            const t = selectedEntity.data;
            return (
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarFallback className="text-lg bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                      {t.firstName[0]}{t.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold">{t.firstName} {t.lastName}</h3>
                    <p className="text-sm text-muted-foreground">{t.email}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize shrink-0 ${statusColor(t.status)}`}>
                    {t.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <DetailRow label="Employment" value={capitalize(t.employmentType)} />
                  <DetailRow label="Status"     value={capitalize(t.status)} />
                  {t.phone && <DetailRow label="Phone" value={t.phone} />}
                </div>

                {t.subjects && t.subjects.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">Subjects</p>
                    <div className="flex flex-wrap gap-1.5">
                      {t.subjects.map((subj) => (
                        <Badge key={subj} variant="secondary">{subj}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {t.qualifications && t.qualifications.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">Qualifications</p>
                    <div className="flex flex-wrap gap-1.5">
                      {t.qualifications.map((q) => (
                        <Badge key={q} variant="outline">{q}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Logout Confirmation */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to logout? You will be redirected to the home page.
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

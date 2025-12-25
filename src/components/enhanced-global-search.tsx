"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  User,
  GraduationCap,
  BookMarked,
  Building2,
  Calendar,
  Users,
  FileText,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface SearchResult {
  id: string;
  type: "student" | "teacher" | "class" | "subject" | "school" | "user";
  title: string;
  subtitle: string;
  link: string;
  icon: React.ReactNode;
  badge?: string;
}

export function EnhancedGlobalSearch() {
  const router = useRouter();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Queries - only fetch when search is open and query is not empty
  const students = useQuery(
    api.search.searchStudents,
    open && searchQuery.length > 0 && user?.schoolId
      ? { schoolId: user.schoolId as Id<"schools">, query: searchQuery }
      : "skip"
  );

  const teachers = useQuery(
    api.search.searchTeachers,
    open && searchQuery.length > 0 && user?.schoolId
      ? { schoolId: user.schoolId as Id<"schools">, query: searchQuery }
      : "skip"
  );

  const classes = useQuery(
    api.search.searchClasses,
    open && searchQuery.length > 0 && user?.schoolId
      ? { schoolId: user.schoolId as Id<"schools">, query: searchQuery }
      : "skip"
  );

  const subjects = useQuery(
    api.search.searchSubjects,
    open && searchQuery.length > 0 && user?.schoolId
      ? { schoolId: user.schoolId as Id<"schools">, query: searchQuery }
      : "skip"
  );

  const schools = useQuery(
    api.search.searchSchools,
    open && searchQuery.length > 0 && user?.role === "super_admin"
      ? { query: searchQuery }
      : "skip"
  );

  const users = useQuery(
    api.search.searchUsers,
    open && searchQuery.length > 0 && user?.schoolId
      ? { schoolId: user.schoolId as Id<"schools">, query: searchQuery }
      : "skip"
  );

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const formatSearchResults = useCallback((): SearchResult[] => {
    const results: SearchResult[] = [];

    // Students
    if (students && students.length > 0) {
      students.forEach((student) => {
        results.push({
          id: student.id,
          type: "student",
          title: `${student.firstName} ${student.lastName}`,
          subtitle: `${student.studentId} • ${student.className || "No class"}`,
          link: `/dashboard/students`,
          icon: <GraduationCap className="h-4 w-4" />,
          badge: student.status,
        });
      });
    }

    // Teachers
    if (teachers && teachers.length > 0) {
      teachers.forEach((teacher) => {
        results.push({
          id: teacher.id,
          type: "teacher",
          title: `${teacher.firstName} ${teacher.lastName}`,
          subtitle: `${teacher.employeeId} • ${teacher.department}`,
          link: `/dashboard/teachers`,
          icon: <Users className="h-4 w-4" />,
          badge: teacher.status,
        });
      });
    }

    // Classes
    if (classes && classes.length > 0) {
      classes.forEach((cls) => {
        results.push({
          id: cls.id,
          type: "class",
          title: cls.name,
          subtitle: `${cls.sectionCount || 0} sections • ${cls.studentCount || 0} students`,
          link: `/dashboard/classes`,
          icon: <Calendar className="h-4 w-4" />,
        });
      });
    }

    // Subjects
    if (subjects && subjects.length > 0) {
      subjects.forEach((subject) => {
        results.push({
          id: subject.id,
          type: "subject",
          title: subject.name,
          subtitle: `${subject.department} • ${subject.classCount || 0} classes`,
          link: `/dashboard/subjects`,
          icon: <BookMarked className="h-4 w-4" />,
          badge: subject.isCore ? "Core" : "Elective",
        });
      });
    }

    // Schools (Super Admin only)
    if (schools && schools.length > 0) {
      schools.forEach((school) => {
        results.push({
          id: school.id,
          type: "school",
          title: school.name,
          subtitle: `${school.studentCount || 0} students • ${school.plan}`,
          link: `/dashboard/schools`,
          icon: <Building2 className="h-4 w-4" />,
          badge: school.status,
        });
      });
    }

    // Users
    if (users && users.length > 0) {
      users.forEach((usr) => {
        results.push({
          id: usr.id,
          type: "user",
          title: `${usr.firstName} ${usr.lastName}`,
          subtitle: `${usr.email} • ${usr.role}`,
          link: `/dashboard/users`,
          icon: <User className="h-4 w-4" />,
          badge: usr.status,
        });
      });
    }

    return results;
  }, [students, teachers, classes, subjects, schools, users]);

  const searchResults = formatSearchResults();

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    router.push(result.link);
  };

  const groupedResults = searchResults.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const typeLabels: Record<string, string> = {
    student: "Students",
    teacher: "Teachers",
    class: "Classes",
    subject: "Subjects",
    school: "Schools",
    user: "Users",
  };

  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-between w-full sm:w-64 px-3 py-2 text-sm text-muted-foreground border rounded-md hover:border-primary transition-colors"
      >
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          <span>Search...</span>
        </div>
        <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Search Dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search students, teachers, classes, and more..."
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          {searchQuery.length > 0 ? (
            <>
              {searchResults.length === 0 ? (
                <CommandEmpty>No results found.</CommandEmpty>
              ) : (
                Object.keys(groupedResults).map((type, index) => (
                  <div key={type}>
                    {index > 0 && <CommandSeparator />}
                    <CommandGroup heading={typeLabels[type] || type}>
                      {groupedResults[type].map((result) => (
                        <CommandItem
                          key={result.id}
                          value={`${result.title} ${result.subtitle}`}
                          onSelect={() => handleSelect(result)}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          {result.icon}
                          <div className="flex-1">
                            <p className="font-medium">{result.title}</p>
                            <p className="text-xs text-muted-foreground">{result.subtitle}</p>
                          </div>
                          {result.badge && (
                            <Badge variant="secondary" className="text-xs">
                              {result.badge}
                            </Badge>
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </div>
                ))
              )}
            </>
          ) : (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="mb-2">Start typing to search</p>
              <p className="text-xs">
                Search across students, teachers, classes, subjects, and more
              </p>
            </div>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/contexts/auth-context";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Search, User, BookOpen, GraduationCap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StudentDetailDialog } from "./student-detail-dialog";
import { TeacherDetailDialog } from "./teacher-detail-dialog";
import { ClassDetailDialog } from "./class-detail-dialog";
import { SubjectDetailDialog } from "./subject-detail-dialog";
import type { Id } from "../../../convex/_generated/dataModel";
import { DialogTitle } from "@radix-ui/react-dialog";

interface SearchResult {
  id: Id<"students"> | Id<"teachers"> | Id<"classes"> | Id<"subjects">;
  type: "student" | "teacher" | "class" | "subject";
  title: string;
  subtitle: string;
  metadata: string;
  data: Record<string, unknown>;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const { user } = useAuth();

  const searchResults = useQuery(
    api.search.globalSearch,
    user?.schoolId && searchQuery.length >= 2
      ? { schoolId: user.schoolId, searchQuery }
      : "skip"
  );

  // Keyboard shortcut to open search (Cmd+K or Ctrl+K)
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

  // Reset search query when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
    }
  }, [open]);

  const handleResultClick = useCallback((result: SearchResult) => {
    setSelectedResult(result);
    setOpen(false);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case "student":
        return <User className="h-4 w-4" />;
      case "teacher":
        return <GraduationCap className="h-4 w-4" />;
      case "class":
        return <Users className="h-4 w-4" />;
      case "subject":
        return <BookOpen className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const hasResults =
    searchResults &&
    (searchResults.students.length > 0 ||
      searchResults.teachers.length > 0 ||
      searchResults.classes.length > 0 ||
      searchResults.subjects.length > 0);

  return (
    <>
      <Button
        variant="outline"
        className="relative w-full justify-start text-sm text-gray-500 sm:w-64 lg:w-80"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span>Search...</span>
        <kbd className="pointer-events-none absolute right-2 hidden h-5 select-none items-center gap-1 rounded border bg-gray-100 px-1.5 font-mono text-xs font-medium opacity-100 sm:flex dark:bg-gray-800">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTitle></DialogTitle>
        <DialogContent className="p-0">
          <Command shouldFilter={false} className="rounded-lg border shadow-md">
            <CommandInput
              placeholder="Search students, teachers, classes, or subjects..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              {searchQuery.length < 2 ? (
                <div className="py-6 text-center text-sm text-gray-500">
                  Type at least 2 characters to search
                </div>
              ) : (
                <>
                  <CommandEmpty>No results found.</CommandEmpty>

                  {searchResults && searchResults.students.length > 0 && (
                    <CommandGroup heading="Students">
                      {searchResults.students.map((result) => (
                        <CommandItem
                          key={result.id}
                          onSelect={() => handleResultClick(result)}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center gap-3 w-full">
                            {getIcon(result.type)}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm">{result.title}</div>
                              <div className="text-xs text-gray-500 truncate">
                                {result.subtitle}
                              </div>
                              <div className="text-xs text-gray-400 truncate">
                                {result.metadata}
                              </div>
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {searchResults && searchResults.teachers.length > 0 && (
                    <CommandGroup heading="Teachers">
                      {searchResults.teachers.map((result) => (
                        <CommandItem
                          key={result.id}
                          onSelect={() => handleResultClick(result)}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center gap-3 w-full">
                            {getIcon(result.type)}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm">{result.title}</div>
                              <div className="text-xs text-gray-500 truncate">
                                {result.subtitle}
                              </div>
                              <div className="text-xs text-gray-400 truncate">
                                {result.metadata}
                              </div>
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {searchResults && searchResults.classes.length > 0 && (
                    <CommandGroup heading="Classes">
                      {searchResults.classes.map((result) => (
                        <CommandItem
                          key={result.id}
                          onSelect={() => handleResultClick(result)}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center gap-3 w-full">
                            {getIcon(result.type)}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm">{result.title}</div>
                              <div className="text-xs text-gray-500 truncate">
                                {result.subtitle}
                              </div>
                              <div className="text-xs text-gray-400 truncate">
                                {result.metadata}
                              </div>
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {searchResults && searchResults.subjects.length > 0 && (
                    <CommandGroup heading="Subjects">
                      {searchResults.subjects.map((result) => (
                        <CommandItem
                          key={result.id}
                          onSelect={() => handleResultClick(result)}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center gap-3 w-full">
                            {getIcon(result.type)}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm">{result.title}</div>
                              <div className="text-xs text-gray-500 truncate">
                                {result.subtitle}
                              </div>
                              <div className="text-xs text-gray-400 truncate">
                                {result.metadata}
                              </div>
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>

      {/* Detail Dialogs */}
      {selectedResult?.type === "student" && (
        <StudentDetailDialog
          open={!!selectedResult}
          onClose={() => setSelectedResult(null)}
          studentData={selectedResult.data}
        />
      )}

      {selectedResult?.type === "teacher" && (
        <TeacherDetailDialog
          open={!!selectedResult}
          onClose={() => setSelectedResult(null)}
          teacherData={selectedResult.data}
        />
      )}

      {selectedResult?.type === "class" && (
        <ClassDetailDialog
          open={!!selectedResult}
          onClose={() => setSelectedResult(null)}
          classData={selectedResult.data}
        />
      )}

      {selectedResult?.type === "subject" && (
        <SubjectDetailDialog
          open={!!selectedResult}
          onClose={() => setSelectedResult(null)}
          subjectData={selectedResult.data}
        />
      )}
    </>
  );
}

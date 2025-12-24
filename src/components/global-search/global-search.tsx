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
import { Search, User, BookOpen, GraduationCap, Users, History, Trash2 } from "lucide-react";
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

const SEARCH_HISTORY_KEY = "schoolflow-search-history";
const MAX_HISTORY_ITEMS = 10;

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const { user } = useAuth();

  // Load search history from localStorage on mount
  useEffect(() => {
    const loadHistory = () => {
      try {
        const saved = localStorage.getItem(SEARCH_HISTORY_KEY);
        if (saved) {
          setSearchHistory(JSON.parse(saved));
        }
      } catch (error) {
        console.error("Failed to load search history:", error);
      }
    };
    loadHistory();
  }, []);

  // Save search query to history
  const addToHistory = useCallback((query: string) => {
    if (!query || query.length < 2) return;

    setSearchHistory((prev) => {
      // Remove duplicate if exists
      const filtered = prev.filter((item) => item !== query);
      // Add to beginning
      const updated = [query, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      // Save to localStorage
      try {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error("Failed to save search history:", error);
      }
      return updated;
    });
  }, []);

  // Clear all search history
  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (error) {
      console.error("Failed to clear search history:", error);
    }
  }, []);

  const searchResults = useQuery(
    api.search.globalSearch,
    user && user.schoolId && searchQuery.length >= 2
      ? { schoolId: user.schoolId, searchQuery }
      : "skip"
  );
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
    // Add the current search query to history
    addToHistory(searchQuery);
    setSelectedResult(result);
    setOpen(false);
  }, [searchQuery, addToHistory]);

  // Handle clicking on a history item
  const handleHistoryClick = useCallback((query: string) => {
    setSearchQuery(query);
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
                <>
                  {searchHistory.length > 0 ? (
                    <CommandGroup heading="Recent Searches">
                      {searchHistory.map((query, index) => (
                        <CommandItem
                          key={index}
                          onSelect={() => handleHistoryClick(query)}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center gap-3 w-full">
                            <History className="h-4 w-4 text-gray-400" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm">{query}</div>
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                      <div className="px-2 py-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearHistory}
                          className="w-full justify-start text-xs text-gray-500 hover:text-red-600"
                        >
                          <Trash2 className="h-3 w-3 mr-2" />
                          Clear History
                        </Button>
                      </div>
                    </CommandGroup>
                  ) : (
                    <div className="py-6 text-center text-sm text-gray-500">
                      Type at least 2 characters to search
                    </div>
                  )}
                </>
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

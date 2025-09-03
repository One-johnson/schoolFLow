
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { Search, User, UserCheck, BookOpen } from "lucide-react"
import { useDatabase } from "@/hooks/use-database"
import { useAuth } from "@/hooks/use-auth"

type Student = { id: string; name: string; studentId: string; }
type Teacher = { id: string; name: string; teacherId: string; }
type Class = { id: string; name: string; }

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const { role, user } = useAuth();

  const { data: students } = useDatabase<Student>('students');
  const { data: teachers } = useDatabase<Teacher>('teachers');
  const { data: classes } = useDatabase<Class>('classes');

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])
  
  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false)
    command()
  }, [])

  const commandGroups = [
    {
      heading: "Students",
      items: students.map(s => ({
        id: s.id,
        label: s.name,
        sublabel: s.studentId,
        icon: User,
        action: () => router.push(`/dashboard/students/${s.id}`),
        roles: ['admin', 'teacher']
      })),
    },
     {
      heading: "Teachers",
      items: teachers.map(t => ({
        id: t.id,
        label: t.name,
        sublabel: t.teacherId,
        icon: UserCheck,
        action: () => router.push(`/dashboard/teachers/${t.id}`),
        roles: ['admin']
      })),
    },
    {
      heading: "Classes",
      items: classes.map(c => ({
        id: c.id,
        label: c.name,
        sublabel: 'Class',
        icon: BookOpen,
        action: () => router.push(`/dashboard/classes`),
        roles: ['admin']
      })),
    }
  ].map(group => ({
      ...group,
      items: group.items.filter(item => role && item.roles.includes(role))
  })).filter(group => group.items.length > 0);


  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-full justify-start rounded-md text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 mr-2" />
        <span className="hidden lg:inline-flex">Search...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {commandGroups.map((group) => (
             <CommandGroup key={group.heading} heading={group.heading}>
              {group.items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.label}
                  onSelect={() => runCommand(item.action)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                     <item.icon className="h-4 w-4" />
                     <span>{item.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{item.sublabel}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  )
}

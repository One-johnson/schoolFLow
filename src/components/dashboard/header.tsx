
"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { UserNav } from "@/components/dashboard/user-nav"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Bell, Search, Moon, Sun, Calendar, Clock, School } from "lucide-react"
import { NotificationBell } from "@/components/dashboard/notification-bell"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import { format } from "date-fns"
import Link from "next/link"

function LiveDateTime() {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hidden lg:flex items-center gap-4 text-sm font-medium text-muted-foreground">
        <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{format(dateTime, 'EEEE, MMMM d, yyyy')}</span>
        </div>
        <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{format(dateTime, 'h:mm:ss a')}</span>
        </div>
    </div>
  )
}

export function DashboardHeader() {
  const { theme, setTheme } = useTheme()

  return (
    <header className="fixed top-0 left-0 right-0 z-20 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-md lg:h-[60px] lg:px-6 peer-data-[state=expanded]:peer-data-[variant=inset]:left-[16rem] peer-data-[variant=inset]:md:left-[16rem] peer-data-[collapsible=icon]:peer-data-[state=collapsed]:peer-data-[variant=inset]:md:left-[calc(3rem+1rem)] peer-data-[collapsible=icon]:peer-data-[state=collapsed]:peer-data-[variant=sidebar]:md:left-12 peer-data-[variant=sidebar]:md:left-64">
      {/* Left Section */}
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarTrigger className="md:hidden" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Toggle Navigation</p>
          </TooltipContent>
        </Tooltip>
        <Link href="/dashboard" className="hidden md:flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <School className="h-6 w-6" />
            </div>
            <span className="text-lg font-semibold text-primary">SchoolFlow</span>
        </Link>
      </div>
      
       {/* Middle Section */}
       <div className="flex-1 flex justify-center">
         <div className="relative w-full max-w-lg">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-full rounded-lg bg-background pl-8"
            />
          </div>
       </div>

       {/* Right Section */}
       <div className="flex items-center gap-4">
          <LiveDateTime />
          <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
          </Button>
          <NotificationBell />
          <UserNav />
       </div>
    </header>
  )
}

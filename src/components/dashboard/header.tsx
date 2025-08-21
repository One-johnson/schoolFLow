"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { UserNav } from "@/components/dashboard/user-nav"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-md lg:h-[60px] lg:px-6">
      <div className="flex-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarTrigger className="md:hidden" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Toggle Navigation</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <UserNav />
    </header>
  )
}

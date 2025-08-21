"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PlusCircle, Megaphone, Trash2, Pencil } from "lucide-react"

const announcements = [
  {
    id: 1,
    title: "Parent-Teacher Meetings Next Week",
    content: "We are pleased to announce the schedule for the upcoming parent-teacher meetings. Please check the school portal for your assigned time slot. We look forward to seeing you there.",
    author: "Principal Evans",
    date: "2023-10-15",
  },
  {
    id: 2,
    title: "Annual Sports Day Postponed",
    content: "Due to the weather forecast, the Annual Sports Day originally scheduled for this Friday has been postponed. A new date will be announced shortly. We apologize for any inconvenience.",
    author: "Admin Office",
    date: "2023-10-14",
  },
  {
    id: 3,
    title: "Science Fair Submissions Open",
    content: "Calling all young scientists! Submissions for the annual Science Fair are now open. The deadline for project proposals is November 1st. See Mr. Newton for more details.",
    author: "Science Dept.",
    date: "2023-10-12",
  },
]

export default function AnnouncementsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground">
            Manage and publish school-wide information.
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Announcement</DialogTitle>
              <DialogDescription>
                Write and publish a new announcement for the entire school.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Title
                </Label>
                <Input id="title" placeholder="Announcement Title" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="content" className="text-right">
                  Content
                </Label>
                <Textarea id="content" placeholder="Type your announcement content here." className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Publish</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {announcements.map((announcement) => (
          <Card key={announcement.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                   <div className="bg-primary text-primary-foreground p-3 rounded-full">
                    <Megaphone className="h-6 w-6" />
                   </div>
                  <div>
                    <CardTitle>{announcement.title}</CardTitle>
                    <CardDescription>By {announcement.author} on {announcement.date}</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground">{announcement.content}</p>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" size="icon">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="destructive" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}

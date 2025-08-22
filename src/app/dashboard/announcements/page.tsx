"use client"

import { useState, useEffect } from "react"
import { database } from "@/lib/firebase"
import { ref, onValue, push, remove, serverTimestamp } from "firebase/database"
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
import { useToast } from "@/hooks/use-toast"

type Announcement = {
  id: string,
  title: string,
  content: string,
  author: string,
  date: string,
  createdAt: number,
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const announcementsRef = ref(database, 'announcements');
    const unsubscribe = onValue(announcementsRef, (snapshot) => {
      const data = snapshot.val();
      const loadedAnnouncements: Announcement[] = [];
      if (data) {
        for (const key in data) {
          loadedAnnouncements.push({
            id: key,
            date: new Date(data[key].createdAt).toLocaleDateString(),
            ...data[key]
          });
        }
      }
      setAnnouncements(loadedAnnouncements.sort((a, b) => b.createdAt - a.createdAt));
    });

    return () => unsubscribe();
  }, []);

  const handleCreateAnnouncement = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      toast({
        title: "Error",
        description: "Title and content cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    
    const announcementsRef = ref(database, 'announcements');
    try {
      await push(announcementsRef, {
        title: newTitle,
        content: newContent,
        author: "Admin", // Or get current user
        createdAt: serverTimestamp(),
      });
      toast({
        title: "Success",
        description: "Announcement published.",
      });
      setNewTitle("");
      setNewContent("");
      setIsDialogOpen(false);
    } catch (error) {
       toast({
        title: "Error",
        description: "Failed to create announcement.",
        variant: "destructive",
      });
      console.error("Firebase error:", error);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    const announcementRef = ref(database, `announcements/${id}`);
    try {
      await remove(announcementRef);
      toast({
        title: "Success",
        description: "Announcement deleted.",
      });
    } catch (error) {
       toast({
        title: "Error",
        description: "Failed to delete announcement.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground">
            Manage and publish school-wide information.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                <Input id="title" placeholder="Announcement Title" className="col-span-3" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="content" className="text-right">
                  Content
                </Label>
                <Textarea id="content" placeholder="Type your announcement content here." className="col-span-3" value={newContent} onChange={(e) => setNewContent(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleCreateAnnouncement}>Publish</Button>
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
              <Button variant="outline" size="icon" disabled>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="destructive" size="icon" onClick={() => handleDeleteAnnouncement(announcement.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}

'use client';

import { JSX, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsTrigger, TabsList } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Eye, Archive, Megaphone, FileText, CheckCircle, Clock } from 'lucide-react';
import { CreateAnnouncementDialog } from '@/components/announcements/create-announcement-dialog';
import { EditAnnouncementDialog } from '@/components/announcements/edit-announcement-dialog';
import { ViewAnnouncementDialog } from '@/components/announcements/view-announcement-dialog';
import { DeleteAnnouncementDialog } from '@/components/announcements/delete-announcement-dialog';
import { toast } from 'sonner';

interface Announcement {
  _id: Id<'announcements'>;
  schoolId: string;
  title: string;
  content: string;
  targetType: 'school' | 'class' | 'department' | 'teachers';
  targetId?: string;
  targetName?: string;
  status: 'draft' | 'published' | 'archived';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export default function AnnouncementsPage(): React.JSX.Element {
  const { user } = useAuth();
  const publishAnnouncement = useMutation(api.announcements.publish);
  const archiveAnnouncement = useMutation(api.announcements.archive);

  const drafts = useQuery(api.announcements.getBySchool, {
    schoolId: user?.schoolId || '',
    status: 'draft',
  });
  const published = useQuery(api.announcements.getBySchool, {
    schoolId: user?.schoolId || '',
    status: 'published',
  });
  const archived = useQuery(api.announcements.getBySchool, {
    schoolId: user?.schoolId || '',
    status: 'archived',
  });

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showView, setShowView] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  const total = (drafts?.length || 0) + (published?.length || 0) + (archived?.length || 0);

  const handlePublish = async (announcement: Announcement): Promise<void> => {
    try {
      await publishAnnouncement({ id: announcement._id, updatedBy: user?.userId || '' });
      toast.success('Announcement published');
    } catch {
      toast.error('Failed to publish announcement');
    }
  };

  const handleArchive = async (announcement: Announcement): Promise<void> => {
    try {
      await archiveAnnouncement({ id: announcement._id, updatedBy: user?.userId || '' });
      toast.success('Announcement archived');
    } catch {
      toast.error('Failed to archive announcement');
    }
  };

  const getTargetDisplay = (announcement: Announcement): string => {
    switch (announcement.targetType) {
      case 'school': return 'Entire School';
      case 'class': return `Class: ${announcement.targetName || 'Unknown'}`;
      case 'department': return `Department: ${announcement.targetName || 'Unknown'}`;
      case 'teachers': return 'Teachers';
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderAnnouncementCard = (announcement: Announcement, actions: React.JSX.Element): React.JSX.Element => (
    <Card key={announcement._id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{announcement.title}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
              {announcement.content.length > 120
                ? announcement.content.slice(0, 120) + '...'
                : announcement.content}
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {getTargetDisplay(announcement)}
              </Badge>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {announcement.status === 'published' && announcement.publishedAt
                  ? `Published ${formatDate(announcement.publishedAt)}`
                  : `Created ${formatDate(announcement.createdAt)}`}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">{actions}</div>
        </div>
      </CardContent>
    </Card>
  );

  const renderEmptyState = (status: string): React.JSX.Element => (
    <div className="text-center py-12">
      <Megaphone className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
      <p className="text-sm text-gray-500 dark:text-gray-400">No {status} announcements</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Announcements</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage and send announcements to your school community
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Announcement
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold">{total}</p>
              </div>
              <Megaphone className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Drafts</p>
                <p className="text-2xl font-bold text-yellow-600">{drafts?.length || 0}</p>
              </div>
              <FileText className="h-6 w-6 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Published</p>
                <p className="text-2xl font-bold text-green-600">{published?.length || 0}</p>
              </div>
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Archived</p>
                <p className="text-2xl font-bold text-gray-600">{archived?.length || 0}</p>
              </div>
              <Clock className="h-6 w-6 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="draft">
        <TabsList>
          <TabsTrigger value="draft">
            Drafts
            {drafts && drafts.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium px-2 h-4">
                {drafts.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="published">
            Published
            {published && published.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-green-100 text-green-800 text-xs font-medium px-2 h-4">
                {published.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="archived">
            Archived
            {archived && archived.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-gray-100 text-gray-800 text-xs font-medium px-2 h-4">
                {archived.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Draft Tab */}
        <TabsContent value="draft" className="space-y-3 mt-4">
          {drafts && drafts.length > 0 ? (
            drafts.map((announcement) =>
              renderAnnouncementCard(announcement as Announcement, (
                <>
                  <Button
                    variant="ghost" size="sm" className="h-8 px-2"
                    onClick={() => { setSelectedAnnouncement(announcement as Announcement); setShowEdit(true); }}
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost" size="sm" className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={() => handlePublish(announcement as Announcement)}
                    title="Publish"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost" size="sm" className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => { setSelectedAnnouncement(announcement as Announcement); setShowDelete(true); }}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              ))
            )
          ) : (
            renderEmptyState('draft')
          )}
        </TabsContent>

        {/* Published Tab */}
        <TabsContent value="published" className="space-y-3 mt-4">
          {published && published.length > 0 ? (
            published.map((announcement) =>
              renderAnnouncementCard(announcement as Announcement, (
                <>
                  <Button
                    variant="ghost" size="sm" className="h-8 px-2"
                    onClick={() => { setSelectedAnnouncement(announcement as Announcement); setShowView(true); }}
                    title="View"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost" size="sm" className="h-8 px-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                    onClick={() => handleArchive(announcement as Announcement)}
                    title="Archive"
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
                </>
              ))
            )
          ) : (
            renderEmptyState('published')
          )}
        </TabsContent>

        {/* Archived Tab */}
        <TabsContent value="archived" className="space-y-3 mt-4">
          {archived && archived.length > 0 ? (
            archived.map((announcement) =>
              renderAnnouncementCard(announcement as Announcement, (
                <Button
                  variant="ghost" size="sm" className="h-8 px-2"
                  onClick={() => { setSelectedAnnouncement(announcement as Announcement); setShowView(true); }}
                  title="View"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              ))
            )
          ) : (
            renderEmptyState('archived')
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateAnnouncementDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onSuccess={() => {}}
      />
      {selectedAnnouncement && (
        <>
          <EditAnnouncementDialog
            open={showEdit}
            onOpenChange={setShowEdit}
            announcement={selectedAnnouncement}
            onSuccess={() => {}}
          />
          <ViewAnnouncementDialog
            open={showView}
            onOpenChange={setShowView}
            announcement={selectedAnnouncement}
          />
          <DeleteAnnouncementDialog
            open={showDelete}
            onOpenChange={setShowDelete}
            announcement={selectedAnnouncement}
            onSuccess={() => {}}
          />
        </>
      )}
    </div>
  );
}

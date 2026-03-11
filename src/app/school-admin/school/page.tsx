'use client';

import { JSX, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import {
  School,
  Mail,
  Phone,
  MapPin,
  Users,
  Calendar,
  Badge as BadgeIcon,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';

export default function SchoolPage(): React.JSX.Element {
  const router = useRouter();
  const { user } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

   const currentAdmin = useQuery(
    api.schoolAdmins.getById,
    user?.userId ? { id: user.userId as import('@/../convex/_generated/dataModel').Id<'schoolAdmins'> } : 'skip'
  );

  const schoolCreationRequests = useQuery(
    api.schoolCreationRequests.getByAdmin,
    currentAdmin ? { schoolAdminId: currentAdmin._id } : 'skip'
  );

  const schools = useQuery(api.schools.list);

  const approvedSchoolRequest = schoolCreationRequests?.find(
    (req) => req.status === 'approved'
  );
  const school = schools?.find((s) => s.adminId === currentAdmin?._id);

  // School logo photos
  const schoolPhotos = useQuery(
    api.photos.getPhotosByEntity,
    school
      ? { entityType: 'school', entityId: school._id }
      : 'skip'
  );

  const generateUploadUrl = useMutation(api.photos.generateUploadUrl);
  const createPhotoRecord = useMutation(api.photos.createPhotoRecord);
  const updateSchoolInfo = useMutation(api.schools.updateSchoolInfo);

  // Derive logo URL from latest school photo
  const logoStorageId =
    schoolPhotos && schoolPhotos.length > 0
      ? schoolPhotos[0].storageId
      : undefined;

  const logoUrl =
    logoStorageId && process.env.NEXT_PUBLIC_CONVEX_URL
      ? `${process.env.NEXT_PUBLIC_CONVEX_URL.replace(
          '.convex.cloud',
          '.convex.site'
        )}/getFile?storageId=${logoStorageId}`
      : undefined;

  useEffect(() => {
    if (school && !isEditing) {
      setEditForm({
        name: school.name ?? '',
        email: school.email ?? '',
        phone: school.phone ?? '',
        address: school.address ?? '',
      });
    }
  }, [school, isEditing]);

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveSchoolInfo = async () => {
    if (!school) return;
    setIsSaving(true);
    try {
      await updateSchoolInfo({
        id: school._id,
        name: editForm.name.trim() || school.name,
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
        address: editForm.address.trim(),
      });
      toast.success('School information updated');
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      toast.error('Failed to update school information');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !school || !currentAdmin) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo must be less than 5MB');
      return;
    }

    setIsUploadingLogo(true);
    try {
      const uploadUrl = await generateUploadUrl();

      const result = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error('Failed to upload logo');
      }

      const { storageId } = await result.json();

      await createPhotoRecord({
        storageId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        entityType: 'school',
        entityId: school._id,
        fileType: 'photo',
        uploadedBy: currentAdmin._id,
        schoolId: currentAdmin.schoolId,
      });

      toast.success('School logo updated');
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload logo');
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) {
        logoInputRef.current.value = '';
      }
    }
  };

  if (!currentAdmin) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Loading...</h2>
          <p className="text-muted-foreground">Please wait</p>
        </div>
      </div>
    );
  }

  if (!approvedSchoolRequest || !school) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>No School Created</CardTitle>
            <CardDescription>
              You haven't created a school yet or your request is still pending
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/school-admin/create-school')}>
              Create School
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My School</h1>
        <p className="text-muted-foreground">
          View and manage your school information
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-16 w-16 border">
                  {logoUrl ? (
                    <AvatarImage src={logoUrl} alt={school.name} />
                  ) : (
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {school.name?.[0] ?? 'S'}
                    </AvatarFallback>
                  )}
                </Avatar>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoFileChange}
                  disabled={isUploadingLogo}
                />
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute -bottom-2 -right-2 h-7 w-7 rounded-full shadow-md"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={isUploadingLogo}
                >
                  {isUploadingLogo ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <ImageIcon className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <div>
                {isEditing ? (
                  <div className="space-y-2">
                    <Input
                      name="name"
                      value={editForm.name}
                      onChange={handleEditChange}
                      placeholder="School name"
                    />
                    <CardDescription>School ID: {currentAdmin.schoolId}</CardDescription>
                  </div>
                ) : (
                  <>
                    <CardTitle className="text-2xl">{school.name}</CardTitle>
                    <CardDescription>School ID: {currentAdmin.schoolId}</CardDescription>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={school.status === 'active' ? 'default' : 'secondary'}>
                {school.status}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing((prev) => !prev)}
              >
                {isEditing ? 'Cancel' : 'Edit Info'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="w-full">
                  <p className="text-sm font-medium">Email</p>
                  {isEditing ? (
                    <Input
                      name="email"
                      type="email"
                      value={editForm.email}
                      onChange={handleEditChange}
                      placeholder="School email"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">{school.email}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="w-full">
                  <p className="text-sm font-medium">Phone</p>
                  {isEditing ? (
                    <Input
                      name="phone"
                      value={editForm.phone}
                      onChange={handleEditChange}
                      placeholder="School phone number"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">{school.phone}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="w-full">
                  <p className="text-sm font-medium">Address</p>
                  {isEditing ? (
                    <Textarea
                      name="address"
                      value={editForm.address}
                      onChange={handleEditChange}
                      placeholder="School address"
                      rows={3}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">{school.address}</p>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={handleSaveSchoolInfo}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditing(false)}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Total Students</p>
                  <p className="text-sm text-muted-foreground">
                    {school.studentCount}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <BadgeIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Subscription Plan</p>
                  <p className="text-sm text-muted-foreground">
                    {school.subscriptionPlan}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Registration Date</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(school.registrationDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {school.approvalDate && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Approval Date</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(school.approvalDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Manage your school</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <Button variant="outline" onClick={() => router.push('/school-admin/subscription')}>
              View Subscription
            </Button>
            <Button variant="outline" onClick={() => router.push('/school-admin/profile')}>
              Update Profile
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useTeacherAuth } from '@/hooks/useTeacherAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  User,
  Mail,
  Building,
  Lock,
  LogOut,
  Eye,
  EyeOff,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  GraduationCap,
  BookOpen,
  Camera,
  Loader2,
} from 'lucide-react';
import type { Id } from '../../../../convex/_generated/dataModel';

export default function TeacherProfilePage() {
  const { teacher, logout, changePassword } = useTeacherAuth();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch full teacher details from database
  const teacherDetails = useQuery(
    api.teachers.getTeacherFullDetails,
    teacher?.id ? { teacherId: teacher.id as Id<'teachers'> } : 'skip'
  );

  const generateUploadUrl = useMutation(api.photos.generateUploadUrl);
  const updateTeacherPhoto = useMutation(api.teachers.updateTeacherPhoto);
  const createPhotoRecord = useMutation(api.photos.createPhotoRecord);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !teacher) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      // Get upload URL from Convex
      const uploadUrl = await generateUploadUrl();

      // Upload file to Convex storage
      const result = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error('Failed to upload image');
      }

      const { storageId } = await result.json();

      // Create photo record
      await createPhotoRecord({
        storageId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        entityType: 'teacher',
        entityId: teacher.id,
        fileType: 'photo',
        uploadedBy: teacher.id,
        schoolId: teacher.schoolId,
      });

      // Get the URL for the uploaded file
      const photoUrl = `${process.env.NEXT_PUBLIC_CONVEX_URL?.replace('.convex.cloud', '.convex.site')}/getFile?storageId=${storageId}`;

      // Update teacher's photo URL
      await updateTeacherPhoto({
        teacherId: teacher.id as Id<'teachers'>,
        photoUrl,
      });

      toast.success('Photo updated successfully');
    } catch (error) {
      console.error('Photo upload error:', error);
      toast.error('Failed to upload photo');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsChangingPassword(true);
    try {
      const result = await changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );

      if (result.success) {
        toast.success('Password changed successfully');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setShowPasswordForm(false);
      } else {
        toast.error(result.error || 'Failed to change password');
      }
    } catch {
      toast.error('Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch {
      toast.error('Failed to log out');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not provided';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!teacher) {
    return (
      <div className="space-y-4 py-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const photoUrl = teacherDetails?.photoUrl || teacher.photoUrl;

  return (
    <div className="space-y-4 py-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold">My Profile</h1>

      {/* Profile Header with Photo */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={photoUrl} alt={`${teacher.firstName} ${teacher.lastName}`} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {teacher.firstName[0]}
                  {teacher.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
                disabled={isUploadingPhoto}
              />
              <Button
                size="icon"
                variant="secondary"
                className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full shadow-md"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
              >
                {isUploadingPhoto ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-semibold">
                {teacher.firstName} {teacher.lastName}
              </h2>
              <p className="text-muted-foreground">{teacherDetails?.teacherId || 'Teacher'}</p>
              <Badge variant="secondary" className="mt-2">
                {teacherDetails?.status || 'active'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium truncate">{teacher.email}</p>
            </div>
          </div>
          <Separator />
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{teacherDetails?.phone || 'Not provided'}</p>
            </div>
          </div>
          <Separator />
          <div className="flex items-center gap-3">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="font-medium">{teacherDetails?.address || 'Not provided'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">Date of Birth</p>
              <p className="font-medium">{formatDate(teacherDetails?.dateOfBirth)}</p>
            </div>
          </div>
          <Separator />
          <div className="flex items-center gap-3">
            <User className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">Gender</p>
              <p className="font-medium capitalize">{teacherDetails?.gender || 'Not provided'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employment Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Employment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Building className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">School ID</p>
              <p className="font-medium">{teacher.schoolId}</p>
            </div>
          </div>
          <Separator />
          <div className="flex items-center gap-3">
            <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">Employment Type</p>
              <p className="font-medium capitalize">
                {teacherDetails?.employmentType?.replace('_', ' ') || 'Not provided'}
              </p>
            </div>
          </div>
          <Separator />
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">Employment Date</p>
              <p className="font-medium">{formatDate(teacherDetails?.employmentDate)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Qualifications & Subjects */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Qualifications & Subjects</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
            <div>
              <p className="text-sm text-muted-foreground mb-2">Qualifications</p>
              <div className="flex flex-wrap gap-1">
                {teacherDetails?.qualifications?.length ? (
                  teacherDetails.qualifications.map((q, i) => (
                    <Badge key={i} variant="outline">
                      {q}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No qualifications listed</p>
                )}
              </div>
            </div>
          </div>
          <Separator />
          <div className="flex items-start gap-3">
            <BookOpen className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
            <div>
              <p className="text-sm text-muted-foreground mb-2">Subjects</p>
              <div className="flex flex-wrap gap-1">
                {teacherDetails?.subjects?.length ? (
                  teacherDetails.subjects.map((s, i) => (
                    <Badge key={i} variant="secondary">
                      {s}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No subjects assigned</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assigned Classes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Assigned Classes</CardTitle>
        </CardHeader>
        <CardContent>
          {teacher.classNames?.length ? (
            <div className="space-y-2">
              {teacher.classNames.map((className, i) => (
                <div
                  key={i}
                  className="p-3 bg-muted/50 rounded-lg flex items-center justify-between"
                >
                  <span className="font-medium">{className}</span>
                  <Badge>Class Teacher</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No classes assigned
            </p>
          )}
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!showPasswordForm ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowPasswordForm(true)}
            >
              Change Password
            </Button>
          ) : (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, currentPassword: e.target.value })
                    }
                    required
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords({ ...showPasswords, current: !showPasswords.current })
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, newPassword: e.target.value })
                    }
                    required
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords({ ...showPasswords, new: !showPasswords.new })
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                    }
                    required
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={isChangingPassword}>
                  {isChangingPassword ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Logout */}
      <Button
        variant="destructive"
        className="w-full"
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4 mr-2" />
        Log Out
      </Button>
    </div>
  );
}

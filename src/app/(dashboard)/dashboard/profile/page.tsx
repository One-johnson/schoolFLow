"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Shield,
  Camera,
  Save,
  Lock,
  Bell,
  Eye,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { roleDisplayNames } from "@/lib/auth";

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export default function ProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phone: user?.phone || "",
    address: user?.address || "",
    bio: user?.bio || "",
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Queries
  const userDetails = useQuery(
    api.users.getUserById,
    user?.id ? { userId: user.id as Id<"users"> } : "skip"
  );

  const userActivities = useQuery(
    api.users.getUserRecentActivities,
    user?.id ? { userId: user.id as Id<"users">, limit: 10 } : "skip"
  );

  // Mutations
  const updateProfile = useMutation(api.users.updateUserProfile);
  const changePassword = useMutation(api.users.changePassword);
  const saveProfilePhoto = useMutation(api.users.saveProfilePhoto);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  
  // Upload state
  const [isUploading, setIsUploading] = useState(false);

  const handleUpdateProfile = async () => {
    if (!user?.id) return;

    try {
      await updateProfile({
        userId: user.id as Id<"users">,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        bio: formData.bio || undefined,
      });
      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to update profile");
      console.error(error);
    }
  };

  const handleChangePassword = async () => {
    if (!user?.id) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      await changePassword({
        userId: user.id as Id<"users">,
        newPassword: passwordData.newPassword,
      });
      toast.success("Password changed successfully");
      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast.error("Failed to change password");
      console.error(error);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    try {
      setIsUploading(true);
      toast.loading("Uploading photo...");

      // Step 1: Get upload URL from Convex
      const uploadUrl = await generateUploadUrl();

      // Step 2: Upload file to Convex storage
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error("Upload failed");
      }

      const { storageId } = await result.json();

      // Step 3: Save storage ID to user profile
      const response = await saveProfilePhoto({
        userId: user.id as Id<"users">,
        storageId,
      });

      toast.dismiss();
      toast.success("Profile photo updated successfully!");
      
      // Reset file input
      event.target.value = "";
    } catch (error) {
      console.error("Photo upload error:", error);
      toast.dismiss();
      toast.error("Failed to upload photo. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  if (!user || !userDetails) {
    return <div>Loading profile...</div>;
  }

  const getInitials = () => {
    return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase();
  };

  return (
    <div className="space-y-6 p-4 sm:p-8 pt-16 sm:pt-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground">
            Manage your account information and preferences
          </p>
        </div>
      </div>

      {/* Profile Overview Card */}
      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
                <AvatarImage src={userDetails.photo} alt={user.firstName} />
                <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <label 
                htmlFor="photo-upload" 
                className={`absolute bottom-0 right-0 ${isUploading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className={`bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 shadow-lg transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <Camera className={`h-4 w-4 ${isUploading ? 'animate-pulse' : ''}`} />
                </div>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={isUploading}
                />
              </label>
            </div>

            {/* User Info */}
            <div className="flex-1 space-y-3">
              <div>
                <h2 className="text-2xl font-bold">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-muted-foreground flex items-center gap-2 mt-1">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="px-3 py-1">
                  <Shield className="h-3 w-3 mr-1" />
                  {roleDisplayNames[user.role as keyof typeof roleDisplayNames]}
                </Badge>
                <Badge variant="outline" className="px-3 py-1">
                  <Briefcase className="h-3 w-3 mr-1" />
                  {user.schoolName || "Platform Administrator"}
                </Badge>
                <Badge
                  variant={userDetails.status === "active" ? "default" : "secondary"}
                  className="px-3 py-1"
                >
                  <Activity className="h-3 w-3 mr-1" />
                  {userDetails.status}
                </Badge>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-blue-600">
                  {userActivities?.length || 0}
                </div>
                <div className="text-xs text-muted-foreground">Recent Activities</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-600">
                  {Math.floor(
                    (Date.now() - (userDetails.createdAt || Date.now())) / (1000 * 60 * 60 * 24)
                  )}
                </div>
                <div className="text-xs text-muted-foreground">Days Active</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Content */}
      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Personal Information Tab */}
        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Update your personal details and contact information
                  </CardDescription>
                </div>
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)} variant="outline">
                    <User className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={() => setIsEditing(false)} variant="outline">
                      Cancel
                    </Button>
                    <Button onClick={handleUpdateProfile}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {isEditing ? (
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData({ ...formData, firstName: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData({ ...formData, lastName: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      placeholder="123 Main St, City, State"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) =>
                        setFormData({ ...formData, bio: e.target.value })
                      }
                      placeholder="Tell us about yourself..."
                      rows={4}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Full Name
                          </p>
                          <p className="text-base">
                            {user.firstName} {user.lastName}
                          </p>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex items-start gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Email Address
                          </p>
                          <p className="text-base">{user.email}</p>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex items-start gap-3">
                        <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Phone Number
                          </p>
                          <p className="text-base">{user.phone || "Not provided"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Address
                          </p>
                          <p className="text-base">{userDetails.address || "Not provided"}</p>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Member Since
                          </p>
                          <p className="text-base">
                            {new Date(userDetails.createdAt || Date.now()).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )}
                          </p>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex items-start gap-3">
                        <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Account Status
                          </p>
                          <p className="text-base capitalize">{userDetails.status || "Unknown"}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {userDetails.bio && (
                    <>
                      <Separator className="my-4" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Bio</p>
                        <p className="text-base">{userDetails.bio}</p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your password and security preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Change Password */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <Lock className="h-5 w-5" />
                      Change Password
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Update your password to keep your account secure
                    </p>
                  </div>
                  {!isChangingPassword && (
                    <Button onClick={() => setIsChangingPassword(true)} variant="outline">
                      Change Password
                    </Button>
                  )}
                </div>

                {isChangingPassword && (
                  <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, newPassword: e.target.value })
                        }
                        placeholder="Enter new password"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            confirmPassword: e.target.value,
                          })
                        }
                        placeholder="Confirm new password"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setIsChangingPassword(false);
                          setPasswordData({
                            currentPassword: "",
                            newPassword: "",
                            confirmPassword: "",
                          });
                        }}
                        variant="outline"
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleChangePassword}>Update Password</Button>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Two-Factor Authentication (Placeholder) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Two-Factor Authentication
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Badge variant="secondary">Coming Soon</Badge>
                </div>
              </div>

              <Separator />

              {/* Login Sessions (Placeholder) */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Active Sessions
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Manage devices where you're currently logged in
                  </p>
                </div>
                <div className="border rounded-lg p-4 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Current Session</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date().toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-green-600">
                      Active
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your recent actions and system interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userActivities && userActivities.length > 0 ? (
                <div className="space-y-4">
                  {userActivities.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 pb-4 border-b last:border-0"
                    >
                      <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-2">
                        <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{(activity as { action?: string }).action ?? 'Unknown action'}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date((activity as { timestamp?: string | number | Date }).timestamp ?? Date.now()).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent activity found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

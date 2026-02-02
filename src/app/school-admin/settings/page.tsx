'use client';

import { JSX, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Bell, Shield, User, Key } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { PasswordChangeDialog } from '@/components/password-change-dialog';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';

export default function SettingsPage(): React.JSX.Element {
  const router = useRouter();
    const { user } = useAuth();
  const [passwordDialogOpen, setPasswordDialogOpen] = useState<boolean>(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState<boolean>(false);
  const [isSavingAccount, setIsSavingAccount] = useState<boolean>(false);

  const currentAdmin = useQuery(
    api.schoolAdmins.getByEmail,
    user?.email ? { email: user.email } : 'skip'
  );
  
  const userSettingsData = useQuery(
    api.userSettings.get,
    currentAdmin?._id ? { userId: currentAdmin._id, userRole: 'school_admin' } : 'skip'
  );
  
  const updateUserSettings = useMutation(api.userSettings.updateSchoolAdmin);

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    paymentAlerts: true,
    systemUpdates: false,
  });

  const [account, setAccount] = useState({
    profileVisibility: true,
    dataSharing: false,
  });

  // Load user settings from database
  useEffect(() => {
    if (userSettingsData) {
      setNotifications({
        emailNotifications: userSettingsData.emailNotifications ?? true,
        paymentAlerts: userSettingsData.paymentAlerts ?? true,
        systemUpdates: userSettingsData.systemUpdates ?? false,
      });
      setAccount({
        profileVisibility: userSettingsData.profileVisibility ?? true,
        dataSharing: userSettingsData.dataSharing ?? false,
      });
    }
  }, [userSettingsData]);

 
  const handleSaveNotifications = async (): Promise<void> => {
    if (!currentAdmin?._id) {
      toast.error('User not authenticated');
      return;
    }

    setIsSavingNotifications(true);
    try {
      await updateUserSettings({
        userId: currentAdmin._id,
        emailNotifications: notifications.emailNotifications,
        paymentAlerts: notifications.paymentAlerts,
        systemUpdates: notifications.systemUpdates,
      });
      toast.success('Notification settings updated successfully');
    } catch (error) {
      toast.error('Failed to update notification settings');
      console.error(error);
    } finally {
      setIsSavingNotifications(false);
    }
  };

  const handleSaveAccount = async (): Promise<void> => {
    if (!currentAdmin?._id) {
      toast.error('User not authenticated');
      return;
    }

    setIsSavingAccount(true);
    try {
      await updateUserSettings({
        userId: currentAdmin._id,
        profileVisibility: account.profileVisibility,
        dataSharing: account.dataSharing,
      });
      toast.success('Account settings updated successfully');
    } catch (error) {
      toast.error('Failed to update account settings');
      console.error(error);
    } finally {
      setIsSavingAccount(false);
    }
  };

  if (!currentAdmin || !userSettingsData) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your preferences and settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notifications</CardTitle>
          </div>
          <CardDescription>Manage how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive email notifications for important updates
              </p>
            </div>
            <Switch 
              checked={notifications.emailNotifications}
              onCheckedChange={(checked: boolean) =>
                setNotifications({ ...notifications, emailNotifications: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Payment Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about payment status and renewals
              </p>
            </div>
            <Switch 
              checked={notifications.paymentAlerts}
              onCheckedChange={(checked: boolean) =>
                setNotifications({ ...notifications, paymentAlerts: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>System Updates</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications about system updates
              </p>
            </div>
            <Switch 
              checked={notifications.systemUpdates}
              onCheckedChange={(checked: boolean) =>
                setNotifications({ ...notifications, systemUpdates: checked })
              }
            />
          </div>
          <div className="pt-4">
            <Button onClick={handleSaveNotifications} disabled={isSavingNotifications}>
              {isSavingNotifications ? 'Saving...' : 'Save Notification Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Security</CardTitle>
          </div>
          <CardDescription>Manage your account security</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account
              </p>
            </div>
            <Button variant="outline" size="sm">
              Enable
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Change Password</Label>
              <p className="text-sm text-muted-foreground">
                Update your password regularly for better security
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPasswordDialogOpen(true)}
              className="gap-2"
            >
              <Key className="h-4 w-4" />
              Change
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <CardTitle>Account</CardTitle>
          </div>
          <CardDescription>Manage your account settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Profile Visibility</Label>
              <p className="text-sm text-muted-foreground">
                Control who can see your profile information
              </p>
            </div>
            <Switch 
              checked={account.profileVisibility}
              onCheckedChange={(checked: boolean) =>
                setAccount({ ...account, profileVisibility: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Data Sharing</Label>
              <p className="text-sm text-muted-foreground">
                Share anonymized data to help improve the platform
              </p>
            </div>
            <Switch 
              checked={account.dataSharing}
              onCheckedChange={(checked: boolean) =>
                setAccount({ ...account, dataSharing: checked })
              }
            />
          </div>
          <div className="pt-4">
            <Button onClick={handleSaveAccount} disabled={isSavingAccount}>
              {isSavingAccount ? 'Saving...' : 'Save Account Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Deactivate Account</Label>
                <p className="text-sm text-muted-foreground">
                  Temporarily disable your account
                </p>
              </div>
              <Button variant="destructive" size="sm">
                Deactivate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <PasswordChangeDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
        userRole="school_admin"
      />
    </div>
  );
}

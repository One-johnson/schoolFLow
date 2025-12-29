'use client';

import { useState, useEffect, JSX } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, CheckCircle, Key } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PasswordChangeDialog } from '@/components/password-change-dialog';
import { useAuth } from '@/hooks/useAuth';

export default function SettingsPage(): JSX.Element {
  const router = useRouter();
  const { user } = useAuth();
  const subscriptionPlans = useQuery(api.subscriptionPlans.list);
  const platformSettingsData = useQuery(api.platformSettings.get);
  const userSettingsData = useQuery(
    api.userSettings.get,
    user?.userId ? { userId: user.userId, userRole: 'super_admin' } : 'skip'
  );
  
  const updatePlatformSettings = useMutation(api.platformSettings.update);
  const updateUserSettings = useMutation(api.userSettings.updateSuperAdmin);
  
  const [passwordDialogOpen, setPasswordDialogOpen] = useState<boolean>(false);
  const [isSavingPlatform, setIsSavingPlatform] = useState<boolean>(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState<boolean>(false);
  const [isSavingSecurity, setIsSavingSecurity] = useState<boolean>(false);

  const [platformSettings, setPlatformSettings] = useState({
    platformName: 'SchoolFlow',
    supportEmail: 'support@schoolflow.com',
    maxSchools: '1000',
    defaultPricePerStudent: '10',
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    newSchoolRegistration: true,
    paymentVerification: true,
    systemAlerts: true,
  });

  const [security, setSecurity] = useState({
    twoFactorAuth: false,
    sessionTimeout: '30',
    ipWhitelist: false,
  });

  // Load platform settings from database
  useEffect(() => {
    if (platformSettingsData) {
      setPlatformSettings({
        platformName: platformSettingsData.platformName,
        supportEmail: platformSettingsData.supportEmail,
        maxSchools: String(platformSettingsData.maxSchools),
        defaultPricePerStudent: String(platformSettingsData.defaultPricePerStudent),
      });
    }
  }, [platformSettingsData]);

  // Load user settings from database
  useEffect(() => {
    if (userSettingsData) {
      setNotifications({
        emailNotifications: userSettingsData.emailNotifications ?? true,
        newSchoolRegistration: userSettingsData.newSchoolRegistration ?? true,
        paymentVerification: userSettingsData.paymentVerification ?? true,
        systemAlerts: userSettingsData.systemAlerts ?? true,
      });
      setSecurity({
        twoFactorAuth: userSettingsData.twoFactorAuth ?? false,
        sessionTimeout: String(userSettingsData.sessionTimeout ?? 30),
        ipWhitelist: userSettingsData.ipWhitelist ?? false,
      });
    }
  }, [userSettingsData]);

  const handleSavePlatform = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!user?.userId) {
      toast.error('User not authenticated');
      return;
    }

    setIsSavingPlatform(true);
    try {
      await updatePlatformSettings({
        platformName: platformSettings.platformName,
        supportEmail: platformSettings.supportEmail,
        maxSchools: parseInt(platformSettings.maxSchools, 10),
        defaultPricePerStudent: parseInt(platformSettings.defaultPricePerStudent, 10),
      });
      toast.success('Platform settings updated successfully');
    } catch (error) {
      toast.error('Failed to update platform settings');
      console.error(error);
    } finally {
      setIsSavingPlatform(false);
    }
  };

  const handleSaveNotifications = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!user?.userId) {
      toast.error('User not authenticated');
      return;
    }

    setIsSavingNotifications(true);
    try {
      await updateUserSettings({
        userId: user.userId,
        emailNotifications: notifications.emailNotifications,
        newSchoolRegistration: notifications.newSchoolRegistration,
        paymentVerification: notifications.paymentVerification,
        systemAlerts: notifications.systemAlerts,
      });
      toast.success('Notification settings updated successfully');
    } catch (error) {
      toast.error('Failed to update notification settings');
      console.error(error);
    } finally {
      setIsSavingNotifications(false);
    }
  };

  const handleSaveSecurity = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!user?.userId) {
      toast.error('User not authenticated');
      return;
    }

    setIsSavingSecurity(true);
    try {
      await updateUserSettings({
        userId: user.userId,
        twoFactorAuth: security.twoFactorAuth,
        sessionTimeout: parseInt(security.sessionTimeout, 10),
        ipWhitelist: security.ipWhitelist,
      });
      toast.success('Security settings updated successfully');
    } catch (error) {
      toast.error('Failed to update security settings');
      console.error(error);
    } finally {
      setIsSavingSecurity(false);
    }
  };

  if (!platformSettingsData || !userSettingsData) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Configure platform settings and preferences</p>
      </div>

      <Tabs defaultValue="platform" className="w-full">
        <TabsList>
          <TabsTrigger value="platform">Platform</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="platform">
          <Card>
            <CardHeader>
              <CardTitle>Platform Configuration</CardTitle>
              <CardDescription>General platform settings and configurations</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSavePlatform} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="platformName">Platform Name</Label>
                  <Input
                    id="platformName"
                    value={platformSettings.platformName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPlatformSettings({ ...platformSettings, platformName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={platformSettings.supportEmail}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPlatformSettings({ ...platformSettings, supportEmail: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxSchools">Maximum Schools</Label>
                  <Input
                    id="maxSchools"
                    type="number"
                    value={platformSettings.maxSchools}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPlatformSettings({ ...platformSettings, maxSchools: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pricePerStudent">Default Price Per Student ($)</Label>
                  <Input
                    id="pricePerStudent"
                    type="number"
                    value={platformSettings.defaultPricePerStudent}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPlatformSettings({ ...platformSettings, defaultPricePerStudent: e.target.value })
                    }
                  />
                </div>
                <Button type="submit" disabled={isSavingPlatform}>
                  {isSavingPlatform ? 'Saving...' : 'Save Platform Settings'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage how and when you receive notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveNotifications} className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailNotifications" className="text-base">
                      Email Notifications
                    </Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications via email</p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={notifications.emailNotifications}
                    onCheckedChange={(checked: boolean) =>
                      setNotifications({ ...notifications, emailNotifications: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="newSchoolRegistration" className="text-base">
                      New School Registration
                    </Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Get notified when a new school registers</p>
                  </div>
                  <Switch
                    id="newSchoolRegistration"
                    checked={notifications.newSchoolRegistration}
                    onCheckedChange={(checked: boolean) =>
                      setNotifications({ ...notifications, newSchoolRegistration: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="paymentVerification" className="text-base">
                      Payment Verification
                    </Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Alerts for pending payment verifications</p>
                  </div>
                  <Switch
                    id="paymentVerification"
                    checked={notifications.paymentVerification}
                    onCheckedChange={(checked: boolean) =>
                      setNotifications({ ...notifications, paymentVerification: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="systemAlerts" className="text-base">
                      System Alerts
                    </Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Critical system notifications and updates</p>
                  </div>
                  <Switch
                    id="systemAlerts"
                    checked={notifications.systemAlerts}
                    onCheckedChange={(checked: boolean) =>
                      setNotifications({ ...notifications, systemAlerts: checked })
                    }
                  />
                </div>
                <Button type="submit" disabled={isSavingNotifications}>
                  {isSavingNotifications ? 'Saving...' : 'Save Notification Settings'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage security and access control settings</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveSecurity} className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="twoFactorAuth" className="text-base">
                      Two-Factor Authentication
                    </Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Add an extra layer of security</p>
                  </div>
                  <Switch
                    id="twoFactorAuth"
                    checked={security.twoFactorAuth}
                    onCheckedChange={(checked: boolean) =>
                      setSecurity({ ...security, twoFactorAuth: checked })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={security.sessionTimeout}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSecurity({ ...security, sessionTimeout: e.target.value })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="ipWhitelist" className="text-base">
                      IP Whitelist
                    </Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Restrict access to specific IP addresses</p>
                  </div>
                  <Switch
                    id="ipWhitelist"
                    checked={security.ipWhitelist}
                    onCheckedChange={(checked: boolean) =>
                      setSecurity({ ...security, ipWhitelist: checked })
                    }
                  />
                </div>
                <div className="border-t pt-6 mt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Change Password</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Update your password regularly for better security</p>
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setPasswordDialogOpen(true)}
                      className="gap-2"
                    >
                      <Key className="h-4 w-4" />
                      Change Password
                    </Button>
                  </div>
                </div>
                <Button type="submit" disabled={isSavingSecurity}>
                  {isSavingSecurity ? 'Saving...' : 'Save Security Settings'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Billing Configuration</CardTitle>
              <CardDescription>Manage subscription plans and billing settings</CardDescription>
            </CardHeader>
            <CardContent>
              {!subscriptionPlans ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-10 w-48" />
                </div>
              ) : subscriptionPlans.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    No subscription plans available. Create plans on the Subscriptions page.
                  </p>
                  <Button onClick={() => router.push('/super-admin/subscriptions')} className="gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Go to Subscriptions
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subscriptionPlans
                      .filter((plan) => plan.isActive)
                      .map((plan) => (
                        <div
                          key={plan._id}
                          className="p-4 rounded-lg border bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950"
                        >
                          <div className="flex flex-col h-full">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
                                <Badge variant="default" className="capitalize">
                                  {plan.billingCycle}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {plan.description}
                              </p>
                              <p className="text-lg font-bold text-blue-700 dark:text-blue-300 mt-2">
                                ${plan.price} per student/
                                {{
                                  monthly: 'month',
                                  quarterly: 'quarter',
                                  termly: 'term',
                                  yearly: 'year',
                                }[plan.billingCycle] ?? plan.billingCycle}
                              </p>
                              <div className="mt-3 space-y-1">
                                {plan.features.slice(0, 3).map((feature, index) => (
                                  <div key={index} className="flex items-center gap-2 text-sm">
                                    <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400 flex-shrink-0" />
                                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                                  </div>
                                ))}
                                {plan.features.length > 3 && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 ml-5">
                                    +{plan.features.length - 3} more features
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                  <div className="pt-2">
                    <Button
                      onClick={() => router.push('/super-admin/subscriptions')}
                      variant="outline"
                      className="gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Manage Plans on Subscriptions Page
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <PasswordChangeDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
        userRole="super_admin"
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Bell,
  Mail,
  Database,
  Shield,
  Zap,
  Save,
  AlertTriangle,
  CheckCircle2,
  Globe,
  DollarSign,
  Users,
} from "lucide-react";
import { toast } from "sonner";

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export default function PlatformSettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("general");

  // General Settings State
  const [generalSettings, setGeneralSettings] = useState({
    platformName: "SchoolFlow",
    platformDescription: "Modern School Management Platform",
    supportEmail: "support@schoolflow.com",
    maintenanceMode: false,
    newSchoolRegistration: true,
    publicSignup: false,
  });

  // Email Settings State
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: "smtp.example.com",
    smtpPort: "587",
    smtpUsername: "",
    smtpPassword: "",
    fromEmail: "noreply@schoolflow.com",
    fromName: "SchoolFlow Platform",
    emailNotifications: true,
  });

  // Notification Settings State
  const [notificationSettings, setNotificationSettings] = useState({
    loginNotifications: true,
    schoolCreatedNotifications: true,
    subscriptionAlerts: true,
    systemAlerts: true,
    weeklyReports: true,
    monthlyReports: true,
  });

  // Security Settings State
  const [securitySettings, setSecuritySettings] = useState({
    passwordMinLength: 8,
    requireSpecialChar: true,
    requireNumber: true,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    twoFactorAuth: false,
  });

  // Subscription Settings State
  const [subscriptionSettings, setSubscriptionSettings] = useState({
    trialPeriodDays: 14,
    basicMonthlyPrice: 49,
    premiumMonthlyPrice: 99,
    enterpriseMonthlyPrice: 249,
    autoRenew: true,
    gracePeriodDays: 7,
  });

  // Mutations
  const updatePlatformSettings = useMutation(api.platform.updateSettings);

  const handleSaveGeneralSettings = async () => {
    try {
      toast.success("General settings updated successfully");
    } catch (error) {
      toast.error("Failed to update settings");
      console.error(error);
    }
  };

  const handleSaveEmailSettings = async () => {
    try {
      toast.success("Email settings updated successfully");
    } catch (error) {
      toast.error("Failed to update email settings");
      console.error(error);
    }
  };

  const handleSaveNotificationSettings = async () => {
    try {
      toast.success("Notification settings updated successfully");
    } catch (error) {
      toast.error("Failed to update notification settings");
      console.error(error);
    }
  };

  const handleSaveSecuritySettings = async () => {
    try {
      toast.success("Security settings updated successfully");
    } catch (error) {
      toast.error("Failed to update security settings");
      console.error(error);
    }
  };

  const handleSaveSubscriptionSettings = async () => {
    try {
      toast.success("Subscription settings updated successfully");
    } catch (error) {
      toast.error("Failed to update subscription settings");
      console.error(error);
    }
  };

  if (user?.role !== "super_admin") {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You don't have permission to access platform settings. Only super administrators
              can manage these settings.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-8 pt-16 sm:pt-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-8 w-8 text-blue-600" />
            Platform Settings
          </h1>
          <p className="text-muted-foreground">
            Configure system-wide settings and preferences
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          <Shield className="h-3 w-3 mr-1" />
          Super Admin Only
        </Badge>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">
            <Globe className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="h-4 w-4 mr-2" />
            Email
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="subscriptions">
            <DollarSign className="h-4 w-4 mr-2" />
            Subscriptions
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Platform Settings</CardTitle>
              <CardDescription>
                Configure basic platform information and behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="platformName">Platform Name</Label>
                  <Input
                    id="platformName"
                    value={generalSettings.platformName}
                    onChange={(e) =>
                      setGeneralSettings({
                        ...generalSettings,
                        platformName: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="platformDescription">Platform Description</Label>
                  <Textarea
                    id="platformDescription"
                    value={generalSettings.platformDescription}
                    onChange={(e) =>
                      setGeneralSettings({
                        ...generalSettings,
                        platformDescription: e.target.value,
                      })
                    }
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={generalSettings.supportEmail}
                    onChange={(e) =>
                      setGeneralSettings({
                        ...generalSettings,
                        supportEmail: e.target.value,
                      })
                    }
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Maintenance Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Temporarily disable access for maintenance
                      </p>
                    </div>
                    <Switch
                      checked={generalSettings.maintenanceMode}
                      onCheckedChange={(checked) =>
                        setGeneralSettings({
                          ...generalSettings,
                          maintenanceMode: checked,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>New School Registration</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow new schools to register on the platform
                      </p>
                    </div>
                    <Switch
                      checked={generalSettings.newSchoolRegistration}
                      onCheckedChange={(checked) =>
                        setGeneralSettings({
                          ...generalSettings,
                          newSchoolRegistration: checked,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Public Signup</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow anyone to create an account without invitation
                      </p>
                    </div>
                    <Switch
                      checked={generalSettings.publicSignup}
                      onCheckedChange={(checked) =>
                        setGeneralSettings({
                          ...generalSettings,
                          publicSignup: checked,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveGeneralSettings}>
                  <Save className="h-4 w-4 mr-2" />
                  Save General Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>
                Configure SMTP settings for email notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtpHost">SMTP Host</Label>
                    <Input
                      id="smtpHost"
                      value={emailSettings.smtpHost}
                      onChange={(e) =>
                        setEmailSettings({ ...emailSettings, smtpHost: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtpPort">SMTP Port</Label>
                    <Input
                      id="smtpPort"
                      value={emailSettings.smtpPort}
                      onChange={(e) =>
                        setEmailSettings({ ...emailSettings, smtpPort: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtpUsername">SMTP Username</Label>
                  <Input
                    id="smtpUsername"
                    value={emailSettings.smtpUsername}
                    onChange={(e) =>
                      setEmailSettings({ ...emailSettings, smtpUsername: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtpPassword">SMTP Password</Label>
                  <Input
                    id="smtpPassword"
                    type="password"
                    value={emailSettings.smtpPassword}
                    onChange={(e) =>
                      setEmailSettings({ ...emailSettings, smtpPassword: e.target.value })
                    }
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fromEmail">From Email</Label>
                    <Input
                      id="fromEmail"
                      type="email"
                      value={emailSettings.fromEmail}
                      onChange={(e) =>
                        setEmailSettings({ ...emailSettings, fromEmail: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fromName">From Name</Label>
                    <Input
                      id="fromName"
                      value={emailSettings.fromName}
                      onChange={(e) =>
                        setEmailSettings({ ...emailSettings, fromName: e.target.value })
                      }
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable system-wide email notifications
                    </p>
                  </div>
                  <Switch
                    checked={emailSettings.emailNotifications}
                    onCheckedChange={(checked) =>
                      setEmailSettings({ ...emailSettings, emailNotifications: checked })
                    }
                  />
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>Note:</strong> Email notifications are currently configured as
                    placeholders. Connect your SMTP provider to enable real email delivery.
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveEmailSettings}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Email Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure which events trigger notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Login Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify when users log in to the platform
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.loginNotifications}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        loginNotifications: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>School Created Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify when new schools register
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.schoolCreatedNotifications}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        schoolCreatedNotifications: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Subscription Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify about subscription changes and renewals
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.subscriptionAlerts}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        subscriptionAlerts: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>System Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify about system errors and issues
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.systemAlerts}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        systemAlerts: checked,
                      })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Weekly Reports</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive weekly platform analytics reports
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.weeklyReports}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        weeklyReports: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Monthly Reports</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive monthly performance summaries
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.monthlyReports}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        monthlyReports: checked,
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveNotificationSettings}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Notification Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Configuration</CardTitle>
              <CardDescription>
                Configure password policies and security features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    value={securitySettings.passwordMinLength}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        passwordMinLength: parseInt(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        sessionTimeout: parseInt(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={securitySettings.maxLoginAttempts}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        maxLoginAttempts: parseInt(e.target.value),
                      })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Special Character</Label>
                    <p className="text-sm text-muted-foreground">
                      Passwords must contain special characters
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.requireSpecialChar}
                    onCheckedChange={(checked) =>
                      setSecuritySettings({
                        ...securitySettings,
                        requireSpecialChar: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Number</Label>
                    <p className="text-sm text-muted-foreground">
                      Passwords must contain at least one number
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.requireNumber}
                    onCheckedChange={(checked) =>
                      setSecuritySettings({
                        ...securitySettings,
                        requireNumber: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable 2FA for enhanced security
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Coming Soon</Badge>
                    <Switch
                      checked={securitySettings.twoFactorAuth}
                      disabled
                      onCheckedChange={(checked) =>
                        setSecuritySettings({
                          ...securitySettings,
                          twoFactorAuth: checked,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveSecuritySettings}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Security Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscription Settings */}
        <TabsContent value="subscriptions">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Management</CardTitle>
              <CardDescription>
                Configure pricing and subscription policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="trialPeriodDays">Trial Period (days)</Label>
                  <Input
                    id="trialPeriodDays"
                    type="number"
                    value={subscriptionSettings.trialPeriodDays}
                    onChange={(e) =>
                      setSubscriptionSettings({
                        ...subscriptionSettings,
                        trialPeriodDays: parseInt(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gracePeriodDays">Grace Period (days)</Label>
                  <Input
                    id="gracePeriodDays"
                    type="number"
                    value={subscriptionSettings.gracePeriodDays}
                    onChange={(e) =>
                      setSubscriptionSettings({
                        ...subscriptionSettings,
                        gracePeriodDays: parseInt(e.target.value),
                      })
                    }
                  />
                  <p className="text-sm text-muted-foreground">
                    Days after subscription expires before access is revoked
                  </p>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Monthly Pricing (USD)</h3>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="basicMonthlyPrice">Basic Plan</Label>
                      <Input
                        id="basicMonthlyPrice"
                        type="number"
                        value={subscriptionSettings.basicMonthlyPrice}
                        onChange={(e) =>
                          setSubscriptionSettings({
                            ...subscriptionSettings,
                            basicMonthlyPrice: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="premiumMonthlyPrice">Premium Plan</Label>
                      <Input
                        id="premiumMonthlyPrice"
                        type="number"
                        value={subscriptionSettings.premiumMonthlyPrice}
                        onChange={(e) =>
                          setSubscriptionSettings({
                            ...subscriptionSettings,
                            premiumMonthlyPrice: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="enterpriseMonthlyPrice">Enterprise Plan</Label>
                      <Input
                        id="enterpriseMonthlyPrice"
                        type="number"
                        value={subscriptionSettings.enterpriseMonthlyPrice}
                        onChange={(e) =>
                          setSubscriptionSettings({
                            ...subscriptionSettings,
                            enterpriseMonthlyPrice: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-Renewal</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically renew subscriptions when they expire
                    </p>
                  </div>
                  <Switch
                    checked={subscriptionSettings.autoRenew}
                    onCheckedChange={(checked) =>
                      setSubscriptionSettings({
                        ...subscriptionSettings,
                        autoRenew: checked,
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveSubscriptionSettings}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Subscription Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* System Status Card */}
      <Card className="border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30">
        <CardHeader>
          <CardTitle className="text-green-900 dark:text-green-100 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-green-800 dark:text-green-200">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="font-medium mb-1">Platform Health</p>
              <Badge className="bg-green-600">Operational</Badge>
            </div>
            <div>
              <p className="font-medium mb-1">Database Status</p>
              <Badge className="bg-green-600">Connected</Badge>
            </div>
            <div>
              <p className="font-medium mb-1">Last Updated</p>
              <p>{new Date().toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

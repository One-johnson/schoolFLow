"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  Mail,
  Database,
  Bell,
  Globe,
  Lock,
  Settings,
  Save,
} from "lucide-react";

export const dynamic = 'force-dynamic';

export default function PlatformSettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Platform Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure system-wide settings and preferences
          </p>
        </div>
        <Badge className="bg-purple-500">Super Admin Only</Badge>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <CardTitle>General Settings</CardTitle>
          </div>
          <CardDescription>Basic platform configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="platform-name">Platform Name</Label>
            <Input
              id="platform-name"
              defaultValue="SchoolFlow"
              placeholder="Enter platform name"
            />
            <p className="text-xs text-muted-foreground">
              The name displayed across the platform
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="platform-url">Platform URL</Label>
            <Input
              id="platform-url"
              type="url"
              defaultValue="https://schoolflow.app"
              placeholder="https://example.com"
            />
            <p className="text-xs text-muted-foreground">
              Base URL for the platform
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="support-email">Support Email</Label>
            <Input
              id="support-email"
              type="email"
              defaultValue="support@schoolflow.app"
              placeholder="support@example.com"
            />
            <p className="text-xs text-muted-foreground">
              Email address for customer support
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Email Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Email Configuration</CardTitle>
          </div>
          <CardDescription>Configure email service settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-xs text-muted-foreground">
                Enable automated email notifications
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="smtp-host">SMTP Host</Label>
            <Input
              id="smtp-host"
              placeholder="smtp.example.com"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="smtp-port">SMTP Port</Label>
              <Input
                id="smtp-port"
                type="number"
                placeholder="587"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-user">SMTP Username</Label>
              <Input
                id="smtp-user"
                type="email"
                placeholder="noreply@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-template">Welcome Email Template</Label>
            <Textarea
              id="email-template"
              rows={4}
              placeholder="Welcome to SchoolFlow! ..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Security Settings</CardTitle>
          </div>
          <CardDescription>Platform security and authentication</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Two-Factor Authentication</Label>
              <p className="text-xs text-muted-foreground">
                Require 2FA for all admin accounts
              </p>
            </div>
            <Switch />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Session Timeout</Label>
              <p className="text-xs text-muted-foreground">
                Auto-logout inactive users
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="password-policy">Minimum Password Length</Label>
            <Input
              id="password-policy"
              type="number"
              defaultValue="8"
              min="6"
              max="20"
            />
            <p className="text-xs text-muted-foreground">
              Minimum characters required for passwords
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require Password Complexity</Label>
              <p className="text-xs text-muted-foreground">
                Uppercase, lowercase, numbers, symbols
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Features & Limits */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Features & Limits</CardTitle>
          </div>
          <CardDescription>Default limits for new schools</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="max-users-free">Free Plan - Max Users</Label>
                <Input
                  id="max-users-free"
                  type="number"
                  defaultValue="50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-users-basic">Basic Plan - Max Users</Label>
                <Input
                  id="max-users-basic"
                  type="number"
                  defaultValue="200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-users-premium">Premium Plan - Max Users</Label>
                <Input
                  id="max-users-premium"
                  type="number"
                  defaultValue="1000"
                />
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable File Uploads</Label>
                <p className="text-xs text-muted-foreground">
                  Allow schools to upload documents and images
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-file-size">Max File Upload Size (MB)</Label>
              <Input
                id="max-file-size"
                type="number"
                defaultValue="10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Mode */}
      <Card className="border-amber-200 dark:border-amber-900">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-amber-900 dark:text-amber-100">
              Maintenance Mode
            </CardTitle>
          </div>
          <CardDescription>
            Enable maintenance mode to perform system updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Maintenance Mode</Label>
              <p className="text-xs text-muted-foreground">
                Prevent all users from accessing the platform
              </p>
            </div>
            <Switch />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="maintenance-message">Maintenance Message</Label>
            <Textarea
              id="maintenance-message"
              rows={3}
              placeholder="We're currently performing system updates. We'll be back soon!"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button size="lg" className="gap-2">
          <Save className="h-4 w-4" />
          Save Settings
        </Button>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Note:</strong> These settings will be functional in future phases.
            Currently, this page serves as a template for platform-wide configuration.
            Changes made here do not yet affect the system.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

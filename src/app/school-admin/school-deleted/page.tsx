'use client';

import { JSX, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { XCircle, Mail, Phone, ArrowLeft, PlusCircle } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useAuth } from '@/hooks/useAuth';

export default function SchoolDeletedPage(): JSX.Element {
  const router = useRouter();
     const { user } = useAuth();
  const [email, setEmail] = useState<string | null>(null);

    const currentAdmin = useQuery(
    api.schoolAdmins.getByEmail,
    user?.email ? { email: user.email } : 'skip'
  );

  const handleLogout = (): void => {
    localStorage.removeItem('schoolAdminEmail');
    router.push('/');
  };

  const handleCreateNewSchool = (): void => {
    router.push('/school-admin/create-school');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <XCircle className="h-8 w-8 text-red-600 dark:text-red-500" />
          </div>
          <CardTitle className="text-2xl font-bold">School Deleted</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-900">
            <AlertDescription className="text-gray-900 dark:text-gray-100">
              Your school has been permanently removed from the system by an administrator.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <h3 className="font-semibold text-lg">What Happened:</h3>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400 list-disc list-inside">
              <li>Your school record has been permanently deleted</li>
              <li>All associated subscriptions have been cancelled</li>
              <li>School data and records have been removed</li>
              <li>Your admin account remains active</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-lg">What You Can Do:</h3>
            <p className="text-gray-600 dark:text-gray-400">
              You can create a new school using the SchoolFlow platform. Your account is still active and ready to set up a new school.
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              If you believe this deletion was made in error, please contact our support team immediately.
            </p>
          </div>

          {currentAdmin && currentAdmin.hasActiveSubscription && (
            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-900">
              <AlertDescription className="text-gray-900 dark:text-gray-100">
                <strong>Good news!</strong> You still have an active subscription. You can use it to create a new school right away.
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
            <h4 className="font-semibold">Need Help?</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gray-500" />
                <a href="mailto:support@schoolflow.com" className="text-blue-600 hover:underline">
                  support@schoolflow.com
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">+1 (555) 123-4567</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="flex-1 gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to Home
            </Button>
            <Button
              onClick={handleCreateNewSchool}
              className="flex-1 gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              Create New School
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

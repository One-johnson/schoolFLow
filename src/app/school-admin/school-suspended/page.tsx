'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Ban, Mail, Phone, ArrowLeft } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';

export default function SchoolSuspendedPage(): React.JSX.Element {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const schoolAdminEmail = localStorage.getItem('schoolAdminEmail');
    setEmail(schoolAdminEmail);
  }, []);

  const admin = useQuery(
    api.schoolAdmins.getByEmail,
    email ? { email } : 'skip'
  );

  const school = useQuery(
    api.schools.getByAdminId,
    admin && admin.schoolId ? { adminId: admin.schoolId } : 'skip'
  );

  const handleLogout = (): void => {
    localStorage.removeItem('schoolAdminEmail');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
            <Ban className="h-8 w-8 text-yellow-600 dark:text-yellow-500" />
          </div>
          <CardTitle className="text-2xl font-bold">School Suspended</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-900">
            <AlertDescription className="text-gray-900 dark:text-gray-100">
              Your school <strong>{school?.name || 'has'}</strong> has been suspended by a system administrator.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <h3 className="font-semibold text-lg">What This Means:</h3>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400 list-disc list-inside">
              <li>Access to school management features is temporarily blocked</li>
              <li>All your school data is safely preserved</li>
              <li>Students and staff cannot access school resources</li>
              <li>Your subscription status may be affected</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Next Steps:</h3>
            <p className="text-gray-600 dark:text-gray-400">
              To reactivate your school, please contact our support team. They will review your case and help restore access.
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
            <h4 className="font-semibold">Contact Support:</h4>
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
              onClick={() => window.open('mailto:support@schoolflow.com', '_blank')}
              className="flex-1"
            >
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { JSX, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Ban, XCircle } from 'lucide-react';

interface AccessBlockedPageProps {
  searchParams?: {
    reason?: string;
    status?: string;
  };
}

export default function AccessBlockedPage({ searchParams }: AccessBlockedPageProps): React.JSX.Element {
  const router = useRouter();
  const [reason, setReason] = useState<string>('');
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setReason(params.get('reason') || 'Your account access has been restricted.');
      setStatus(params.get('status') || 'suspended');
    }
  }, []);

  const handleLogout = (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('schoolAdminEmail');
      router.push('/');
    }
  };

  const getIcon = (): React.JSX.Element => {
    switch (status) {
      case 'deleted':
        return <XCircle className="h-16 w-16 text-red-500" />;
      case 'inactive':
        return <Ban className="h-16 w-16 text-yellow-500" />;
      default:
        return <AlertCircle className="h-16 w-16 text-red-500" />;
    }
  };

  const getTitle = (): string => {
    switch (status) {
      case 'deleted':
        return 'Account Deleted';
      case 'inactive':
        return 'Account Deactivated';
      case 'suspended':
        return 'Account Suspended';
      default:
        return 'Access Restricted';
    }
  };

  const getMessage = (): string => {
    switch (status) {
      case 'deleted':
        return 'Your account has been permanently deleted from the system.';
      case 'inactive':
        return 'Your account has been deactivated and you can no longer access the system.';
      case 'suspended':
        return 'Your account has been suspended and you cannot access the system at this time.';
      default:
        return 'You do not have permission to access this system.';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getIcon()}
          </div>
          <CardTitle className="text-2xl">{getTitle()}</CardTitle>
          <CardDescription className="text-base mt-2">
            {getMessage()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Reason:</strong> {reason}
            </p>
          </div>

          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>If you believe this is a mistake, please contact the system administrator.</p>
            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <p className="font-semibold text-gray-900 dark:text-gray-100">Need Help?</p>
              <p className="mt-1">Email: support@schoolflow.com</p>
              <p>Phone: +1 (555) 123-4567</p>
            </div>
          </div>

          <div className="pt-4 space-y-2">
            <Button 
              onClick={handleLogout}
              className="w-full"
              variant="destructive"
            >
              Return to Home Page
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

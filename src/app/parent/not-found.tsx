import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';

export default function ParentNotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-muted">
              <FileQuestion className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <CardTitle>Page not found</CardTitle>
              <CardDescription>
                The page you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button asChild variant="default" className="flex-1">
              <Link href="/parent">
                <Home className="h-4 w-4 mr-2" />
                Back to dashboard
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/parent/children">
                <ArrowLeft className="h-4 w-4 mr-2" />
                My Children
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

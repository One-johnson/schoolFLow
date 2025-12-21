import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GraduationCap, Home } from "lucide-react";

export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 p-3">
            <GraduationCap className="h-12 w-12 text-white" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            404
          </h1>
          <h2 className="text-2xl font-semibold text-foreground">
            Page Not Found
          </h2>
          <p className="text-muted-foreground">
            Sorry, we couldn't find the page you're looking for.
          </p>
        </div>

        <Link href="/">
          <Button className="gap-2">
            <Home className="h-4 w-4" />
            Go Back Home
          </Button>
        </Link>
      </div>
    </div>
  );
}


'use client';

import { School, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, database } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { ref, get } from 'firebase/database';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <School className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-bold text-primary">SchoolFlow</h1>
          <p className="text-muted-foreground">
            Your all-in-one school management solution.
          </p>
        </div>
        <Tabs defaultValue="admin" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="admin">Admin</TabsTrigger>
            <TabsTrigger value="teacher">Teacher</TabsTrigger>
            <TabsTrigger value="student">Student</TabsTrigger>
          </TabsList>
          <TabsContent value="admin">
            <LoginForm role="admin" />
          </TabsContent>
          <TabsContent value="teacher">
            <LoginForm role="teacher" />
          </TabsContent>
          <TabsContent value="student">
            <LoginForm role="student" />
          </TabsContent>
        </Tabs>
        <p className="px-8 text-center text-sm text-muted-foreground mt-4">
          Don't have an account? Please contact your school administrator to get access.
        </p>
      </div>
    </div>
  );
}

function LoginForm({ role }: { role: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const userRef = ref(database, `users/${user.uid}`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        const userData = snapshot.val();
        const userRole = userData.role;

        if (userRole === role) {
          toast({ title: 'Success', description: 'Signed in successfully. Redirecting...' });
          // Redirect to role-specific default page
          if (userRole === 'admin') {
            router.push('/dashboard');
          } else if (userRole === 'teacher') {
            router.push('/dashboard');
          } else if (userRole === 'student') {
             router.push(`/dashboard`);
          } else {
            router.push('/dashboard'); // Fallback
          }
        } else {
           throw new Error(`You are not authorized to log in as a(n) ${role}.`);
        }
      } else {
         throw new Error("User data not found. Please contact an administrator.");
      }

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{role} Login</CardTitle>
        <CardDescription>
          Enter your credentials to access your dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignIn}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          <Button type="submit" className="mt-6 w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>
        </form>
        <div className="mt-2 text-center text-sm">
          <a href="#" className="underline">
            Forgot your password?
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

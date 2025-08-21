'use client';

import { BookOpen, School } from 'lucide-react';
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
import Link from 'next/link';
import { useState } from 'react';

export default function LoginPage() {
  const [role, setRole] = useState('admin');

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
        <Tabs defaultValue="admin" className="w-full" onValueChange={setRole}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="admin">Admin</TabsTrigger>
            <TabsTrigger value="teacher">Teacher</TabsTrigger>
            <TabsTrigger value="student">Student</TabsTrigger>
          </TabsList>
          <TabsContent value="admin">
            <LoginForm role="Admin" />
          </TabsContent>
          <TabsContent value="teacher">
            <LoginForm role="Teacher" />
          </TabsContent>
          <TabsContent value="student">
            <LoginForm role="Student" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function LoginForm({ role }: { role: string }) {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{role} Login</CardTitle>
        <CardDescription>
          Enter your credentials to access your dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="m@example.com" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required />
          </div>
        </div>
        <Link href="/dashboard" passHref>
          <Button type="submit" className="mt-6 w-full">
            Sign In
          </Button>
        </Link>
        <div className="mt-4 text-center text-sm">
          <a href="#" className="underline">
            Forgot your password?
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

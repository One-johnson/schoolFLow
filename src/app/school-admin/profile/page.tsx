'use client';

import { useState, useEffect, JSX } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { toast } from 'sonner';
import { User, Mail, Phone, Building2, Calendar, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';

export default function ProfilePage(): React.JSX.Element {
  const router = useRouter();
  const { user, checkAuth } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);

  const currentAdmin = useQuery(
    api.schoolAdmins.getById,
    user?.userId ? { id: user.userId as import('../../../../convex/_generated/dataModel').Id<'schoolAdmins'> } : 'skip'
  );

  const updateAdmin = useMutation(api.schoolAdmins.update);



  useEffect(() => {
    if (currentAdmin) {
      setFormData({
        name: currentAdmin.name,
        email: currentAdmin.email,
        phone: currentAdmin.phone ?? '',
      });
    }
  }, [currentAdmin]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);

    if (!currentAdmin) {
      toast.error('Admin not found');
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      toast.error('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      await updateAdmin({
        id: currentAdmin._id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone.trim() || undefined,
      });

      localStorage.setItem('schoolAdminEmail', formData.email);
      await checkAuth();
      toast.success('Profile updated. Session refreshed.');
    } catch (error) {
      toast.error('Failed to update profile');
      if (process.env.NODE_ENV !== 'production') {
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  };

  if (currentAdmin === undefined) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (currentAdmin === null) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Account not found</h2>
          <p className="text-muted-foreground">
            Your account could not be found. Please contact support.
          </p>
          <Button variant="outline" onClick={() => router.push("/school-admin")}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account information.{' '}
          <Link href="/school-admin/settings" className="text-primary underline underline-offset-2 hover:no-underline">
            Notification &amp; security settings
          </Link>
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Account Details</CardTitle>
              <CardDescription>View and update your profile information</CardDescription>
            </div>
            <Badge variant={currentAdmin.status === 'active' ? 'default' : 'secondary'}>
              {currentAdmin.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 mb-6">
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">School ID</p>
                <p className="text-sm text-muted-foreground">{currentAdmin.schoolId}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Member Since</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(currentAdmin.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Subscription</p>
                <p className="text-sm text-muted-foreground">
                  {currentAdmin.hasActiveSubscription ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">School Created</p>
                <p className="text-sm text-muted-foreground">
                  {currentAdmin.hasCreatedSchool ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 border-t pt-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="pl-10"
                  placeholder="e.g. +233..."
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Profile'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/school-admin')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

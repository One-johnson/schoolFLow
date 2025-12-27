'use client';

import { JSX, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authService } from '@/lib/auth';
import { toast } from 'sonner';
import { Eye, EyeOff, Mail, Lock, GraduationCap } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export default function LoginPage(): JSX.Element {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Query to check school admin by schoolId
  const schoolAdmins = useQuery(api.schoolAdmins.list);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);

    if (!formData.email || !formData.password) {
      toast.error('All fields are required');
      setLoading(false);
      return;
    }

    // First, check if it's a Super Admin login
    const superAdminResult = authService.login(formData.email, formData.password);
    if (superAdminResult.success) {
      toast.success('Login successful!');
      router.push('/super-admin');
      setLoading(false);
      return;
    }

    // If not Super Admin, check School Admin by schoolId or email
    if (schoolAdmins) {
      const schoolAdmin = schoolAdmins.find(
        (admin) => 
          (admin.schoolId === formData.email || admin.email === formData.email) && 
          (admin.tempPassword === formData.password || admin.password === formData.password)
      );

      if (schoolAdmin) {
        // Check if admin is active or pending
        if (schoolAdmin.status === 'inactive') {
          toast.error('Your account has been deactivated. Please contact support.');
          setLoading(false);
          return;
        }

        if (schoolAdmin.status === 'suspended') {
          toast.error('Your account has been suspended. Your trial may have expired.');
          setLoading(false);
          return;
        }

        // Allow pending admins to login to complete subscription process
        // School Admin login successful
        localStorage.setItem('schoolAdminEmail', schoolAdmin.email);
        toast.success('Login successful!');
        router.push('/school-admin');
        setLoading(false);
        return;
      }
    }

    // No matching credentials
    toast.error('Invalid credentials');
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 pt-16">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 rounded-full bg-primary/10">
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to SchoolFlow</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email or School ID</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="text"
                  placeholder="admin@example.com or SCH12345678"
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

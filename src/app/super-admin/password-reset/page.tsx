'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Key, Search, User } from 'lucide-react';
import { toast } from 'sonner';
import { PasswordResetDialog } from '@/components/password-reset-dialog';

type ResetRole = 'school-admin' | 'teacher' | 'super-admin';

const ROLES: { value: ResetRole; label: string }[] = [
  { value: 'school-admin', label: 'School Admin' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'super-admin', label: 'Super Admin' },
];

export default function PasswordResetPage(): React.JSX.Element {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<ResetRole>('school-admin');
  const [loading, setLoading] = useState(false);
  const [foundUser, setFoundUser] = useState<{
    role: ResetRole;
    userId: string;
    userName: string;
    userEmail: string;
  } | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);

  const handleSearch = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setLoading(true);
    setFoundUser(null);
    try {
      const response = await fetch('/api/auth/lookup-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), role }),
      });

      const data = await response.json();

      if (data.success && data.found) {
        setFoundUser({
          role: data.role,
          userId: data.userId,
          userName: data.userName,
          userEmail: data.userEmail,
        });
        toast.success('User found');
      } else {
        toast.error(data.message || 'User not found');
      }
    } catch {
      toast.error('Failed to search');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReset = (): void => {
    setShowResetDialog(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Password Reset</h1>
        <p className="text-muted-foreground mt-1">
          Look up users by email and reset their password. Use this when processing forgot-password requests.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            <CardTitle>Look Up User</CardTitle>
          </div>
          <CardDescription>
            Enter the email and account type from the forgot-password request
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Account Type</Label>
                <Select value={role} onValueChange={(v) => setRole(v as ResetRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? (
                'Searching...'
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </>
              )}
            </Button>
          </form>

          {foundUser && (
            <div className="p-4 bg-muted rounded-lg border space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <h3 className="font-medium">User Found</h3>
              </div>
              <div className="grid gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Name:</span>{' '}
                  <span className="font-medium">{foundUser.userName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>{' '}
                  <span className="font-medium">{foundUser.userEmail}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Role:</span>{' '}
                  <span className="font-medium">
                    {ROLES.find((r) => r.value === foundUser.role)?.label}
                  </span>
                </div>
              </div>
              <Button onClick={handleOpenReset}>
                <Key className="h-4 w-4 mr-2" />
                Reset Password
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {foundUser && (
        <PasswordResetDialog
          open={showResetDialog}
          onOpenChange={setShowResetDialog}
          role={foundUser.role}
          userId={foundUser.userId}
          userName={foundUser.userName}
          userEmail={foundUser.userEmail}
          onSuccess={() => setFoundUser(null)}
        />
      )}
    </div>
  );
}

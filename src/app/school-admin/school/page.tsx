'use client';

import { JSX, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { School, Mail, Phone, MapPin, Users, Calendar, Badge as BadgeIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function SchoolPage(): JSX.Element {
  const router = useRouter();

  const schoolAdminEmail = typeof window !== 'undefined' ? localStorage.getItem('schoolAdminEmail') : null;

  const schoolAdmins = useQuery(api.schoolAdmins.list);
  const currentAdmin = schoolAdmins?.find((admin) => admin.email === schoolAdminEmail);

  const schoolCreationRequests = useQuery(
    api.schoolCreationRequests.getByAdmin,
    currentAdmin ? { schoolAdminId: currentAdmin._id } : "skip"
  );

  const schools = useQuery(api.schools.list);


  const approvedSchoolRequest = schoolCreationRequests?.find((req) => req.status === 'approved');
  const school = schools?.find((s) => s.adminId === currentAdmin?._id);

  useEffect(() => {
    if (!schoolAdminEmail) {
      router.push('/login');
    }
  }, [schoolAdminEmail, router]);

  if (!currentAdmin) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Loading...</h2>
          <p className="text-muted-foreground">Please wait</p>
        </div>
      </div>
    );
  }

  if (!approvedSchoolRequest || !school) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>No School Created</CardTitle>
            <CardDescription>
              You haven't created a school yet or your request is still pending
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/school-admin/create-school')}>
              Create School
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My School</h1>
        <p className="text-muted-foreground">
          View and manage your school information
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-primary/10">
                <School className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">{school.name}</CardTitle>
                <CardDescription>School ID: {currentAdmin.schoolId}</CardDescription>
              </div>
            </div>
            <Badge variant={school.status === 'active' ? 'default' : 'secondary'}>
              {school.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{school.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">{school.phone}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-sm text-muted-foreground">{school.address}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Total Students</p>
                  <p className="text-sm text-muted-foreground">{school.studentCount}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <BadgeIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Subscription Plan</p>
                  <p className="text-sm text-muted-foreground">{school.subscriptionPlan}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Registration Date</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(school.registrationDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {school.approvalDate && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Approval Date</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(school.approvalDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Manage your school</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <Button variant="outline" onClick={() => router.push('/school-admin/subscription')}>
              View Subscription
            </Button>
            <Button variant="outline" onClick={() => router.push('/school-admin/profile')}>
              Update Profile
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

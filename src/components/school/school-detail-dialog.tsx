"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Building2,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Activity,
  Clock,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  DollarSign,
} from "lucide-react";
import { format } from "date-fns";

interface SchoolDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: Id<"schools"> | null;
}

export function SchoolDetailDialog({
  open,
  onOpenChange,
  schoolId,
}: SchoolDetailDialogProps) {
  const schoolDetails = useQuery(
    api.platform.getSchoolDetails,
    schoolId ? { schoolId } : "skip"
  );

  if (!schoolDetails || !schoolId) {
    return null;
  }

  const { school, admin, statistics, subscription, subscriptionHistory, paymentHistory, recentActivity } = schoolDetails;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="mr-1 h-3 w-3" />
            Active
          </Badge>
        );
      case "inactive":
        return (
          <Badge variant="secondary">
            <XCircle className="mr-1 h-3 w-3" />
            Inactive
          </Badge>
        );
      case "suspended":
        return (
          <Badge variant="destructive">
            <AlertCircle className="mr-1 h-3 w-3" />
            Suspended
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSubscriptionStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "expired":
        return <Badge variant="destructive">Expired</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      case "trialing":
        return <Badge className="bg-blue-500">Trialing</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-500">Paid</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case "overdue":
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            {school.name}
          </DialogTitle>
          <DialogDescription>
            Comprehensive school information and statistics
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-120px)] pr-4">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="statistics">Statistics</TabsTrigger>
              <TabsTrigger value="subscription">Subscription</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              {/* School Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">School Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        School Name
                      </div>
                      <div className="font-medium">{school.name}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Activity className="h-4 w-4" />
                        Status
                      </div>
                      <div>{getStatusBadge(school.status)}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        Email
                      </div>
                      <div className="font-medium">{school.email}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        Phone
                      </div>
                      <div className="font-medium">{school.phone || "N/A"}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        Address
                      </div>
                      <div className="font-medium">{school.address || "N/A"}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Created
                      </div>
                      <div className="font-medium">
                        {format(new Date(school.createdAt), "MMM dd, yyyy")}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Admin Information */}
              {admin && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Administrator</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          Name
                        </div>
                        <div className="font-medium">
                          {admin.firstName} {admin.lastName}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          Email
                        </div>
                        <div className="font-medium">{admin.email}</div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          Phone
                        </div>
                        <div className="font-medium">{admin.phone || "N/A"}</div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          Last Login
                        </div>
                        <div className="font-medium">
                          {admin.lastLogin
                            ? format(new Date(admin.lastLogin), "MMM dd, yyyy HH:mm")
                            : "Never"}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Statistics Tab */}
            <TabsContent value="statistics" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{statistics.totalUsers}</div>
                    <p className="text-xs text-muted-foreground">
                      {statistics.activeUsers} active (30 days)
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Students</CardTitle>
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{statistics.totalStudents}</div>
                    <p className="text-xs text-muted-foreground">
                      {statistics.activeStudents} active, {statistics.graduatedStudents} graduated
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Teachers</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{statistics.totalTeachers}</div>
                    <p className="text-xs text-muted-foreground">
                      {statistics.activeTeachers} active, {statistics.onLeaveTeachers} on leave
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Classes</CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{statistics.totalClasses}</div>
                    <p className="text-xs text-muted-foreground">Active classes</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Subjects</CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{statistics.totalSubjects}</div>
                    <p className="text-xs text-muted-foreground">Available subjects</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Engagement</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {statistics.totalUsers > 0
                        ? Math.round((statistics.activeUsers / statistics.totalUsers) * 100)
                        : 0}
                      %
                    </div>
                    <p className="text-xs text-muted-foreground">Active user rate</p>
                  </CardContent>
                </Card>
              </div>

              {/* Users by Role */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Users by Role</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(statistics.usersByRole).map(([role, count]) => (
                      <div key={role} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{role.replace("_", " ")}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Subscription Tab */}
            <TabsContent value="subscription" className="space-y-4">
              {/* Current Subscription */}
              {subscription ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Current Subscription</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Plan</div>
                        <div className="font-medium">{subscription.planName}</div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Status</div>
                        <div>{getSubscriptionStatusBadge(subscription.status)}</div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Start Date</div>
                        <div className="font-medium">
                          {format(new Date(subscription.startDate), "MMM dd, yyyy")}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">End Date</div>
                        <div className="font-medium">
                          {format(new Date(subscription.endDate), "MMM dd, yyyy")}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Price</div>
                        <div className="font-medium">GHS {subscription.planPrice}</div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Auto Renew</div>
                        <div className="font-medium">
                          {subscription.autoRenew ? "Yes" : "No"}
                        </div>
                      </div>
                    </div>
                    {subscription.notes && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <div className="text-sm text-muted-foreground">Notes</div>
                          <div className="text-sm">{subscription.notes}</div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No active subscription
                  </CardContent>
                </Card>
              )}

              {/* Subscription History */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Subscription History</CardTitle>
                  <CardDescription>
                    All past and current subscriptions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {subscriptionHistory.length > 0 ? (
                    <div className="space-y-3">
                      {subscriptionHistory.map((sub) => (
                        <div
                          key={sub._id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="space-y-1">
                            <div className="font-medium">{sub.planName}</div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(sub.startDate), "MMM dd, yyyy")} -{" "}
                              {format(new Date(sub.endDate), "MMM dd, yyyy")}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-sm font-medium">
                              GHS {sub.planPrice}
                            </div>
                            {getSubscriptionStatusBadge(sub.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-4">
                      No subscription history
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Payment History</CardTitle>
                  <CardDescription>
                    All payment records for this school
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {paymentHistory.length > 0 ? (
                    <div className="space-y-3">
                      {paymentHistory.map((payment) => (
                        <div
                          key={payment._id}
                          className="flex items-start justify-between p-3 border rounded-lg"
                        >
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                GHS {payment.amount} - {payment.paymentMethod}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Due: {format(new Date(payment.dueDate), "MMM dd, yyyy")}
                              {payment.paymentDate && (
                                <> • Paid: {format(new Date(payment.paymentDate), "MMM dd, yyyy")}</>
                              )}
                            </div>
                            {payment.reference && (
                              <div className="text-xs text-muted-foreground">
                                Ref: {payment.reference}
                              </div>
                            )}
                            {payment.notes && (
                              <div className="text-xs text-muted-foreground">
                                {payment.notes}
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground">
                              Recorded by: {payment.recorderName}
                            </div>
                          </div>
                          <div>{getPaymentStatusBadge(payment.paymentStatus)}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-4">
                      No payment records
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                  <CardDescription>
                    Latest user logins and actions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {recentActivity.length > 0 ? (
                    <div className="space-y-3">
                      {recentActivity.map((activity, index) => (
                        <div
                          key={index}
                          className="flex items-start justify-between p-3 border rounded-lg"
                        >
                          <div className="space-y-1 flex-1">
                            <div className="font-medium">{activity.userName}</div>
                            <div className="text-sm text-muted-foreground">
                              {activity.userEmail}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {activity.userRole}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {activity.action}
                              </span>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(activity.timestamp), "MMM dd, HH:mm")}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-4">
                      No recent activity
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

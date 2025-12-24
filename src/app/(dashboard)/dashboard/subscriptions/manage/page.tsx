"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Calendar, Check, X, Clock, Package } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { StatsSkeleton } from "@/components/loading-skeletons";
import type { Id } from "../../../../../../convex/_generated/dataModel";

export const dynamic = "force-dynamic";
export const runtime = "edge";

export default function ManageSubscriptionsPage() {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState<Id<"schools"> | "">("");
  const [selectedPlanId, setSelectedPlanId] = useState<Id<"subscriptionPlans"> | "">("");
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [durationMonths, setDurationMonths] = useState<number>(1);
  const [notes, setNotes] = useState("");

  const schools = useQuery(api.platform.getAllSchools);
  const plans = useQuery(api.subscriptionPlans.getAllPlans);
  const subscriptions = useQuery(api.subscriptions.getAllSubscriptions);

  const createSubscription = useMutation(api.subscriptions.createSubscription);
  const updateSubscription = useMutation(api.subscriptions.updateSubscription);
  const seedPlans = useMutation(api.subscriptionPlans.seedDefaultPlans);

  // Automatically seed plans if none exist
  const handleSeedPlans = async () => {
    try {
      await seedPlans();
      toast.success("Subscription plans created successfully!");
    } catch (error) {
      toast.error("Failed to create plans");
      console.error(error);
    }
  };

  const handleCreateSubscription = async () => {
    if (!selectedSchoolId || !selectedPlanId || !user) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const start = new Date(startDate).getTime();
      const end = new Date(start);
      end.setMonth(end.getMonth() + durationMonths);

      await createSubscription({
        schoolId: selectedSchoolId as Id<"schools">,
        planId: selectedPlanId as Id<"subscriptionPlans">,
        startDate: start,
        endDate: end.getTime(),
        status: "active",
        notes,
        createdBy: user.id,
      });

      toast.success("Subscription created successfully");
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error("Failed to create subscription");
      console.error(error);
    }
  };

  const handleUpdateStatus = async (
    subscriptionId: Id<"subscriptions">,
    newStatus: string
  ) => {
    if (!user) return;

    try {
      await updateSubscription({
        subscriptionId,
        status: newStatus,
        updatedBy: user.id,
      });

      toast.success(`Subscription ${newStatus} successfully`);
    } catch (error) {
      toast.error("Failed to update subscription");
      console.error(error);
    }
  };

  const resetForm = () => {
    setSelectedSchoolId("");
    setSelectedPlanId("");
    setStartDate(new Date().toISOString().split("T")[0]);
    setDurationMonths(1);
    setNotes("");
  };

  if (!schools || !plans || !subscriptions) {
    return <StatsSkeleton />;
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: React.ReactNode }> = {
      active: { color: "bg-green-500", icon: <Check className="h-3 w-3" /> },
      inactive: { color: "bg-gray-500", icon: <X className="h-3 w-3" /> },
      expired: { color: "bg-red-500", icon: <X className="h-3 w-3" /> },
      trialing: { color: "bg-blue-500", icon: <Clock className="h-3 w-3" /> },
    };

    const { color, icon } = config[status] || config.inactive;

    return (
      <Badge className={`${color} flex items-center gap-1`}>
        {icon}
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getDaysUntilExpiry = (endDate: number) => {
    const days = Math.floor((endDate - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="space-y-6">
      {/* No Plans Warning */}
      {plans.length === 0 && (
        <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950">
          <CardContent className="py-6 text-center">
            <h3 className="text-lg font-semibold mb-2">No Subscription Plans Found</h3>
            <p className="text-muted-foreground mb-4">
              You need to create subscription plans first before you can assign them to schools.
            </p>
            <Button onClick={handleSeedPlans} variant="default">
              <Plus className="mr-2 h-4 w-4" />
              Create Default Plans
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              This will create Free, Basic, Premium, and Enterprise plans
            </p>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Manage Subscriptions</h1>
          <p className="text-muted-foreground mt-1">
            Assign and manage school subscriptions manually
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.href = '/dashboard/subscriptions/plans'}>
            <Package className="mr-2 h-4 w-4" />
            Manage Plans
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Subscription
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Subscription</DialogTitle>
              <DialogDescription>
                Assign a subscription plan to a school
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="school">School *</Label>
                <Select
                  value={selectedSchoolId}
                  onValueChange={(value) => setSelectedSchoolId(value as Id<"schools">)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a school" />
                  </SelectTrigger>
                  <SelectContent>
                    {schools.map((school) => (
                      <SelectItem key={school._id} value={school._id}>
                        {school.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="plan">Subscription Plan *</Label>
                <Select
                  value={selectedPlanId}
                  onValueChange={(value) =>
                    setSelectedPlanId(value as Id<"subscriptionPlans">)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan._id} value={plan._id}>
                        {plan.displayName} - GHS {plan.price}/month
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (Months) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={durationMonths}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      setDurationMonths(isNaN(value) || value < 1 ? 1 : value);
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this subscription..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateSubscription}>Create Subscription</Button>
              </div>
            </div>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Subscriptions List */}
      <div className="grid gap-4">
        {subscriptions.map((sub) => {
          const daysLeft = getDaysUntilExpiry(sub.endDate);
          const isExpiring = daysLeft <= 7 && daysLeft > 0;
          const isExpired = daysLeft < 0;

          return (
            <Card key={sub._id} className="hover-lift">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {sub.schoolName}
                      {getStatusBadge(sub.status)}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {sub.planName} - GHS {sub.planPrice.toLocaleString()}/month
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {sub.status === "active" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateStatus(sub._id, "inactive")}
                      >
                        Deactivate
                      </Button>
                    )}
                    {sub.status === "inactive" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateStatus(sub._id, "active")}
                      >
                        Activate
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Start Date</p>
                    <p className="font-medium">
                      {new Date(sub.startDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Expiry Date</p>
                    <p className="font-medium flex items-center gap-1">
                      {new Date(sub.endDate).toLocaleDateString()}
                      {isExpiring && (
                        <Badge variant="outline" className="text-orange-500 border-orange-500">
                          {daysLeft} days left
                        </Badge>
                      )}
                      {isExpired && (
                        <Badge variant="outline" className="text-red-500 border-red-500">
                          Expired
                        </Badge>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created By</p>
                    <p className="font-medium">{sub.creatorName}</p>
                  </div>
                </div>
                {sub.notes && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p className="text-sm mt-1">{sub.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {subscriptions.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Subscriptions Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first subscription to get started
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Subscription
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

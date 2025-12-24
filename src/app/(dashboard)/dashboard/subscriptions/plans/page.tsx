"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Package, Star } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { StatsSkeleton } from "@/components/loading-skeletons";
import type { Id } from "../../../../../../convex/_generated/dataModel";

export const dynamic = "force-dynamic";
export const runtime = "edge";

type PlanFormData = {
  name: string;
  displayName: string;
  description: string;
  price: number;
  currency: string;
  billingPeriod: string;
  features: string[];
  maxUsers: number | undefined;
  maxStudents: number | undefined;
  maxClasses: number | undefined;
  isPopular: boolean;
};

export default function PlansManagementPage() {
  const { user } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Id<"subscriptionPlans"> | null>(null);
  const [featureInput, setFeatureInput] = useState("");

  const [formData, setFormData] = useState<PlanFormData>({
    name: "",
    displayName: "",
    description: "",
    price: 0,
    currency: "GHS",
    billingPeriod: "monthly",
    features: [],
    maxUsers: undefined,
    maxStudents: undefined,
    maxClasses: undefined,
    isPopular: false,
  });

  const plans = useQuery(api.subscriptionPlans.getAllPlansAdmin);
  const createPlan = useMutation(api.subscriptionPlans.createPlan);
  const updatePlan = useMutation(api.subscriptionPlans.updatePlan);
  const deletePlan = useMutation(api.subscriptionPlans.deletePlan);
  const seedPlans = useMutation(api.subscriptionPlans.seedDefaultPlans);

  const handleSeedPlans = async () => {
    try {
      await seedPlans();
      toast.success("Default subscription plans created successfully!");
    } catch (error) {
      toast.error("Failed to create default plans");
      console.error(error);
    }
  };

  const handleCreatePlan = async () => {
    if (!formData.name || !formData.displayName || !formData.description) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      await createPlan({
        name: formData.name,
        displayName: formData.displayName,
        description: formData.description,
        price: formData.price,
        currency: formData.currency,
        billingPeriod: formData.billingPeriod,
        features: formData.features,
        maxUsers: formData.maxUsers,
        maxStudents: formData.maxStudents,
        maxClasses: formData.maxClasses,
        isPopular: formData.isPopular,
      });

      toast.success("Plan created successfully");
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error("Failed to create plan");
      console.error(error);
    }
  };

  const handleEditPlan = async () => {
    if (!editingPlan) return;

    try {
      await updatePlan({
        planId: editingPlan,
        displayName: formData.displayName,
        description: formData.description,
        price: formData.price,
        currency: formData.currency,
        billingPeriod: formData.billingPeriod,
        features: formData.features,
        maxUsers: formData.maxUsers,
        maxStudents: formData.maxStudents,
        maxClasses: formData.maxClasses,
        isPopular: formData.isPopular,
      });

      toast.success("Plan updated successfully");
      setIsEditDialogOpen(false);
      setEditingPlan(null);
      resetForm();
    } catch (error) {
      toast.error("Failed to update plan");
      console.error(error);
    }
  };

  const handleDeletePlan = async (planId: Id<"subscriptionPlans">) => {
    if (!confirm("Are you sure you want to delete this plan? It will be deactivated.")) {
      return;
    }

    try {
      await deletePlan({ planId });
      toast.success("Plan deleted successfully");
    } catch (error) {
      toast.error("Failed to delete plan");
      console.error(error);
    }
  };

  // Fix type: plans may be undefined and has no index signature,
  // Accept plan as a non-null plan from the plans array, fallback to 'any' if plans is undefined
  const openEditDialog = (
    plan: (typeof plans extends Array<infer T> ? T : any)
  ) => {
    setEditingPlan(plan._id);
    setFormData({
      name: plan.name,
      displayName: plan.displayName,
      description: plan.description,
      price: plan.price,
      currency: plan.currency,
      billingPeriod: plan.billingPeriod,
      features: plan.features,
      maxUsers: plan.maxUsers,
      maxStudents: plan.maxStudents,
      maxClasses: plan.maxClasses,
      isPopular: plan.isPopular,
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      displayName: "",
      description: "",
      price: 0,
      currency: "GHS",
      billingPeriod: "monthly",
      features: [],
      maxUsers: undefined,
      maxStudents: undefined,
      maxClasses: undefined,
      isPopular: false,
    });
    setFeatureInput("");
  };

  const addFeature = () => {
    if (featureInput.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, featureInput.trim()],
      });
      setFeatureInput("");
    }
  };

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index),
    });
  };

  if (!plans) {
    return <StatsSkeleton />;
  }

  const PlanForm = () => (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div className="space-y-2">
        <Label htmlFor="name">Plan ID (lowercase, no spaces) *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
          placeholder="e.g., basic, premium"
          disabled={!!editingPlan}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="displayName">Display Name *</Label>
        <Input
          id="displayName"
          value={formData.displayName}
          onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
          placeholder="e.g., Basic Plan"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of the plan"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Price *</Label>
          <Input
            id="price"
            type="number"
            min="0"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GHS">GHS</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="billingPeriod">Billing Period</Label>
        <Select value={formData.billingPeriod} onValueChange={(value) => setFormData({ ...formData, billingPeriod: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="maxUsers">Max Users</Label>
          <Input
            id="maxUsers"
            type="number"
            min="0"
            value={formData.maxUsers || ""}
            onChange={(e) => setFormData({ ...formData, maxUsers: e.target.value ? parseInt(e.target.value) : undefined })}
            placeholder="Unlimited"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxStudents">Max Students</Label>
          <Input
            id="maxStudents"
            type="number"
            min="0"
            value={formData.maxStudents || ""}
            onChange={(e) => setFormData({ ...formData, maxStudents: e.target.value ? parseInt(e.target.value) : undefined })}
            placeholder="Unlimited"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxClasses">Max Classes</Label>
          <Input
            id="maxClasses"
            type="number"
            min="0"
            value={formData.maxClasses || ""}
            onChange={(e) => setFormData({ ...formData, maxClasses: e.target.value ? parseInt(e.target.value) : undefined })}
            placeholder="Unlimited"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Features</Label>
        <div className="flex gap-2">
          <Input
            value={featureInput}
            onChange={(e) => setFeatureInput(e.target.value)}
            placeholder="Add a feature"
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addFeature();
              }
            }}
          />
          <Button type="button" onClick={addFeature} variant="outline">
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {formData.features.map((feature, index) => (
            <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeFeature(index)}>
              {feature} ×
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="isPopular">Mark as Popular</Label>
        <Switch
          id="isPopular"
          checked={formData.isPopular}
          onCheckedChange={(checked) => setFormData({ ...formData, isPopular: checked })}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* No Plans Warning */}
      {plans.length === 0 && (
        <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950">
          <CardContent className="py-6 text-center">
            <h3 className="text-lg font-semibold mb-2">No Subscription Plans Found</h3>
            <p className="text-muted-foreground mb-4">
              Create default plans or add your own custom plans to get started.
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={handleSeedPlans} variant="default">
                <Plus className="mr-2 h-4 w-4" />
                Create Default Plans
              </Button>
              <Button onClick={() => setIsCreateDialogOpen(true)} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Create Custom Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Subscription Plans</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage subscription plans for schools
          </p>
        </div>
        <div className="flex gap-2">
          {plans.length > 0 && (
            <Button onClick={handleSeedPlans} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Seed Defaults
            </Button>
          )}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Subscription Plan</DialogTitle>
                <DialogDescription>
                  Add a new subscription plan for schools
                </DialogDescription>
              </DialogHeader>
              <PlanForm />
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreatePlan}>Create Plan</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Subscription Plan</DialogTitle>
            <DialogDescription>
              Update plan details (Plan ID cannot be changed)
            </DialogDescription>
          </DialogHeader>
          <PlanForm />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditPlan}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Plans List */}
      <div className="grid gap-4 md:grid-cols-2">
        {plans.map((plan) => (
          <Card key={plan._id} className={`hover-lift ${!plan.isActive ? "opacity-60" : ""}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    {plan.displayName}
                    {plan.isPopular && (
                      <Badge className="bg-yellow-500">
                        <Star className="h-3 w-3 mr-1" />
                        Popular
                      </Badge>
                    )}
                    {!plan.isActive && <Badge variant="outline">Inactive</Badge>}
                  </CardTitle>
                  <CardDescription className="mt-1">{plan.description}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(plan)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeletePlan(plan._id)}
                    disabled={!plan.isActive}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-3xl font-bold">
                    {plan.currency} {plan.price.toLocaleString()}
                    <span className="text-base font-normal text-muted-foreground">/{plan.billingPeriod}</span>
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Users</p>
                    <p className="font-medium">{plan.maxUsers || "Unlimited"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Students</p>
                    <p className="font-medium">{plan.maxStudents || "Unlimited"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Classes</p>
                    <p className="font-medium">{plan.maxClasses || "Unlimited"}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Features:</p>
                  <ul className="space-y-1">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {plans.length === 0 && (
          <Card className="md:col-span-2">
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Plans Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first subscription plan to get started
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Plan
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

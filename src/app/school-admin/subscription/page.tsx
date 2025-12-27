'use client';

import { useState, useEffect, JSX } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Check, CreditCard, Clock, Zap, Shield, Sparkles, Users, TrendingUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function SubscriptionPage(): JSX.Element {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [studentCount, setStudentCount] = useState<number>(100);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedPlanDetails, setSelectedPlanDetails] = useState<{
    id: string;
    name: string;
    pricePerStudent: number;
    isTrial: boolean;
  } | null>(null);

  const schoolAdminEmail = typeof window !== 'undefined' ? localStorage.getItem('schoolAdminEmail') : null;

  const schoolAdmins = useQuery(api.schoolAdmins.list);
  const currentAdmin = schoolAdmins?.find((admin) => admin.email === schoolAdminEmail);

  const subscriptionPlans = useQuery(api.subscriptionPlans.list);
  const activePlans = subscriptionPlans?.filter((plan) => plan.isActive);

  const subscriptionRequests = useQuery(
    api.subscriptionRequests.getByAdmin,
    currentAdmin ? { schoolAdminId: currentAdmin._id } : 'skip'
  );

  const createSubscriptionRequest = useMutation(api.subscriptionRequests.create);

  const activeSubscription = subscriptionRequests?.find(
    (req) => req.status === 'approved'
  );

  useEffect(() => {
    if (!schoolAdminEmail) {
      router.push('/login');
    }
  }, [schoolAdminEmail, router]);

  const handleSelectPlan = (planId: string, planName: string, pricePerStudent: number, isTrial: boolean): void => {
    setSelectedPlanDetails({
      id: planId,
      name: planName,
      pricePerStudent,
      isTrial,
    });
    setSelectedPlan(planId);
    setShowConfirmDialog(true);
  };

  const handleConfirmPlan = async (): Promise<void> => {
    if (!currentAdmin || !selectedPlanDetails) return;

    try {
      const totalAmount = selectedPlanDetails.isTrial ? 0 : selectedPlanDetails.pricePerStudent * studentCount;

      await createSubscriptionRequest({
        schoolAdminId: currentAdmin._id,
        schoolAdminEmail: currentAdmin.email,
        planId: selectedPlanDetails.id,
        planName: selectedPlanDetails.name,
        studentsCount: studentCount,
        totalAmount,
        isTrial: selectedPlanDetails.isTrial,
      });

      toast.success(
        selectedPlanDetails.isTrial
          ? 'Trial activated! You can now create your school.'
          : 'Subscription request created! Please proceed to payment.'
      );

      setShowConfirmDialog(false);

      if (selectedPlanDetails.isTrial) {
        router.push('/school-admin/create-school');
      } else {
        router.push('/school-admin/payment');
      }
    } catch (error) {
      toast.error('Failed to create subscription request');
      console.error(error);
    }
  };

  if (!currentAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <div>
            <h2 className="text-2xl font-bold mb-2">Loading Your Dashboard</h2>
            <p className="text-muted-foreground">Preparing your subscription options...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4 pt-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-2">
            <Sparkles className="h-4 w-4" />
            Choose Your Plan
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
            Subscription Plans
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Select the perfect plan for your school and unlock powerful features to streamline your operations
          </p>
        </div>

        {/* Active Subscription Banner */}
        {activeSubscription && (
          <Card className="border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-green-700 dark:text-green-400 flex items-center gap-2">
                    <Check className="h-5 w-5" />
                    Active Subscription
                  </CardTitle>
                  <CardDescription className="text-green-600 dark:text-green-500">
                    You currently have an active subscription
                  </CardDescription>
                </div>
                <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white">
                  <Check className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                <div className="flex justify-between items-center p-3 bg-white/50 dark:bg-slate-900/50 rounded-lg">
                  <span className="text-muted-foreground font-medium">Plan:</span>
                  <span className="font-semibold text-lg">{activeSubscription.planName}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/50 dark:bg-slate-900/50 rounded-lg">
                  <span className="text-muted-foreground font-medium">Students:</span>
                  <span className="font-semibold text-lg">{activeSubscription.studentsCount}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/50 dark:bg-slate-900/50 rounded-lg">
                  <span className="text-muted-foreground font-medium">Total Amount:</span>
                  <span className="font-semibold text-lg">₵{activeSubscription.totalAmount}</span>
                </div>
                {activeSubscription.isTrial && activeSubscription.trialEndDate && (
                  <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
                    <span className="text-orange-700 dark:text-orange-400 font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Trial Expires:
                    </span>
                    <span className="font-semibold text-lg text-orange-600 dark:text-orange-500">
                      {new Date(activeSubscription.trialEndDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Student Count Input */}
        <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-2 bg-white">
          <CardHeader className="bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl text-gray-900">Number of Students</CardTitle>
                <CardDescription className="text-gray-600">Enter your expected number of students to calculate pricing</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="flex-1 w-full">
                <Label htmlFor="studentCount" className="text-base font-semibold mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Student Count
                </Label>
                <Input
                  id="studentCount"
                  type="number"
                  min={1}
                  value={studentCount}
                  onChange={(e) => setStudentCount(parseInt(e.target.value) || 1)}
                  className="mt-2 h-12 text-lg font-semibold"
                  placeholder="Enter number of students"
                />
              </div>
              <div className="text-center sm:text-right bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600">Pricing is calculated</p>
                <p className="text-sm font-semibold text-gray-900">per student basis</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* All Plans Grid */}
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Choose Your Plan</h2>
            <p className="text-gray-600">Select a plan that scales with your institution</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Trial Plan */}
            <Card className="flex flex-col border-2 border-blue-500 relative overflow-hidden shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 bg-white">
              <div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-1 text-xs font-bold flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                POPULAR
              </div>
              <CardHeader className="pt-8">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Zap className="h-5 w-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg font-bold text-gray-900">30-Day Free Trial</CardTitle>
                </div>
                <CardDescription className="text-sm text-gray-600">
                  Try SchoolFlow risk-free
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-4xl font-bold text-gray-900">₵0</div>
                    <p className="text-sm text-gray-600 mt-1">For 30 days</p>
                  </div>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-gray-700">All premium features</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-gray-700">Up to {studentCount} students</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-gray-700">No credit card required</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Clock className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                      <span className="text-gray-700">Auto-suspend after 30 days</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => handleSelectPlan('trial', 'Free Trial', 0, true)}
                  disabled={!!activeSubscription}
                >
                  <Zap className="mr-2 h-4 w-4" />
                  {activeSubscription ? 'Already Subscribed' : 'Start Trial'}
                </Button>
              </CardFooter>
            </Card>

            {/* Paid Plans */}
            {activePlans?.map((plan) => {
              const totalAmount = plan.price * studentCount;
              
              return (
                <Card 
                  key={plan._id} 
                  className="flex flex-col shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-2 hover:border-gray-300 bg-white"
                >
                  <CardHeader className="bg-gray-50">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 bg-gray-200 rounded-lg">
                        <Shield className="h-5 w-5 text-gray-700" />
                      </div>
                      <CardTitle className="text-lg font-bold text-gray-900">{plan.name}</CardTitle>
                    </div>
                    <CardDescription className="text-sm text-gray-600">{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 pt-6">
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-bold text-gray-900">₵{plan.price}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          per student / {plan.billingCycle}
                        </p>
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xl font-bold text-gray-900">
                            Total: ₵{totalAmount.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            for {studentCount} students
                          </p>
                        </div>
                      </div>
                      <ul className="space-y-2">
                        {plan.features.map((feature, index) => (
                          <li 
                            key={index} 
                            className="flex items-start gap-2 text-sm hover:bg-gray-50 p-1 rounded transition-colors"
                          >
                            <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                            <span className="text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full hover:bg-gray-100"
                      variant="outline"
                      onClick={() => handleSelectPlan(plan._id, plan.name, plan.price, false)}
                      disabled={!!activeSubscription}
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      {activeSubscription ? 'Already Subscribed' : 'Select Plan'}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          <div className="text-center p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-200">
            <Shield className="h-10 w-10 text-gray-700 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Secure Payments</h3>
            <p className="text-sm text-gray-600">Bank-grade security</p>
          </div>
          <div className="text-center p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-200">
            <Users className="h-10 w-10 text-gray-700 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Trusted by Schools</h3>
            <p className="text-sm text-gray-600">Join hundreds of institutions</p>
          </div>
          <div className="text-center p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-200">
            <Sparkles className="h-10 w-10 text-gray-700 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Premium Support</h3>
            <p className="text-sm text-gray-600">24/7 assistance available</p>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Check className="h-6 w-6 text-green-500" />
              Confirm Subscription
            </DialogTitle>
            <DialogDescription className="text-base">
              Please review your subscription details before confirming
            </DialogDescription>
          </DialogHeader>
          {selectedPlanDetails && (
            <div className="space-y-4">
              <div className="grid gap-3 bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Plan:</span>
                  <span className="font-bold text-lg">{selectedPlanDetails.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Students:</span>
                  <span className="font-bold text-lg">{studentCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Price per Student:</span>
                  <span className="font-bold text-lg">
                    {selectedPlanDetails.isTrial ? 'Free' : `₵${selectedPlanDetails.pricePerStudent}`}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xl font-bold border-t-2 pt-3 mt-2">
                  <span>Total Amount:</span>
                  <span className="text-primary">
                    {selectedPlanDetails.isTrial
                      ? 'Free for 30 days'
                      : `₵${(selectedPlanDetails.pricePerStudent * studentCount).toFixed(2)}`}
                  </span>
                </div>
              </div>
              {selectedPlanDetails.isTrial && (
                <div className="bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Important:</strong> Your trial will automatically expire after 30 days. You'll need to
                      upgrade to a paid plan to continue using SchoolFlow.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleConfirmPlan} className="w-full sm:w-auto">
              {selectedPlanDetails?.isTrial ? (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Activate Trial
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Proceed to Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

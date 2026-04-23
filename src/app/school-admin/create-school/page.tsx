"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { toast } from "sonner";
import {
  School,
  Mail,
  Phone,
  MapPin,
  Users,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CreateSchoolPage(): React.JSX.Element {
  const router = useRouter();
  const { user } = useAuth();
  const [schoolType, setSchoolType] = useState<"private" | "public">("private");
  const [formData, setFormData] = useState({
    schoolName: "",
    email: "",
    phone: "",
    address: "",
    studentCount: "",
  });
  const [loading, setLoading] = useState(false);

  const currentAdmin = useQuery(
    api.schoolAdmins.getById,
    user?.userId ? { id: user.userId as import('@/../convex/_generated/dataModel').Id<'schoolAdmins'> } : 'skip',
  );

  const subscriptionRequests = useQuery(
    api.subscriptionRequests.getByAdmin,
    currentAdmin ? { schoolAdminId: currentAdmin._id } : "skip",
  );

  const schoolCreationRequests = useQuery(
    api.schoolCreationRequests.getByAdmin,
    currentAdmin ? { schoolAdminId: currentAdmin._id } : "skip",
  );

  const createSchoolRequest = useMutation(api.schoolCreationRequests.create);

  const activeSubscription = subscriptionRequests?.find(
    (req) => req.status === "approved",
  );

  const pendingSchool = schoolCreationRequests?.find(
    (req) => req.status === "pending",
  );
  const approvedSchool = schoolCreationRequests?.find(
    (req) => req.status === "approved",
  );

  // Note: Public schools don't require subscriptions. Private schools still do.

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ): void => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);

    if (!currentAdmin) {
      toast.error("Admin not found");
      setLoading(false);
      return;
    }

    const needsSubscription = schoolType === "private";
    if (needsSubscription && !activeSubscription) {
      toast.error("No active subscription found");
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      toast.error("Please enter a valid email address");
      setLoading(false);
      return;
    }

    const phoneRegex = /^[\d\s\-+()]{10,}$/;
    if (formData.phone && !phoneRegex.test(formData.phone.trim())) {
      toast.error("Please enter a valid phone number (at least 10 digits)");
      setLoading(false);
      return;
    }

    try {
      const studentCount =
        schoolType === "public"
          ? Math.max(0, parseInt(formData.studentCount || "0", 10) || 0)
          : activeSubscription!.studentsCount;
      await createSchoolRequest({
        schoolAdminId: currentAdmin._id,
        schoolAdminEmail: currentAdmin.email,
        schoolName: formData.schoolName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        studentCount,
        schoolType,
      });

      toast.success("School creation request submitted successfully!", {
        description:
          "Your request is now awaiting admin approval. You will be notified once approved.",
        icon: <CheckCircle2 className="h-4 w-4" />,
      });

      router.push("/school-admin");
    } catch (error) {
      toast.error("Failed to submit school creation request", {
        description:
          "Please try again or contact support if the problem persists.",
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Premium Loading State
  if (!currentAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-gray-900 mx-auto" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Loading Your Profile
            </h2>
            <p className="text-gray-600 mt-2">
              Please wait while we fetch your information...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (schoolType === "private" && !activeSubscription) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="border-2 hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <AlertCircle className="h-5 w-5" />
              No Active Subscription
            </CardTitle>
            <CardDescription className="text-gray-600">
              You need an active subscription before creating a school
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>School type</Label>
                <Select
                  value={schoolType}
                  onValueChange={(v) => setSchoolType(v as "private" | "public")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select school type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private (subscription required)</SelectItem>
                    <SelectItem value="public">Public (no subscription)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            <Button
              onClick={() => router.push("/school-admin/subscription")}
              className="w-full"
            >
              View Subscriptions
            </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (approvedSchool) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card className="border-2 border-green-500 hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-6 w-6" />
              School Approved!
            </CardTitle>
            <CardDescription className="text-gray-600">
              Your school has been successfully created and approved
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-sm text-gray-500">School Name</span>
                  <p className="font-medium text-gray-900">
                    {approvedSchool.schoolName}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-gray-500">Email</span>
                  <p className="font-medium text-gray-900">
                    {approvedSchool.email}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-gray-500">Phone</span>
                  <p className="font-medium text-gray-900">
                    {approvedSchool.phone}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-gray-500">Students</span>
                  <p className="font-medium text-gray-900">
                    {approvedSchool.studentCount}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Status:</span>
                  <Badge variant="default" className="bg-green-600">
                    Approved
                  </Badge>
                </div>
              </div>
              <Button
                onClick={() => router.push("/school-admin")}
                className="w-full mt-4"
              >
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (pendingSchool) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card className="border-2 border-orange-500 hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <Clock className="h-6 w-6" />
              School Request Under Review
            </CardTitle>
            <CardDescription className="text-gray-600">
              Your school creation request is currently being reviewed by the
              administrator
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert className="border-orange-200 bg-orange-50">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-gray-700">
                  You will receive a notification once your school has been
                  approved. This usually takes 1-2 business days.
                </AlertDescription>
              </Alert>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-sm text-gray-500">School Name</span>
                  <p className="font-medium text-gray-900">
                    {pendingSchool.schoolName}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-gray-500">Email</span>
                  <p className="font-medium text-gray-900">
                    {pendingSchool.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-4 border-t">
                <span className="text-sm text-gray-500">Status:</span>
                <Badge
                  variant="secondary"
                  className="bg-orange-100 text-orange-700"
                >
                  Pending Approval
                </Badge>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push("/school-admin")}
                className="w-full mt-4 hover:bg-gray-50"
              >
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Create Your School
          </h1>
          <p className="text-gray-600 text-lg">
            Fill in your school details to get started with SchoolFlow
          </p>
        </div>

        {/* Active Subscription Card (private schools only; public has no platform subscription) */}
        {schoolType === "private" && activeSubscription && (
          <Card className="bg-white border-2 border-blue-500 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
                Active Subscription
              </CardTitle>
              <CardDescription className="text-gray-600">
                Your current subscription plan details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <span className="text-sm text-gray-500">Plan Name</span>
                  <p className="font-semibold text-gray-900">
                    {activeSubscription.planName}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-gray-500">
                    Students Allowed
                  </span>
                  <p className="font-semibold text-gray-900">
                    {activeSubscription.studentsCount}
                  </p>
                </div>
                {activeSubscription.isTrial &&
                  activeSubscription.trialEndDate && (
                    <div className="space-y-1">
                      <span className="text-sm text-gray-500">
                        Trial Expires
                      </span>
                      <p className="font-semibold text-orange-600">
                        {new Date(
                          activeSubscription.trialEndDate,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* School Information Form */}
        <Card className="bg-white border-2 hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <School className="h-5 w-5" />
              School Information
            </CardTitle>
            <CardDescription className="text-gray-600">
              Please provide accurate information about your school
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 2-Column Grid for Form Fields */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* School type */}
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-gray-900 font-medium">School type *</Label>
                  <Select
                    value={schoolType}
                    onValueChange={(v) => setSchoolType(v as "private" | "public")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select school type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private (subscription required)</SelectItem>
                      <SelectItem value="public">Public (no subscription)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Public schools do not require subscriptions but still need super-admin approval.
                  </p>
                </div>

                {/* School Name */}
                <div className="space-y-2">
                  <Label
                    htmlFor="schoolName"
                    className="text-gray-900 font-medium"
                  >
                    School Name *
                  </Label>
                  <div className="relative">
                    <School className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="schoolName"
                      name="schoolName"
                      placeholder="Enter school name"
                      value={formData.schoolName}
                      onChange={handleChange}
                      className="pl-10 border-gray-300 focus:border-blue-500 hover:border-gray-400 transition-colors"
                      required
                    />
                  </div>
                </div>

                {/* School Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-900 font-medium">
                    School Email *
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="school@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="pl-10 border-gray-300 focus:border-blue-500 hover:border-gray-400 transition-colors"
                      required
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-900 font-medium">
                    Phone Number *
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+233 XX XXX XXXX"
                      value={formData.phone}
                      onChange={handleChange}
                      className="pl-10 border-gray-300 focus:border-blue-500 hover:border-gray-400 transition-colors"
                      required
                    />
                  </div>
                </div>

                {/* Number of Students */}
                <div className="space-y-2">
                  <Label
                    htmlFor="studentCount"
                    className="text-gray-900 font-medium"
                  >
                    Number of Students *
                  </Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="studentCount"
                      name="studentCount"
                      type="number"
                      value={
                        schoolType === "public"
                          ? formData.studentCount
                          : String(activeSubscription?.studentsCount ?? 0)
                      }
                      onChange={handleChange}
                      readOnly={schoolType !== "public"}
                      className={
                        schoolType === "public"
                          ? "pl-10 border-gray-300 focus:border-blue-500 hover:border-gray-400 transition-colors"
                          : "pl-10 bg-gray-50 border-gray-300 text-gray-700 cursor-not-allowed"
                      }
                    />
                  </div>
                  {schoolType === "public" ? (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Enter an estimate for your school.
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Auto-filled from your subscription plan
                    </p>
                  )}
                </div>
              </div>

              {/* School Address (Full Width) */}
              <div className="space-y-2">
                <Label htmlFor="address" className="text-gray-900 font-medium">
                  School Address *
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Textarea
                    id="address"
                    name="address"
                    placeholder="Enter complete school address with city and region"
                    value={formData.address}
                    onChange={handleChange}
                    className="pl-10 border-gray-300 focus:border-blue-500 hover:border-gray-400 transition-colors resize-none"
                    rows={3}
                    required
                  />
                </div>
              </div>

              {/* Info Alert */}
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-gray-700">
                  Your school creation request will be reviewed by the super
                  administrator. You&apos;ll receive a notification once
                  it&apos;s approved (typically within 1-2 business days).
                </AlertDescription>
              </Alert>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 hover:shadow-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting Request...
                    </>
                  ) : (
                    <>
                      <School className="mr-2 h-4 w-4" />
                      Submit for Approval
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/school-admin")}
                  disabled={loading}
                  className="flex-1 hover:bg-gray-50 border-gray-300 text-gray-900 transition-colors"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

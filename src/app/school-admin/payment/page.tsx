"use client";

import { useState, useEffect} from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { toast } from "sonner";
import {
  Upload,
  CreditCard,
  Smartphone,
  Building2,
  AlertCircle,
  Loader2,
  Calendar as CalendarIcon,
  DollarSign,
  FileText,
  Image as ImageIcon,
  Hash,
  CheckCircle2,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

export default function PaymentPage(): React.JSX.Element {
  const router = useRouter();
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<
    "mobile_money" | "bank_transfer"
  >("mobile_money");
  const [transactionId, setTransactionId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(undefined);
  const [notes, setNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const currentAdmin = useQuery(
    api.schoolAdmins.getByEmail,
    user?.email ? { email: user.email } : "skip",
  );

  const subscriptionRequests = useQuery(
    api.subscriptionRequests.getByAdmin,
    currentAdmin ? { schoolAdminId: currentAdmin._id } : "skip",
  );

  const createPaymentProof = useMutation(api.paymentProofs.create);
  const generateUploadUrl = useMutation(api.paymentProofs.generateUploadUrl);

  const pendingSubscription = subscriptionRequests?.find(
    (req) => req.status === "pending_payment",
  );

  const pendingApproval = subscriptionRequests?.find(
    (req) => req.status === "pending_approval",
  );

  useEffect(() => {
    if (pendingSubscription) {
      setAmount(pendingSubscription.totalAmount.toString());
    }
  }, [pendingSubscription]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);

    if (!currentAdmin || !pendingSubscription) {
      toast.error("No pending subscription found");
      setLoading(false);
      return;
    }

    if (!paymentDate) {
      toast.error("Please select a payment date");
      setLoading(false);
      return;
    }

    try {
      let screenshotStorageId: string | undefined = undefined;

      // Upload file if selected
      if (selectedFile) {
        setUploading(true);
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": selectedFile.type },
          body: selectedFile,
        });
        const { storageId } = await result.json();
        screenshotStorageId = storageId;
        setUploading(false);
      }

      await createPaymentProof({
        subscriptionRequestId: pendingSubscription._id,
        schoolAdminId: currentAdmin._id,
        schoolAdminEmail: currentAdmin.email,
        paymentMethod,
        transactionId,
        amount: parseFloat(amount),
        paymentDate: paymentDate.toISOString(),
        notes,
        screenshotStorageId,
      });

      toast.success(
        "Payment proof submitted successfully! Awaiting admin approval.",
      );
      router.push("/school-admin");
    } catch (error) {
      toast.error("Failed to submit payment proof");
      console.error(error);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  if (!currentAdmin) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <div>
            <h2 className="text-2xl font-bold mb-2">Loading Payment Details</h2>
            <p className="text-muted-foreground">
              Setting up your payment form...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!pendingSubscription && !pendingApproval) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>No Pending Payment</CardTitle>
            <CardDescription>
              You don&apos;t have any pending subscription payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/school-admin/subscription")}>
              View Subscriptions
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (pendingApproval) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-yellow-500" />
              Payment Under Review
            </CardTitle>
            <CardDescription>
              Your payment proof is currently being reviewed by the
              administrator
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You will receive a notification once your payment has been
                  verified. This usually takes 1-2 business days.
                </AlertDescription>
              </Alert>
              <div className="grid gap-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plan:</span>
                  <span className="font-medium">
                    {pendingApproval.planName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-medium">
                    ₵{pendingApproval.totalAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant="secondary">Pending Approval</Badge>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push("/school-admin")}
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payment Details</h1>
        <p className="text-muted-foreground">
          Upload your payment proof for verification
        </p>
      </div>

      {pendingSubscription && (
        <Card className="bg-primary/5 border-primary hover:shadow-lg transition-all hover:border-primary/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscription Details
            </CardTitle>
            <CardDescription>
              Review your subscription before payment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Plan:</span>
                <Badge variant="outline" className="font-medium">
                  {pendingSubscription.planName}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Students:</span>
                <span className="font-medium">
                  {pendingSubscription.studentsCount}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total Amount:</span>
                <span className="text-primary">
                  ₵{pendingSubscription.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Instructions */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-500" />
            Payment Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-lg">
                <Smartphone className="h-5 w-5 text-green-500" />
                Mobile Money
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    <strong>MTN Mobile Money:</strong> 0712345678
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    <strong>Airtel Money:</strong> 0787654321
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Send the exact amount shown above</span>
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5 text-blue-500" />
                Bank Transfer
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    <strong>Bank:</strong> Ghana Commercial Bank
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    <strong>Account Name:</strong> SchoolFlow Systems
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    <strong>Account Number:</strong> 1234567890
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    <strong>Branch:</strong> Accra Main Branch
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Form */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Payment Proof
          </CardTitle>
          <CardDescription>
            Fill in the payment details and upload a screenshot
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-base">Payment Method</Label>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(value) =>
                  setPaymentMethod(value as "mobile_money" | "bank_transfer")
                }
              >
                <div className="grid md:grid-cols-2 gap-3">
                  <div
                    className={cn(
                      "flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                      paymentMethod === "mobile_money"
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-primary/50",
                    )}
                  >
                    <RadioGroupItem value="mobile_money" id="mobile_money" />
                    <Label
                      htmlFor="mobile_money"
                      className="font-normal flex items-center gap-2 cursor-pointer"
                    >
                      <Smartphone className="h-4 w-4" />
                      Mobile Money
                    </Label>
                  </div>
                  <div
                    className={cn(
                      "flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                      paymentMethod === "bank_transfer"
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-primary/50",
                    )}
                  >
                    <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                    <Label
                      htmlFor="bank_transfer"
                      className="font-normal flex items-center gap-2 cursor-pointer"
                    >
                      <Building2 className="h-4 w-4" />
                      Bank Transfer
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="transactionId"
                  className="flex items-center gap-2"
                >
                  <Hash className="h-4 w-4" />
                  Transaction ID / Reference Number *
                </Label>
                <Input
                  id="transactionId"
                  placeholder="Enter transaction ID"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  required
                  className="transition-all focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Amount Paid (GHS ₵) *
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  readOnly
                  className="bg-muted cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Payment Date *
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal transition-all",
                        !paymentDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {paymentDate ? format(paymentDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={paymentDate}
                      onSelect={setPaymentDate}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="screenshot" className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Payment Screenshot (Optional)
                </Label>
                <div className="relative">
                  <Input
                    id="screenshot"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 transition-all"
                  />
                  {selectedFile && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {selectedFile.name}
                    </p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload a screenshot of your payment confirmation (Max 5MB)
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Additional Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                placeholder="Any additional information about the payment"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="transition-all focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading || uploading}
                className="flex-1 transition-all hover:shadow-lg"
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading Screenshot...
                  </>
                ) : loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Submit Payment Proof
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/school-admin")}
                disabled={loading || uploading}
                className="transition-all hover:bg-muted"
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

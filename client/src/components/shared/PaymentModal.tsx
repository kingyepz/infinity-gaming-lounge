import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { GameStation } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PaymentModalProps {
  amount: number;
  station: any;
  onSuccess: () => Promise<void>;
  onClose: () => void;
}

export default function PaymentModal({ amount, station, onSuccess, onClose }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mpesa">("cash");
  const [mpesaRef, setMpesaRef] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "completed" | "failed">("pending");
  const { toast } = useToast();

  // Function to check M-Pesa payment status
  const checkPaymentStatus = async (checkoutId: string) => {
    try {
      setVerifying(true);
      const statusResponse = await apiRequest(
        "GET", 
        `/api/payments/mpesa/status/${checkoutId}`
      );

      if (statusResponse.status === "COMPLETED") {
        setPaymentStatus("completed");
        toast({
          title: "Payment Successful",
          description: `M-Pesa payment of KSH ${amount} received`
        });
        onSuccess();
      } else if (statusResponse.status === "FAILED") {
        setPaymentStatus("failed");
        toast({
          title: "Payment Failed",
          description: statusResponse.message || "M-Pesa payment failed",
          variant: "destructive"
        });
      } else {
        // Still pending
        setTimeout(() => checkPaymentStatus(checkoutId), 5000); // Check again in 5 seconds
      }
    } catch (error) {
      console.error("Error checking payment status:", error);
    } finally {
      setVerifying(false);
    }
  };

  const handlePayment = async () => {
    try {
      setProcessing(true);

      if (paymentMethod === "mpesa") {
        if (!phoneNumber) {
          toast({
            title: "Error",
            description: "Please enter a phone number",
            variant: "destructive"
          });
          setProcessing(false);
          return;
        }

        // Format phone number to the required format (254...)
        const formattedPhone = formatPhoneNumber(phoneNumber);

        // Initiate M-Pesa payment
        const response = await apiRequest("POST", "/api/payments/mpesa", {
          phoneNumber: formattedPhone,
          amount,
          transactionId: station.id
        });

        if (response.success) {
          setCheckoutId(response.checkoutRequestId);
          // Start polling for status
          checkPaymentStatus(response.checkoutRequestId);
        } else {
          toast({
            title: "M-Pesa Error",
            description: response.error || "Failed to initiate M-Pesa payment",
            variant: "destructive"
          });
          setProcessing(false);
        }
      } else {
        // Cash payment
        const response = await apiRequest("POST", "/api/transactions/payment", {
          stationId: station.id,
          amount: String(amount), // Convert amount to string
          paymentMethod: "cash"
        });

        if (response.success) {
          toast({
            title: "Payment Successful",
            description: "Cash payment has been recorded",
          });
          await onSuccess();
          onClose();
        } else {
          toast({
            title: "Error",
            description: response.error || "Failed to process payment",
            variant: "destructive"
          });
        }
        setProcessing(false);
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      setProcessing(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-black/50 border-primary/20 text-white">
        <DialogHeader>
          <DialogTitle>Process Payment</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <p className="text-lg font-bold">Amount: KSH {amount}</p>
            <p className="text-sm text-muted-foreground">{station.name}</p>
            <p className="text-sm text-muted-foreground">
              Rate: KSH {station.sessionType === "per_game" ? "40 per game" : "200 per hour"}
            </p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Payment Method</label>
            <Select
              onValueChange={(value) => setPaymentMethod(value as "cash" | "mpesa")}
              value={paymentMethod}
              disabled={processing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="mpesa">M-Pesa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {paymentMethod === "mpesa" && (
            <div className="space-y-4">
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium">
                  Customer Phone Number
                </label>
                <input
                  id="phoneNumber"
                  type="tel"
                  placeholder="e.g., 07XXXXXXXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
                  disabled={processing || checkoutId !== null}
                />
                <p className="text-xs text-muted-foreground mt-1">Enter the phone number registered with M-Pesa</p>
              </div>

              {checkoutId && (
                <div className="rounded-lg bg-muted p-3">
                  <h4 className="font-medium">Payment Status</h4>
                  <div className="flex items-center mt-2">
                    {verifying ? (
                      <>
                        <svg className="animate-spin h-4 w-4 mr-2 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Verifying payment...</span>
                      </>
                    ) : (
                      <span>
                        {paymentStatus === "completed" ? "✅ Payment completed" : 
                         paymentStatus === "failed" ? "❌ Payment failed" : 
                         "⏳ Waiting for payment..."}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {!checkoutId && (
                <div>
                  <label className="text-sm text-muted-foreground">M-Pesa Instructions</label>
                  <p className="text-sm mt-1">
                    Once you click "Initiate M-Pesa", the customer will receive an STK push prompt on their phone.
                    <br/>
                    They need to:
                    <br/>
                    1. Enter their M-Pesa PIN when prompted<br/>
                    2. Payment will be processed automatically<br/>
                    3. The system will verify the payment
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={processing}>
            Cancel
          </Button>
          <Button onClick={handlePayment} disabled={processing || (paymentMethod === "mpesa" && checkoutId !== null)}>
            {processing 
              ? "Processing..." 
              : paymentMethod === "cash" 
                ? "Confirm Payment" 
                : checkoutId 
                  ? "M-Pesa Initiated" 
                  : "Initiate M-Pesa"
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Placeholder for phone number formatting - replace with actual implementation
const formatPhoneNumber = (phoneNumber: string) => phoneNumber;
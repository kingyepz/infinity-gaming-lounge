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
  const { toast } = useToast();

  const handlePayment = async () => {
    try {
      setProcessing(true);

      // Create payment record through API
      const response = await fetch("/api/transactions/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stationId: station.id,
          amount: amount,
          paymentMethod: paymentMethod,
          mpesaRef: paymentMethod === "mpesa" ? mpesaRef : null
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Payment processing failed");
      }

      // Show appropriate success message
      if (paymentMethod === "cash") {
        toast({
          title: "Cash Payment Processed",
          description: `KSH ${amount} received successfully.`,
        });
      } else if (paymentMethod === "mpesa") {
        toast({
          title: "M-Pesa Payment Verified",
          description: `Payment of KSH ${amount} verified with reference: ${mpesaRef}.`,
        });
      }

      // Call success callback
      await onSuccess();

      setProcessing(false);
      onClose();
    } catch (error) {
      console.error("Payment error:", error);
      setProcessing(false);
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to process payment. Please try again.",
        variant: "destructive"
      });
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
            <div>
              <label className="text-sm text-muted-foreground">M-Pesa Reference</label>
              <Input
                placeholder="Enter M-Pesa Reference Number"
                type="text"
                onChange={(e) => setMpesaRef(e.target.value)}
                value={mpesaRef || ""}
              />
              <p className="text-sm mt-1">
                1. Go to M-Pesa menu<br/>
                2. Select Lipa na M-Pesa<br/>
                3. Enter Till Number: 123456<br/>
                4. Enter Amount: KSH {amount}<br/>
                5. Enter your M-Pesa PIN<br/>
                6. Wait for confirmation SMS and enter the reference number above.
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={processing}>
            Cancel
          </Button>
          <Button onClick={handlePayment} disabled={processing}>
            {processing
              ? "Processing..."
              : paymentMethod === "cash"
                ? "Confirm Payment"
                : "Verify M-Pesa"
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
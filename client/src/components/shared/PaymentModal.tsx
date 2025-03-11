import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { GameStation } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface PaymentModalProps {
  amount: number;
  station: GameStation;
  onSuccess: () => void;
  onClose: () => void;
}

export default function PaymentModal({ amount, station, onSuccess, onClose }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mpesa">("cash");
  const { toast } = useToast();

  const handlePayment = async () => {
    try {
      if (paymentMethod === "cash") {
        // Process cash payment
        const response = await apiRequest("POST", "/api/transactions/payment", {
          stationId: station.id,
          amount,
          paymentMethod: "cash"
        });

        if (!response) {
          throw new Error("Failed to process cash payment");
        }

        toast({
          title: "Payment Successful",
          description: `Cash payment of KSH ${amount} received`
        });

        onSuccess();
      } else {
        // M-Pesa payment instructions
        toast({
          title: "M-Pesa Payment",
          description: "Please follow the M-Pesa instructions to complete payment",
        });
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process payment",
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
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Payment Method</label>
            <Select
              onValueChange={(value) => setPaymentMethod(value as "cash" | "mpesa")}
              value={paymentMethod}
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
              <label className="text-sm text-muted-foreground">M-Pesa Instructions</label>
              <p className="text-sm mt-1">
                1. Go to M-Pesa menu<br/>
                2. Select Lipa na M-Pesa<br/>
                3. Enter Till Number: 123456<br/>
                4. Enter Amount: KSH {amount}<br/>
                5. Enter your M-Pesa PIN<br/>
                6. Share the confirmation message
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handlePayment}>
            {paymentMethod === "cash" ? "Confirm Payment" : "Verify M-Pesa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
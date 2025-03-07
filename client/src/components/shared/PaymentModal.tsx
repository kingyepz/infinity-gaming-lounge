import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { GameStation } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import PaymentForm from "./PaymentForm";

interface PaymentModalProps {
  station: GameStation;
  onClose: () => void;
}

export default function PaymentModal({ station, onClose }: PaymentModalProps) {
  const [customerName, setCustomerName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePayment = async (paymentInfo: any) => {
    try {
      setLoading(true);

      // Create transaction and start session
      await apiRequest("PATCH", `/api/stations/${station.id}`, {
        currentCustomer: customerName,
        sessionType: paymentInfo.sessionType || "hourly",
        sessionStartTime: new Date().toISOString()
      });

      // Create transaction record
      await apiRequest("POST", "/api/transactions", {
        stationId: station.id,
        customerName,
        amount: paymentInfo.amount,
        sessionType: paymentInfo.sessionType || "hourly",
        duration: paymentInfo.duration || 60, // Default to 1 hour
        paymentStatus: "completed"
      });

      toast({
        title: "Session Started",
        description: "Gaming session has been started successfully!"
      });

      onClose();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to Start Session",
        description: error.message || "An error occurred while starting the session"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start Gaming Session - {station.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Customer Name</label>
            <input
              type="text"
              className="w-full px-3 py-2 rounded-md bg-background border"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer name"
            />
          </div>

          <PaymentForm
            amount={station.hourlyRate || station.baseRate || 0}
            customerName={customerName}
            onComplete={handlePayment}
            onCancel={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
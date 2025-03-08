import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { GameStation, User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import PaymentForm from "./PaymentForm";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";

interface PaymentModalProps {
  station: GameStation;
  selectedCustomer?: User;
  selectedGame?: string;
  onClose: () => void;
}

export default function PaymentModal({ station, selectedCustomer, selectedGame, onClose }: PaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch available games
  const { data: games } = useQuery({
    queryKey: ["/api/games"],
  });

  const handlePayment = async (paymentInfo: any) => {
    try {
      if (!selectedGame) {
        toast({
          variant: "destructive",
          title: "Game Required",
          description: "Please select a game to start the session"
        });
        return;
      }

      setLoading(true);

      // Create transaction and start session
      await apiRequest("PATCH", `/api/stations/${station.id}`, {
        currentCustomer: selectedCustomer?.displayName,
        currentGame: selectedGame,
        sessionType: paymentInfo.sessionType || "hourly",
        sessionStartTime: new Date().toISOString()
      });

      // Create transaction record
      await apiRequest("POST", "/api/transactions", {
        stationId: station.id,
        customerName: selectedCustomer?.displayName,
        gameName: selectedGame,
        amount: paymentInfo.amount,
        sessionType: paymentInfo.sessionType || "hourly",
        duration: paymentInfo.duration || 60, // Default to 1 hour
        paymentStatus: "completed",
        userId: selectedCustomer?.id
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
          {selectedCustomer && (
            <div className="bg-primary/10 p-3 rounded-md">
              <p className="text-sm text-muted-foreground">Selected Customer</p>
              <p className="font-medium">{selectedCustomer.displayName}</p>
              <p className="text-sm">@{selectedCustomer.gamingName}</p>
            </div>
          )}

          <div className="bg-primary/10 p-3 rounded-md">
            <p className="text-sm text-muted-foreground">Selected Game</p>
            <p className="font-medium">{selectedGame}</p>
          </div>

          <PaymentForm
            amount={station.hourlyRate || station.baseRate || 0}
            customerName={selectedCustomer?.displayName || ""}
            userId={selectedCustomer?.id}
            onComplete={handlePayment}
            onCancel={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
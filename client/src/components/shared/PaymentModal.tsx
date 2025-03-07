import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { GameStation } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import PaymentForm from "./PaymentForm";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";

interface PaymentModalProps {
  station: GameStation;
  onClose: () => void;
}

export default function PaymentModal({ station, onClose }: PaymentModalProps) {
  const [customerName, setCustomerName] = useState("");
  const [selectedGame, setSelectedGame] = useState<string>("");
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
        currentCustomer: customerName,
        currentGame: selectedGame,
        sessionType: paymentInfo.sessionType || "hourly",
        sessionStartTime: new Date().toISOString()
      });

      // Create transaction record
      await apiRequest("POST", "/api/transactions", {
        stationId: station.id,
        customerName,
        gameName: selectedGame,
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

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Select Game</label>
            <Select value={selectedGame} onValueChange={setSelectedGame}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a game" />
              </SelectTrigger>
              <SelectContent>
                {games?.map((game) => (
                  <SelectItem key={game.id} value={game.name}>
                    {game.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
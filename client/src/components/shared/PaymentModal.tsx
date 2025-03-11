import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { GameStation, User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import PaymentForm from "./PaymentForm";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface PaymentModalProps {
  station: GameStation;
  onClose: () => void;
}

const AVAILABLE_GAMES = [
  "FC25",
  "Mortal Kombat",
  "GTA V",
  "GTA VI",
  "NBA 2K25",
  "NBA 2K26",
  "F1 24",
  "F1 25",
  "VR GAMING"
];

export default function PaymentModal({ station, onClose }: PaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [selectedGame, setSelectedGame] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch registered customers
  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: ["/api/users/customers"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/users/customers");
      return response;
    }
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

      if (!selectedCustomer) {
        toast({
          variant: "destructive",
          title: "Customer Required",
          description: "Please select a customer to start the session"
        });
        return;
      }

      setLoading(true);

      // Create transaction record
      await apiRequest("POST", "/api/transactions", {
        stationId: station.id,
        customerName: selectedCustomer.displayName,
        gameName: selectedGame,
        amount: paymentInfo.amount,
        sessionType: paymentInfo.sessionType || "hourly",
        duration: paymentInfo.duration || 60, // Default to 1 hour
        paymentStatus: "completed"
      });

      // Update the station with current session info
      await apiRequest("PATCH", `/api/stations/${station.id}`, {
        currentCustomer: selectedCustomer.displayName,
        currentGame: selectedGame,
        sessionType: paymentInfo.sessionType || "hourly",
        sessionStartTime: new Date().toISOString()
      });

      // Award loyalty points (10% of amount spent)
      if (selectedCustomer.id) {
        try {
          await apiRequest("POST", "/api/users/points/award", {
            userId: selectedCustomer.id,
            points: Math.round(paymentInfo.amount * 0.1)  // 10% of amount as points
          });
        } catch (error) {
          console.error("Failed to award loyalty points:", error);
        }
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/stations"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });

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
            <label className="text-sm font-medium">Select Customer</label>
            <Select
              value={selectedCustomer?.id?.toString()}
              onValueChange={(value) => {
                const customer = customers?.find((c: User) => c.id.toString() === value);
                setSelectedCustomer(customer || null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a customer" />
              </SelectTrigger>
              <SelectContent>
                {customers && customers.length > 0 ? (
                  customers.map((customer: User) => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.displayName} ({customer.gamingName})
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-customers" disabled>
                    {customersLoading ? "Loading customers..." : "No customers found"}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Select Game</label>
            <Select
              value={selectedGame}
              onValueChange={setSelectedGame}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a game" />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_GAMES.map((game) => (
                  <SelectItem key={game} value={game}>
                    {game}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCustomer && selectedGame && (
            <PaymentForm
              amount={station.hourlyRate || station.baseRate || 0}
              customerName={selectedCustomer.displayName}
              userId={selectedCustomer.id}
              onComplete={handlePayment}
              onCancel={onClose}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
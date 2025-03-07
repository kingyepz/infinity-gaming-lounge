import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { initiateMpesaPayment, checkPaymentStatus } from "@/lib/mpesa";
import type { Game } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface PaymentModalProps {
  game: Game;
  onClose: () => void;
}

export default function PaymentModal({ game, onClose }: PaymentModalProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [duration, setDuration] = useState(1); // hours
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const amount = game.hourlyRate * duration;

  const handlePayment = async () => {
    try {
      setLoading(true);

      // Create transaction first
      const transaction = await apiRequest("POST", "/api/transactions", {
        gameId: game.id,
        amount,
        duration: duration * 60 // convert to minutes
      });

      // Initiate M-Pesa payment
      await initiateMpesaPayment({
        phoneNumber,
        amount,
        transactionId: transaction.id
      });

      // Poll for payment status
      const checkStatus = async () => {
        const status = await checkPaymentStatus(transaction.id);
        if (status.status === "completed") {
          toast({
            title: "Payment Successful",
            description: "Your gaming session has started!"
          });
          onClose();
        } else if (status.status === "failed") {
          toast({
            variant: "destructive",
            title: "Payment Failed",
            description: "Please try again"
          });
        } else {
          // Keep polling
          setTimeout(checkStatus, 5000);
        }
      };

      checkStatus();

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Payment Failed",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pay for Gaming Session</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label>Duration (hours)</label>
            <Input
              type="number"
              min={1}
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <label>M-Pesa Phone Number</label>
            <Input
              type="tel"
              placeholder="254700000000"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>

          <div className="pt-4">
            <p className="text-lg font-semibold">
              Total Amount: KSH {amount}
            </p>
            <p className="text-sm text-muted-foreground">
              You'll earn {Math.floor(amount / 100)} loyalty points
            </p>
          </div>

          <Button
            className="w-full"
            onClick={handlePayment}
            disabled={loading || !phoneNumber || duration < 1}
          >
            {loading ? "Processing..." : "Pay with M-Pesa"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import React, { useState } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import PaymentForm from "./PaymentForm";
import ReceiptGenerator from "./ReceiptGenerator";
import { PaymentFormData, PaymentResult } from "@/lib/payment";
import type { GameStation } from "@shared/schema";

interface PaymentModalProps {
  station: GameStation;
  onClose: () => void;
}

export default function PaymentModal({ station, onClose }: PaymentModalProps) {
  const [activeTab, setActiveTab] = useState<string>("form");
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);

  // Build the initial payment data from the station details
  const initialPaymentData: PaymentFormData = {
    customerName: station.currentCustomer || "",
    stationId: station.id,
    amount: station.sessionType === "per_game" ? station.baseRate : 
           (station.sessionStartTime ? 
            Math.ceil((Date.now() - new Date(station.sessionStartTime).getTime()) / (1000 * 60 * 60)) * station.hourlyRate : 
            station.hourlyRate),
    paymentMethod: "cash",
    sessionType: station.sessionType || "per_game",
    duration: station.sessionStartTime ? 
              Math.ceil((Date.now() - new Date(station.sessionStartTime).getTime()) / (1000 * 60)) : 
              null,
    gameName: station.currentGame || "Unknown Game"
  };

  const handlePaymentSuccess = (result: PaymentResult) => {
    setPaymentResult(result);
    setActiveTab("receipt");
  };

  return (
    <Dialog open={true} onOpenChange={value => !value && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="form">Payment</TabsTrigger>
            <TabsTrigger value="receipt" disabled={!paymentResult}>Receipt</TabsTrigger>
          </TabsList>
          
          <TabsContent value="form" className="pt-4">
            <PaymentForm 
              initialData={initialPaymentData}
              onSuccess={handlePaymentSuccess}
              onCancel={onClose}
            />
          </TabsContent>
          
          <TabsContent value="receipt" className="pt-4">
            {paymentResult && (
              <ReceiptGenerator 
                paymentResult={paymentResult} 
                onClose={onClose} 
              />
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

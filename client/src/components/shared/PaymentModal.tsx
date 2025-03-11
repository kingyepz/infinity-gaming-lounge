
import { useState, useEffect } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Banknote, SmartphoneIcon, CheckCircle, XCircle } from "lucide-react";

type PaymentMethod = "cash" | "mpesa" | "airtel";

type PaymentStatus = "idle" | "processing" | "completed" | "failed";

interface PaymentModalProps {
  station: any;
  onClose: () => void;
  onPaymentComplete: () => void;
}

export default function PaymentModal({
  station,
  onClose,
  onPaymentComplete,
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [mpesaPhoneNumber, setMpesaPhoneNumber] = useState("");
  const [airtelPhoneNumber, setAirtelPhoneNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [mpesaStatus, setMpesaStatus] = useState<PaymentStatus>("idle");
  const [airtelStatus, setAirtelStatus] = useState<PaymentStatus>("idle");
  const { toast } = useToast();

  // Calculate duration if session is active
  const duration = station.sessionStartTime
    ? Math.ceil(
        (Date.now() - new Date(station.sessionStartTime).getTime()) / (1000 * 60)
      ) // minutes
    : 0;

  // Calculate amount based on session type
  const amount = station.sessionType === "per_game"
    ? station.baseRate
    : Math.ceil(duration / 60) * station.hourlyRate;

  const handlePayment = async () => {
    try {
      setIsProcessing(true);

      // Create a transaction record
      const transactionResponse = await axios.post("/api/transactions", {
        stationId: station.id,
        customerName: station.currentCustomer || "Walk-in Customer",
        gameName: station.currentGame || "Unknown Game",
        sessionType: station.sessionType,
        amount: String(amount),
        duration: station.sessionType === "hourly" ? duration : null
      });

      const transactionId = transactionResponse.data[0]?.id;

      if (!transactionId) {
        throw new Error("Failed to create transaction record");
      }

      if (paymentMethod === "cash") {
        // Process cash payment
        await axios.post("/api/payments/cash", {
          transactionId,
          amount
        });

        toast({
          title: "Payment Successful",
          description: "Cash payment processed successfully."
        });
        onPaymentComplete();
        onClose();
      } else if (paymentMethod === "mpesa") {
        if (!mpesaPhoneNumber) {
          setIsProcessing(false);
          toast({
            title: "Phone Number Required",
            description: "Please enter a phone number for M-Pesa payment.",
            variant: "destructive"
          });
          return;
        }

        setMpesaStatus("processing");

        // Process M-Pesa payment
        const mpesaResponse = await axios.post("/api/payments/mpesa", {
          phoneNumber: mpesaPhoneNumber,
          amount,
          transactionId
        });

        if (mpesaResponse.data.success) {
          // Start polling for payment status
          startPollingMpesaStatus(mpesaResponse.data.checkoutRequestId);
          toast({
            title: "M-Pesa Request Sent",
            description: "Please check your phone to complete the payment."
          });
        } else {
          setMpesaStatus("failed");
          setIsProcessing(false);
          toast({
            title: "Payment Failed",
            description: mpesaResponse.data.error || "Failed to initiate M-Pesa payment.",
            variant: "destructive"
          });
        }
      } else if (paymentMethod === "airtel") {
        if (!airtelPhoneNumber) {
          setIsProcessing(false);
          toast({
            title: "Phone Number Required",
            description: "Please enter a phone number for Airtel Money payment.",
            variant: "destructive"
          });
          return;
        }

        setAirtelStatus("processing");

        // Process Airtel Money payment
        const airtelResponse = await axios.post("/api/payments/airtel", {
          phoneNumber: airtelPhoneNumber,
          amount,
          transactionId,
          reference: `TXN-${transactionId}`
        });

        if (airtelResponse.data.success) {
          // Start polling for payment status
          startPollingAirtelStatus(airtelResponse.data.reference);
          toast({
            title: "Airtel Money Request Sent",
            description: "Please check your phone to complete the payment."
          });
        } else {
          setAirtelStatus("failed");
          setIsProcessing(false);
          toast({
            title: "Payment Failed",
            description: airtelResponse.data.error || "Failed to initiate Airtel Money payment.",
            variant: "destructive"
          });
        }
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      setIsProcessing(false);
      setMpesaStatus("idle");
      setAirtelStatus("idle");
      toast({
        title: "Payment Error",
        description: error.message || "An error occurred during payment processing.",
        variant: "destructive"
      });
    }
  };

  const startPollingMpesaStatus = (checkoutRequestId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await axios.get(`/api/payments/mpesa/status/${checkoutRequestId}`);

        if (response.data.status === "COMPLETED") {
          clearInterval(pollInterval);
          setMpesaStatus("completed");
          toast({
            title: "Payment Successful",
            description: "M-Pesa payment completed successfully."
          });
          onPaymentComplete();
          onClose();
        } else if (response.data.status === "FAILED") {
          clearInterval(pollInterval);
          setMpesaStatus("failed");
          setIsProcessing(false);
          toast({
            title: "Payment Failed",
            description: response.data.message || "M-Pesa payment failed.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error checking M-Pesa status:", error);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  };

  const startPollingAirtelStatus = (referenceId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await axios.get(`/api/payments/airtel/status/${referenceId}`);

        if (response.data.transactionStatus === "SUCCESS") {
          clearInterval(pollInterval);
          setAirtelStatus("completed");
          toast({
            title: "Payment Successful",
            description: "Airtel Money payment completed successfully."
          });
          onPaymentComplete();
          onClose();
        } else if (response.data.transactionStatus === "FAILED") {
          clearInterval(pollInterval);
          setAirtelStatus("failed");
          setIsProcessing(false);
          toast({
            title: "Payment Failed",
            description: response.data.message || "Airtel Money payment failed.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error checking Airtel status:", error);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
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
              Rate: KSH {station.sessionType === "per_game" ? `${station.baseRate} per game` : `${station.hourlyRate} per hour`}
            </p>
          </div>
          <Tabs defaultValue="cash" className="w-full" onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="cash">Cash</TabsTrigger>
              <TabsTrigger value="mpesa">M-Pesa</TabsTrigger>
              <TabsTrigger value="airtel">Airtel Money</TabsTrigger>
            </TabsList>
            <TabsContent value="cash" className="mt-4">
              {/* Cash Payment UI */}
              <div className="space-y-4">
                <div className="rounded-md border p-4 flex flex-col items-center">
                  <Banknote className="h-12 w-12 text-primary mb-2" />
                  <p className="text-center mb-2">Collect cash payment of <strong>KSH {amount}</strong></p>
                  <Button 
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className="w-full"
                  >
                    {isProcessing ? "Processing..." : "Confirm Cash Payment"}
                  </Button>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="mpesa" className="mt-4">
              {/* M-Pesa Payment UI */}
              <div className="space-y-4">
                {mpesaStatus === "idle" && (
                  <div className="rounded-md border p-4">
                    <div className="flex items-center justify-center mb-4">
                      <SmartphoneIcon className="h-12 w-12 text-green-500" />
                    </div>
                    <p className="text-center mb-4">Enter customer's M-Pesa phone number to initiate payment of <strong>KSH {amount}</strong></p>
                    <Input
                      type="tel"
                      placeholder="Phone Number (e.g. 0712345678)"
                      value={mpesaPhoneNumber}
                      onChange={(e) => setMpesaPhoneNumber(e.target.value)}
                      className="mb-4"
                    />
                    <Button 
                      onClick={handlePayment}
                      disabled={isProcessing}
                      className="w-full"
                    >
                      {isProcessing ? "Processing..." : "Send M-Pesa Request"}
                    </Button>
                  </div>
                )}
                {mpesaStatus === "processing" && (
                  <div className="rounded-md border p-4 flex flex-col items-center">
                    <div className="animate-pulse">
                      <SmartphoneIcon className="h-12 w-12 text-green-500" />
                    </div>
                    <p className="text-center my-4">M-Pesa payment is being processed...</p>
                    <p className="text-center text-sm">Customer should receive a prompt on their phone. Please wait for confirmation.</p>
                  </div>
                )}
                {mpesaStatus === "completed" && (
                  <div className="rounded-md border p-4 flex flex-col items-center">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p className="font-semibold mb-2">Payment Successful</p>
                    <p className="text-sm mb-4">The M-Pesa payment has been processed successfully.</p>
                  </div>
                )}
                {mpesaStatus === "failed" && (
                  <div className="rounded-md border p-4 flex flex-col items-center">
                    <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                    <p className="font-semibold mb-2">Payment Failed</p>
                    <p className="text-sm mb-4">The M-Pesa payment could not be processed.</p>
                    <Button onClick={() => setMpesaStatus("idle")} variant="outline">Try Again</Button>
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="airtel" className="mt-4">
              {/* Airtel Money Payment UI */}
              <div className="space-y-4">
                {airtelStatus === "idle" && (
                  <div className="rounded-md border p-4">
                    <div className="flex items-center justify-center mb-4">
                      <SmartphoneIcon className="h-12 w-12 text-orange-500" />
                    </div>
                    <p className="text-center mb-4">Enter customer's Airtel Money phone number to initiate payment of <strong>KSH {amount}</strong></p>
                    <Input
                      type="tel"
                      placeholder="Phone Number (e.g. 0733123456)"
                      value={airtelPhoneNumber}
                      onChange={(e) => setAirtelPhoneNumber(e.target.value)}
                      className="mb-4"
                    />
                    <Button 
                      onClick={handlePayment}
                      disabled={isProcessing}
                      className="w-full"
                    >
                      {isProcessing ? "Processing..." : "Send Airtel Money Request"}
                    </Button>
                  </div>
                )}
                {airtelStatus === "processing" && (
                  <div className="rounded-md border p-4 flex flex-col items-center">
                    <div className="animate-pulse">
                      <SmartphoneIcon className="h-12 w-12 text-orange-500" />
                    </div>
                    <p className="text-center my-4">Airtel Money payment is being processed...</p>
                    <p className="text-center text-sm">Customer should receive a prompt on their phone. Please wait for confirmation.</p>
                  </div>
                )}
                {airtelStatus === "completed" && (
                  <div className="rounded-md border p-4 flex flex-col items-center">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p className="font-semibold mb-2">Payment Successful</p>
                    <p className="text-sm mb-4">The Airtel Money payment has been processed successfully.</p>
                  </div>
                )}
                {airtelStatus === "failed" && (
                  <div className="rounded-md border p-4 flex flex-col items-center">
                    <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                    <p className="font-semibold mb-2">Payment Failed</p>
                    <p className="text-sm mb-4">The Airtel Money payment could not be processed.</p>
                    <Button onClick={() => setAirtelStatus("idle")} variant="outline">Try Again</Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

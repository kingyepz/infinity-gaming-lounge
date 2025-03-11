import { useState } from "react";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Banknote, Check, CheckCircle, CreditCard, Loader, SmartphoneIcon, X, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PaymentMethod } from "@/lib/payment";

interface PaymentModalProps {
  amount: number;
  station: any;
  duration?: number; // Added duration for hourly rate calculation.  May need adjustment
  onSuccess: () => Promise<void>;
  onClose: () => void;
}

export function PaymentModal({ station,  amount, duration = 0, onSuccess, onClose }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [mpesaPhoneNumber, setMpesaPhoneNumber] = useState("");
  const [airtelPhoneNumber, setAirtelPhoneNumber] = useState("");
  const [mpesaStatus, setMpesaStatus] = useState<"idle" | "pending" | "completed" | "failed">("idle");
  const [airtelStatus, setAirtelStatus] = useState<"idle" | "pending" | "completed" | "failed">("idle");
  const [mpesaRequestId, setMpesaRequestId] = useState("");
  const [airtelRequestId, setAirtelRequestId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

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

        if (response.data.status === "COMPLETED" || response.data.transactionStatus === "TS") {
          clearInterval(pollInterval);
          setAirtelStatus("completed");
          toast({
            title: "Payment Successful",
            description: "Airtel Money payment completed successfully."
          });
          onPaymentComplete();
          onClose();
        } else if (response.data.status === "FAILED" || response.data.transactionStatus === "TF") {
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
        console.error("Error checking Airtel Money status:", error);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  };

  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      // Calculate amount and ensure it's a string
      const calculatedAmount = station.sessionType === "per_game" 
        ? station.baseRate 
        : Math.ceil(duration / 60) * station.hourlyRate;
      const amount = String(calculatedAmount);

      if (paymentMethod === "cash") {
        const response = await axios.post('/api/transactions/payment', {
          stationId: station.id,
          amount,
          paymentMethod: "cash"
        });

        if (response.data.success) {
          toast({
            title: "Payment Successful",
            description: "Cash payment recorded successfully."
          });
          await onSuccess();
          onClose();
        } else {
          throw new Error(response.data.error || "Failed to process cash payment");
        }
      } else if (paymentMethod === "mpesa") {
        const phoneNumber = mpesaPhoneNumber.startsWith("0") 
          ? `254${mpesaPhoneNumber.substring(1)}`
          : mpesaPhoneNumber;

        const response = await axios.post('/api/payments/mpesa', {
          phoneNumber,
          amount: parseInt(amount), 
          transactionId: station.id
        });

        if (response.data.success) {
          setMpesaRequestId(response.data.checkoutRequestId);
          setMpesaStatus("pending");
          startPollingMpesaStatus(response.data.checkoutRequestId);
        } else {
          throw new Error(response.data.error || "Failed to initiate M-Pesa payment");
        }
      } else if (paymentMethod === "airtel") {
        const phoneNumber = airtelPhoneNumber.startsWith("0") 
          ? `254${airtelPhoneNumber.substring(1)}`
          : airtelPhoneNumber;

        const response = await axios.post('/api/payments/airtel', {
          phoneNumber,
          amount: parseInt(amount),
          transactionId: station.id,
          reference: `INF-${station.id}-${Date.now()}`,
          transactionDesc: `Payment for station ${station.name}`
        });

        if (response.data.success) {
          setAirtelRequestId(response.data.reference);
          setAirtelStatus("pending");
          startPollingAirtelStatus(response.data.reference);
        } else {
          throw new Error(response.data.error || "Failed to initiate Airtel Money payment");
        }
      }
      setIsProcessing(false);
    } catch (error) {
      console.error("Payment processing error:", error);
      toast({
        title: "Payment Failed",
        description: error.message || "There was a problem processing your payment.",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

  const onPaymentComplete = async () => {
    await onSuccess();
    onClose();
  }


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
                  <p className="text-center mb-2">Collect cash payment of <strong>KSH {station.sessionType === "per_game" ? station.baseRate : Math.ceil(duration / 60) * station.hourlyRate}</strong></p>
                  <Button onClick={handlePayment} disabled={isProcessing} className="w-full">
                    {isProcessing ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                    Confirm Cash Payment
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
                      <CreditCard className="h-12 w-12 text-primary" />
                    </div>
                    <p className="text-center mb-4">Enter customer's M-Pesa phone number to initiate payment of <strong>KSH {station.sessionType === "per_game" ? station.baseRate : Math.ceil(duration / 60) * station.hourlyRate}</strong></p>
                    <Input
                      type="tel"
                      placeholder="Phone Number (e.g. 0712345678)"
                      value={mpesaPhoneNumber}
                      onChange={(e) => setMpesaPhoneNumber(e.target.value)}
                      className="mb-4"
                    />
                    <Button 
                      onClick={handlePayment}
                      disabled={!mpesaPhoneNumber || isProcessing}
                      className="w-full"
                    >
                      {isProcessing ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Initiate M-Pesa Payment
                    </Button>
                  </div>
                )}
                {/* M-Pesa Status Display */}
                {mpesaStatus !== "idle" && (
                  <div className="rounded-md border p-4 text-center">
                    {mpesaStatus === "pending" && (
                      <>
                        <Loader className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                        <p className="font-semibold mb-2">Processing M-Pesa Payment</p>
                        <p className="text-sm mb-4">The customer should receive an STK push to complete the payment.</p>
                        <p className="text-xs text-muted-foreground">Request ID: {mpesaRequestId}</p>
                      </>
                    )}
                    {mpesaStatus === "completed" && (
                      <>
                        <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                        <p className="font-semibold mb-2">Payment Successful!</p>
                        <p className="text-sm">The M-Pesa payment has been completed successfully.</p>
                      </>
                    )}
                    {mpesaStatus === "failed" && (
                      <>
                        <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                        <p className="font-semibold mb-2">Payment Failed</p>
                        <p className="text-sm mb-4">The M-Pesa payment could not be processed.</p>
                        <Button onClick={() => setMpesaStatus("idle")} variant="outline">Try Again</Button>
                      </>
                    )}
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
                    <p className="text-center mb-4">Enter customer's Airtel Money phone number to initiate payment of <strong>KSH {station.sessionType === "per_game" ? station.baseRate : Math.ceil(duration / 60) * station.hourlyRate}</strong></p>
                    <Input
                      type="tel"
                      placeholder="Phone Number (e.g. 0733123456)"
                      value={airtelPhoneNumber}
                      onChange={(e) => setAirtelPhoneNumber(e.target.value)}
                      className="mb-4"
                    />
                    <Button 
                      onClick={handlePayment}
                      disabled={!airtelPhoneNumber || isProcessing}
                      className="w-full"
                    >
                      {isProcessing ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Initiate Airtel Money Payment
                    </Button>
                  </div>
                )}
                {/* Airtel Money Status Display */}
                {airtelStatus !== "idle" && (
                  <div className="rounded-md border p-4 text-center">
                    {airtelStatus === "pending" && (
                      <>
                        <Loader className="h-12 w-12 animate-spin mx-auto mb-4 text-orange-500" />
                        <p className="font-semibold mb-2">Processing Airtel Money Payment</p>
                        <p className="text-sm mb-4">The customer should receive a prompt to complete the payment.</p>
                        <p className="text-xs text-muted-foreground">Reference ID: {airtelRequestId}</p>
                      </>
                    )}
                    {airtelStatus === "completed" && (
                      <>
                        <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                        <p className="font-semibold mb-2">Payment Successful!</p>
                        <p className="text-sm">The Airtel Money payment has been completed successfully.</p>
                      </>
                    )}
                    {airtelStatus === "failed" && (
                      <>
                        <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                        <p className="font-semibold mb-2">Payment Failed</p>
                        <p className="text-sm mb-4">The Airtel Money payment could not be processed.</p>
                        <Button onClick={() => setAirtelStatus("idle")} variant="outline">Try Again</Button>
                      </>
                    )}
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
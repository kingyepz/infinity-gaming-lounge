import { useState, useEffect } from "react";
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
import { Banknote, SmartphoneIcon, CheckCircle, XCircle, QrCodeIcon, Receipt } from "lucide-react";
import QRCodePayment from "./QRCodePayment";
import SplitPaymentModal from './SplitPaymentModal';
import ReceiptGenerator from './ReceiptGenerator';

type PaymentMethod = "cash" | "mpesa" | "airtel" | "qrcode" | "qr-mpesa" | "qr-airtel";

type PaymentStatus = "idle" | "processing" | "completed" | "failed";

interface PaymentModalProps {
  station: any;
  onClose: () => void;
  onPaymentComplete: () => void;
  userId?: number; // Add optional user ID for loyalty points
}

export default function PaymentModal({
  station,
  onClose,
  onPaymentComplete,
  userId,
}: PaymentModalProps) {
  console.log("PaymentModal userId:", userId); // Log userId to verify it's being passed
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [mpesaPhoneNumber, setMpesaPhoneNumber] = useState("");
  const [airtelPhoneNumber, setAirtelPhoneNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [mpesaStatus, setMpesaStatus] = useState<PaymentStatus>("idle");
  const [airtelStatus, setAirtelStatus] = useState<PaymentStatus>("idle");
  const [showSplitPayment, setShowSplitPayment] = useState(false); // State for split payment modal
  const [mpesaRef, setMpesaRef] = useState<string | null>(null); // Track M-Pesa transaction reference
  const [airtelRef, setAirtelRef] = useState<string | null>(null); // Track Airtel Money transaction reference
  const { toast } = useToast();
  
  // Helper function to reset the station status after payment
  const resetStationStatus = async (paymentSource: string) => {
    try {
      console.log(`Resetting station after ${paymentSource} payment:`, station.id);
      const { apiRequest } = await import("@/lib/queryClient");
      
      // Call API to update station status
      await apiRequest({
        method: "PATCH",
        path: `/api/stations/${station.id}`,
        data: {
          currentCustomer: null,
          currentGame: null,
          sessionType: null,
          sessionStartTime: null,
          status: "available"
        }
      });
      console.log(`Station ${station.id} reset successful after ${paymentSource} payment`);
    } catch (resetError) {
      console.error(`Error resetting station after ${paymentSource} payment:`, resetError);
    }
  };

  // Calculate duration if session is active (in minutes)
  const duration = station.sessionStartTime
    ? Math.ceil(
        (Date.now() - new Date(station.sessionStartTime).getTime()) / (1000 * 60)
      ) // minutes
    : 0;

  // Calculate amount based on session type with safe fallbacks
  const amount = station.sessionType === "per_game"
    ? (station.baseRate || 40) // Default to 40 KES if baseRate is missing
    : Math.ceil(duration / 60) * (station.hourlyRate || 200); // Default to 200 KES/hour if hourlyRate is missing

  const handlePayment = async () => {
    try {
      setIsProcessing(true);

      // Create a transaction record
      const { createTransaction } = await import("@/lib/payment");
      const transactionData = {
        stationId: station.id,
        customerName: station.currentCustomer || "Walk-in Customer",
        gameName: station.currentGame || "Unknown Game",
        sessionType: station.sessionType || "per_game", // Ensure sessionType is never null
        amount: String(amount),
        duration: station.sessionType === "hourly" ? duration : null
      };

      console.log("Creating transaction with data:", transactionData);
      const txResult = await createTransaction(transactionData);
      console.log("Transaction creation result:", txResult);

      // Enhanced error handling for transaction creation failures
      if (!txResult.success) {
        setIsProcessing(false);
        toast({
          title: "Transaction Error",
          description: txResult.error || "Failed to create transaction record. Please try again.",
          variant: "destructive"
        });
        return;
      }

      if (!txResult.transactionId) {
        setIsProcessing(false);
        toast({
          title: "System Error",
          description: "Transaction was created but no ID was returned. Please try again.",
          variant: "destructive"
        });
        return;
      }

      const transactionId = txResult.transactionId;

      if (paymentMethod === "cash") {
        try {
          // Process cash payment
          const { processCashPayment } = await import("@/lib/payment");
          console.log("Processing cash payment for transaction:", transactionId, "amount:", amount, "userId:", userId);
          const result = await processCashPayment(transactionId, amount, userId);
          console.log("Cash payment result:", result);

          if (result.success) {
            // Reset the station status after cash payment
            await resetStationStatus("Cash");
            
            toast({
              title: "Payment Successful",
              description: "Cash payment processed successfully.",
              variant: "default"
            });
            onPaymentComplete();
            onClose();
          } else {
            setIsProcessing(false);
            toast({
              title: "Payment Failed",
              description: result.error || "Failed to process cash payment. Please try again.",
              variant: "destructive"
            });
          }
        } catch (error) {
          console.error("Cash payment error:", error);
          setIsProcessing(false);
          toast({
            title: "Payment Error",
            description: error instanceof Error ? error.message : "An unexpected error occurred processing the cash payment.",
            variant: "destructive"
          });
        }
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
        const { initiateMpesaPayment } = await import("@/lib/payment");
        const mpesaResponse = await initiateMpesaPayment(mpesaPhoneNumber, amount, transactionId, userId);

        if (mpesaResponse.success && mpesaResponse.checkoutRequestId) {
          // Start polling for payment status
          startPollingMpesaStatus(mpesaResponse.checkoutRequestId);
          
          // Store reference for later use
          if (mpesaResponse.merchantRequestId) {
            setMpesaRef(mpesaResponse.merchantRequestId);
          }
          
          toast({
            title: "M-Pesa Request Sent",
            description: "Please check your phone to complete the payment."
          });
        } else {
          setMpesaStatus("failed");
          setIsProcessing(false);
          toast({
            title: "Payment Failed",
            description: mpesaResponse.error || "Failed to initiate M-Pesa payment.",
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
        const { initiateAirtelPayment } = await import("@/lib/payment");
        const airtelResponse = await initiateAirtelPayment(airtelPhoneNumber, amount, transactionId, userId);

        if (airtelResponse.success && airtelResponse.reference) {
          // Start polling for payment status
          startPollingAirtelStatus(airtelResponse.reference);
          
          // Store reference for later use
          setAirtelRef(airtelResponse.reference);
          
          toast({
            title: "Airtel Money Request Sent",
            description: "Please check your phone to complete the payment."
          });
        } else {
          setAirtelStatus("failed");
          setIsProcessing(false);
          toast({
            title: "Payment Failed",
            description: airtelResponse.error || "Failed to initiate Airtel Money payment.",
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
        const { checkMpesaPaymentStatus } = await import("@/lib/payment");
        const response = await checkMpesaPaymentStatus(checkoutRequestId);

        if (response.status === "COMPLETED") {
          clearInterval(pollInterval);
          setMpesaStatus("completed");
          
          // Reset the station status after payment is complete
          await resetStationStatus("M-Pesa");
          
          toast({
            title: "Payment Successful",
            description: "M-Pesa payment completed successfully."
          });
          
          onPaymentComplete();
          onClose();
        } else if (response.status === "FAILED") {
          clearInterval(pollInterval);
          setMpesaStatus("failed");
          setIsProcessing(false);
          toast({
            title: "Payment Failed",
            description: response.message || "M-Pesa payment failed.",
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
        const { checkAirtelPaymentStatus } = await import("@/lib/payment");
        const response = await checkAirtelPaymentStatus(referenceId);

        if (response.transactionStatus === "SUCCESS") {
          clearInterval(pollInterval);
          setAirtelStatus("completed");
          
          // Reset the station status after payment is complete
          await resetStationStatus("Airtel");
          
          toast({
            title: "Payment Successful",
            description: "Airtel Money payment completed successfully."
          });
          onPaymentComplete();
          onClose();
        } else if (response.transactionStatus === "FAILED") {
          clearInterval(pollInterval);
          setAirtelStatus("failed");
          setIsProcessing(false);
          toast({
            title: "Payment Failed",
            description: response.message || "Airtel Money payment failed.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error checking Airtel status:", error);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  };

  const handleOpenSplitPayment = () => {
    setShowSplitPayment(true);
    onClose(); // Close the main payment modal
  };

  const handleSplitPaymentClose = () => {
    setShowSplitPayment(false);
  };


  return (
    <>
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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="cash">Cash</TabsTrigger>
              <TabsTrigger value="mpesa">M-Pesa</TabsTrigger>
              <TabsTrigger value="airtel">Airtel</TabsTrigger>
              <TabsTrigger value="qrcode">QR Code</TabsTrigger>
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
                    <p className="text-center mb-4">Enter customer's M-Pesa phone number to initiate payment of <strong>KES {amount}</strong></p>
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
                    {mpesaRef && (
                      <p className="text-xs text-gray-500 bg-gray-100 p-2 rounded w-full text-center mb-4">
                        Transaction Reference: <span className="font-mono">{mpesaRef}</span>
                      </p>
                    )}
                    <div className="w-full mt-2">
                      <p className="text-sm font-medium mb-2 text-center">Receipt Options:</p>
                      <ReceiptGenerator
                        transactionId={parseInt(station.lastTransactionId || "0")}
                        customerName={station.currentCustomer || "Walk-in Customer"}
                        amount={amount}
                        paymentMethod="M-Pesa"
                        timestamp={new Date().toISOString()}
                      />
                    </div>
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
                    {airtelRef && (
                      <p className="text-xs text-gray-500 bg-gray-100 p-2 rounded w-full text-center mb-4">
                        Transaction Reference: <span className="font-mono">{airtelRef}</span>
                      </p>
                    )}
                    <div className="w-full mt-2">
                      <p className="text-sm font-medium mb-2 text-center">Receipt Options:</p>
                      <ReceiptGenerator
                        transactionId={parseInt(station.lastTransactionId || "0")}
                        customerName={station.currentCustomer || "Walk-in Customer"}
                        amount={amount}
                        paymentMethod="Airtel Money"
                        timestamp={new Date().toISOString()}
                      />
                    </div>
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

            <TabsContent value="qrcode" className="mt-4">
              {/* QR Code Payment UI */}
              <div className="space-y-4">
                <div className="border p-4 rounded-md">
                  <div className="flex items-center justify-center mb-4">
                    <QrCodeIcon className="h-12 w-12 text-primary mb-2" />
                  </div>
                  <p className="text-center mb-4">
                    Select your preferred payment method and scan the QR code
                  </p>

                  <div className="flex justify-center space-x-4 mb-4">
                    <Button
                      variant={paymentMethod === "qr-mpesa" ? "default" : "outline"}
                      onClick={() => {
                        setMpesaStatus("idle");
                        setPaymentMethod("qr-mpesa" as PaymentMethod);
                      }}
                      className="flex-1"
                    >
                      M-Pesa
                    </Button>
                    <Button
                      variant={paymentMethod === "qr-airtel" ? "default" : "outline"}
                      onClick={() => {
                        setAirtelStatus("idle");
                        setPaymentMethod("qr-airtel" as PaymentMethod);
                      }}
                      className="flex-1"
                    >
                      Airtel Money
                    </Button>
                  </div>

                  {paymentMethod === "qr-mpesa" && (
                    <div className="mt-4">
                      <QRCodePayment
                        amount={amount}
                        transactionId={0} // Will be set after creating transaction
                        paymentType="mpesa"
                        onCheckStatus={async () => {
                          try {
                            // Mock implementation - in real app would check status from server
                            return { status: "COMPLETED" };
                          } catch (error) {
                            console.error("Error checking payment status:", error);
                            return { status: "ERROR", message: "Failed to check payment status" };
                          }
                        }}
                        onComplete={async () => {
                          // Reset the station status after QR MPesa payment
                          await resetStationStatus("QR-MPesa");
                          
                          toast({
                            title: "Payment Successful",
                            description: "QR payment processed successfully."
                          });
                          onPaymentComplete();
                          onClose();
                        }}
                        onRetry={() => {
                          setMpesaStatus("idle");
                        }}
                      />
                    </div>
                  )}

                  {paymentMethod === "qr-airtel" && (
                    <div className="mt-4">
                      <QRCodePayment
                        amount={amount}
                        transactionId={0} // Will be set after creating transaction
                        paymentType="airtel"
                        onCheckStatus={async () => {
                          try {
                            // Mock implementation - in real app would check status from server
                            return { status: "COMPLETED" };
                          } catch (error) {
                            console.error("Error checking payment status:", error);
                            return { status: "ERROR", message: "Failed to check payment status" };
                          }
                        }}
                        onComplete={async () => {
                          // Reset the station status after QR Airtel payment
                          await resetStationStatus("QR-Airtel");
                          
                          toast({
                            title: "Payment Successful",
                            description: "QR payment processed successfully."
                          });
                          onPaymentComplete();
                          onClose();
                        }}
                        onRetry={() => {
                          setAirtelStatus("idle");
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <Button
            className="w-full"
            variant="secondary"
            onClick={handleOpenSplitPayment}
            disabled={isProcessing}
          >
            Split Payment
          </Button>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <SplitPaymentModal
        isOpen={showSplitPayment}
        onClose={handleSplitPaymentClose}
        transaction={station && {
          id: 0, // This will be set by the transaction creation process
          amount: amount,
          customerName: station.currentCustomer || "Walk-in Customer",
          gameName: station.currentGame || "Unknown Game",
          stationId: station.id
        }}
        onPaymentComplete={onPaymentComplete}
      />
    </>
  );
}
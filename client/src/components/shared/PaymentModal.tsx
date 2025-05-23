import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Banknote, SmartphoneIcon, CheckCircle, XCircle, QrCodeIcon, Loader2 } from "lucide-react";
import QRCodePayment from "./QRCodePayment";
import SplitPaymentModal from './SplitPaymentModal';
import ReceiptGenerator from './ReceiptGenerator';

type PaymentMethod = "cash" | "mpesa" | "qrcode" | "qr-mpesa";

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [mpesaStatus, setMpesaStatus] = useState<PaymentStatus>("idle");
  const [showSplitPayment, setShowSplitPayment] = useState(false); // State for split payment modal
  const [mpesaRef, setMpesaRef] = useState<string | null>(null); // Track M-Pesa transaction reference
  const [qrCodeData, setQrCodeData] = useState<string | null>(null); // QR Code data
  const [qrRequestId, setQrRequestId] = useState<string | null>(null); // QR request ID for status checking
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
            
            // Store reference to transaction details for receipt
            const cashTransactionId = result.transactionId || transactionId;
            
            // Show receipt options
            toast({
              title: "Payment Successful",
              description: "Cash payment processed successfully.",
              variant: "default",
              action: (
                <div className="mt-2">
                  <ReceiptGenerator
                    transactionId={parseInt(cashTransactionId.toString())}
                    customerName={station.currentCustomer || "Walk-in Customer"}
                    amount={amount}
                    paymentMethod="Cash"
                    timestamp={new Date().toISOString()}
                  />
                </div>
              )
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
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      setIsProcessing(false);
      setMpesaStatus("idle");
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



  const handleOpenSplitPayment = () => {
    setShowSplitPayment(true);
    onClose(); // Close the main payment modal
  };

  const handleSplitPaymentClose = () => {
    setShowSplitPayment(false);
  };
  
  // QR Code payment methods
  const handleGenerateQRCode = async (type: "mpesa") => {
    try {
      setIsProcessing(true);
      
      // Create transaction first
      const { createTransaction } = await import("@/lib/payment");
      const transactionData = {
        stationId: station.id,
        customerName: station.currentCustomer || "Walk-in Customer",
        gameName: station.currentGame || "Unknown Game",
        sessionType: station.sessionType || "per_game",
        amount: String(amount),
        duration: station.sessionType === "hourly" ? duration : null
      };
      
      console.log("Creating transaction for QR payment:", transactionData);
      const txResult = await createTransaction(transactionData);
      
      if (!txResult.success || !txResult.transactionId) {
        setIsProcessing(false);
        toast({
          title: "Transaction Error",
          description: txResult.error || "Failed to create transaction record for QR code payment",
          variant: "destructive"
        });
        return;
      }
      
      const transactionId = txResult.transactionId;
      
      // Generate QR code
      const { generateMpesaQRCode } = await import("@/lib/payment");
      const qrResult = await generateMpesaQRCode(amount, transactionId);
      
      if (qrResult.success && qrResult.qrCode) {
        setQrCodeData(qrResult.qrCode);
        setQrRequestId(qrResult.requestId || null);
        setIsProcessing(false);
      } else {
        toast({
          title: "QR Code Error",
          description: qrResult.error || "Failed to generate QR code",
          variant: "destructive"
        });
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Error generating QR code:", error);
      toast({
        title: "QR Code Error", 
        description: error instanceof Error ? error.message : "An unexpected error occurred", 
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };
  
  const handleCheckQRStatus = async () => {
    try {
      const stationTransactionId = parseInt(station.lastTransactionId || "0");
      if (!stationTransactionId) {
        return { status: "ERROR", message: "Transaction ID is missing" };
      }
      
      const { checkMpesaQRPaymentStatus } = await import("@/lib/payment");
      const result = await checkMpesaQRPaymentStatus(stationTransactionId);
      return result;
    } catch (error) {
      console.error("Error checking QR payment status:", error);
      return { 
        status: "ERROR", 
        message: error instanceof Error ? error.message : "Failed to check payment status" 
      };
    }
  };
  
  const handleQRPaymentComplete = async () => {
    try {
      // Reset the station status after QR payment
      await resetStationStatus("QR-MPesa");
      
      toast({
        title: "Payment Successful",
        description: "QR code payment processed successfully."
      });
      
      onPaymentComplete();
      onClose();
    } catch (error) {
      console.error("Error completing QR payment:", error);
    }
  };
  
  const handleQRRetry = () => {
    // Reset QR code data and status
    setQrCodeData(null);
    setQrRequestId(null);
    
    // Start over with new QR code generation
    if (paymentMethod === "qr-mpesa") {
      handleGenerateQRCode("mpesa");
    }
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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="cash">Cash</TabsTrigger>
              <TabsTrigger value="mpesa">M-Pesa</TabsTrigger>
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


            <TabsContent value="qrcode" className="mt-4">
              {/* QR Code Payment UI */}
              <div className="space-y-4">
                <div className="border p-4 rounded-md">
                  <div className="flex items-center justify-center mb-4">
                    <QrCodeIcon className="h-12 w-12 text-primary mb-2" />
                  </div>
                  <p className="text-center mb-4">
                    Select your preferred payment method and generate a QR code for payment
                  </p>

                  <div className="flex justify-center mb-4">
                    <Button
                      variant="default"
                      onClick={() => {
                        setPaymentMethod("qr-mpesa" as PaymentMethod);
                        // Reset QR code states
                        setQrCodeData(null);
                        setQrRequestId(null);
                      }}
                      className="flex-1"
                    >
                      M-Pesa QR Code
                    </Button>
                  </div>
                  
                  {!qrCodeData && paymentMethod === "qr-mpesa" && (
                    <div className="text-center p-4">
                      <Button 
                        onClick={() => handleGenerateQRCode("mpesa")}
                        disabled={isProcessing}
                        className="w-full"
                      >
                        {isProcessing ? 
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Generating QR Code...</span>
                          </div> : 
                          "Generate QR Code"
                        }
                      </Button>
                    </div>
                  )}

                  {qrCodeData && paymentMethod === "qr-mpesa" && (
                    <div className="mt-4">
                      <QRCodePayment
                        amount={amount}
                        transactionId={parseInt(station.lastTransactionId || "0")} 
                        paymentType="mpesa"
                        onCheckStatus={handleCheckQRStatus}
                        onComplete={handleQRPaymentComplete}
                        onRetry={handleQRRetry}
                      />
                    </div>
                  )}

                  {/* Airtel QR payment option removed */}
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
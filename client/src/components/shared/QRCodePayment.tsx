import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, RefreshCw } from "lucide-react";

interface QRCodePaymentProps {
  amount: number;
  transactionId: number;
  paymentType: "mpesa" | "airtel";
  onCheckStatus: () => Promise<{ status: string; message?: string }>;
  onComplete: () => void;
  onRetry: () => void;
}

export default function QRCodePayment({
  amount,
  transactionId,
  paymentType,
  onCheckStatus,
  onComplete,
  onRetry
}: QRCodePaymentProps) {
  const [status, setStatus] = useState<"pending" | "processing" | "completed" | "failed">("pending");
  const [isPolling, setIsPolling] = useState(false);
  
  // Generate QR code data
  const qrData = JSON.stringify({
    type: paymentType,
    amount: amount,
    transactionId: transactionId,
    merchantName: "Infinity Gaming Lounge",
    reference: `TX-${transactionId}`
  });
  
  // Colors based on payment type
  const colors = {
    mpesa: "#4CAF50", // Green for M-Pesa
    airtel: "#FF5722"  // Orange/Red for Airtel
  };

  // Start polling for payment status
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    
    if (status === "processing" && !isPolling) {
      setIsPolling(true);
      
      pollInterval = setInterval(async () => {
        try {
          const result = await onCheckStatus();
          
          if (result.status === "COMPLETED" || result.status === "SUCCESS") {
            clearInterval(pollInterval);
            setStatus("completed");
            setIsPolling(false);
            onComplete();
          } else if (result.status === "FAILED" || result.status === "ERROR") {
            clearInterval(pollInterval);
            setStatus("failed");
            setIsPolling(false);
          }
        } catch (error) {
          console.error("Error checking payment status:", error);
        }
      }, 5000);
    }
    
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [status, isPolling, onCheckStatus, onComplete]);
  
  const handleCheckStatus = async () => {
    setStatus("processing");
  };
  
  const handleRetry = () => {
    setStatus("pending");
    onRetry();
  };
  
  return (
    <Card className="p-4 bg-black/30 border-gray-800">
      <div className="flex flex-col items-center">
        {status === "pending" && (
          <>
            <div className="mb-4 py-2 px-4 bg-white rounded-lg">
              <QRCodeSVG
                value={qrData}
                size={200}
                level="H"
                includeMargin={true}
                fgColor="#000000"
                bgColor="#FFFFFF"
              />
            </div>
            <p className="text-center mb-2">
              Scan this QR code with your {paymentType === "mpesa" ? "M-Pesa" : "Airtel Money"} app
            </p>
            <p className="font-semibold text-center mb-4">
              Amount: KES {amount}
            </p>
            <div className="space-y-2 w-full">
              <Button 
                className="w-full" 
                onClick={handleCheckStatus}
                style={{ backgroundColor: colors[paymentType] }}
              >
                Check Payment Status
              </Button>
            </div>
          </>
        )}
        
        {status === "processing" && (
          <div className="flex flex-col items-center py-4">
            <div className="animate-spin mb-4">
              <RefreshCw size={48} color={colors[paymentType]} />
            </div>
            <p className="text-center mb-2 font-semibold">Checking payment status...</p>
            <p className="text-center text-sm mb-4">
              This may take a few moments. Please wait.
            </p>
          </div>
        )}
        
        {status === "completed" && (
          <div className="flex flex-col items-center py-4">
            <CheckCircle size={48} className="mb-4 text-green-500" />
            <p className="font-semibold text-center mb-2">Payment Successful!</p>
            <p className="text-center text-sm mb-4">
              Your payment of KES {amount} has been processed successfully.
            </p>
          </div>
        )}
        
        {status === "failed" && (
          <div className="flex flex-col items-center py-4">
            <XCircle size={48} className="mb-4 text-red-500" />
            <p className="font-semibold text-center mb-2">Payment Failed</p>
            <p className="text-center text-sm mb-4">
              We couldn't process your payment. Please try again.
            </p>
            <Button variant="outline" onClick={handleRetry}>
              Try Again
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
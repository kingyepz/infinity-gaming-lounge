import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, RefreshCw } from "lucide-react";

interface QRCodePaymentProps {
  amount: number;
  transactionId: number;
  paymentType: "mpesa";
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
  
  // M-Pesa QR code is provided by the API and displayed directly
  // We will fetch it in the useEffect hook
  const [qrCodeImage, setQrCodeImage] = useState<string>("");
  
  // M-Pesa brand color
  const mpesaColor = "#4CAF50"; // Green for M-Pesa

  // Fetch QR code on component mount and start polling for payment status
  useEffect(() => {
    // Function to initialize and fetch the QR code
    const initializeQRCode = async () => {
      try {
        // For the QR-M-Pesa payment method, we generate the QR code using the M-Pesa API
        const response = await fetch(`/api/mpesa/qrcode`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            amount,
            transactionId,
            referenceNumber: `TX-${transactionId}`
          })
        });
        
        const data = await response.json();
        
        if (data.success && data.QRCode) {
          // Set the QR code image received from the API
          setQrCodeImage(data.QRCode);
        } else {
          console.error("Failed to generate QR code:", data.error || "Unknown error");
          setStatus("failed");
        }
      } catch (error) {
        console.error("Error generating QR code:", error);
        setStatus("failed");
      }
    };
    
    // Initialize QR code when component mounts
    if (status === "pending" && !qrCodeImage) {
      initializeQRCode();
    }
    
    // Set up payment status polling
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
  }, [status, isPolling, onCheckStatus, onComplete, amount, transactionId, qrCodeImage]);
  
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
              {qrCodeImage ? (
                // If we have a QR code image from M-Pesa API, display it
                <img 
                  src={`data:image/png;base64,${qrCodeImage}`} 
                  alt="M-Pesa QR Code" 
                  width={200} 
                  height={200}
                />
              ) : (
                // Fallback to generated QR code if API fails
                <QRCodeSVG
                  value={`TX-${transactionId}-${amount}`}
                  size={200}
                  level="H"
                  includeMargin={true}
                  fgColor="#000000"
                  bgColor="#FFFFFF"
                />
              )}
            </div>
            <p className="text-center mb-2">
              Scan this QR code with your M-Pesa app
            </p>
            <p className="font-semibold text-center mb-2">
              Amount: KES {amount}
            </p>
            <div className="text-xs text-muted-foreground text-center mb-4">
              <p>📱 How to pay with M-Pesa:</p>
              <p>1. Open M-Pesa app and tap 'Scan QR'</p>
              <p>2. Point camera at the QR code</p>
              <p>3. Confirm payment amount</p>
              <p>4. Enter M-Pesa PIN when prompted</p>
            </div>
            <div className="space-y-2 w-full">
              <Button 
                className="w-full" 
                onClick={handleCheckStatus}
                style={{ backgroundColor: mpesaColor }}
              >
                Check Payment Status
              </Button>
            </div>
          </>
        )}
        
        {status === "processing" && (
          <div className="flex flex-col items-center py-4">
            <div className="animate-spin mb-4">
              <RefreshCw size={48} color={mpesaColor} />
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
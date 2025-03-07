import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { generateReceipt } from "@/lib/payment";

interface ReceiptGeneratorProps {
  transactionId: number;
  customerName: string;
  amount: number;
  paymentMethod: string;
  timestamp: string;
}

export default function ReceiptGenerator({
  transactionId,
  customerName,
  amount,
  paymentMethod,
  timestamp
}: ReceiptGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      const receiptBlob = await generateReceipt(transactionId);

      // Create a download link
      const url = URL.createObjectURL(receiptBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${transactionId}.pdf`;
      document.body.appendChild(a);
      a.click();

      // Clean up
      URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Receipt generated",
        description: "Your receipt has been downloaded"
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to generate receipt",
        description: error.message
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = async () => {
    try {
      setIsGenerating(true);
      const receiptBlob = await generateReceipt(transactionId);

      // Create object URL for printing
      const url = URL.createObjectURL(receiptBlob);

      // Create an iframe for printing
      const printFrame = document.createElement('iframe');
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = '0';

      printFrame.onload = () => {
        printFrame.contentWindow?.print();

        // Remove iframe after printing
        setTimeout(() => {
          document.body.removeChild(printFrame);
          URL.revokeObjectURL(url);
        }, 100);
      };

      printFrame.src = url;
      document.body.appendChild(printFrame);

      toast({
        title: "Receipt printed",
        description: "Your receipt has been sent to printer"
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to print receipt",
        description: error.message
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={handleGenerate}
        disabled={isGenerating}
      >
        Download Receipt
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={handlePrint}
        disabled={isGenerating}
      >
        Print Receipt
      </Button>
    </div>
  );
}
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PaymentResult } from '@/lib/payment';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useReactToPrint } from 'react-to-print';

interface ReceiptGeneratorProps {
  paymentResult: PaymentResult;
  onClose: () => void;
}

export default function ReceiptGenerator({
  paymentResult,
  onClose
}: ReceiptGeneratorProps) {
  const receiptRef = React.useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: `Receipt-${paymentResult.transactionId}`,
  });

  return (
    <div className="flex flex-col space-y-4">
      <Card className="border border-dashed p-6" ref={receiptRef}>
        <CardContent className="p-0">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold mb-1">Infinity Gaming Lounge</h2>
            <p className="text-sm text-gray-500">Official Receipt</p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Transaction ID:</span>
              <span>{paymentResult.transactionId}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="font-medium">Date:</span>
              <span>{formatDate(new Date(paymentResult.timestamp))}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="font-medium">Customer:</span>
              <span>{paymentResult.customerName}</span>
            </div>

            {paymentResult.phoneNumber && (
              <div className="flex justify-between text-sm">
                <span className="font-medium">Phone:</span>
                <span>{paymentResult.phoneNumber}</span>
              </div>
            )}

            {paymentResult.stationId && (
              <div className="flex justify-between text-sm">
                <span className="font-medium">Station:</span>
                <span>{paymentResult.stationId}</span>
              </div>
            )}

            {paymentResult.sessionType && (
              <div className="flex justify-between text-sm">
                <span className="font-medium">Session Type:</span>
                <span className="capitalize">{paymentResult.sessionType.replace('_', ' ')}</span>
              </div>
            )}

            {paymentResult.gameName && (
              <div className="flex justify-between text-sm">
                <span className="font-medium">Game:</span>
                <span>{paymentResult.gameName}</span>
              </div>
            )}

            {paymentResult.duration && (
              <div className="flex justify-between text-sm">
                <span className="font-medium">Duration:</span>
                <span>{paymentResult.duration} minutes</span>
              </div>
            )}

            <div className="flex justify-between text-sm">
              <span className="font-medium">Payment Method:</span>
              <span className="capitalize">{paymentResult.paymentMethod}</span>
            </div>

            {paymentResult.mpesaReceiptNumber && (
              <div className="flex justify-between text-sm">
                <span className="font-medium">M-Pesa Receipt:</span>
                <span>{paymentResult.mpesaReceiptNumber}</span>
              </div>
            )}

            <div className="pt-4 border-t border-dashed">
              <div className="flex justify-between font-bold">
                <span>Total Amount:</span>
                <span>{formatCurrency(paymentResult.amount)}</span>
              </div>
            </div>

            {paymentResult.pointsAwarded > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span className="font-medium">Points Awarded:</span>
                <span>+{paymentResult.pointsAwarded} points</span>
              </div>
            )}
          </div>

          <div className="mt-6 text-center text-xs text-gray-500">
            <p>Thank you for visiting Infinity Gaming Lounge!</p>
            <p>We appreciate your business.</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button onClick={handlePrint}>
          Print Receipt
        </Button>
      </div>
    </div>
  );
}
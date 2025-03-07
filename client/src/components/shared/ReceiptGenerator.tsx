
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { PaymentResult } from "@/lib/payment";
import { Printer, Download } from "lucide-react";

interface ReceiptGeneratorProps {
  paymentResult: PaymentResult;
  onClose: () => void;
}

export default function ReceiptGenerator({ paymentResult, onClose }: ReceiptGeneratorProps) {
  const { transaction, reference, pointsAwarded } = paymentResult;
  
  if (!transaction) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Receipt Unavailable</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Transaction details are not available.</p>
        </CardContent>
        <CardFooter>
          <Button onClick={onClose}>Close</Button>
        </CardFooter>
      </Card>
    );
  }
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleDownload = () => {
    // In a real implementation, this would generate a PDF
    alert("Receipt download functionality would be implemented here");
  };
  
  return (
    <Card className="w-full max-w-md" id="receipt-card">
      <CardHeader className="text-center border-b">
        <CardTitle className="text-xl">Infinity Gaming Lounge</CardTitle>
        <p className="text-sm text-muted-foreground">Receipt</p>
      </CardHeader>
      
      <CardContent className="space-y-4 pt-4">
        <div className="text-center mb-4">
          <p className="text-xs text-muted-foreground">{formatDate(transaction.timestamp)} at {formatTime(transaction.timestamp)}</p>
          <p className="text-xs font-medium">Ref: {reference}</p>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Customer:</span>
            <span className="font-medium">{transaction.customerName}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span>Station:</span>
            <span className="font-medium">Station {transaction.stationId}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span>Session Type:</span>
            <span className="font-medium">
              {transaction.sessionType === 'per_game' ? 'Per Game' : 'Hourly'}
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span>Payment Method:</span>
            <span className="font-medium capitalize">{transaction.paymentMethod}</span>
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Amount:</span>
            <span className="font-medium">{formatCurrency(transaction.amount)}</span>
          </div>
          
          {transaction.discountApplied && transaction.discountApplied > 0 && (
            <div className="flex justify-between text-green-500 text-sm">
              <span>Discount Applied:</span>
              <span>{transaction.discountApplied}%</span>
            </div>
          )}
          
          {pointsAwarded && pointsAwarded > 0 && (
            <div className="flex justify-between text-emerald-600 text-sm">
              <span>Points Earned:</span>
              <span>+{pointsAwarded} points</span>
            </div>
          )}
        </div>
        
        <Separator />
        
        <div className="flex justify-between font-bold">
          <span>Total Paid:</span>
          <span>{formatCurrency(transaction.amount)}</span>
        </div>
        
        <div className="text-center mt-6">
          <p className="text-xs">Thank you for choosing Infinity Gaming Lounge!</p>
          <p className="text-xs text-muted-foreground">www.infinitygaminglounge.com</p>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-2" />
          Print
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
        <Button size="sm" onClick={onClose}>Close</Button>
      </CardFooter>
    </Card>
  );
}

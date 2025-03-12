
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
    <div className="flex gap-1">
      <Button 
        size="sm" 
        variant="outline" 
        onClick={handleGenerate} 
        disabled={isGenerating}
        className="h-8 px-2 text-xs"
      >
        Download
      </Button>
      <Button 
        size="sm" 
        variant="outline" 
        onClick={handlePrint} 
        disabled={isGenerating}
        className="h-8 px-2 text-xs"
      >
        Print
      </Button>
    </div>
  );
}

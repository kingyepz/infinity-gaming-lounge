import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Printer, Download } from "lucide-react";

interface Transaction {
  id: number;
  customerName: string;
  amount: number;
  sessionType: 'per_game' | 'hourly';
  paymentMethod: string;
  timestamp: string;
  stationId: number;
  discountApplied?: number;
  pointsAwarded?: number;
}

interface PaymentResult {
  transaction: Transaction;
  reference: string;
  pointsAwarded: number;
}

interface ReceiptGeneratorProps {
  paymentResult: PaymentResult;
  onClose?: () => void;
}

export default function ReceiptGenerator({ paymentResult, onClose }: ReceiptGeneratorProps) {
  const { toast } = useToast();
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
    try {
      window.print();
      toast({
        title: "Print Started",
        description: "Your receipt is being sent to the printer"
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Print Failed",
        description: error.message
      });
    }
  };

  const handleDownload = async () => {
    try {
      // Create receipt content
      const receiptContent = [
        "=== INFINITY GAMING LOUNGE ===\n",
        `Date: ${new Date(transaction.timestamp).toLocaleDateString()}`,
        `Time: ${new Date(transaction.timestamp).toLocaleTimeString()}`,
        `Reference: ${reference}\n`,
        `Customer: ${transaction.customerName}`,
        `Station: ${transaction.stationId}`,
        `Session Type: ${transaction.sessionType === 'per_game' ? 'Per Game' : 'Hourly'}`,
        `Payment Method: ${transaction.paymentMethod}\n`,
        `Amount: ${formatCurrency(transaction.amount)}`,
        transaction.discountApplied ? `Discount: ${transaction.discountApplied}%` : '',
        `Points Earned: +${pointsAwarded}\n`,
        "Thank you for choosing Infinity Gaming Lounge!",
        "www.infinitygaminglounge.com"
      ].filter(Boolean).join('\n');

      // Create and download file
      const blob = new Blob([receiptContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${reference}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Receipt Downloaded",
        description: "Check your downloads folder"
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: error.message
      });
    }
  };

  return (
    <Card className="w-full max-w-md" id="receipt-card">
      <CardHeader className="text-center border-b">
        <CardTitle className="text-xl">Infinity Gaming Lounge</CardTitle>
        <p className="text-sm text-muted-foreground">Receipt</p>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        <div className="text-center mb-4">
          <p className="text-xs text-muted-foreground">
            {new Date(transaction.timestamp).toLocaleDateString()} at {new Date(transaction.timestamp).toLocaleTimeString()}
          </p>
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

          {pointsAwarded > 0 && (
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
        {onClose && <Button size="sm" onClick={onClose}>Close</Button>}
      </CardFooter>
    </Card>
  );
}
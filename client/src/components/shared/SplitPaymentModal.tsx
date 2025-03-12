
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest, formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "../ui/badge";

interface SplitPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: {
    id: number;
    amount: number;
    customerName: string;
    gameName: string;
    stationId: number;
  } | null;
  onPaymentComplete?: () => void;
}

export function SplitPaymentModal({ isOpen, onClose, transaction, onPaymentComplete }: SplitPaymentModalProps) {
  const { toast } = useToast();
  const [numPayers, setNumPayers] = useState<number>(2);
  const [processing, setProcessing] = useState<boolean>(false);
  const [completedPayments, setCompletedPayments] = useState<number>(0);

  // Calculate the split amount based on number of payers
  const splitAmount = transaction ? Math.ceil(Number(transaction.amount) / numPayers) : 0;
  const totalSplitAmount = splitAmount * numPayers;
  const difference = transaction ? totalSplitAmount - Number(transaction.amount) : 0;

  // Reset state when modal closes or changes transaction
  React.useEffect(() => {
    if (!isOpen) {
      setNumPayers(2);
      setCompletedPayments(0);
      setProcessing(false);
    }
  }, [isOpen, transaction]);

  const handlePayment = async (index: number, method: 'cash' | 'mpesa' | 'airtel') => {
    if (!transaction) return;
    
    setProcessing(true);
    
    try {
      // Create a payment record for this split
      const paymentData = {
        transactionId: transaction.id,
        amount: splitAmount,
        paymentMethod: method,
        splitPayment: true,
        splitIndex: index,
        splitTotal: numPayers
      };
      
      // Use different endpoints based on payment method
      const endpoint = `/api/payments/${method}`;
      
      const response = await apiRequest(endpoint, {
        method: 'POST',
        data: paymentData
      });
      
      if (response.success) {
        toast({
          title: "Payment Processed",
          description: `Split payment ${index + 1} of ${numPayers} processed successfully.`,
        });
        
        setCompletedPayments(prev => prev + 1);
        
        // If all payments completed, call the callback
        if (completedPayments + 1 >= numPayers) {
          if (onPaymentComplete) {
            onPaymentComplete();
          }
          
          // Close modal after 1 second to show all payments completed
          setTimeout(() => {
            onClose();
          }, 1000);
        }
      } else {
        toast({
          title: "Payment Failed",
          description: response.error || "Failed to process payment",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Split payment error:", error);
      toast({
        title: "Payment Error",
        description: "An error occurred during payment processing",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  if (!transaction) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Split Payment</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h3 className="font-medium">Transaction Details</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Game:</span>
              <span>{transaction.gameName}</span>
              <span className="text-muted-foreground">Customer:</span>
              <span>{transaction.customerName}</span>
              <span className="text-muted-foreground">Total Amount:</span>
              <span className="font-bold">{formatCurrency(transaction.amount)}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="numPayers" className="text-sm font-medium">
                Number of Payers:
              </label>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={numPayers <= 2 || processing}
                  onClick={() => setNumPayers(prev => Math.max(2, prev - 1))}
                >-</Button>
                <Input
                  id="numPayers"
                  type="number"
                  min={2}
                  max={10}
                  value={numPayers}
                  onChange={(e) => setNumPayers(parseInt(e.target.value) || 2)}
                  className="w-16 text-center"
                  disabled={processing}
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={numPayers >= 10 || processing}
                  onClick={() => setNumPayers(prev => Math.min(10, prev + 1))}
                >+</Button>
              </div>
            </div>
            
            <div className="text-sm">
              <div className="flex justify-between">
                <span>Amount per person:</span>
                <span className="font-bold">{formatCurrency(splitAmount)}</span>
              </div>
              {difference > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Rounding difference:</span>
                  <span>+{formatCurrency(difference)}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-medium">Collect Payments</h3>
            
            <div className="grid grid-cols-1 gap-3">
              {Array.from({ length: numPayers }).map((_, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                  <div>
                    <span className="font-medium">Payer {index + 1}</span>
                    <div className="text-sm text-muted-foreground">{formatCurrency(splitAmount)}</div>
                  </div>
                  
                  {index < completedPayments ? (
                    <Badge variant="success" className="bg-green-500">Paid</Badge>
                  ) : (
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handlePayment(index, 'cash')}
                        disabled={processing}
                      >
                        Cash
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handlePayment(index, 'mpesa')}
                        disabled={processing}
                      >
                        M-Pesa
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handlePayment(index, 'airtel')}
                        disabled={processing}
                      >
                        Airtel
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose} disabled={processing}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

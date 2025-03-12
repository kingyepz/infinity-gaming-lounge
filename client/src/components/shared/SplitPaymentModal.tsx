
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/payment";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "../ui/badge";
import { CustomerSelector } from "./CustomerSelector";
import { CustomerRegistrationForm } from "./CustomerRegistrationForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Customer {
  id: number;
  displayName: string;
  gamingName: string;
  phoneNumber: string;
  points: number;
}

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

type PaymentMethod = 'cash' | 'mpesa' | 'airtel';

interface Payer {
  index: number;
  customer: Customer | null;
  amount: number;
  paid: boolean;
  paymentMethod?: PaymentMethod;
}

export function SplitPaymentModal({ isOpen, onClose, transaction, onPaymentComplete }: SplitPaymentModalProps) {
  const { toast } = useToast();
  const [numPayers, setNumPayers] = useState<number>(2);
  const [processing, setProcessing] = useState<boolean>(false);
  const [payers, setPayers] = useState<Payer[]>([
    { index: 0, customer: null, amount: 0, paid: false },
    { index: 1, customer: null, amount: 0, paid: false }
  ]);
  const [selectedPayerIndex, setSelectedPayerIndex] = useState<number | null>(null);
  const [showCustomerSelectionModal, setShowCustomerSelectionModal] = useState<boolean>(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState<boolean>(false);

  // Calculate the split amount based on number of payers
  const baseAmount = transaction ? Math.floor(Number(transaction.amount) / numPayers) : 0;
  const remainder = transaction ? Number(transaction.amount) % numPayers : 0;
  // Function to get split amount for a payer index (first payer gets any remainder)
  const getSplitAmount = (index: number): number => {
    return index === 0 ? baseAmount + remainder : baseAmount;
  };
  // Use this for the default display 
  const splitAmount = baseAmount;
  const totalSplitAmount = baseAmount * numPayers + remainder;
  const difference = transaction ? totalSplitAmount - Number(transaction.amount) : 0;

  // State to store actual transaction ID after it's created
  const [actualTransactionId, setActualTransactionId] = useState<number>(0);
  
  // Reset state when modal closes or changes transaction
  React.useEffect(() => {
    if (!isOpen) {
      setNumPayers(2);
      setPayers([
        { index: 0, customer: null, amount: 0, paid: false },
        { index: 1, customer: null, amount: 0, paid: false }
      ]);
      setSelectedPayerIndex(null);
      setShowCustomerSelectionModal(false);
      setShowRegistrationForm(false);
      setProcessing(false);
      setActualTransactionId(0);
    } else if (transaction) {
      // Initialize payers with the calculated split amount
      setPayers(Array.from({ length: numPayers }).map((_, index) => ({
        index,
        customer: null,
        amount: splitAmount,
        paid: false
      })));
      
      // If transaction already has an ID (not 0), use it
      if (transaction.id > 0) {
        setActualTransactionId(transaction.id);
      }
    }
  }, [isOpen, transaction, splitAmount, numPayers]);

  // Update payers when numPayers changes
  React.useEffect(() => {
    if (transaction) {
      setPayers(prev => {
        // Keep existing payer data for payers that still exist
        const updatedPayers = prev.slice(0, numPayers).map(payer => ({
          ...payer,
          amount: splitAmount
        }));
        
        // Add new payers if needed
        while (updatedPayers.length < numPayers) {
          updatedPayers.push({
            index: updatedPayers.length,
            customer: null,
            amount: splitAmount,
            paid: false
          });
        }
        
        return updatedPayers;
      });
    }
  }, [numPayers, splitAmount, transaction]);

  const handleSelectCustomer = (index: number) => {
    setSelectedPayerIndex(index);
    setShowCustomerSelectionModal(true);
  };

  const handleCustomerSelected = (customer: Customer) => {
    if (selectedPayerIndex !== null) {
      setPayers(prev => 
        prev.map(payer => 
          payer.index === selectedPayerIndex
            ? { ...payer, customer }
            : payer
        )
      );
      setShowCustomerSelectionModal(false);
      setSelectedPayerIndex(null);
    }
  };

  const handleRegisterNewCustomer = () => {
    setShowCustomerSelectionModal(false);
    setShowRegistrationForm(true);
  };

  const handleRegistrationSuccess = (customer: Customer) => {
    if (selectedPayerIndex !== null) {
      setPayers(prev => 
        prev.map(payer => 
          payer.index === selectedPayerIndex
            ? { ...payer, customer }
            : payer
        )
      );
    }
    setShowRegistrationForm(false);
    setSelectedPayerIndex(null);
  };

  const handlePayment = async (index: number, method: PaymentMethod) => {
    if (!transaction) return;
    
    setProcessing(true);
    
    try {
      // Get the payer
      const payer = payers.find(p => p.index === index);
      
      // Create a payment record for this split
      // First create transaction if needed (when id is 0)
      let transactionId = actualTransactionId > 0 ? actualTransactionId : transaction.id;
      
      if (transactionId === 0) {
        try {
          // Create the transaction first
          const txResponse = await apiRequest({
            path: '/api/transactions',
            method: 'POST',
            data: {
              stationId: transaction.stationId,
              customerName: payer?.customer?.displayName || transaction.customerName,
              gameName: transaction.gameName,
              amount: transaction.amount,
              sessionType: 'per_game',
              paymentStatus: 'pending'
            }
          });
          
          if (txResponse.success && txResponse.data) {
            transactionId = txResponse.data.id;
            // Save this transaction ID for future split payments
            setActualTransactionId(transactionId);
          } else {
            throw new Error(txResponse.error || "Failed to create transaction");
          }
        } catch (err) {
          console.error("Failed to create transaction:", err);
          toast({
            title: "Transaction Error",
            description: "Could not create transaction for split payment",
            variant: "destructive"
          });
          setProcessing(false);
          return;
        }
      }
      
      const paymentData = {
        transactionId: transactionId,
        amount: splitAmount,
        paymentMethod: method,
        splitPayment: true,
        splitIndex: index,
        splitTotal: numPayers,
        userId: payer?.customer?.id || null
      };
      
      // Use different endpoints based on payment method
      const endpoint = method === 'cash' 
        ? '/api/transactions/payment'
        : `/api/payments/${method}`;
      
      const response = await apiRequest({
        path: endpoint,
        method: 'POST',
        data: paymentData
      });
      
      if (response.success) {
        toast({
          title: "Payment Processed",
          description: `Split payment ${index + 1} of ${numPayers} processed successfully.`,
        });
        
        // Mark this payer as paid
        setPayers(prev => 
          prev.map(payer => 
            payer.index === index
              ? { ...payer, paid: true, paymentMethod: method }
              : payer
          )
        );
        
        // Check if all payments are completed
        const updatedPayers = payers.map(payer => 
          payer.index === index ? { ...payer, paid: true } : payer
        );
        const allPaid = updatedPayers.every(payer => payer.paid);
        
        if (allPaid) {
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
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Split Payment</DialogTitle>
            <DialogDescription>
              Split the bill among multiple customers
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h3 className="font-medium">Transaction Details</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Game:</span>
                <span>{transaction.gameName}</span>
                <span className="text-muted-foreground">Primary Customer:</span>
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
                {payers.map((payer) => (
                  <div key={payer.index} className="flex flex-col p-3 border rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        {payer.customer ? (
                          <div>
                            <p className="font-medium">{payer.customer.displayName}</p>
                            <p className="text-xs text-muted-foreground">@{payer.customer.gamingName}</p>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <span className="font-medium">Payer {payer.index + 1}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-2 h-7 text-xs"
                              onClick={() => handleSelectCustomer(payer.index)}
                              disabled={payer.paid || processing}
                            >
                              Select Customer
                            </Button>
                          </div>
                        )}
                        <div className="text-sm text-muted-foreground">{formatCurrency(payer.amount)}</div>
                      </div>
                      
                      {payer.paid ? (
                        <Badge variant="success" className="bg-green-500">
                          Paid via {payer.paymentMethod}
                        </Badge>
                      ) : (
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handlePayment(payer.index, 'cash')}
                            disabled={processing}
                          >
                            Cash
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handlePayment(payer.index, 'mpesa')}
                            disabled={processing}
                          >
                            M-Pesa
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handlePayment(payer.index, 'airtel')}
                            disabled={processing}
                          >
                            Airtel
                          </Button>
                        </div>
                      )}
                    </div>
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

      {/* Customer Selection Modal */}
      <Dialog open={showCustomerSelectionModal} onOpenChange={setShowCustomerSelectionModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Customer</DialogTitle>
            <DialogDescription>
              Choose a registered customer or register a new one
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="select" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="select">Select Customer</TabsTrigger>
              <TabsTrigger value="register">Register New</TabsTrigger>
            </TabsList>
            
            <TabsContent value="select">
              <CustomerSelector 
                onSelectCustomer={handleCustomerSelected}
                onRegisterNewCustomer={handleRegisterNewCustomer}
              />
            </TabsContent>
            
            <TabsContent value="register">
              <CustomerRegistrationForm 
                onSuccess={handleRegistrationSuccess}
                onCancel={() => setShowRegistrationForm(false)}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Customer Registration Form Modal */}
      <Dialog open={showRegistrationForm} onOpenChange={setShowRegistrationForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Register New Customer</DialogTitle>
            <DialogDescription>
              Create a new customer account
            </DialogDescription>
          </DialogHeader>
          
          <CustomerRegistrationForm 
            onSuccess={handleRegistrationSuccess}
            onCancel={() => setShowRegistrationForm(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}


import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { processPayment, type PaymentMethod } from "@/lib/payment";

interface PaymentFormProps {
  transactionId: number;
  customerName: string;
  amount: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function PaymentForm({ 
  transactionId, 
  customerName, 
  amount, 
  onSuccess, 
  onCancel 
}: PaymentFormProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [discount, setDiscount] = useState(0);
  const [applyDiscount, setApplyDiscount] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loyaltyPoints, setLoyaltyPoints] = useState(Math.floor(amount / 100)); // Default points
  const [redeemPoints, setRedeemPoints] = useState(false);
  
  const { toast } = useToast();
  
  // Calculate final amount
  const discountAmount = applyDiscount ? (amount * (discount / 100)) : 0;
  const finalAmount = amount - discountAmount;
  
  const handlePayment = async () => {
    if (!paymentMethod) {
      toast({
        variant: "destructive",
        title: "Payment method required",
        description: "Please select a payment method"
      });
      return;
    }
    
    if ((paymentMethod === "mpesa" || paymentMethod === "airtel") && !phoneNumber) {
      toast({
        variant: "destructive",
        title: "Phone number required",
        description: "Please enter a phone number for mobile money payment"
      });
      return;
    }
    
    try {
      setIsProcessing(true);
      
      const result = await processPayment({
        transactionId,
        amount,
        method: paymentMethod as PaymentMethod,
        customerName,
        phoneNumber: phoneNumber || undefined,
        discount: applyDiscount ? discount : 0,
        loyaltyPoints: redeemPoints ? -loyaltyPoints : loyaltyPoints
      });
      
      if (result.success) {
        toast({
          title: "Payment successful",
          description: `Reference: ${result.reference}`
        });
        if (onSuccess) onSuccess();
      } else {
        toast({
          variant: "destructive",
          title: "Payment failed",
          description: result.error
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Payment failed",
        description: error.message
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm mb-1">Customer: <span className="font-medium">{customerName}</span></p>
        <p className="text-lg font-bold">Amount: KSH {finalAmount.toFixed(2)}</p>
        {applyDiscount && (
          <p className="text-xs text-green-500">Discount: KSH {discountAmount.toFixed(2)} ({discount}%)</p>
        )}
      </div>
      
      <div className="space-y-3">
        <div>
          <Label htmlFor="payment-method">Payment Method</Label>
          <Select 
            value={paymentMethod} 
            onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
          >
            <SelectTrigger id="payment-method">
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="mpesa">M-Pesa</SelectItem>
              <SelectItem value="airtel">Airtel Money</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {(paymentMethod === "mpesa" || paymentMethod === "airtel") && (
          <div>
            <Label htmlFor="phone-number">Phone Number</Label>
            <Input
              id="phone-number"
              placeholder="e.g. 254700000000"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="apply-discount" 
            checked={applyDiscount}
            onCheckedChange={(checked) => setApplyDiscount(checked === true)}
          />
          <Label htmlFor="apply-discount">Apply Discount</Label>
        </div>
        
        {applyDiscount && (
          <div>
            <Label htmlFor="discount">Discount Percentage</Label>
            <Input
              id="discount"
              type="number"
              min="0"
              max="100"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
            />
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="redeem-points" 
            checked={redeemPoints}
            onCheckedChange={(checked) => setRedeemPoints(checked === true)}
          />
          <Label htmlFor="redeem-points">Redeem Loyalty Points</Label>
        </div>
        
        {redeemPoints && (
          <div>
            <Label htmlFor="points">Points to Redeem</Label>
            <Input
              id="points"
              type="number"
              min="0"
              value={loyaltyPoints}
              onChange={(e) => setLoyaltyPoints(Number(e.target.value))}
            />
          </div>
        )}
      </div>
      
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
          Cancel
        </Button>
        <Button onClick={handlePayment} disabled={isProcessing}>
          {isProcessing ? "Processing..." : "Complete Payment"}
        </Button>
      </div>
    </div>
  );
}

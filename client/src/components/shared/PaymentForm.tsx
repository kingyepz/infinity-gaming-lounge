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
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { processPayment, PaymentFormData, PaymentResult } from "@/lib/payment";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface PaymentFormProps {
  initialData: PaymentFormData;
  onSuccess: (result: PaymentResult) => void;
  onCancel: () => void;
}

export default function PaymentFormComponent({ initialData, onSuccess, onCancel }: PaymentFormProps) {
  const { toast } = useToast();
  const [paymentData, setPaymentData] = useState<PaymentFormData>(initialData);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDataChange = (field: keyof PaymentFormData, value: any) => {
    setPaymentData(prev => ({ ...prev, [field]: value }));
  };

  const calculateFinalAmount = (): number => {
    let amount = paymentData.amount;

    // Apply discount if selected
    if (paymentData.discount && paymentData.discount > 0) {
      amount = amount * (1 - (paymentData.discount / 100));
    }

    // Apply points redemption if selected
    if (paymentData.redeemPoints && paymentData.pointsToRedeem && paymentData.pointsToRedeem > 0) {
      // Assuming 1 point = 1 KSH
      const discountFromPoints = Math.min(paymentData.pointsToRedeem, amount);
      amount = Math.max(0, amount - discountFromPoints);
    }

    return amount;
  };

  const handlePayment = async () => {
    try {
      setIsProcessing(true);

      if (!paymentData.paymentMethod) {
        toast({
          title: "Payment method required",
          description: "Please select a payment method",
          variant: "destructive"
        });
        return;
      }

      if ((paymentData.paymentMethod === 'mpesa' || paymentData.paymentMethod === 'airtel') && 
          (!paymentData.phoneNumber || !paymentData.phoneNumber.match(/^254\d{9}$/))) {
        toast({
          title: "Invalid phone number",
          description: "Please enter a valid phone number in format 254XXXXXXXXX",
          variant: "destructive"
        });
        return;
      }

      const result = await processPayment(paymentData);

      if (result.success) {
        toast({
          title: "Payment successful",
          description: result.message,
          variant: "default"
        });
        onSuccess(result);
      } else {
        toast({
          title: "Payment failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Payment error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Process Payment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="customer-name">Customer Name</Label>
          <Input 
            id="customer-name" 
            value={paymentData.customerName}
            onChange={(e) => handleDataChange('customerName', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input 
            id="amount" 
            type="number" 
            value={paymentData.amount}
            onChange={(e) => handleDataChange('amount', parseFloat(e.target.value))}
            disabled={true}
          />
          <p className="text-xs text-muted-foreground">
            {paymentData.sessionType === 'per_game' 
              ? 'Per game fee' 
              : `${paymentData.duration || 0} minutes (${Math.ceil((paymentData.duration || 0) / 60)} hour(s))`}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="payment-method">Payment Method</Label>
          <Select 
            value={paymentData.paymentMethod} 
            onValueChange={(value) => handleDataChange('paymentMethod', value as any)}
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

        {(paymentData.paymentMethod === 'mpesa' || paymentData.paymentMethod === 'airtel') && (
          <div className="space-y-2">
            <Label htmlFor="phone-number">Phone Number</Label>
            <Input
              id="phone-number"
              placeholder="e.g. 254700000000"
              value={paymentData.phoneNumber || ''}
              onChange={(e) => handleDataChange('phoneNumber', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Format: 254XXXXXXXXX</p>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Checkbox 
            id="apply-discount" 
            checked={!!paymentData.discount}
            onCheckedChange={(checked) => handleDataChange('discount', checked ? 10 : 0)}
          />
          <Label htmlFor="apply-discount">Apply Discount</Label>
        </div>

        {paymentData.discount && paymentData.discount > 0 && (
          <div className="space-y-2">
            <Label htmlFor="discount">Discount Percentage</Label>
            <Input
              id="discount"
              type="number"
              min="0"
              max="100"
              value={paymentData.discount}
              onChange={(e) => handleDataChange('discount', parseFloat(e.target.value))}
            />
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Checkbox 
            id="redeem-points"
            checked={!!paymentData.redeemPoints}
            onCheckedChange={(checked) => handleDataChange('redeemPoints', checked ? true : false)}
          />
          <Label htmlFor="redeem-points">Redeem Loyalty Points</Label>
        </div>

        {paymentData.redeemPoints && (
          <div className="space-y-2">
            <Label htmlFor="points">Points to Redeem</Label>
            <Input
              id="points"
              type="number"
              min="0"
              value={paymentData.pointsToRedeem || 0}
              onChange={(e) => handleDataChange('pointsToRedeem', parseInt(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">Available: 200 points</p>
          </div>
        )}

        <Separator />

        <div className="bg-muted p-3 rounded-md">
          <div className="flex justify-between">
            <span>Original Amount:</span>
            <span>{formatCurrency(paymentData.amount)}</span>
          </div>

          {paymentData.discount && paymentData.discount > 0 && (
            <div className="flex justify-between text-green-500">
              <span>Discount ({paymentData.discount}%):</span>
              <span>-{formatCurrency(paymentData.amount * (paymentData.discount / 100))}</span>
            </div>
          )}

          {paymentData.redeemPoints && paymentData.pointsToRedeem && paymentData.pointsToRedeem > 0 && (
            <div className="flex justify-between text-green-500">
              <span>Points Redeemed:</span>
              <span>-{formatCurrency(Math.min(paymentData.pointsToRedeem, 
                paymentData.amount * (1 - (paymentData.discount || 0) / 100)))}</span>
            </div>
          )}

          <Separator className="my-2" />

          <div className="flex justify-between font-bold">
            <span>Final Amount:</span>
            <span>{formatCurrency(calculateFinalAmount())}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
          Cancel
        </Button>
        <Button onClick={handlePayment} disabled={isProcessing}>
          {isProcessing ? "Processing..." : "Complete Payment"}
        </Button>
      </CardFooter>
    </Card>
  );
}
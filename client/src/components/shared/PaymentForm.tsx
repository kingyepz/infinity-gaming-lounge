import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface PaymentFormProps {
  amount: number;
  customerName: string;
  userId?: number;
  onComplete: (paymentInfo: any) => void;
  onCancel: () => void;
}

export default function PaymentForm({ amount, customerName, userId, onComplete, onCancel }: PaymentFormProps) {
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [applyDiscount, setApplyDiscount] = useState<boolean>(false);
  const [discount, setDiscount] = useState<number>(0);
  const [redeemPoints, setRedeemPoints] = useState<boolean>(false);
  const [loyaltyPoints, setLoyaltyPoints] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [availablePoints, setAvailablePoints] = useState<number>(0);
  const { toast } = useToast();

  // Fetch user data if userId is provided
  const { data: userData } = useQuery({
    queryKey: ["/api/users/current", userId],
    enabled: !!userId,
    headers: userId ? { 'user-id': userId.toString() } : undefined
  });

  useEffect(() => {
    if (userData?.points) {
      setAvailablePoints(userData.points);
    }
  }, [userData]);

  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      // Calculate final amount after discounts and points
      let finalAmount = amount;

      if (applyDiscount) {
        finalAmount = amount - (amount * (discount / 100));
      }

      if (redeemPoints) {
        // Check if user has enough points
        if (redeemPoints && loyaltyPoints > availablePoints) {
          toast({
            title: "Insufficient Points",
            description: `Customer only has ${availablePoints} points available.`,
            variant: "destructive"
          });
          setIsProcessing(false);
          return;
        }

        // Assume 1 point = 1 currency unit
        finalAmount = Math.max(0, finalAmount - loyaltyPoints);

        // If user is registered, redeem points from their account
        if (userId && redeemPoints && loyaltyPoints > 0) {
          try {
            const response = await fetch("/api/users/points/redeem", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId, points: loyaltyPoints })
            });

            if (!response.ok) {
              throw new Error("Failed to redeem points");
            }
          } catch (error) {
            console.error("Error redeeming points:", error);
            toast({
              title: "Points Redemption Failed",
              description: "There was an error redeeming loyalty points.",
              variant: "destructive"
            });
          }
        }
      }

      // For mobile money, process the payment
      if (paymentMethod === "mpesa" || paymentMethod === "airtel") {
        if (!phoneNumber) {
          toast({
            title: "Phone Number Required",
            description: "Please enter a phone number for mobile payment.",
            variant: "destructive"
          });
          setIsProcessing(false);
          return;
        }

        // Simulate payment processing delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Award points if user is registered (1 point per 100 currency)
        if (userId) {
          try {
            const pointsToAward = Math.floor(finalAmount / 100);
            if (pointsToAward > 0) {
              await fetch("/api/users/points/award", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, points: pointsToAward })
              });
            }
          } catch (error) {
            console.error("Error awarding points:", error);
          }
        }
      }

      toast({
        title: "Payment Successful",
        description: `${paymentMethod.toUpperCase()} payment of ${finalAmount} processed successfully.`,
      });

      onComplete({
        method: paymentMethod,
        amount: finalAmount,
        discount: applyDiscount ? discount : 0,
        pointsRedeemed: redeemPoints ? loyaltyPoints : 0,
        phoneNumber: phoneNumber || undefined,
        timestamp: new Date().toISOString(),
        userId
      });
    } catch (error) {
      console.error("Payment processing error:", error);
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm mb-1">Customer: <span className="font-medium">{customerName}</span></p>
        <p className="text-lg font-bold">Amount: KSH {amount.toFixed(2)}</p>
        {applyDiscount && (
          <p className="text-xs text-green-500">Discount: KSH {(amount * (discount / 100)).toFixed(2)} ({discount}%)</p>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <Label htmlFor="payment-method">Payment Method</Label>
          <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value)}>
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
            onCheckedChange={(checked) => setApplyDiscount(checked)}
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
            onCheckedChange={(checked) => setRedeemPoints(checked)}
          />
          <Label htmlFor="redeem-points">Redeem Loyalty Points</Label>
        </div>

        {redeemPoints && (
          <div>
            <Label htmlFor="points">Points to Redeem (Available: {availablePoints})</Label>
            <Input
              id="points"
              type="number"
              min="0"
              max={availablePoints}
              value={loyaltyPoints}
              onChange={(e) => setLoyaltyPoints(Math.min(Number(e.target.value), availablePoints))}
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
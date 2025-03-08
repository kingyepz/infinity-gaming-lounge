
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { UserWithoutPassword } from '../../../shared/schema';

interface PaymentModalProps {
  user: UserWithoutPassword;
  amount: number;
  description: string;
  onPaymentComplete: (paymentMethod: string) => void;
  onCancel: () => void;
}

export default function PaymentModal({ 
  user, 
  amount, 
  description, 
  onPaymentComplete, 
  onCancel 
}: PaymentModalProps) {
  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Payment Required</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p><strong>Customer:</strong> {user.displayName}</p>
            <p><strong>Amount:</strong> {amount} KES</p>
            <p><strong>Description:</strong> {description}</p>
            <p><strong>Points to Earn:</strong> {amount === 200 ? 25 : 5}</p>
          </div>
          <div className="space-y-2">
            <p className="font-semibold">Select Payment Method:</p>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => onPaymentComplete('mpesa')}>M-Pesa</Button>
              <Button onClick={() => onPaymentComplete('cash')}>Cash</Button>
              <Button onClick={() => onPaymentComplete('card')}>Card</Button>
              {user.points >= amount && (
                <Button onClick={() => onPaymentComplete('points')}>Use Points ({user.points})</Button>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import React, { useState } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import PaymentForm from './PaymentForm';
import ReceiptGenerator from './ReceiptGenerator';
import { PaymentResult } from '@/lib/payment';

type GameData = {
  id: number;
  name: string;
  price: number;
  platform?: string;
};

type StationData = {
  id: number;
  name: string;
  currentGame?: string;
  status: 'available' | 'occupied' | 'maintenance';
};

type PaymentModalProps = {
  game?: GameData;
  station?: StationData;
  onClose: () => void;
};

export default function PaymentModal({ game, station, onClose }: PaymentModalProps) {
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);

  // Determine initial data based on whether we have a game or station
  const initialData = game ? {
    customerName: '',
    amount: game.price,
    paymentMethod: 'cash' as const,
    sessionType: 'per_game' as const,
    gameName: game.name,
  } : station ? {
    customerName: '',
    stationId: station.id,
    amount: 100, // Default hourly rate
    paymentMethod: 'cash' as const,
    sessionType: 'hourly' as const,
    duration: 60, // Default session duration in minutes
    gameName: station.currentGame || 'Console Gaming',
  } : {};

  const handlePaymentSuccess = (result: PaymentResult) => {
    setPaymentResult(result);
    setPaymentComplete(true);
  };

  const handleCloseReceipt = () => {
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {!paymentComplete ? 'Payment' : 'Receipt'}
          </DialogTitle>
          <DialogDescription>
            {!paymentComplete 
              ? `Complete payment${game ? ` for ${game.name}` : station ? ` for Station ${station.id}` : ''}`
              : 'Your payment has been processed successfully.'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {!paymentComplete ? (
            <PaymentForm
              initialData={initialData}
              onSuccess={handlePaymentSuccess}
              onCancel={onClose}
            />
          ) : (
            <ReceiptGenerator 
              paymentResult={paymentResult!} 
              onClose={handleCloseReceipt} 
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import PaymentForm from "./PaymentForm";
import ReceiptGenerator from "./ReceiptGenerator";
import { PaymentResult } from "@/lib/payment";
import type { GameStation } from "@shared/schema";

interface PaymentModalProps {
  station?: GameStation;
  onClose: () => void;
}

export default function PaymentModal({ station, onClose }: PaymentModalProps) {
  const [activeTab, setActiveTab] = useState<string>("form");
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);

  const handlePaymentSuccess = (result: PaymentResult) => {
    setPaymentResult(result);
    setActiveTab("receipt");
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Payment Processing</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="form">Payment Form</TabsTrigger>
            <TabsTrigger value="receipt" disabled={!paymentResult}>Receipt</TabsTrigger>
          </TabsList>

          <TabsContent value="form" className="space-y-4">
            {station && (
              <PaymentForm 
                stationId={station.id}
                amount={station.sessionType === "per_game" ? station.baseRate : station.hourlyRate}
                onSuccess={handlePaymentSuccess}
              />
            )}
          </TabsContent>

          <TabsContent value="receipt">
            {paymentResult && (
              <ReceiptGenerator 
                paymentResult={paymentResult}
                onClose={onClose}
              />
            )}

            <div className="flex justify-end mt-4 space-x-2">
              <Button variant="outline" onClick={onClose}>Close</Button>
              <Button onClick={() => window.print()}>Print Receipt</Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import StationTransactionHistory from "./StationTransactionHistory";
import { type GameStation } from "@shared/schema";

interface StationTransactionHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  station: GameStation | null;
}

export default function StationTransactionHistoryModal({
  open,
  onOpenChange,
  station
}: StationTransactionHistoryModalProps) {
  if (!station) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-gray-900 text-white">
        <DialogHeader>
          <DialogTitle>Station Transactions</DialogTitle>
          <DialogDescription>
            View all transaction history for {station.name}
          </DialogDescription>
        </DialogHeader>
        
        <StationTransactionHistory 
          stationId={station.id} 
          stationName={station.name} 
        />
      </DialogContent>
    </Dialog>
  );
}

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';

interface BonusGameNotificationProps {
  gameType: string;
  onClose: () => void;
}

export default function BonusGameNotification({ gameType, onClose }: BonusGameNotificationProps) {
  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bonus Game Awarded! 🎮</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="text-center space-y-2">
            <p className="text-xl font-bold">Congratulations!</p>
            <p>The customer has completed a streak of 5 games and earned a bonus game!</p>
            <div className="p-4 bg-green-50 rounded-lg mt-4">
              <p className="text-green-700 font-semibold">Bonus Game: {gameType}</p>
              <p className="text-green-600 text-sm">This bonus game has been added to their account</p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

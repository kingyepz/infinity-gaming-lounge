import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

interface LoyaltyPointsCardProps {
  userId: number;
  points: number;
}

export default function LoyaltyPointsCard({ userId, points }: LoyaltyPointsCardProps) {
  const [redeemDialogOpen, setRedeemDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: rewards, isLoading } = useQuery({
    queryKey: ['/api/rewards'],
    queryFn: () => apiRequest('/api/rewards')
  });

  const redeemMutation = useMutation({
    mutationFn: (rewardId: number) => 
      apiRequest('/api/rewards/redeem', {
        method: 'POST',
        body: JSON.stringify({ userId, rewardId })
      }),
    onSuccess: (data) => {
      toast({
        title: "Reward Redeemed!",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users/current'] });
      setRedeemDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Redemption Failed",
        description: error.message || "Could not redeem reward. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleRedeemReward = (rewardId: number) => {
    redeemMutation.mutate(rewardId);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Loyalty Points</span>
          <Badge variant="outline" className="ml-2 text-xl px-4 py-1">{points}</Badge>
        </CardTitle>
        <CardDescription>
          Earn points with every purchase and redeem for rewards
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Current Level</span>
            <Badge>{points < 500 ? "Beginner" : points < 2000 ? "Pro" : "Elite"}</Badge>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Next Level</span>
            <span className="text-sm">
              {points < 500 
                ? `${500 - points} points until Pro` 
                : points < 2000 
                ? `${2000 - points} points until Elite` 
                : "You've reached the highest level!"}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Dialog open={redeemDialogOpen} onOpenChange={setRedeemDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">Redeem Rewards</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Available Rewards</DialogTitle>
              <DialogDescription>
                You have {points} points to redeem
              </DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="h-72 rounded-md border p-4">
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-3 w-[200px]" />
                      </div>
                      <Skeleton className="h-8 w-20" />
                    </div>
                  ))}
                </div>
              ) : rewards && rewards.length > 0 ? (
                <div className="space-y-4">
                  {rewards.map((reward: any) => (
                    <div key={reward.id} className="flex items-center justify-between border-b pb-3">
                      <div>
                        <h4 className="font-medium">{reward.title}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{reward.description}</p>
                        <Badge variant="outline" className="mt-1">{reward.points} points</Badge>
                      </div>
                      <Button 
                        onClick={() => handleRedeemReward(reward.id)}
                        disabled={points < reward.points || redeemMutation.isPending}
                        size="sm"
                      >
                        {redeemMutation.isPending ? "Redeeming..." : "Redeem"}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p>No rewards available at the moment</p>
                </div>
              )}
            </ScrollArea>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setRedeemDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
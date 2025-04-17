import React, { useState,useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"; 
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

interface Transaction {
  id: number;
  amount: number;
  date: string;
}

interface Friend {
  id: number;
  name: string;
}

interface Event {
  id: number;
  name: string;
  date: string;
}
interface Reward {
  id: number;
  title: string;
  description: string;
  points: number;
}

interface LoyaltyPointsCardProps {
  userId: number;
  points: number;
}
interface RewardsResponse {
  rewards: Reward[];
}

export default function LoyaltyPointsCard({ userId, points }: LoyaltyPointsCardProps) {
  const [redeemDialogOpen, setRedeemDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const [loyaltyHistoryData, setLoyaltyHistoryData] = useState<any[] | null>(null);
  const [loyaltyHistoryLoading, setLoyaltyHistoryLoading] = useState(false);
  const [loyaltyHistoryError, setLoyaltyHistoryError] = useState<Error | null>(null);


  const { data: rewards, isLoading } = useQuery({
    queryKey: ["/api/rewards", { userId }],
    queryFn: async ({ queryKey }) => {
      const [, { userId }] = queryKey; 
      try {
        const response = await fetch("/api/rewards", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId }),
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data as RewardsResponse;
      } catch (error) {
        console.error("Failed to fetch rewards:", error);
        throw error;
      }
    },
  });

  const redeemMutation = useMutation({
    mutationFn: async (rewardId: number) => {
      const response = await fetch("/api/rewards/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, rewardId }),
      });
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        // @ts-ignore
        title: "Reward Redeemed!",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users/current'] });
      setRedeemDialogOpen(false);
    },
    onError: (error: { message: string; }) => {
      toast({
        // @ts-ignore
        title: "Redemption Failed",
        description: error.message || "Could not redeem reward. Please try again.",
        variant: "destructive"
      });
    },
  })

  useEffect(() => {
    const fetchLoyaltyHistory = async () => {
      setLoyaltyHistoryLoading(true);
      setLoyaltyHistoryError(null);
      try {
        const response = await fetch('/api/loyalty/history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setLoyaltyHistoryData(data); 
      } catch (error: any) {
        console.error('Error fetching loyalty history:', error);
        setLoyaltyHistoryError(error);
      } finally {
        setLoyaltyHistoryLoading(false);
      }
    };

    fetchLoyaltyHistory();
  }, [userId]);
  
  const handleRedeemReward = (rewardId: number) => {
    redeemMutation.mutate(rewardId);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Loyalty Points</span>
          <Badge variant="outline" className="ml-2 px-4 py-1 text-xl">
            {points}
          </Badge>
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
              {isLoading || !rewards ? (
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
                  {(rewards as RewardsResponse)?.rewards.map((reward: Reward) => (
                    <div key={reward.id} className="flex items-center justify-between border-b pb-3">
                      <div>
                       <h4 className="font-medium">{reward.title}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {reward.description}
                        </p>
                        <Badge variant="outline" className="mt-1">
                          {reward.points} points
                        </Badge>
                      </div>
                      <Button
                        onClick={() => handleRedeemReward(reward.id)}
                        disabled={
                          points < reward.points || redeemMutation.isPending
                        }
                        size="sm"
                      >
                        {redeemMutation.isPending ? "Redeeming..." : "Redeem"}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (rewards as RewardsResponse).rewards.length === 0 ? (
                <div className="text-center py-4">
                  <p>No rewards available at the moment</p>
                </div>
              ) : (
              <div>Error loading</div>
              )}
            </ScrollArea>

            <Separator className="my-4" />
              <DialogTitle>Loyalty History</DialogTitle>
              <DialogDescription className="pb-4">
              View your loyalty points history
              </DialogDescription>
            <ScrollArea className="h-72 rounded-md border p-4">
              {loyaltyHistoryLoading ? (
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
              ) : loyaltyHistoryError ? (
                  <div>Error loading history</div>
              ) : loyaltyHistoryData && Array.isArray(loyaltyHistoryData) && loyaltyHistoryData.length > 0 ? (
                <div className="space-y-4">
                  {loyaltyHistoryData.map((transaction: any) => (
                  <div key={transaction.id}>{JSON.stringify(transaction)}</div>
                  ))}
                </div>
              ) : loyaltyHistoryData && Array.isArray(loyaltyHistoryData) && loyaltyHistoryData.length === 0? (
                 <div>No loyalty history</div>
              )   
                : <div>Error loading</div>
              }
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
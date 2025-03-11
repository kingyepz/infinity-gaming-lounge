import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import LoyaltyPointsCard from "@/components/customer/LoyaltyPointsCard";
import {
  Timer,
  Star,
  Gamepad2,
  Clock,
  Calendar,
  Trophy,
  BarChart3,
  Gift,
  Users,
  CalendarClock,
  Bell,
  Copy,
  UserCircle
} from "lucide-react";

export default function CustomerPortal() {
  const { toast } = useToast();

  // Fetch current user
  const { data: currentUser, isLoading: currentUserLoading } = useQuery({
    queryKey: ["/api/users/current"],
  });

  // Fetch all friends
  const { data: friends, isLoading: friendsLoading } = useQuery({
    queryKey: ["/api/users/friends"],
  });

  // Fetch user transactions
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/transactions"],
  });

  // Fetch upcoming events
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ["/api/events"],
  });

  const isLoading = currentUserLoading || friendsLoading || transactionsLoading || eventsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Filter user's own transactions
  const userTransactions = transactions?.filter(tx => 
    tx.customerName === currentUser?.displayName || 
    tx.customerName === currentUser?.gamingName
  ) || [];

  const handleCopyReferral = () => {
    if (currentUser?.referralCode) {
      navigator.clipboard.writeText(currentUser.referralCode);
      toast({
        title: "Copied!",
        description: "Referral code copied to clipboard",
      });
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* User Profile and Points */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Profile */}
        <Card className="bg-black/30 border-primary/20 md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="text-2xl">
                  {currentUser?.displayName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{currentUser?.displayName}</CardTitle>
                <CardDescription className="text-base">@{currentUser?.gamingName}</CardDescription>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">
                    {currentUser?.points < 500 ? "Beginner" : currentUser?.points < 2000 ? "Pro Gamer" : "Elite Gamer"}
                  </Badge>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <UserCircle className="w-3 h-3" />
                    Member since {new Date(currentUser?.createdAt).toLocaleDateString()}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  {currentUser?.phoneNumber}
                </p>
                {currentUser?.referralCode && (
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    Referral Code: 
                    <span className="font-mono bg-primary/10 px-2 py-0.5 rounded">{currentUser.referralCode}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopyReferral}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Gaming Progress</p>
                <Progress value={currentUser?.points ? Math.min((currentUser.points / 3000) * 100, 100) : 0} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {currentUser?.points} / 3000 XP to max level
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loyalty Points Card */}
        {currentUser && (
          <LoyaltyPointsCard 
            userId={currentUser.id} 
            points={currentUser.points || 0} 
          />
        )}
      </div>

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            My Sessions
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Events
          </TabsTrigger>
          <TabsTrigger value="friends" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Friends
          </TabsTrigger>
        </TabsList>

        {/* Recent Transactions Tab */}
        <TabsContent value="transactions">
          <Card className="bg-black/30 border-primary/20">
            <CardHeader>
              <CardTitle>My Gaming History</CardTitle>
              <CardDescription>Your recent gaming sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-4">
                  {userTransactions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No gaming sessions found</p>
                  ) : (
                    userTransactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-3 rounded-md bg-primary/5">
                        <div>
                          <div className="flex items-center gap-2">
                            <Gamepad2 className="w-4 h-4 text-primary" />
                            <p className="font-medium">Station #{tx.stationId}</p>
                          </div>
                          <div className="flex gap-3 text-sm text-muted-foreground mt-1">
                            <span>{tx.gameName || "Custom Game"}</span>
                            <span>•</span>
                            <span>{tx.sessionType === "per_game" ? "Per Game" : `${tx.duration || '?'} minutes`}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">KSH {tx.amount}</p>
                          <div className="flex items-center justify-end gap-2 mt-1">
                            <Badge variant={tx.paymentStatus === "completed" ? "default" : "secondary"} className="text-xs">
                              {tx.paymentStatus}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events">
          <Card className="bg-black/30 border-primary/20">
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Gaming tournaments and special events</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-4">
                  {!events || events.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No upcoming events</p>
                  ) : (
                    events.map((event) => (
                      <div key={event.id} className="p-3 rounded-md bg-primary/5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-primary" />
                            <p className="font-medium">{event.title}</p>
                          </div>
                          <Badge>{event.prize}</Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                          <CalendarClock className="w-4 h-4" />
                          <span>{event.date} at {event.time}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Friends Tab */}
        <TabsContent value="friends">
          <Card className="bg-black/30 border-primary/20">
            <CardHeader>
              <CardTitle>Gaming Friends</CardTitle>
              <CardDescription>Your gaming network and leaderboard</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-4">
                  {!friends || friends.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No friends added yet</p>
                  ) : (
                    friends.map((friend) => (
                      <div key={friend.id} className="flex items-center justify-between p-3 rounded-md bg-primary/5">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium flex items-center gap-2">
                              {friend.name}
                              <Badge 
                                variant={friend.status === "online" ? "default" : 
                                        friend.status === "gaming" ? "outline" : "secondary"} 
                                className="text-xs">
                                {friend.status}
                              </Badge>
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{friend.points} points</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
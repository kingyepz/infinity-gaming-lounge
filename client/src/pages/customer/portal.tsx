import { useQuery, useQueryClient, type UseQueryResult, type QueryClient } from "@tanstack/react-query";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import LoyaltyPointsCard from "@/components/customer/LoyaltyPointsCard";
import { Clock } from "lucide-react";
import { Calendar } from "lucide-react";
import { Trophy, Users, CalendarClock, Copy, UserCircle, Phone } from "lucide-react";
import { CustomerRegistrationForm } from "@/components/shared/CustomerRegistrationForm";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast"
import { Gamepad2 } from "lucide-react";
export default function CustomerPortal() {
  const { toast } = useToast();

  type Transaction = {
    id: string;
    stationId: string;
    sessionType: "per_game" | "per_minute";
    duration?: number;
    amount: number;
    paymentStatus: "completed" | "pending";
    createdAt?: string | Date;
    customerName:string
  };

  type Event = {
    id: string;
    title: string;
    prize: string;
    date: string;
    time: string;
  };

  type Friend = {
    id: string;
    name: string;
    status: "online" | "gaming" | "offline";
    points: number;
  };

  type User = {
    displayName: string;
    gamingName: string;
    referralCode?: string;
    points?: number;
    createdAt?: Date;
    phoneNumber?: string;
    id: number;
  };
  // Fetch current user
  const queryClient: QueryClient = useQueryClient();
  const { data: currentUser, isLoading: currentUserLoading }: UseQueryResult<User> = useQuery({ queryKey: ["/api/users/current"] });
  const { loading: authLoading } = useAuth();

  // Fetch all friends
  const { data: friends, isLoading: friendsLoading }: UseQueryResult<Friend[]> = useQuery({
    queryKey: ["/api/users/friends"],
  });

  // Fetch user transactions
  const { data: transactions, isLoading: transactionsLoading }: UseQueryResult<Transaction[]>  = useQuery({
    queryKey: ["/api/transactions"],
  });

  // Fetch upcoming events
  const { data: events, isLoading: eventsLoading }: UseQueryResult<Event[]>  = useQuery({
    queryKey: ["/api/events"],
  });

  const allLoading = currentUserLoading || friendsLoading || transactionsLoading || eventsLoading || authLoading;
  if (allLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  //states
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/users/friends"] });
    setIsDialogOpen(false);
  };

  const handleFormCancel = () => {
    setIsDialogOpen(false);
  };

  // Filter user's own transactions
  const userTransactions = transactions?.filter((tx) =>
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
    <div>
      <div className="space-y-6 pb-8">
        <div className="flex justify-end items-center gap-4">          
            <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button>Add Customer</Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-black/30 border-primary/20">
                <AlertDialogHeader>
                  <AlertDialogTitle>Add new Customer</AlertDialogTitle>
                </AlertDialogHeader>                <CustomerRegistrationForm onSuccess={handleFormSuccess} onCancel={handleFormCancel} />             
              </AlertDialogContent>            </AlertDialog>        
        </div> 
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6"> <Card className="bg-black/30 border-primary/20 md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-4">              
              <Avatar className="w-16 h-16"><AvatarFallback className="text-2xl">
                  {currentUser?.displayName?.charAt(0)}
                </AvatarFallback></Avatar>
              <CardTitle className="text-2xl">{currentUser?.displayName || ''}</CardTitle>
              <CardDescription className="text-base">@{currentUser?.gamingName}</CardDescription>
            </div>
            <div className="flex items-center gap-2 mt-1">              <Badge variant="outline">
                {currentUser?.points && currentUser.points < 500 ? "Beginner" : currentUser?.points && currentUser.points < 2000 ? "Pro Gamer" : "Elite Gamer"}
              </Badge>              <Badge variant="secondary" className="flex items-center gap-1">                <UserCircle className="w-3 h-3" />Member since {currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : ''}              </Badge>            </div>
             

             
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  {currentUser?.phoneNumber || ''}
              </p>
                {currentUser?.referralCode && (
                  <p className="text-sm font-medium flex items-center gap-2" >
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
                <Progress value={currentUser?.points !== undefined ? Math.min((currentUser.points / 3000) * 100, 100) : 0} className="h-2" /><p className="text-xs text-muted-foreground mt-1"> {currentUser?.points ?? 0 } / 3000 XP to max level</p>
              </div>
            </div>
          </CardContent>
        </Card>        
        
        {currentUser && <LoyaltyPointsCard userId={Number(currentUser.id)} points={currentUser.points ?? 0}/>}
        </div>
    

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions" className="flex items-center gap-2" >
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
                            <span>Custom Game</span>                             
                            <span className="text-xs">•</span>
                            <span>{tx.sessionType === "per_game" ? "Per Game" : `${tx.duration || "?"} minutes`}</span>                            
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
                    events?.map((event) => (
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
      </Tabs>        
    </div>

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
                 {!friends || !Array.isArray(friends) || friends.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No friends found</p>
                 ) : (
                 friends.map((friend) => (
                   <div
                     key={friend.id}
                     className="flex items-center justify-between p-3 rounded-md bg-primary/5">
                     <div className="flex items-center gap-3">
                       <Avatar className="w-10 h-10">
                        <AvatarImage src="https://github.com/shadcn.png" />                       
                       <AvatarFallback>
                           {friend.name ? friend.name.charAt(0) : ""}
                         </AvatarFallback>
                       </Avatar>
                       <div>
                          <p className="font-medium flex items-center gap-2">
                            {friend.name}
                            <Badge variant={friend.status === "online" ? "default" : friend.status === "gaming" ? "outline" : "secondary"} className="text-xs">
                              {friend.status}
                            </Badge>
                          </p>
                        </div>
                      </div>
                     <div className="text-right"> <p className="font-medium">{friend.points} points</p></div>                     
                    </div>)))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>        
          </TabsContent>
       
      
    </div>
  );
};


import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
  Copy
} from "lucide-react";

export default function CustomerPortal() {
  const { toast } = useToast();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["/api/users/current"],
  });

  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ["/api/transactions/user/current"],
    enabled: !!user,
  });

  const mockFriends = [
    { id: 1, name: "Alex Gaming", avatar: "", points: 980, status: "online" },
    { id: 2, name: "ProPlayer22", avatar: "", points: 750, status: "offline" },
    { id: 3, name: "GameMaster", avatar: "", points: 1200, status: "gaming" }
  ];
  
  const mockLeaderboard = [
    { rank: 1, name: "EliteGamer", points: 2500, avatar: "" },
    { rank: 2, name: "VictoryRoad", points: 2300, avatar: "" },
    { rank: 3, name: "GameMaster", points: 1200, avatar: "" },
    { rank: 4, name: "ProPlayer22", points: 750, avatar: "" },
  ];
  
  const mockEvents = [
    { id: 1, title: "FIFA Tournament", date: "2023-12-15", time: "14:00", prize: "5000 Points" },
    { id: 2, title: "Call of Duty Marathon", date: "2023-12-22", time: "18:00", prize: "Free Hours" },
    { id: 3, title: "Racing Championship", date: "2023-12-29", time: "16:00", prize: "Gaming Gear" }
  ];
  
  const mockRewards = [
    { id: 1, title: "1 Hour Free Gaming", points: 500, image: "" },
    { id: 2, title: "Gaming Headset", points: 2000, image: "" },
    { id: 3, title: "Premium Snack Pack", points: 300, image: "" },
    { id: 4, title: "Controller Skin", points: 800, image: "" }
  ];
  
  const mockGameStats = [
    { game: "FIFA 23", wins: 24, losses: 12, hoursPlayed: 45 },
    { game: "Call of Duty", wins: 56, losses: 32, hoursPlayed: 78 },
    { game: "Fortnite", wins: 18, losses: 22, hoursPlayed: 36 }
  ];
  
  const mockNotifications = [
    { id: 1, title: "Weekend Discount", message: "Get 20% off this weekend!", time: "2h ago" },
    { id: 2, title: "Tournament Reminder", message: "FIFA Tournament starts tomorrow!", time: "5h ago" },
    { id: 3, title: "Friend Request", message: "GameMaster wants to be friends", time: "1d ago" }
  ];
  
  if (userLoading || txLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid grid-cols-5 gap-2 mb-6">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <Gamepad2 className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="gaming" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Gaming</span>
          </TabsTrigger>
          <TabsTrigger value="rewards" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            <span className="hidden sm:inline">Rewards</span>
          </TabsTrigger>
          <TabsTrigger value="social" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Social</span>
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Events</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Dashboard Tab */}
        <TabsContent value="profile" className="space-y-6">
          {/* Profile Card */}
          <Card className="backdrop-blur-sm bg-white/10 border-primary/20">
            <CardHeader>
              <CardTitle>Customer Profile</CardTitle>
              <CardDescription>Your gaming profile and preferences</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16 border-2 border-primary">
                  <AvatarFallback>{user?.displayName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-bold">{user?.displayName}</h3>
                  <p className="text-sm text-muted-foreground">@{user?.gamingName}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Display Name</p>
                  <p className="text-lg font-semibold">{user?.displayName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Gaming Name</p>
                  <p className="text-lg font-semibold">{user?.gamingName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
                  <p className="text-lg font-semibold">{user?.phoneNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                  <p className="text-lg font-semibold">
                    {new Date(user?.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-primary/10">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">Loyalty Points</h3>
                  <span className="text-2xl font-bold text-primary">{user?.points || 0}</span>
                </div>
                <Progress value={((user?.points || 0) % 1000) / 10} className="h-2" />
                <p className="text-xs text-right mt-1 text-muted-foreground">
                  {1000 - ((user?.points || 0) % 1000)} points until next level
                </p>
              </div>
              
              {/* Referral program */}
              <div className="mt-4 pt-4 border-t border-primary/10">
                <h3 className="font-semibold">Refer Friends & Earn Points</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-2">
                  Share your code and get 50 points when friends join
                </p>
                <div className="flex items-center gap-2 bg-primary/10 p-2 rounded-md">
                  <code className="text-lg font-bold">{user?.referralCode || `REF${user?.id}${user?.gamingName?.substring(0, 3).toUpperCase()}`}</code>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(user?.referralCode || `REF${user?.id}${user?.gamingName?.substring(0, 3).toUpperCase()}`);
                      toast({
                        title: "Copied!",
                        description: "Referral code copied to clipboard"
                      });
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Notifications Center */}
              <div className="mt-4 pt-4 border-t border-primary/10">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">Notifications</h3>
                  <Badge variant="outline">{mockNotifications.length}</Badge>
                </div>
                
                <ScrollArea className="h-[150px]">
                  <div className="space-y-2">
                    {mockNotifications.map(notification => (
                      <div key={notification.id} className="flex items-start gap-2 p-2 rounded-md bg-primary/5 hover:bg-primary/10">
                        <Bell className="h-4 w-4 mt-1 text-primary" />
                        <div>
                          <p className="text-sm font-medium">{notification.title}</p>
                          <p className="text-xs text-muted-foreground">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gaming History Tab */}
        <TabsContent value="gaming" className="space-y-6">
          {/* Gaming History Card */}
          <Card className="backdrop-blur-sm bg-white/10 border-primary/20">
            <CardHeader>
              <CardTitle>Gaming History</CardTitle>
              <CardDescription>Your recent gaming sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <div className="space-y-4">
                  {!transactions || transactions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No gaming history found</p>
                  ) : (
                    transactions.map((tx, i) => (
                      <div key={i} className="flex justify-between items-center p-2 rounded-md bg-primary/5 hover:bg-primary/10">
                        <div className="flex items-center gap-2">
                          <Gamepad2 className="h-4 w-4" />
                          <div>
                            <p className="font-medium">{tx.gameName}</p>
                            <p className="text-xs text-muted-foreground">
                              {tx.sessionType === "per_game" ? "Per Game" : `${tx.duration} minutes`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">KSH {tx.amount}</p>
                          <p className="text-xs text-primary">+{Math.floor(tx.amount / 100)} points</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
          
          {/* Game Statistics Card */}
          <Card className="backdrop-blur-sm bg-white/10 border-primary/20">
            <CardHeader>
              <CardTitle>Game Statistics</CardTitle>
              <CardDescription>Your performance metrics across games</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockGameStats.map((stat, i) => (
                  <div key={i} className="p-3 rounded-md bg-primary/5">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold">{stat.game}</h4>
                      <Badge variant="outline" className="font-mono">
                        {stat.hoursPlayed}h
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Wins</p>
                        <p className="font-medium text-green-400">{stat.wins}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Losses</p>
                        <p className="font-medium text-red-400">{stat.losses}</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground mb-1">Win Rate</p>
                      <Progress 
                        value={stat.wins / (stat.wins + stat.losses) * 100} 
                        className="h-1.5"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Booking System Card */}
          <Card className="backdrop-blur-sm bg-white/10 border-primary/20">
            <CardHeader>
              <CardTitle>Station Booking</CardTitle>
              <CardDescription>Reserve your gaming station in advance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm font-medium">Date</p>
                    <div className="border rounded-md p-2 mt-1">
                      <input 
                        type="date" 
                        className="bg-transparent w-full outline-none" 
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Time</p>
                    <div className="border rounded-md p-2 mt-1">
                      <input 
                        type="time" 
                        className="bg-transparent w-full outline-none" 
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium">Station</p>
                  <div className="border rounded-md p-2 mt-1">
                    <select className="bg-transparent w-full outline-none">
                      <option value="">Select a station</option>
                      <option value="1">Game Station 1</option>
                      <option value="2">Game Station 2</option>
                      <option value="3">Game Station 3</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium">Duration</p>
                  <div className="border rounded-md p-2 mt-1">
                    <select className="bg-transparent w-full outline-none">
                      <option value="1">1 Hour</option>
                      <option value="2">2 Hours</option>
                      <option value="3">3 Hours</option>
                      <option value="4">4 Hours</option>
                    </select>
                  </div>
                </div>
                
                <Button className="w-full">Book Station</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Rewards Tab */}
        <TabsContent value="rewards" className="space-y-6">
          {/* Loyalty Points Card */}
          <Card className="backdrop-blur-sm bg-white/10 border-primary/20">
            <CardHeader>
              <CardTitle>Loyalty Points</CardTitle>
              <CardDescription>Track and manage your loyalty points</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-4">
                <div className="text-5xl font-bold text-primary mb-2">{user?.points || 0}</div>
                <p className="text-sm text-muted-foreground">Available Points</p>
                
                <div className="w-full mt-6">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Beginner</span>
                    <span>Pro</span>
                    <span>Elite</span>
                  </div>
                  <Progress value={(user?.points || 0) / 50} max={50} className="h-2" />
                  <p className="text-xs text-center mt-1 text-muted-foreground">
                    {Math.max(0, 5000 - (user?.points || 0))} points until Elite status
                  </p>
                </div>
                
                <div className="mt-6 w-full grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 rounded-md bg-primary/5">
                    <p className="text-sm font-medium">Points Earned</p>
                    <p className="text-xl font-bold">{user?.points || 0}</p>
                    <p className="text-xs text-muted-foreground">Lifetime</p>
                  </div>
                  <div className="p-3 rounded-md bg-primary/5">
                    <p className="text-sm font-medium">Points Redeemed</p>
                    <p className="text-xl font-bold">0</p>
                    <p className="text-xs text-muted-foreground">Lifetime</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Rewards Redemption Card */}
          <Card className="backdrop-blur-sm bg-white/10 border-primary/20">
            <CardHeader>
              <CardTitle>Rewards Catalog</CardTitle>
              <CardDescription>Redeem your points for rewards</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockRewards.map(reward => (
                  <div key={reward.id} className="border border-primary/20 rounded-md overflow-hidden">
                    <div className="bg-primary/5 h-32 flex items-center justify-center">
                      <Gift className="h-16 w-16 text-primary/50" />
                    </div>
                    <div className="p-3">
                      <h4 className="font-semibold">{reward.title}</h4>
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-sm text-primary font-bold">{reward.points} points</p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={(user?.points || 0) < reward.points}
                        >
                          Redeem
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Social Tab */}
        <TabsContent value="social" className="space-y-6">
          {/* Leaderboard Card */}
          <Card className="backdrop-blur-sm bg-white/10 border-primary/20">
            <CardHeader>
              <CardTitle>Leaderboard</CardTitle>
              <CardDescription>Top players this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mockLeaderboard.map(player => (
                  <div 
                    key={player.rank} 
                    className={`flex items-center gap-3 p-2 rounded-md ${
                      player.rank === 1 ? 'bg-yellow-500/10' : 
                      player.rank === 2 ? 'bg-slate-400/10' : 
                      player.rank === 3 ? 'bg-amber-700/10' : 'bg-primary/5'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      player.rank === 1 ? 'bg-yellow-500/20 text-yellow-500' : 
                      player.rank === 2 ? 'bg-slate-400/20 text-slate-400' : 
                      player.rank === 3 ? 'bg-amber-700/20 text-amber-700' : 'bg-primary/10'
                    }`}>
                      {player.rank}
                    </div>
                    
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <p className="font-medium">{player.name}</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-bold">{player.points}</p>
                      <p className="text-xs text-muted-foreground">points</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Friends Card */}
          <Card className="backdrop-blur-sm bg-white/10 border-primary/20">
            <CardHeader>
              <CardTitle>Gaming Friends</CardTitle>
              <CardDescription>Connect with other gamers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex">
                <div className="relative w-full">
                  <input 
                    type="text"
                    placeholder="Find friends by gaming name"
                    className="w-full px-3 py-2 rounded-md bg-primary/5 border border-primary/20 outline-none"
                  />
                  <Button className="absolute right-1 top-1" variant="ghost" size="sm">
                    Search
                  </Button>
                </div>
              </div>
                
              <div className="space-y-2">
                {mockFriends.map(friend => (
                  <div key={friend.id} className="flex items-center justify-between p-2 rounded-md bg-primary/5">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{friend.name}</p>
                          <div className={`w-2 h-2 rounded-full ${
                            friend.status === 'online' ? 'bg-green-500' :
                            friend.status === 'gaming' ? 'bg-blue-500' : 'bg-gray-500'
                          }`} />
                        </div>
                        <p className="text-xs text-muted-foreground">{friend.points} points</p>
                      </div>
                    </div>
                    
                    <Button variant="ghost" size="sm">
                      Challenge
                    </Button>
                  </div>
                ))}
              </div>
              
              <Button variant="outline" className="w-full">
                Add More Friends
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Events Tab */}
        <TabsContent value="events" className="space-y-6">
          {/* Upcoming Events Card */}
          <Card className="backdrop-blur-sm bg-white/10 border-primary/20">
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Tournaments and special gaming events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockEvents.map(event => (
                  <div key={event.id} className="border border-primary/20 rounded-md overflow-hidden">
                    <div className="bg-primary/10 p-3 flex justify-between items-center">
                      <h4 className="font-semibold">{event.title}</h4>
                      <Badge variant="outline">{event.prize}</Badge>
                    </div>
                    <div className="p-3">
                      <div className="flex items-center gap-2 text-sm mb-3">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span>{new Date(event.date).toLocaleDateString()}</span>
                        <Clock className="h-4 w-4 text-primary ml-2" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-muted-foreground">8 spots remaining</p>
                        <Button size="sm">Register</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="pt-4 mt-4 border-t border-primary/10">
                <h4 className="font-medium mb-2">Monthly Calendar</h4>
                <div className="bg-primary/5 rounded-md p-3">
                  <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
                    <div>Mon</div>
                    <div>Tue</div>
                    <div>Wed</div>
                    <div>Thu</div>
                    <div>Fri</div>
                    <div>Sat</div>
                    <div>Sun</div>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array(31).fill(0).map((_, i) => (
                      <div 
                        key={i} 
                        className={`aspect-square flex items-center justify-center text-xs rounded-md ${
                          [15, 22, 29].includes(i + 1) ? 'bg-primary text-primary-foreground' : 'hover:bg-primary/10'
                        }`}
                      >
                        {i + 1}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

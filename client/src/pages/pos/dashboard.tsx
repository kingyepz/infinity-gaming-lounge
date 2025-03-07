import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  GamepadIcon,
  ClockIcon,
  Timer,
  FileText,
  BarChart,
  Users,
  LogOut,
  TrophyIcon,
  StarIcon,
  ActivityIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import PaymentModal from "@/components/shared/PaymentModal";
import CustomerPortal from "@/pages/customer/portal";
import type { GameStation, Game } from "@shared/schema";

export default function POSDashboard() {
  const [selectedStation, setSelectedStation] = useState<GameStation | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: stations, isLoading: stationsLoading } = useQuery({
    queryKey: ["/api/stations"],
  });

  const { data: games, isLoading: gamesLoading } = useQuery({
    queryKey: ["/api/games"],
  });

  const handleLogout = () => {
    localStorage.removeItem('user');
    setLocation('/');
  };

  if (stationsLoading || gamesLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-black">
      {/* Animated gradient background */}
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-pink-500/20 animate-gradient-x"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYwIiBoZWlnaHQ9IjE2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZSIgeD0iMCIgeT0iMCI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNzUiIG51bU9jdGF2ZXM9IjQiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMTYwIiBoZWlnaHQ9IjE2MCIgZmlsdGVyPSJ1cmwoI25vaXNlKSIgb3BhY2l0eT0iMC4xNSIvPjwvc3ZnPg==')] opacity-20"></div>
      </div>

      <Tabs defaultValue="overview" className="flex w-full relative">
        {/* Sidebar */}
        <div className="w-64 border-r border-primary/20 p-4 space-y-2 backdrop-blur-sm bg-black/50">
          <div className="flex flex-col items-center mb-6">
            <h1 className="text-xl font-bold text-primary text-center mb-2">Infinity Gaming</h1>
            <div className="flex w-full justify-end">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleLogout}
                className="hover:bg-primary/20"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <TabsList className="flex flex-col w-full space-y-2">
            <TabsTrigger 
              value="overview"
              className="w-full justify-start px-4 py-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary hover:bg-primary/10 transition-all duration-200"
            >
              <GamepadIcon className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="sessions"
              className="w-full justify-start px-4 py-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary hover:bg-primary/10 transition-all duration-200"
            >
              <ClockIcon className="w-4 h-4 mr-2" />
              Gaming Sessions
            </TabsTrigger>
            <TabsTrigger 
              value="customers"
              className="w-full justify-start px-4 py-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary hover:bg-primary/10 transition-all duration-200"
            >
              <Users className="w-4 h-4 mr-2" />
              Customer Portal
            </TabsTrigger>
            <TabsTrigger 
              value="analytics"
              className="w-full justify-start px-4 py-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary hover:bg-primary/10 transition-all duration-200"
            >
              <BarChart className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="reports"
              className="w-full justify-start px-4 py-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary hover:bg-primary/10 transition-all duration-200"
            >
              <FileText className="w-4 h-4 mr-2" />
              Reports
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 backdrop-blur-sm bg-black/50">
          <TabsContent value="overview">
            {/* Dashboard Content */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-4">Gaming Lounge Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Quick Stats Cards */}
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">12</div>
                    <p className="text-xs text-muted-foreground">+2 from yesterday</p>
                  </CardContent>
                </Card>
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">$1,234</div>
                    <p className="text-xs text-muted-foreground">+15% from yesterday</p>
                  </CardContent>
                </Card>
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">New Customers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">8</div>
                    <p className="text-xs text-muted-foreground">+3 from yesterday</p>
                  </CardContent>
                </Card>
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Points Awarded</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">1,850</div>
                    <p className="text-xs text-muted-foreground">+220 from yesterday</p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Recent Activity */}
              <h3 className="text-xl font-semibold mt-8 mb-4">Recent Activity</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-lg">Station Activity</CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-[300px] overflow-auto">
                    <div className="space-y-4">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="flex items-center p-2 rounded-lg bg-primary/5 hover:bg-primary/10">
                          <div className="mr-4 p-2 rounded-full bg-primary/20">
                            <Gamepad2 className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium">Station {i} activated</p>
                            <p className="text-xs text-muted-foreground">{i * 10} minutes ago</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-lg">Customer Activity</CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-[300px] overflow-auto">
                    <div className="space-y-4">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="flex items-center p-2 rounded-lg bg-primary/5 hover:bg-primary/10">
                          <div className="mr-4 p-2 rounded-full bg-primary/20">
                            <Users className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium">New customer registered</p>
                            <p className="text-xs text-muted-foreground">{i * 15} minutes ago</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
                <Card className="backdrop-blur-sm bg-white/10 border-primary/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Active Sessions
                    </CardTitle>
                    <GamepadIcon className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stations?.filter(s => s.currentCustomer)?.length || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      stations in use
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="p-6 text-center">
                <h3 className="text-xl font-semibold mb-2">Gaming Stations Overview</h3>
                <p className="text-muted-foreground">Game stations have been moved to the Sessions tab</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    const sessionsTab = document.querySelector('[data-value="sessions"]') as HTMLElement;
                    if (sessionsTab) sessionsTab.click();
                  }}
                >
                  Go to Sessions
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sessions">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Gaming Sessions</h2>
              <div className="flex space-x-2">
                <select 
                  className="bg-black/40 border border-primary/20 rounded px-3 py-1 text-sm"
                  onChange={(e) => {
                    // Filter implementation would go here
                    console.log("Filter by:", e.target.value);
                  }}
                >
                  <option value="all">All Stations</option>
                  <option value="active">Active Only</option>
                  <option value="available">Available Only</option>
                </select>
                <select 
                  className="bg-black/40 border border-primary/20 rounded px-3 py-1 text-sm"
                  onChange={(e) => {
                    // Sort implementation would go here
                    console.log("Sort by:", e.target.value);
                  }}
                >
                  <option value="name">Sort by Name</option>
                  <option value="duration">Sort by Duration</option>
                  <option value="game">Sort by Game</option>
                </select>
                <input 
                  type="text" 
                  placeholder="Search stations or customers..." 
                  className="bg-black/40 border border-primary/20 rounded px-3 py-1 text-sm"
                />
              </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="backdrop-blur-sm bg-white/10 border-primary/20">
                <CardContent className="pt-4">
                  <div className="text-sm font-medium mb-1">Active Sessions</div>
                  <div className="text-2xl font-bold">{stations?.filter(s => s.currentCustomer)?.length || 0} / {stations?.length || 0}</div>
                </CardContent>
              </Card>
              <Card className="backdrop-blur-sm bg-white/10 border-primary/20">
                <CardContent className="pt-4">
                  <div className="text-sm font-medium mb-1">Avg. Session Duration</div>
                  <div className="text-2xl font-bold">45 min</div>
                </CardContent>
              </Card>
              <Card className="backdrop-blur-sm bg-white/10 border-primary/20">
                <CardContent className="pt-4">
                  <div className="text-sm font-medium mb-1">Most Popular Game</div>
                  <div className="text-2xl font-bold">FC25</div>
                </CardContent>
              </Card>
              <Card className="backdrop-blur-sm bg-white/10 border-primary/20">
                <CardContent className="pt-4">
                  <div className="text-sm font-medium mb-1">Today's Revenue</div>
                  <div className="text-2xl font-bold">KSH 2,500</div>
                </CardContent>
              </Card>
            </div>

            {/* Batch Actions */}
            <div className="flex justify-end mb-4 space-x-2">
              <Button variant="outline" size="sm">
                <ClockIcon className="mr-2 h-4 w-4" />
                End All Sessions
              </Button>
              <Button variant="outline" size="sm">
                <TrophyIcon className="mr-2 h-4 w-4" />
                Award Bonus Points
              </Button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {stations?.map((station) => (
                  <Card key={station.id} className="backdrop-blur-sm bg-white/10 border-primary/20">
                    <CardHeader>
                      <CardTitle>{station.name}</CardTitle>
                      <CardDescription>
                        {station.currentCustomer ? (
                          <>
                            Customer: {station.currentCustomer}
                            <br />
                            Game: {station.currentGame}
                            <br />
                            Session: {station.sessionType === "per_game" ? "40 KES/game" : "200 KES/hour"}
                          </>
                        ) : (
                          "Available"
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {station.currentCustomer ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Timer className="h-4 w-4" />
                              <span>Started: {new Date(station.sessionStartTime!).toLocaleTimeString()}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs text-muted-foreground">Duration</span>
                              <div className="text-lg font-bold text-primary">
                                {(() => {
                                  // Calculate elapsed time
                                  const startTime = new Date(station.sessionStartTime!);
                                  const now = new Date();
                                  const diffMs = now.getTime() - startTime.getTime();
                                  const diffMins = Math.floor(diffMs / 60000);
                                  const diffHrs = Math.floor(diffMins / 60);
                                  const remainingMins = diffMins % 60;
                                  return `${diffHrs}h ${remainingMins}m`;
                                })()}
                              </div>
                            </div>
                          </div>
                          <div className="mt-2">
                            <Progress value={(() => {
                              // For per_hour sessions, show percentage of hour completed
                              if (station.sessionType === "per_hour") {
                                const startTime = new Date(station.sessionStartTime!);
                                const now = new Date();
                                const diffMs = now.getTime() - startTime.getTime();
                                const diffMins = Math.floor(diffMs / 60000);
                                return Math.min((diffMins / 60) * 100, 100);
                              }
                              return 100; // For per_game sessions
                            })()} className="h-2" />
                          </div>
                          <Button
                            variant="destructive"
                            className="w-full"
                            onClick={async () => {
                              try {
                                await apiRequest("PATCH", `/api/stations/${station.id}`, {
                                  currentCustomer: null,
                                  currentGame: null,
                                  sessionType: null,
                                  sessionStartTime: null
                                });
                              } catch (error: any) {
                                toast({
                                  variant: "destructive",
                                  title: "Failed to end session",
                                  description: error.message
                                });
                              }
                            }}
                          >
                            End Session
                          </Button>
                        </div>
                      ) : (
                        <Button
                          className="w-full"
                          onClick={() => {
                            setSelectedStation(station);
                            setShowPayment(true);
                          }}
                        >
                          Start Session
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* Recent Session History */}
              <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">Recent Session History</h3>
                  <Button variant="outline" size="sm">
                    View All History
                  </Button>
                </div>
                
                <Card className="backdrop-blur-sm bg-white/10 border-primary/20">
                  <CardContent className="p-0">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-primary/20">
                          <th className="text-left p-4">Customer</th>
                          <th className="text-left p-4">Station</th>
                          <th className="text-left p-4">Game</th>
                          <th className="text-left p-4">Duration</th>
                          <th className="text-left p-4">Amount</th>
                          <th className="text-left p-4">Time</th>
                          <th className="text-left p-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-primary/10 hover:bg-white/5">
                          <td className="p-4">John Doe</td>
                          <td className="p-4">Game Station 1</td>
                          <td className="p-4">FC25</td>
                          <td className="p-4">1h 24m</td>
                          <td className="p-4">KSH 280</td>
                          <td className="p-4">Today, 3:45 PM</td>
                          <td className="p-4">
                            <Button variant="ghost" size="sm">View</Button>
                          </td>
                        </tr>
                        <tr className="border-b border-primary/10 hover:bg-white/5">
                          <td className="p-4">Jane Smith</td>
                          <td className="p-4">Game Station 3</td>
                          <td className="p-4">NBA 2K25</td>
                          <td className="p-4">45m</td>
                          <td className="p-4">KSH 160</td>
                          <td className="p-4">Today, 2:30 PM</td>
                          <td className="p-4">
                            <Button variant="ghost" size="sm">View</Button>
                          </td>
                        </tr>
                        <tr className="hover:bg-white/5">
                          <td className="p-4">Mike Johnson</td>
                          <td className="p-4">Game Station 2</td>
                          <td className="p-4">GTA V</td>
                          <td className="p-4">2h 15m</td>
                          <td className="p-4">KSH 450</td>
                          <td className="p-4">Today, 11:20 AM</td>
                          <td className="p-4">
                            <Button variant="ghost" size="sm">View</Button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="customers">
            <CustomerPortal />
          </TabsContent>

          <TabsContent value="analytics">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-4">Gaming Analytics</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Usage Analytics */}
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader>
                    <CardTitle>Station Usage</CardTitle>
                    <CardDescription>Station utilization over time</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <div className="flex items-center justify-center h-full bg-primary/5 rounded-md">
                      <div className="text-center">
                        <BarChart className="h-12 w-12 mx-auto text-primary opacity-50" />
                        <p className="mt-4 text-sm text-muted-foreground">Station Usage Chart</p>
                        <p className="text-xs text-muted-foreground">(Data visualization will appear here)</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Game Popularity */}
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader>
                    <CardTitle>Game Popularity</CardTitle>
                    <CardDescription>Most played games this month</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <div className="flex items-center justify-center h-full bg-primary/5 rounded-md">
                      <div className="text-center">
                        <PieChart className="h-12 w-12 mx-auto text-primary opacity-50" />
                        <p className="mt-4 text-sm text-muted-foreground">Game Popularity Chart</p>
                        <p className="text-xs text-muted-foreground">(Data visualization will appear here)</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Customer Retention */}
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader>
                    <CardTitle>Customer Retention</CardTitle>
                    <CardDescription>Returning vs. new customers</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <div className="flex items-center justify-center h-full bg-primary/5 rounded-md">
                      <div className="text-center">
                        <LineChart className="h-12 w-12 mx-auto text-primary opacity-50" />
                        <p className="mt-4 text-sm text-muted-foreground">Customer Retention Chart</p>
                        <p className="text-xs text-muted-foreground">(Data visualization will appear here)</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Peak Hours */}
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader>
                    <CardTitle>Peak Hours</CardTitle>
                    <CardDescription>Busiest hours of operation</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <div className="flex items-center justify-center h-full bg-primary/5 rounded-md">
                      <div className="text-center">
                        <BarChart className="h-12 w-12 mx-auto text-primary opacity-50" />
                        <p className="mt-4 text-sm text-muted-foreground">Peak Hours Chart</p>
                        <p className="text-xs text-muted-foreground">(Data visualization will appear here)</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reports">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-4">Financial Reports</h2>
              
              <div className="flex justify-between items-center mb-6">
                <div className="space-x-2">
                  <Button variant="outline">
                    <Calendar className="mr-2 h-4 w-4" />
                    This Week
                  </Button>
                  <Button variant="outline">
                    <Calendar className="mr-2 h-4 w-4" />
                    This Month
                  </Button>
                  <Button variant="outline">
                    <Calendar className="mr-2 h-4 w-4" />
                    Custom Range
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="default">
                    <FileText className="mr-2 h-4 w-4" />
                    Export Report
                  </Button>
                  <Button variant="outline">
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                  </Button>
                </div>
              </div>
              
              {/* Revenue Summary */}
              <Card className="bg-black/30 border-primary/20 mb-6">
                <CardHeader>
                  <CardTitle>Revenue Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-primary/10 rounded-lg">
                      <p className="text-sm text-muted-foreground">Today</p>
                      <p className="text-2xl font-bold">$1,234</p>
                    </div>
                    <div className="p-4 bg-primary/10 rounded-lg">
                      <p className="text-sm text-muted-foreground">This Week</p>
                      <p className="text-2xl font-bold">$5,678</p>
                    </div>
                    <div className="p-4 bg-primary/10 rounded-lg">
                      <p className="text-sm text-muted-foreground">This Month</p>
                      <p className="text-2xl font-bold">$15,890</p>
                    </div>
                    <div className="p-4 bg-primary/10 rounded-lg">
                      <p className="text-sm text-muted-foreground">Year to Date</p>
                      <p className="text-2xl font-bold">$127,560</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Revenue by Service */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader>
                    <CardTitle>Revenue by Service Type</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <div className="flex items-center justify-center h-full bg-primary/5 rounded-md">
                      <div className="text-center">
                        <PieChart className="h-12 w-12 mx-auto text-primary opacity-50" />
                        <p className="mt-4 text-sm text-muted-foreground">Service Revenue Chart</p>
                        <p className="text-xs text-muted-foreground">(Data visualization will appear here)</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader>
                    <CardTitle>Daily Revenue Trends</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <div className="flex items-center justify-center h-full bg-primary/5 rounded-md">
                      <div className="text-center">
                        <LineChart className="h-12 w-12 mx-auto text-primary opacity-50" />
                        <p className="mt-4 text-sm text-muted-foreground">Daily Revenue Chart</p>
                        <p className="text-xs text-muted-foreground">(Data visualization will appear here)</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Transactions Table */}
              <Card className="bg-black/30 border-primary/20 mt-6">
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-primary/20">
                          <th className="text-left p-2">Transaction ID</th>
                          <th className="text-left p-2">Customer</th>
                          <th className="text-left p-2">Service</th>
                          <th className="text-left p-2">Amount</th>
                          <th className="text-left p-2">Date</th>
                          <th className="text-left p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[1, 2, 3, 4, 5].map(i => (
                          <tr key={i} className="border-b border-primary/10 hover:bg-primary/5">
                            <td className="p-2">TX-{1000 + i}</td>
                            <td className="p-2">Customer {i}</td>
                            <td className="p-2">Gaming Session</td>
                            <td className="p-2">${20 + i * 5}</td>
                            <td className="p-2">{new Date().toLocaleDateString()}</td>
                            <td className="p-2"><span className="px-2 py-1 rounded-full bg-green-500/20 text-green-500 text-xs">Completed</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {showPayment && selectedStation && (
        <PaymentModal
          station={selectedStation}
          onClose={() => {
            setShowPayment(false);
            setSelectedStation(null);
          }}
        />
      )}
    </div>
  );
}
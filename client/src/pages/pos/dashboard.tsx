import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, GamepadIcon, BarChart2Icon, DollarSignIcon, UsersIcon } from "lucide-react";
import InfinityLogo from "@/components/animations/InfinityLogo";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import PaymentModal from "@/components/shared/PaymentModal";
import CustomerPortal from "@/pages/customer/portal";
import type { GameStation, Game } from "@shared/schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUp, ArrowDown, Download, Printer } from "lucide-react";


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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white relative overflow-hidden">
      {/* Background patterns - keep existing */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYwIiBoZWlnaHQ9IjE2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZSIgeD0iMCIgeT0iMCI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNzUiIG51bU9jdGF2ZXM9IjQiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMTYwIiBoZWlnaHQ9IjE2MCIgZmlsdGVyPSJ1cmwoI25vaXNlKSIgb3BhY2l0eT0iMC4xNSIvPjwvc3ZnPg==')] opacity-20"></div>
      </div>

      {/* Center Logo - Make it responsive */}

                <Card className="bg-black/30 border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Top Games</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Mock top games data */}
                      {[
                        { name: "FIFA 24", sessions: 42, platform: "PS5" },
                        { name: "Call of Duty", sessions: 38, platform: "Xbox" },
                        { name: "Fortnite", sessions: 27, platform: "PC" },
                        { name: "Mortal Kombat", sessions: 23, platform: "PS5" },
                      ].map((game, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="text-sm font-medium">{game.name}</span>
                            <Badge variant="outline" className="ml-2 text-xs">
                              {game.platform}
                            </Badge>
                          </div>
                          <span className="text-sm">{game.sessions} sessions</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

      <div className="w-full flex justify-center items-center py-2 sm:py-4 z-10 relative">
        <div className="flex flex-col items-center">
          <InfinityLogo className="w-16 h-16 sm:w-24 sm:h-24" />
          <h1 className="text-xl sm:text-2xl font-bold text-primary">INFINITY GAMING LOUNGE</h1>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleLogout} 
            className="hover:bg-primary/20 mt-2"
          >
            <UsersIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="flex flex-col md:flex-row w-full relative">
        {/* Sidebar - Make it collapsible on mobile */}
        <div className="w-full md:w-64 border-b md:border-r border-primary/20 p-2 sm:p-4 space-y-2 backdrop-blur-sm bg-black/50">
          <TabsList className="flex flex-row md:flex-col w-full space-x-2 md:space-x-0 md:space-y-2 overflow-x-auto md:overflow-x-visible">
            <TabsTrigger value="overview" className="flex-1 md:flex-none justify-start px-4 py-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary hover:bg-primary/10 transition-all duration-200">
              <GamepadIcon className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="sessions" className="flex-1 md:flex-none justify-start px-4 py-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary hover:bg-primary/10 transition-all duration-200">
              <CalendarIcon className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Sessions</span>
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex-1 md:flex-none justify-start px-4 py-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary hover:bg-primary/10 transition-all duration-200">
              <UsersIcon className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Customers</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex-1 md:flex-none justify-start px-4 py-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary hover:bg-primary/10 transition-all duration-200">
              <BarChart2Icon className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex-1 md:flex-none justify-start px-4 py-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary hover:bg-primary/10 transition-all duration-200">
              <DollarSignIcon className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Reports</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex-1 md:flex-none justify-start px-4 py-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary hover:bg-primary/10 transition-all duration-200">
              <DollarSignIcon className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Payments</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Main Content Area - Make it responsive */}
        <div className="flex-1 p-2 sm:p-4 md:p-6 backdrop-blur-sm bg-black/50 overflow-x-hidden">
          <TabsContent value="overview">
            <div className="space-y-4 sm:space-y-6">
              {/* Stats Grid - Make it responsive */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg sm:text-2xl font-bold">
                      {stations?.filter(s => s.currentCustomer)?.length || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">+2 from last hour</p>
                  </CardContent>
                </Card>
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg sm:text-2xl font-bold">KSH 1,250.00</div>
                    <p className="text-xs text-muted-foreground">+$350 from yesterday</p>
                  </CardContent>
                </Card>
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">New Customers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg sm:text-2xl font-bold">8</div>
                    <p className="text-xs text-muted-foreground">+3 from yesterday</p>
                  </CardContent>
                </Card>
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Points Awarded</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg sm:text-2xl font-bold">1,850</div>
                    <p className="text-xs text-muted-foreground">+220 from yesterday</p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity Section - Make it responsive */}
              <h3 className="text-lg sm:text-xl font-semibold mt-6 sm:mt-8 mb-4">Recent Activity</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Station Activity</CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-[300px] overflow-auto">
                    <div className="space-y-3 sm:space-y-4">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">Station {i}</p>
                            <p className="text-sm text-muted-foreground">Call of Duty: Warzone</p>
                          </div>

            <Card className="bg-black/40 border-primary/20 mt-6">
              <CardHeader>
                <CardTitle>Upcoming Reservations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Mock reservation data */}
                  {[
                    { name: "John Doe", time: "3:00 PM", duration: "2 hours", stations: 2, status: "confirmed" },
                    { name: "Jane Smith", time: "4:30 PM", duration: "3 hours", stations: 1, status: "pending" },
                    { name: "Team Apex", time: "6:00 PM", duration: "4 hours", stations: 4, status: "confirmed" },
                  ].map((reservation, i) => (
                    <div key={i} className="flex items-center justify-between bg-black/20 p-3 rounded-md">
                      <div>
                        <div className="font-medium">{reservation.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {reservation.time} • {reservation.duration} • {reservation.stations} {reservation.stations > 1 ? 'stations' : 'station'}
                        </div>
                      </div>
                      <Badge variant={reservation.status === "confirmed" ? "default" : "outline"}>
                        {reservation.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

                          <Badge variant={i % 2 === 0 ? "default" : "secondary"}>
                            {i % 2 === 0 ? "Active" : "Ending Soon"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black/30 border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Latest Transactions</CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-[300px] overflow-auto">
                    <div className="space-y-3 sm:space-y-4">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">Customer {i}</p>
                            <p className="text-sm text-muted-foreground">{new Date().toLocaleTimeString()}</p>
                          </div>
                          <p className="font-medium">KSH {(Math.random() * 100).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions - Make it responsive */}
              <div className="mt-4 sm:mt-6">
                <h3 className="text-lg sm:text-xl font-semibold mb-4">Quick Actions</h3>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <Button variant="default">New Session</Button>
                  <Button variant="outline">View Reports</Button>
                  <Button variant="outline">Manage Stations</Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sessions">
            {/* Sessions Tab Content */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Gaming Sessions</h2>
                <Button variant="default">New Session</Button>
              </div>

              {/* Active Sessions */}
              <Card className="bg-black/30 border-primary/20">
                <CardHeader>
                  <CardTitle>Active Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stations?.filter(station => station.currentCustomer).map((station) => (
                      <Card key={station.id} className="bg-primary/5 border-primary/10">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between">
                            <CardTitle className="text-sm font-medium">Station #{station.id}</CardTitle>
                            <Badge>Active</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xs text-muted-foreground mb-1">Customer</p>
                          <p className="font-medium">{station.currentCustomer}</p>

                          <div className="grid grid-cols-2 gap-2 mt-3">
                            <div>
                              <p className="text-xs text-muted-foreground">Game</p>
                              <p className="font-medium">{station.currentGame}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Time Left</p>
                              <p className="font-medium">
                                {(() => {
                                  const startTime = new Date(station.sessionStartTime!);
                                  const now = new Date();
                                  const diffMs = now.getTime() - startTime.getTime();
                                  const diffMins = Math.floor(diffMs / 60000);
                                  return `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`;
                                })()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Started</p>
                              <p className="font-medium">{new Date(station.sessionStartTime!).toLocaleTimeString()}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Amount</p>
                              <p className="font-medium">KSH {station.sessionType === "per_game" ? "40" : "200"}</p>
                            </div>
                          </div>

                          <div className="flex gap-2 mt-4">
                            <Button size="sm" variant="outline" className="flex-1" onClick={async () => {
                              try {
                                await apiRequest("PATCH", `/api/stations/${station.id}`, {
                                  sessionStartTime: new Date().toISOString() 
                                });
                              } catch (error: any) {
                                toast({
                                  variant: "destructive",
                                  title: "Failed to extend session",
                                  description: error.message
                                });
                              }
                            }}>Extend</Button>
                            <Button size="sm" variant="destructive" className="flex-1" onClick={async () => {
                              try {
                                await apiRequest("PATCH", `/api/stations/${station.id}`, {
                                  currentCustomer: null,
                                  currentGame: null,
                                  sessionType: null,
                                  sessionStartTime: null
                                });

                                toast({
                                  title: "Session ended",
                                  description: "Payment has been added to the pending payments list"
                                });

                              } catch (error: any) {
                                toast({
                                  variant: "destructive",
                                  title: "Failed to end session",
                                  description: error.message
                                });
                              }
                            }}>End</Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Available Stations */}
              <Card className="bg-black/30 border-primary/20">
                <CardHeader>
                  <CardTitle>Available Stations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {stations?.filter(station => !station.currentCustomer).map((station) => (
                      <Card key={station.id} className="bg-green-900/20 border-green-500/20">
                        <CardContent className="p-4 text-center">
                          <p className="font-bold text-lg">Station #{station.id}</p>
                          <Badge variant="outline" className="mt-2 bg-green-500/20">Available</Badge>
                          <Button size="sm" className="w-full mt-3" onClick={() => {
                            setSelectedStation(station);
                            setShowPayment(true);
                          }}>Start Session</Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Sessions */}
              <Card className="bg-black/30 border-primary/20">
                <CardHeader>
                  <CardTitle>Recent Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="flex justify-between items-center p-3 border border-primary/10 rounded-md">
                        <div>
                          <p className="font-medium">Station #{Math.floor(Math.random() * 10) + 1}</p>
                          <p className="text-sm text-muted-foreground">Customer: Alex Smith</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">KSH {(Math.random() * 50).toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">2 hours</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="customers">
            {/* Customers Tab Content */}
            <div>
              <h3 className="text-2xl font-bold mb-4">Customer Management</h3>
              <CustomerPortal />
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold">Analytics Dashboard</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card className="bg-black/40 border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue (Today)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">KSH {stations?.reduce((sum, station) => {
                      if (station.currentCustomer) {
                        return sum + (station.sessionType === "per_game" ? station.baseRate : station.hourlyRate)
                      }
                      return sum
                    }, 0) || 0}</div>
                    <p className="text-xs text-muted-foreground">+2.5% from yesterday</p>
                  </CardContent>
                </Card>

                <Card className="bg-black/40 border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stations?.filter(s => s.currentCustomer).length || 0}</div>
                    <p className="text-xs text-muted-foreground">Out of {stations?.length || 0} stations</p>
                  </CardContent>
                </Card>

                <Card className="bg-black/40 border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Most Popular Game</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(() => {
                        const gameCounts = {};
                        stations?.forEach(station => {
                          if (station.currentGame) {
                            gameCounts[station.currentGame] = (gameCounts[station.currentGame] || 0) + 1;
                          }
                        });
                        const entries = Object.entries(gameCounts);
                        if (entries.length === 0) return "N/A";
                        return entries.sort((a, b) => b[1] - a[1])[0][0];
                      })()}
                    </div>
                    <p className="text-xs text-muted-foreground">Currently being played</p>
                  </CardContent>
                </Card>

                <Card className="bg-black/40 border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Average Session Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(() => {
                        const activeSessions = stations?.filter(s => s.sessionStartTime && s.currentCustomer) || [];
                        if (activeSessions.length === 0) return "0 min";
                        const totalMinutes = activeSessions.reduce((sum, s) => {
                          const startTime = new Date(s.sessionStartTime);
                          const now = new Date();
                          return sum + Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
                        }, 0);
                        return `${Math.floor(totalMinutes / activeSessions.length)} min`;
                      })()}
                    </div>
                    <p className="text-xs text-muted-foreground">For active sessions</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Revenue Trends */}
                <Card className="bg-black/40 border-primary/20 col-span-1">
                  <CardHeader>
                    <CardTitle>Station Utilization</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-full flex flex-col">
                        {/* Station usage donut chart */}
                        <div className="flex-1 flex items-center justify-center relative">
                          <div className="w-48 h-48 rounded-full border-8 border-primary/20 relative">
                            {stations && (
                              <>
                                <div 
                                  className="absolute inset-0 rounded-full border-8 border-primary" 
                                  style={{ 
                                    clipPath: `polygon(50% 50%, 50% 0%, ${
                                      50 + 50 * Math.sin((stations.filter(s => s.currentCustomer).length / stations.length) * Math.PI * 2)
                                    }% ${
                                      50 - 50 * Math.cos((stations.filter(s => s.currentCustomer).length / stations.length) * Math.PI * 2)
                                    }%, 50% 50%)` 
                                  }}
                                ></div>
                                <div className="absolute inset-0 flex items-center justify-center flex-col">
                                  <span className="text-3xl font-bold">{
                                    stations?.filter(s => s.currentCustomer)?.length || 0
                                  }/{stations?.length || 0}</span>
                                  <span className="text-xs text-muted-foreground">Stations in use</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between px-4 py-4">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-primary mr-2"></div>
                            <span className="text-xs">Active</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-primary/20 mr-2"></div>
                            <span className="text-xs">Available</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-black/40 border-primary/20 col-span-1">
                  <CardHeader>
                    <CardTitle>Revenue Trends (7 Days)</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-full flex flex-col">
                        <div className="flex-1 flex">
                          {/* Mock bar chart */}
                          {Array.from({ length: 7 }).map((_, i) => {
                            const height = 30 + Math.random() * 70;
                            return (
                              <div key={i} className="flex-1 flex items-end pb-8">
                                <div 
                                  className="w-full mx-1 rounded-t-sm bg-gradient-to-t from-primary/50 to-primary/80" 
                                  style={{ height: `${height}%` }}
                                ></div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex justify-between px-2 text-xs text-muted-foreground">
                          <span>Mon</span>
                          <span>Tue</span>
                          <span>Wed</span>
                          <span>Thu</span>
                          <span>Fri</span>
                          <span>Sat</span>
                          <span>Sun</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Game Popularity */}
                <Card className="bg-black/40 border-primary/20 col-span-1">
                  <CardHeader>
                    <CardTitle>Game Popularity</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    <div className="h-full flex flex-col justify-center">
                      {/* Game popularity bars */}
                      {games?.slice(0, 5).map((game, i) => {
                        const randomPercent = 20 + Math.random() * 80;
                        return (
                          <div key={i} className="mb-6 last:mb-0">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium">{game.name}</span>
                              <span className="text-sm font-medium">{Math.floor(randomPercent)}%</span>
                            </div>
                            <div className="h-2 w-full bg-primary/20 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${randomPercent}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Hourly Traffic */}
                <Card className="bg-black/40 border-primary/20 col-span-1 lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Hourly Traffic</CardTitle>
                  </CardHeader>
                  <CardContent className="h-60 relative">
                    <div className="absolute inset-0 px-4">
                      <div className="h-full flex items-end">
                        {/* Mock line chart */}
                        <svg className="w-full h-full" viewBox="0 0 24 10" preserveAspectRatio="none">
                          <path 
                            d="M0,10 C1,8 2,9 3,7 C4,5 5,6 6,4 C7,2 8,3 9,3 C10,3 11,5 12,4 C13,3 14,2 15,3 C16,4 17,5 18,4 C19,3 20,2 21,1 C22,0 23,1 24,2" 
                            fill="none" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth="0.2" 
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-muted-foreground px-2">
                        <span>9AM</span>
                        <span>12PM</span>
                        <span>3PM</span>
                        <span>6PM</span>
                        <span>9PM</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Customer Breakdown */}
                <Card className="bg-black/40 border-primary/20 col-span-1">
                  <CardHeader>
                    <CardTitle>Customer Types</CardTitle>
                  </CardHeader>
                  <CardContent className="h-60 flex items-center justify-center">
                    {/* Mock donut chart */}
                    <div className="relative w-36 h-36">
                      <svg viewBox="0 0 36 36">
                        <path 
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="hsl(var(--primary))"
                          strokeWidth="2"
                          strokeDasharray="60, 100"
                        />
                        <path 
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="hsl(var(--primary) / 0.5)"
                          strokeWidth="2"
                          strokeDasharray="25, 100"
                          strokeDashoffset="-60"
                        />
                        <path 
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="hsl(var(--primary) / 0.2)"
                          strokeWidth="2"
                          strokeDasharray="15, 100"
                          strokeDashoffset="-85"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-medium">Total: 100</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center mb-2">
                        <div className="w-3 h-3 rounded-full bg-primary mr-2"></div>
                        <span className="text-sm">Regular (60%)</span>
                      </div>
                      <div className="flex items-center mb-2">
                        <div className="w-3 h-3 rounded-full bg-primary/50 mr-2"></div>
                        <span className="text-sm">New (25%)</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-primary/20 mr-2"></div>
                        <span className="text-sm">VIP (15%)</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reports">
            {/* Reports Tab Content */}
            <div>
              <h3 className="text-2xl font-bold mb-4">Financial Reports</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Customers</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>2023-10-26</TableCell>
                    <TableCell>1200</TableCell>
                    <TableCell>5</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>2023-10-27</TableCell>
                    <TableCell>1500</TableCell>
                    <TableCell>7</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>2023-10-28</TableCell>
                    <TableCell>1000</TableCell>
                    <TableCell>3</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="payments">
            <div className="space-y-6">
              <h3 className="text-2xl font-bold">Payments</h3>

              {/* Pending Payments Section */}
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>Pending Payments</span>
                    <Badge variant="secondary">3</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex justify-between items-center p-3 rounded-md bg-primary/5">
                        <div>
                          <p className="font-medium">Customer {i+1}</p>
                          <p className="text-sm text-muted-foreground">
                            Game Station {i+1} • {Math.floor(Math.random() * 60) + 30} min
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">KSH {(Math.random() * 500 + 200).toFixed(2)}</p>
                          <div className="flex gap-2 mt-2">
                            <select className="text-xs p-1 rounded border border-primary/20 bg-primary/5">
                              <option value="">Payment Method</option>
                              <option value="cash">Cash</option>
                              <option value="mpesa">M-Pesa</option>
                              <option value="airtel">Airtel Money</option>
                            </select>
                            <Button size="sm" variant="default" className="text-xs">Pay</Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Payment Statistics Section */}
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle>Payment Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-primary/5 p-3 rounded-md">
                      <p className="text-sm text-mutedforeground">Today</p>
                      <p className="text-xl font-bold">KSH 12,500</p>
                      <p className="text-xs text-green-500">+15% from yesterday</p>
                    </div>
                    <div className="bg-primary/5 p-3 rounded-md">
                      <p className="text-sm text-muted-foreground">This Week</p>
                      <p className="text-xl font-bold">KSH 68,200</p>
                      <p className="text-xs text-green-500">+8% from last week</p>
                    </div>
                    <div className="bg-primary/5 p-3 rounded-md">
                      <p className="text-sm text-muted-foreground">This Month</p>
                      <p className="text-xl font-bold">KSH 245,800</p>
                      <p className="text-xs text-green-500">+12% from last month</p>
                    </div>
                  </div>

                  {/* Payment Method Breakdown */}
                  <div className="mt-4">
                    <p className="font-medium mb-2">Payment Method Breakdown</p>
                    <div className="bg-primary/5 p-3 rounded-md">
                      <div className="flex justify-between items-center mb-2">
                        <span>Cash</span>
                        <span>35%</span>
                      </div>
                      <div className="w-full bg-gray-300 rounded-full h-2.5">
                        <div className="bg-green-600 h-2.5 rounded-full" style={{ width: '35%' }}></div>
                      </div>

                      <div className="flex justify-between items-center mb-2 mt-3">
                        <span>M-Pesa</span>
                        <span>55%</span>
                      </div>
                      <div className="w-full bg-gray-300 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '55%' }}></div>
                      </div>

                      <div className="flex justify-between items-center mb-2 mt-3">
                        <span>Airtel Money</span>
                        <span>10%</span>
                      </div>
                      <div className="w-full bg-gray-300 rounded-full h-2.5">
                        <div className="bg-orange-600 h-2.5 rounded-full" style={{ width: '10%' }}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Transactions Section */}
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>Recent Transactions</span>
                    <Button size="sm" variant="outline">Print Receipt</Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex justify-between items-center p-3 rounded-md bg-primary/5">
                        <div>
                          <p className="font-medium">Transaction #{10045 + i}</p>
                          <div className="flex gap-2 items-center">
                            <p className="text-xs text-muted-foreground">
                              {new Date(Date.now() - i * 60 * 60 * 1000).toLocaleTimeString()}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {['Cash', 'M-Pesa', 'Airtel Money'][i % 3]}
                            </Badge>
                            {i % 2 === 0 && <Badge variant="secondary" className="text-xs">10% Discount</Badge>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">KSH {(Math.random() * 500 + 200).toFixed(2)}</p>
                          <p className="text-xs text-primary">+{Math.floor(Math.random() * 50 + 20)} points</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Button variant="outline" className="h-auto flex flex-col items-center py-3">
                      <span className="text-sm">Apply Discount</span>
                    </Button>
                    <Button variant="outline" className="h-auto flex flex-col items-center py-3">
                      <span className="text-sm">Split Payment</span>
                    </Button>
                    <Button variant="outline" className="h-auto flex flex-col items-center py-3">
                      <span className="text-sm">Verify Payment</span>
                    </Button>
                    <Button variant="outline" className="h-auto flex flex-col items-center py-3">
                      <span className="text-sm">Redeem Points</span>
                    </Button>
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
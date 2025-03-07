import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, GamepadIcon, BarChart2Icon, DollarSignIcon, UsersIcon } from "lucide-react";
import InfinityLogo from "@/components/animations/InfinityLogo";
import { useState } from "react";
import { useLocation } from "wouter";
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYwIiBoZWlnaHQ9IjE2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZSIgeD0iMCIgeT0iMCI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNzUiIG51bU9jdGF2ZXM9IjQiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMTYwIiBoZWlnaHQ9IjE2MCIgZmlsdGVyPSJ1cmwoI25vaXNlKSIgb3BhY2l0eT0iMC4xNSIvPjwvc3ZnPg==')] opacity-20"></div>
      </div>

      {/* Center Logo */}
      <div className="w-full flex justify-center items-center py-4 z-10 relative">
        <div className="flex flex-col items-center">
          <InfinityLogo className="w-24 h-24" />
          <h1 className="text-2xl font-bold text-primary">INFINITY GAMING LOUNGE</h1>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="hover:bg-primary/20">
            <UsersIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="flex w-full relative">
        {/* Sidebar */}
        <div className="w-64 border-r border-primary/20 p-4 space-y-2 backdrop-blur-sm bg-black/50">
          <div className="flex items-center justify-between mb-6">
            {/* Removed POS System text */}
          </div>

          <TabsList className="flex flex-col w-full space-y-2">
            <TabsTrigger value="overview" className="w-full justify-start px-4 py-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary hover:bg-primary/10 transition-all duration-200">
              <GamepadIcon className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="sessions" className="w-full justify-start px-4 py-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary hover:bg-primary/10 transition-all duration-200">
              <CalendarIcon className="w-4 h-4 mr-2" />
              Sessions
            </TabsTrigger>
            <TabsTrigger value="customers" className="w-full justify-start px-4 py-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary hover:bg-primary/10 transition-all duration-200">
              <UsersIcon className="w-4 h-4 mr-2" />
              Customers
            </TabsTrigger>
            <TabsTrigger value="analytics" className="w-full justify-start px-4 py-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary hover:bg-primary/10 transition-all duration-200">
              <BarChart2Icon className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="reports" className="w-full justify-start px-4 py-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary hover:bg-primary/10 transition-all duration-200">
              <DollarSignIcon className="w-4 h-4 mr-2" />
              Reports
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 backdrop-blur-sm bg-black/50">
          <TabsContent value="overview">
            {/* Dashboard Content */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stations?.filter(s => s.currentCustomer)?.length || 0}</div>
                    <p className="text-xs text-muted-foreground">+2 from last hour</p>
                  </CardContent>
                </Card>
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">$1,250.00</div>
                    <p className="text-xs text-muted-foreground">+$350 from yesterday</p>
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
                        <div key={i} className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">Station {i}</p>
                            <p className="text-sm text-muted-foreground">Call of Duty: Warzone</p>
                          </div>
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
                    <CardTitle className="text-lg">Latest Transactions</CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-[300px] overflow-auto">
                    <div className="space-y-4">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">Customer {i}</p>
                            <p className="text-sm text-muted-foreground">{new Date().toLocaleTimeString()}</p>
                          </div>
                          <p className="font-medium">${(Math.random() * 100).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
                <div className="flex flex-wrap gap-3">
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
                              <p className="font-medium">{station.sessionType === "per_game" ? "40 KES/game" : "200 KES/hour"}</p>
                            </div>
                          </div>

                          <div className="flex gap-2 mt-4">
                            <Button size="sm" variant="outline" className="flex-1" onClick={async () => {
                              try {
                                await apiRequest("PATCH", `/api/stations/${station.id}`, {
                                  sessionStartTime: new Date().toISOString() //Extend session
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
                          <p className="font-medium">${(Math.random() * 50).toFixed(2)}</p>
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
            {/* Analytics Tab Content */}
            <div>
              <h3 className="text-2xl font-bold mb-4">Analytics Dashboard</h3>
              <p>This tab will display various analytical data and metrics.</p>
            </div>
          </TabsContent>

          <TabsContent value="reports">
            {/* Reports Tab Content */}
            <div>
              <h3 className="text-2xl font-bold mb-4">Financial Reports</h3>
              <p>This tab will contain financial reporting features.</p>
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
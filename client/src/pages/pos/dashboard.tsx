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

      <Tabs defaultValue="dashboard" className="flex w-full relative">
        {/* Sidebar */}
        <div className="w-64 border-r border-primary/20 p-4 space-y-2 backdrop-blur-sm bg-black/50">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-lg font-bold text-primary">Infinity Gaming</h1>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleLogout}
              className="hover:bg-primary/20"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>

          <TabsList className="flex flex-col w-full space-y-2">
            <TabsTrigger 
              value="dashboard"
              className="w-full justify-start px-4 py-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary hover:bg-primary/10 transition-all duration-200"
            >
              <GamepadIcon className="w-4 h-4 mr-2" />
              POS Dashboard
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
          <TabsContent value="dashboard">
            {/* Dashboard Content */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

                <Card className="backdrop-blur-sm bg-white/10 border-primary/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Points Earned Today
                    </CardTitle>
                    <StarIcon className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">250</div>
                    <p className="text-xs text-muted-foreground">
                      across all customers
                    </p>
                  </CardContent>
                </Card>

                <Card className="backdrop-blur-sm bg-white/10 border-primary/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Top Customer Today
                    </CardTitle>
                    <TrophyIcon className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">John Doe</div>
                    <p className="text-xs text-muted-foreground">
                      50 points earned today
                    </p>
                  </CardContent>
                </Card>

                <Card className="backdrop-blur-sm bg-white/10 border-primary/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Today's Revenue
                    </CardTitle>
                    <ActivityIcon className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">KES 12,500</div>
                    <p className="text-xs text-muted-foreground">
                      +15% from yesterday
                    </p>
                  </CardContent>
                </Card>
              </div>

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
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Timer className="h-4 w-4" />
                            <span>Session started at {new Date(station.sessionStartTime!).toLocaleTimeString()}</span>
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
            </div>
          </TabsContent>

          <TabsContent value="sessions">
            <div className="text-center text-muted-foreground py-8">
              Gaming Sessions coming soon...
            </div>
          </TabsContent>

          <TabsContent value="customers">
            <CustomerPortal />
          </TabsContent>

          <TabsContent value="analytics">
            <div className="text-center text-muted-foreground py-8">
              Analytics dashboard coming soon...
            </div>
          </TabsContent>

          <TabsContent value="reports">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Session Reports</h2>
                <div className="flex gap-2">
                  <Button variant="default">
                    <FileText className="mr-2 h-4 w-4" />
                    Current Sessions
                  </Button>
                  <Button variant="default">
                    <ClockIcon className="mr-2 h-4 w-4" />
                    Hourly Report
                  </Button>
                  <Button variant="default">
                    <BarChart className="mr-2 h-4 w-4" />
                    Daily Report
                  </Button>
                </div>
              </div>
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
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
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
import PaymentModal from "@/components/shared/PaymentModal";
import CustomerRegistrationForm from "@/components/shared/CustomerRegistrationForm";
import type { GameStation, Game } from "@shared/schema";

type ReportType = "current" | "hourly" | "daily";

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

  const DashboardOverview = () => {
    const activeSessions = stations?.filter(s => s.currentCustomer)?.length || 0;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Sessions
              </CardTitle>
              <GamepadIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeSessions}</div>
              <p className="text-xs text-muted-foreground">
                stations in use
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Top Customer Today
              </CardTitle>
              <TrophyIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">John Doe</div>
              <p className="text-xs text-muted-foreground">
                50 points earned today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Points Earned Today
              </CardTitle>
              <StarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">250</div>
              <p className="text-xs text-muted-foreground">
                across all customers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Today's Revenue
              </CardTitle>
              <ActivityIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">KES 12,500</div>
              <p className="text-xs text-muted-foreground">
                +15% from yesterday
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Customers</CardTitle>
              <CardDescription>By points earned this week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "John Doe", points: 150, sessions: 10 },
                  { name: "Jane Smith", points: 120, sessions: 8 },
                  { name: "Mike Johnson", points: 90, sessions: 6 },
                  { name: "Sarah Williams", points: 75, sessions: 5 },
                  { name: "Tom Brown", points: 60, sessions: 4 }
                ].map((customer, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-muted-foreground">{i + 1}</span>
                      <span>{customer.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{customer.points} points</div>
                      <div className="text-sm text-muted-foreground">
                        {customer.sessions} sessions
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Popular Games</CardTitle>
              <CardDescription>Most played this week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "FC25", plays: 45 },
                  { name: "GTA 5", plays: 38 },
                  { name: "NBA 2K25", plays: 32 },
                  { name: "F1 Racing", plays: 28 },
                  { name: "VR Games", plays: 25 }
                ].map((game, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-muted-foreground">{i + 1}</span>
                      <span>{game.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{game.plays} plays</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const GamingSessionsTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {stations?.map((station) => (
        <StationCard key={station.id} station={station} />
      ))}
    </div>
  );

  const ReportsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Session Reports</h2>
        <div className="flex gap-2">
          <Button onClick={() => generateReport("current")} className="bg-green-600 hover:bg-green-700">
            <FileText className="mr-2 h-4 w-4" />
            Current Sessions
          </Button>
          <Button onClick={() => generateReport("hourly")} className="bg-blue-600 hover:bg-blue-700">
            <ClockIcon className="mr-2 h-4 w-4" />
            Hourly Report
          </Button>
          <Button onClick={() => generateReport("daily")} className="bg-purple-600 hover:bg-purple-700">
            <BarChart className="mr-2 h-4 w-4" />
            Daily Report
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Generation Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Current Sessions Report</h3>
            <p className="text-muted-foreground">
              Shows all active gaming sessions with customer details, games being played, and costs.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Hourly Report</h3>
            <p className="text-muted-foreground">
              Summary of gaming sessions from the last hour, including revenue and session counts.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Daily Report</h3>
            <p className="text-muted-foreground">
              Complete overview of today's gaming sessions, total revenue, and station utilization.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const startSession = async (station: GameStation, formData: {
    customerName: string;
    gameName: string;
    sessionType: "per_game" | "hourly";
  }) => {
    try {
      await apiRequest("PATCH", `/api/stations/${station.id}`, {
        currentCustomer: formData.customerName,
        currentGame: formData.gameName,
        sessionType: formData.sessionType,
        sessionStartTime: new Date()
      });

      setSelectedStation(station);
      setShowPayment(true);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to start session",
        description: error.message
      });
    }
  };

  const StationCard = ({ station }: { station: GameStation }) => {
    const [customerName, setCustomerName] = useState("");
    const [selectedGame, setSelectedGame] = useState("");
    const [sessionType, setSessionType] = useState<"per_game" | "hourly">("per_game");

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            {station.name}
            {!station.isActive && (
              <span className="text-sm font-normal text-muted-foreground">
                (Unavailable)
              </span>
            )}
          </CardTitle>
          {station.currentCustomer ? (
            <CardDescription>
              Customer: {station.currentCustomer}
              <br />
              Game: {station.currentGame}
              <br />
              Session: {station.sessionType === "per_game" ? "40 KES/game" : "200 KES/hour"}
            </CardDescription>
          ) : (
            <CardDescription>Available</CardDescription>
          )}
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
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Customer Name</Label>
                <Input
                  placeholder="Enter customer name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Game</Label>
                <Select value={selectedGame} onValueChange={setSelectedGame}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select game" />
                  </SelectTrigger>
                  <SelectContent>
                    {games?.map((game) => (
                      <SelectItem key={game.id} value={game.name}>
                        {game.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Session Type</Label>
                <Select value={sessionType} onValueChange={(value: "per_game" | "hourly") => setSessionType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_game">40 KES/game</SelectItem>
                    <SelectItem value="hourly">200 KES/hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full"
                onClick={() => {
                  try {
                    startSession(station, {
                      customerName,
                      gameName: selectedGame,
                      sessionType
                    });
                  } catch (error: any) {
                    toast({
                      variant: "destructive",
                      title: "Failed to start session",
                      description: error.message
                    });
                  }
                }}
                disabled={!customerName || !selectedGame}
              >
                Start Session
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const generateReport = async (type: ReportType) => {
    try {
      const response = await apiRequest("GET", `/api/reports/${type}`);
      const report = await response.json();

      let reportText = `=== ${type.toUpperCase()} REPORT ===\n\n`;

      if (type === "current") {
        report.forEach((session: any) => {
          reportText += `Station: ${session.stationName}\n`;
          reportText += `Customer: ${session.customerName}\n`;
          reportText += `Game: ${session.gameName}\n`;
          reportText += `Duration: ${session.duration}\n`;
          reportText += `Cost: KES ${session.cost}\n\n`;
        });
      } else {
        reportText += `Total Revenue: KES ${report.totalRevenue}\n`;
        reportText += `Active Sessions: ${report.activeSessions}\n`;
        reportText += `Completed Sessions: ${report.completedSessions}\n\n`;

        reportText += "Session Details:\n";
        report.sessions.forEach((session: any) => {
          reportText += `- ${session.stationName}: ${session.customerName} (${session.duration})\n`;
        });
      }

      const blob = new Blob([reportText], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gaming-report-${type}-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Report Generated",
        description: "The report has been downloaded to your device."
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to generate report",
        description: error.message
      });
    }
  };

  if (stationsLoading || gamesLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Tabs defaultValue="dashboard" className="flex w-full">
        <div className="w-64 border-r border-primary/20 p-4 space-y-2">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-lg font-bold">Gaming Lounge</h1>
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
        <div className="flex-1 p-6 space-y-6">
          <TabsContent value="dashboard">
            <h2 className="text-2xl font-bold mb-6">POS Dashboard</h2>
            <DashboardOverview />
          </TabsContent>

          <TabsContent value="sessions">
            <h2 className="text-2xl font-bold mb-6">Gaming Sessions</h2>
            <GamingSessionsTab />
          </TabsContent>

          <TabsContent value="customers">
            <h2 className="text-2xl font-bold mb-6">Customer Portal</h2>
            <CustomerRegistrationForm />
          </TabsContent>

          <TabsContent value="analytics">
            <h2 className="text-2xl font-bold mb-6">Analytics</h2>
            <div className="text-center text-muted-foreground">
              Analytics dashboard coming soon...
            </div>
          </TabsContent>

          <TabsContent value="reports">
            <h2 className="text-2xl font-bold mb-6">Reports</h2>
            <ReportsTab />
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
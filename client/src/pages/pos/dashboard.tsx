import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GamepadIcon, ClockIcon, Timer, FileText, BarChart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import PaymentModal from "@/components/shared/PaymentModal";
import CustomerRegistrationForm from "@/components/shared/CustomerRegistrationForm";
import type { GameStation, Game } from "@shared/schema";

type ReportType = "current" | "hourly" | "daily";

export default function POSDashboard() {
  const [selectedStation, setSelectedStation] = useState<GameStation | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const { toast } = useToast();

  const { data: stations, isLoading: stationsLoading } = useQuery({
    queryKey: ["/api/stations"],
  });

  const { data: games, isLoading: gamesLoading } = useQuery({
    queryKey: ["/api/games"],
  });

  const generateReport = async (type: ReportType) => {
    try {
      const response = await apiRequest("GET", `/api/reports/${type}`);
      const report = await response.json();

      // Convert report data to text
      let reportText = `=== ${type.toUpperCase()} REPORT ===\n\n`;

      if (type === "current") {
        // Format current active sessions
        report.forEach((session: any) => {
          reportText += `Station: ${session.stationName}\n`;
          reportText += `Customer: ${session.customerName}\n`;
          reportText += `Game: ${session.gameName}\n`;
          reportText += `Duration: ${session.duration}\n`;
          reportText += `Cost: KES ${session.cost}\n\n`;
        });
      } else {
        // Format summary reports
        reportText += `Total Revenue: KES ${report.totalRevenue}\n`;
        reportText += `Active Sessions: ${report.activeSessions}\n`;
        reportText += `Completed Sessions: ${report.completedSessions}\n\n`;

        reportText += "Session Details:\n";
        report.sessions.forEach((session: any) => {
          reportText += `- ${session.stationName}: ${session.customerName} (${session.duration})\n`;
        });
      }

      // Create and download report file
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


  if (stationsLoading || gamesLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gaming Sessions</h1>

      <Tabs defaultValue="sessions">
        <TabsList>
          <TabsTrigger value="sessions">Gaming Sessions</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="register">Register Customer</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {stations?.map((station) => (
              <StationCard key={station.id} station={station} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reports">
          <ReportsTab />
        </TabsContent>

        <TabsContent value="register">
          <Card>
            <CardHeader>
              <CardTitle>Register New Customer</CardTitle>
            </CardHeader>
            <CardContent>
              <CustomerRegistrationForm />
            </CardContent>
          </Card>
        </TabsContent>
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
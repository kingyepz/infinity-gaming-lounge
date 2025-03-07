import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  GamepadIcon,
  ClockIcon,
  Timer,
  FileText,
  BarChart,
  Users,
  Trophy,
  Star,
  Activity,
  LayoutDashboardIcon,
  LogOut,
  AlertCircle
} from "lucide-react";
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
  const [, setLocation] = useLocation();

  const { data: stations, isLoading: stationsLoading, error: stationsError } = useQuery({
    queryKey: ["/api/stations"],
  });

  const { data: games, isLoading: gamesLoading, error: gamesError } = useQuery({
    queryKey: ["/api/games"],
  });

  const handleLogout = () => {
    localStorage.removeItem('user');
    setLocation('/');
  };

  if (stationsLoading || gamesLoading) {
    return (
      <div className="min-h-screen bg-black overflow-hidden relative flex items-center justify-center">
        <div className="absolute inset-0 w-full h-full">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-pink-500/20 animate-gradient-x"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYwIiBoZWlnaHQ9IjE2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZSIgeD0iMCIgeT0iMCI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNzUiIG51bU9jdGF2ZXM9IjQiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMTYwIiBoZWlnaHQ9IjE2MCIgZmlsdGVyPSJ1cmwoI25vaXNlKSIgb3BhY2l0eT0iMC4xNSIvPjwvc3ZnPg==')] opacity-20"></div>
        </div>
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (stationsError || gamesError) {
    return (
      <div className="min-h-screen bg-black overflow-hidden relative flex items-center justify-center">
        <div className="absolute inset-0 w-full h-full">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-pink-500/20 animate-gradient-x"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYwIiBoZWlnaHQ9IjE2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZSIgeD0iMCIgeT0iMCI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNzUiIG51bU9jdGF2ZXM9IjQiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMTYwIiBoZWlnaHQ9IjE2MCIgZmlsdGVyPSJ1cmwoI25vaXNlKSIgb3BhY2l0eT0iMC4xNSIvPjwvc3ZnPg==')] opacity-20"></div>
        </div>
        <div className="relative z-10 flex flex-col items-center gap-4 p-8 backdrop-blur-sm bg-white/10 border-2 border-red-500/50 rounded-lg">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <h2 className="text-xl font-bold text-white">Unable to Load Dashboard</h2>
          <p className="text-gray-400 text-center">There was an error connecting to the server. Please try again later.</p>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="relative group px-4 py-2 overflow-hidden backdrop-blur-sm bg-white/10 hover:bg-white/20 border-2 border-primary/50 hover:border-primary transition-all duration-300"
          >
            <div className="absolute inset-0 w-1/2 bg-gradient-to-r from-primary/40 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
            <LogOut className="w-4 h-4 mr-2" />
            <span className="relative z-10">Return to Welcome Page</span>
          </Button>
        </div>
      </div>
    );
  }

  const DashboardOverview = () => {
    const activeSessions = stations?.filter(s => s.currentCustomer)?.length || 0;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Active Sessions Widget */}
          <Card className="backdrop-blur-sm bg-white/10 border-2 border-primary/50 hover:border-primary transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-pink-500">
                Active Sessions
              </CardTitle>
              <GamepadIcon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{activeSessions}</div>
              <p className="text-xs text-gray-400">
                stations in use
              </p>
            </CardContent>
          </Card>

          {/* Top Customer Widget */}
          <Card className="backdrop-blur-sm bg-white/10 border-2 border-primary/50 hover:border-primary transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-pink-500">
                Top Customer Today
              </CardTitle>
              <Trophy className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">John Doe</div>
              <p className="text-xs text-gray-400">
                50 points earned today
              </p>
            </CardContent>
          </Card>

          {/* Total Points Widget */}
          <Card className="backdrop-blur-sm bg-white/10 border-2 border-primary/50 hover:border-primary transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-pink-500">
                Points Earned Today
              </CardTitle>
              <Star className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">250</div>
              <p className="text-xs text-gray-400">
                across all customers
              </p>
            </CardContent>
          </Card>

          {/* Revenue Widget */}
          <Card className="backdrop-blur-sm bg-white/10 border-2 border-primary/50 hover:border-primary transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-pink-500">
                Today's Revenue
              </CardTitle>
              <Activity className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">KES 12,500</div>
              <p className="text-xs text-gray-400">
                +15% from yesterday
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Customers List */}
          <Card className="backdrop-blur-sm bg-white/10 border-2 border-primary/50 hover:border-primary transition-all duration-300">
            <CardHeader>
              <CardTitle className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-pink-500">Top Customers</CardTitle>
              <CardDescription className="text-gray-400">By points earned this week</CardDescription>
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
                      <span className="text-gray-400">{i + 1}</span>
                      <span className="text-white">{customer.name}</span>
                    </div>
                    <div className="text-right text-white">
                      <div className="font-medium">{customer.points} points</div>
                      <div className="text-sm text-gray-400">
                        {customer.sessions} sessions
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Games List */}
          <Card className="backdrop-blur-sm bg-white/10 border-2 border-primary/50 hover:border-primary transition-all duration-300">
            <CardHeader>
              <CardTitle className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-pink-500">Popular Games</CardTitle>
              <CardDescription className="text-gray-400">Most played this week</CardDescription>
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
                      <span className="text-gray-400">{i + 1}</span>
                      <span className="text-white">{game.name}</span>
                    </div>
                    <div className="text-right text-white">
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
        <StationCard 
          key={station.id} 
          station={station}
          onStartSession={(customerName, gameName, sessionType) => {
            startSession(station, { customerName, gameName, sessionType });
          }}
        />
      ))}
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

  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-pink-500/20 animate-gradient-x"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYwIiBoZWlnaHQ9IjE2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZSIgeD0iMCIgeT0iMCI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNzUiIG51bU9jdGF2ZXM9IjQiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMTYwIiBoZWlnaHQ9IjE2MCIgZmlsdGVyPSJ1cmwoI25vaXNlKSIgb3BhY2l0eT0iMC4xNSIvPjwvc3ZnPg==')] opacity-20"></div>
      </div>

      <div className="relative z-10 p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-pink-500">
            Gaming Lounge Dashboard
          </h1>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="relative group px-4 py-2 overflow-hidden backdrop-blur-sm bg-white/10 hover:bg-white/20 border-2 border-primary/50 hover:border-primary transition-all duration-300"
          >
            <div className="absolute inset-0 w-1/2 bg-gradient-to-r from-primary/40 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
            <LogOut className="w-4 h-4 mr-2" />
            <span className="relative z-10">Back to Welcome</span>
          </Button>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-background/20 backdrop-blur-sm border-2 border-primary/20 rounded-lg overflow-hidden">
            <TabsTrigger 
              value="dashboard"
              className="relative group data-[state=active]:bg-primary/20 data-[state=active]:text-primary hover:bg-primary/10 transition-all duration-200"
            >
              <div className="absolute inset-0 w-1/2 bg-gradient-to-r from-primary/40 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-500 opacity-0 group-hover:opacity-100" />
              <LayoutDashboardIcon className="w-4 h-4 mr-2" />
              <span className="relative z-10">Overview</span>
            </TabsTrigger>
            <TabsTrigger 
              value="sessions"
              className="relative group data-[state=active]:bg-primary/20 data-[state=active]:text-primary hover:bg-primary/10 transition-all duration-200"
            >
              <div className="absolute inset-0 w-1/2 bg-gradient-to-r from-primary/40 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-500 opacity-0 group-hover:opacity-100" />
              <GamepadIcon className="w-4 h-4 mr-2" />
              <span className="relative z-10">Gaming Sessions</span>
            </TabsTrigger>
            <TabsTrigger 
              value="customers"
              className="relative group data-[state=active]:bg-primary/20 data-[state=active]:text-primary hover:bg-primary/10 transition-all duration-200"
            >
              <div className="absolute inset-0 w-1/2 bg-gradient-to-r from-primary/40 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-500 opacity-0 group-hover:opacity-100" />
              <Users className="w-4 h-4 mr-2" />
              <span className="relative z-10">Customer Portal</span>
            </TabsTrigger>
            <TabsTrigger 
              value="analytics"
              className="relative group data-[state=active]:bg-primary/20 data-[state=active]:text-primary hover:bg-primary/10 transition-all duration-200"
            >
              <div className="absolute inset-0 w-1/2 bg-gradient-to-r from-primary/40 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-500 opacity-0 group-hover:opacity-100" />
              <BarChart className="w-4 h-4 mr-2" />
              <span className="relative z-10">Analytics</span>
            </TabsTrigger>
            <TabsTrigger 
              value="reports"
              className="relative group data-[state=active]:bg-primary/20 data-[state=active]:text-primary hover:bg-primary/10 transition-all duration-200"
            >
              <div className="absolute inset-0 w-1/2 bg-gradient-to-r from-primary/40 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-500 opacity-0 group-hover:opacity-100" />
              <FileText className="w-4 h-4 mr-2" />
              <span className="relative z-10">Reports</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardOverview />
          </TabsContent>

          <TabsContent value="sessions">
            <GamingSessionsTab />
          </TabsContent>

          <TabsContent value="customers">
            <CustomerRegistrationForm />
          </TabsContent>

          <TabsContent value="analytics">
            <div className="text-center text-gray-400 py-8">
              Analytics dashboard coming soon...
            </div>
          </TabsContent>

          <TabsContent value="reports">
            <ReportsTab />
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
    </div>
  );
}

type StationCardProps = {
  station: GameStation;
  onStartSession: (customerName: string, gameName: string, sessionType: "per_game" | "hourly") => void;
};

const StationCard = ({ station, onStartSession }: StationCardProps) => {
  const [customerName, setCustomerName] = useState("");
  const [selectedGame, setSelectedGame] = useState("");
  const [sessionType, setSessionType] = useState<"per_game" | "hourly">("per_game");
  const { toast } = useToast();

  return (
    <Card className="backdrop-blur-sm bg-white/10 border-2 border-primary/50 hover:border-primary transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex justify-between items-center bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-pink-500">
          {station.name}
          {!station.isActive && (
            <span className="text-sm font-normal text-gray-400">
              (Unavailable)
            </span>
          )}
        </CardTitle>
        {station.currentCustomer ? (
          <CardDescription className="text-gray-400">
            Customer: {station.currentCustomer}
            <br />
            Game: {station.currentGame}
            <br />
            Session: {station.sessionType === "per_game" ? "40 KES/game" : "200 KES/hour"}
          </CardDescription>
        ) : (
          <CardDescription className="text-gray-400">Available</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {station.currentCustomer ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-400">
              <Timer className="h-4 w-4" />
              <span>Session started at {new Date(station.sessionStartTime!).toLocaleTimeString()}</span>
            </div>
            <Button
              variant="destructive"
              className="w-full relative group overflow-hidden"
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
              <div className="absolute inset-0 w-1/2 bg-gradient-to-r from-red-500/40 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
              <span className="relative z-10">End Session</span>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-400">Customer Name</Label>
              <Input
                placeholder="Enter customer name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="bg-white/5 border-primary/30 focus:border-primary transition-colors duration-200"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-400">Game</Label>
              <Select value={selectedGame} onValueChange={setSelectedGame}>
                <SelectTrigger className="bg-white/5 border-primary/30 focus:border-primary transition-colors duration-200">
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
              <Label className="text-gray-400">Session Type</Label>
              <Select value={sessionType} onValueChange={setSessionType}>
                <SelectTrigger className="bg-white/5 border-primary/30 focus:border-primary transition-colors duration-200">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_game">40 KES/game</SelectItem>
                  <SelectItem value="hourly">200 KES/hour</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full relative group overflow-hidden bg-primary/10 hover:bg-primary/20 border-2 border-primary/50 hover:border-primary transition-all duration-300"
              onClick={() => onStartSession(customerName, selectedGame, sessionType)}
              disabled={!customerName || !selectedGame}
            >
              <div className="absolute inset-0 w-1/2 bg-gradient-to-r from-primary/40 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
              <span className="relative z-10">Start Session</span>
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
      <h2 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-pink-500">Session Reports</h2>
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

    <Card className="backdrop-blur-sm bg-white/10 border-2 border-primary/50 hover:border-primary transition-all duration-300">
      <CardHeader>
        <CardTitle className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-pink-500">Report Generation Guide</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-pink-500">Current Sessions Report</h3>
          <p className="text-gray-400">
            Shows all active gaming sessions with customer details, games being played, and costs.
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-pink-500">Hourly Report</h3>
          <p className="text-gray-400">
            Summary of gaming sessions from the last hour, including revenue and session counts.
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-pink-500">Daily Report</h3>
          <p className="text-gray-400">
            Complete overview of today's gaming sessions, total revenue, and station utilization.
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
);

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
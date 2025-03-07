import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  GamepadIcon,
  ClockIcon,
  Timer,
  FileText,
  BarChart,
  TrophyIcon,
  StarIcon,
  ActivityIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import PaymentModal from "@/components/shared/PaymentModal";
import CustomerRegistrationForm from "@/components/shared/CustomerRegistrationForm";
import Sidebar from "@/components/layout/Sidebar";
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

      <Sidebar onLogout={handleLogout} />

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="space-y-6">
          {/* Stats Overview */}
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

          {/* Gaming Stations Grid */}
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
      </div>

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
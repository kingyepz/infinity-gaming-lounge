import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GamepadIcon, StopCircleIcon, ClockIcon } from "lucide-react";
import PaymentModal from "@/components/shared/PaymentModal";
import CustomerRegistrationForm from "@/components/shared/CustomerRegistrationForm";
import type { Game } from "@shared/schema";

type StationType = "PS5" | "Xbox" | "PC";

export default function POSDashboard() {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  const { data: games, isLoading } = useQuery({
    queryKey: ["/api/games"],
  });

  const { data: activeSessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["/api/transactions"],
  });

  // Group games by type
  const groupedGames = games?.reduce((acc, game) => {
    let type: StationType = "PC";
    if (game.name.includes("PS5")) type = "PS5";
    if (game.name.includes("Xbox")) type = "Xbox";

    return {
      ...acc,
      [type]: [...(acc[type] || []), game]
    };
  }, {} as Record<StationType, Game[]>);

  const startSession = (game: Game) => {
    setSelectedGame(game);
    setShowPayment(true);
  };

  const renderGameStations = (type: StationType) => {
    if (!groupedGames?.[type]?.length) return null;

    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <GamepadIcon className="h-5 w-5" />
          {type} Stations
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groupedGames[type].map((game) => (
            <Card key={game.id} className={!game.isActive ? "opacity-60" : ""}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  {game.name}
                  {!game.isActive && (
                    <span className="text-sm font-normal text-muted-foreground">
                      (Unavailable)
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  KSH {game.hourlyRate}/hour
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Show active session if exists */}
                {activeSessions?.find(session => 
                  session.gameId === game.id && 
                  session.paymentStatus === "completed"
                ) ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <ClockIcon className="h-4 w-4" />
                      <span>Session in progress</span>
                    </div>
                    <Button 
                      variant="destructive"
                      className="w-full"
                      onClick={() => {/* TODO: End session handler */}}
                    >
                      <StopCircleIcon className="mr-2 h-4 w-4" />
                      End Session
                    </Button>
                  </div>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => startSession(game)}
                    disabled={!game.isActive}
                  >
                    Start Session
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  if (isLoading || sessionsLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="sessions">
        <TabsList>
          <TabsTrigger value="sessions">Gaming Sessions</TabsTrigger>
          <TabsTrigger value="register">Register Customer</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-6">
          {/* PS5 Stations */}
          {renderGameStations("PS5")}

          {/* Xbox Stations */}
          {renderGameStations("Xbox")}

          {/* PC Stations */}
          {renderGameStations("PC")}
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

      {showPayment && selectedGame && (
        <PaymentModal
          game={selectedGame}
          onClose={() => {
            setShowPayment(false);
            setSelectedGame(null);
          }}
        />
      )}
    </div>
  );
}
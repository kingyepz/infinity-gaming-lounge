import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PaymentModal from "@/components/shared/PaymentModal";
import CustomerRegistrationForm from "@/components/shared/CustomerRegistrationForm";
import type { Game } from "@shared/schema";

export default function POSDashboard() {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  const { data: games, isLoading } = useQuery({
    queryKey: ["/api/games"],
  });

  const startSession = (game: Game) => {
    setSelectedGame(game);
    setShowPayment(true);
  };

  if (isLoading) {
    return <div>Loading games...</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="sessions">
        <TabsList>
          <TabsTrigger value="sessions">Gaming Sessions</TabsTrigger>
          <TabsTrigger value="register">Register Customer</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games?.map((game: Game) => (
              <Card key={game.id}>
                <CardHeader>
                  <CardTitle>{game.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold">
                    KSH {game.hourlyRate}/hour
                  </p>
                  <Button
                    className="w-full mt-4"
                    onClick={() => startSession(game)}
                    disabled={!game.isActive}
                  >
                    Start Session
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
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
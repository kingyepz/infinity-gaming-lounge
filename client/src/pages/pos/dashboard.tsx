import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { GameStation, Game, User } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

export default function POSDashboard() {
  const [selectedStation, setSelectedStation] = useState<GameStation | null>(null);
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [selectedSessionType, setSelectedSessionType] = useState<"per_game" | "hourly" | null>(null);
  const [showCustomerRegistration, setShowCustomerRegistration] = useState(false);
  const [activeTab, setActiveTab] = useState("sessions");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch data using useQuery
  const { data: stations = [], isLoading: stationsLoading } = useQuery({
    queryKey: ["/api/stations"],
    queryFn: () => apiRequest("GET", "/api/stations")
  });

  const { data: games = [], isLoading: gamesLoading } = useQuery({
    queryKey: ["/api/games"],
    queryFn: () => apiRequest("GET", "/api/games")
  });

  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ["/api/users/customers"],
    queryFn: () => apiRequest("GET", "/api/users/customers")
  });

  if (stationsLoading || gamesLoading || customersLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <Tabs className="w-full" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="sessions">Gaming Sessions</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="p-6">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Gaming Sessions</h2>
              <Button onClick={() => {
                const availableStation = stations.find(s => !s.currentCustomer);
                if (availableStation) {
                  setSelectedStation(availableStation);
                  setShowNewSessionModal(true);
                } else {
                  toast({
                    title: "No Available Stations",
                    description: "All gaming stations are currently occupied.",
                    variant: "destructive"
                  });
                }
              }}>
                Start New Session
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Available Games</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {games?.map((game) => (
                    <Card key={game.id} className="bg-primary/5">
                      <CardContent className="p-4 text-center">
                        <p className="font-bold text-lg">{game.name}</p>
                        <Badge variant="outline" className={`mt-2 ${game.isActive ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                          {game.isActive ? 'Available' : 'Unavailable'}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stations?.filter(station => station.currentCustomer).map((station) => {
                    const startTime = new Date(station.sessionStartTime!);
                    const now = new Date();
                    const diffMs = now.getTime() - startTime.getTime();
                    const diffMins = Math.floor(diffMs / 60000);
                    const hours = Math.floor(diffMins / 60);
                    const mins = diffMins % 60;

                    const cost = station.sessionType === "per_game"
                      ? station.baseRate
                      : Math.ceil(diffMins / 60) * (station.hourlyRate || 0);

                    return (
                      <Card key={station.id} className="bg-primary/5 border-primary/10">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between">
                            <CardTitle className="text-sm font-medium">Station #{station.id}</CardTitle>
                            <Badge variant="outline" className="bg-green-500/20">Active</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <p className="text-xs text-muted-foreground">Customer</p>
                              <p className="font-medium">{station.currentCustomer}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <p className="text-xs text-muted-foreground">Game</p>
                                <p className="font-medium">{station.currentGame}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Duration</p>
                                <p className="font-medium">{hours}h {mins}m</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Type</p>
                                <p className="font-medium capitalize">{station.sessionType}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Cost</p>
                                <p className="font-medium">KSH {cost}</p>
                              </div>
                            </div>

                            <Button
                              variant="destructive"
                              className="w-full"
                              onClick={async () => {
                                try {
                                  await apiRequest("POST", "/api/transactions", {
                                    stationId: station.id,
                                    customerName: station.currentCustomer,
                                    gameName: station.currentGame,
                                    sessionType: station.sessionType,
                                    amount: cost,
                                    duration: diffMins,
                                    paymentStatus: "completed"
                                  });

                                  await apiRequest("POST", "/api/sessions/end", {
                                    stationId: station.id
                                  });

                                  await queryClient.invalidateQueries({ queryKey: ["/api/stations"] });
                                  await queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });

                                  toast({
                                    title: "Session Ended",
                                    description: `Session completed. Total cost: KSH ${cost}`,
                                  });
                                } catch (error: any) {
                                  toast({
                                    title: "Error",
                                    description: "Failed to end session. Please try again.",
                                    variant: "destructive"
                                  });
                                }
                              }}
                            >
                              End Session
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Available Stations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {stations?.filter(station => !station.currentCustomer).map((station) => (
                    <Card key={station.id} className="bg-green-900/20 border-green-500/20">
                      <CardContent className="p-4 text-center">
                        <p className="font-bold text-lg">Station #{station.id}</p>
                        <Badge variant="outline" className="mt-2 bg-green-500/20">Available</Badge>
                        <Button
                          variant="default"
                          size="sm"
                          className="w-full mt-3"
                          onClick={() => {
                            setSelectedStation(station);
                            setShowNewSessionModal(true);
                          }}
                        >
                          Start Session
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="overview">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-black/30 border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stations?.filter(s => s.currentCustomer)?.length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Out of {stations?.length || 0} stations</p>
                </CardContent>
              </Card>
              {/* Add more overview cards */}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="customers">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Customer Management</h2>
              <Button onClick={() => setShowCustomerRegistration(true)}>
                Register New Customer
              </Button>
            </div>
            {/* Add customer list */}
          </div>
        </TabsContent>

        <TabsContent value="reports">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Report</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Add daily report content */}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Weekly Report</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Add weekly report content */}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="payments">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Payments</h2>
            <Card>
              <CardHeader>
                <CardTitle>Recent Payments</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Add payments list */}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Revenue</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Today's Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">KSH {/* Add actual revenue */}</div>
                </CardContent>
              </Card>
              {/* Add more revenue metrics */}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showNewSessionModal} onOpenChange={setShowNewSessionModal}>
        <DialogContent className="sm:max-w-[425px] bg-black/50 border-primary/20 text-white">
          <DialogHeader>
            <DialogTitle>Start New Gaming Session</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <label className="text-sm text-muted-foreground">Select Game</label>
              <Select
                onValueChange={setSelectedGame}
                value={selectedGame || undefined}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a game" />
                </SelectTrigger>
                <SelectContent>
                  {games?.filter(game => game.isActive).map(game => (
                    <SelectItem key={game.id} value={game.name}>
                      {game.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Select Customer</label>
              <Select
                onValueChange={(value) => {
                  const customer = customers.find(c => c.id.toString() === value);
                  setSelectedCustomer(customer || null);
                }}
                value={selectedCustomer?.id?.toString()}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.displayName} (@{customer.gamingName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Session Type</label>
              <Select
                onValueChange={(value) => setSelectedSessionType(value as "per_game" | "hourly")}
                value={selectedSessionType || undefined}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select session type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_game">Per Game</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => setShowCustomerRegistration(true)}
            >
              Register New Customer
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setShowNewSessionModal(false)}>
                Cancel
              </Button>
              <Button onClick={async () => {
                try {
                  if (!selectedStation || !selectedGame || !selectedCustomer || !selectedSessionType) {
                    toast({
                      title: "Missing Information",
                      description: "Please select a game, customer and session type",
                      variant: "destructive"
                    });
                    return;
                  }

                  await apiRequest("POST", "/api/sessions/start", {
                    stationId: selectedStation.id,
                    customerId: selectedCustomer.id,
                    customerName: selectedCustomer.displayName,
                    gameId: selectedGame,
                    sessionType: selectedSessionType
                  });

                  await queryClient.invalidateQueries({ queryKey: ["/api/stations"] });

                  setShowNewSessionModal(false);
                  setSelectedGame(null);
                  setSelectedCustomer(null);
                  setSelectedSessionType(null);

                  toast({
                    title: "Session Started",
                    description: "Gaming session has been started successfully!"
                  });
                } catch (error: any) {
                  toast({
                    title: "Error",
                    description: "Failed to start session. Please try again.",
                    variant: "destructive"
                  });
                }
              }}>
                Start Session
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
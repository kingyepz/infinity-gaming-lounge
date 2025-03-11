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

  const handleStartSession = async () => {
    try {
      if (!selectedStation || !selectedGame || !selectedCustomer || !selectedSessionType) {
        toast({
          title: "Missing Information",
          description: "Please select a game, customer, and session type",
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
  };

  return (
    <div className="flex h-full">
      <Tabs className="w-full" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sessions">Gaming Sessions</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions">
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
              }}>Start New Session</Button>
            </div>

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
          </div>
        </TabsContent>

        <TabsContent value="customers">
          <div>
            <h3 className="text-2xl font-bold mb-4">Customers</h3>
            {/* Customer list will be implemented later */}
          </div>
        </TabsContent>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4">
            <Card className="bg-black/40 border-primary/20 col-span-1">
              <CardHeader>
                <CardTitle>Stations Overview</CardTitle>
                <Button size="sm" variant="default" onClick={() => {
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
                }} className="ml-auto">Start New Session</Button>
              </CardHeader>
              <CardContent className="relative h-60">
                <div className="absolute inset-0 flex items-center justify-center">
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
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-black/40 border-primary/20 col-span-1">
                <CardHeader>
                  <CardTitle>Stations Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-60">
                    <div className="flex justify-between px-4 py-4">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-primary mr-2"></div>
                        <span className="text-xs">Active</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-primary/20 relative"></div>
                        <span className="text-xs">Available</span>
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
            </div>
            <Card className="bg-black/40 border-primary/20 col-span-1">
              <CardHeader>
                <CardTitle>Game Popularity</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <div className="h-full flex flex-col justify-center">
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4">
            <Card className="bg-black/40 border-primary/20 col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle>Hourly Traffic</CardTitle>
              </CardHeader>
              <CardContent className="h-60 relative">
                <div className="absolute inset-0 px-4">
                  <div className="h-full flex items-end">
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

            <Card className="bg-black/40 border-primary/20 col-span-1">
              <CardHeader>
                <CardTitle>Customer Types</CardTitle>
              </CardHeader>
              <CardContent className="h-60 flex items-center justify-center">
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
              <Button onClick={handleStartSession}>
                Start Session
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
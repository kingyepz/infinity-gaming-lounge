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
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { GameStation, Game, User } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function POSDashboard() {
  const [selectedStation, setSelectedStation] = useState<GameStation | null>(null);
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [selectedSessionType, setSelectedSessionType] = useState<"per_game" | "hourly" | null>(null);
  const [showCustomerRegistration, setShowCustomerRegistration] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Properly fetch data using useQuery
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
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sessions">Gaming Sessions</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4">
            <Card className="bg-black/40 border-primary/20 col-span-1">
              <CardHeader>
                <CardTitle>Stations Overview</CardTitle>
                <Button size="sm" variant="default" onClick={() => setShowNewSessionModal(true)} className="ml-auto">Start New Session</Button>
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


        <TabsContent value="sessions">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Gaming Sessions</h2>
              <Button onClick={() => setShowNewSessionModal(true)}>
                Start New Session
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Available Games</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {games.map((game) => (
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
            {/* Add customer list here */}
          </div>
        </TabsContent>
        <TabsContent value="reports">
          <div>
            <h3 className="text-2xl font-bold mb-4">Financial Reports</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Customers</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>2023-10-26</TableCell>
                  <TableCell>1200</TableCell>
                  <TableCell>5</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>2023-10-27</TableCell>
                  <TableCell>1500</TableCell>
                  <TableCell>7</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>2023-10-28</TableCell>
                  <TableCell>1000</TableCell>
                  <TableCell>3</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        <TabsContent value="payments">
          <div className="space-y-6">
            <h3 className="text-2xl font-bold">Payments</h3>

            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Pending Payments</span>
                  <Badge variant="secondary">3</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded-md bg-primary/5">
                      <div>
                        <p className="font-medium">Customer {i+1}</p>
                        <p className="text-sm text-muted-foreground">
                          Game Station {i+1} • {Math.floor(Math.random() * 60) + 30} min
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">KSH {(Math.random() * 500 + 200).toFixed(2)}</p>
                        <div className="flex gap-2 mt-2">
                          <select className="text-xs p-1 rounded border border-primary/20 bg-primary/5">
                            <option value="">Payment Method</option>
                            <option value="cash">Cash</option>
                            <option value="mpesa">M-Pesa</option>
                            <option value="airtel">Airtel Money</option>
                          </select>
                          <Button size="sm" variant="default" className="text-xs">Pay</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle>Payment Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-primary/5 p-3 rounded-md">
                    <p className="text-sm text-muted-foreground">Today</p>
                    <p className="text-xl font-bold">KSH 12,500</p>
                    <p className="text-xs text-green-500">+15% from yesterday</p>
                  </div>
                  <div className="bg-primary/5 p-3 rounded-md">
                    <p className="text-sm text-muted-foreground">This Week</p>
                    <p className="text-xl font-bold">KSH 68,200</p>
                    <p className="text-xs text-green-500">+8% from last week</p>
                  </div>
                  <div className="bg-primary/5 p-3 rounded-md">
                    <p className="text-sm text-muted-foreground">This Month</p>
                    <p className="text-xl font-bold">KSH 245,800</p>
                    <p className="text-xs text-green-500">+12% from last month</p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="font-medium mb-2">Payment Method Breakdown</p>
                  <div className="bg-primary/5 p-3 rounded-md">
                    <div className="flex justify-between items-center mb-2">
                      <span>Cash</span>
                      <span>35%</span>
                    </div>
                    <div className="w-full bg-gray-300 rounded-full h-2.5">
                      <div className="bg-green-600 h-2.5 rounded-full" style={{ width: '35%' }}></div>
                    </div>

                    <div className="flex justify-between items-center mb-2 mt-3">
                      <span>M-Pesa</span>
                      <span>55%</span>
                    </div>
                    <div className="w-full bg-gray-300 rounded-full h-2.5">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '55%' }}></div>
                    </div>

                    <div className="flex justify-between items-center mb-2 mt-3">
                      <span>Airtel Money</span>
                      <span>10%</span>
                    </div>
                    <div className="w-full bg-gray-300 rounded-full h-2.5">
                      <div className="bg-orange-600 h-2.5 rounded-full" style={{ width: '10%' }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Recent Transactions</span>
                  <Button size="sm" variant="outline">Print Receipt</Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded-md bg-primary/5">
                      <div>
                        <p className="font-medium">Transaction #{10045 + i}</p>
                        <div className="flex gap-2 items-center">
                          <p className="text-xs text-muted-foreground">
                            {new Date(Date.now() - i * 60 * 60 * 1000).toLocaleTimeString()}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {['Cash', 'M-Pesa', 'Airtel Money'][i % 3]}
                          </Badge>
                          {i % 2 === 0 && <Badge variant="secondary" className="text-xs">10% Discount</Badge>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">KSH {(Math.random() * 500 + 200).toFixed(2)}</p>
                        <p className="text-xs text-primary">+{Math.floor(Math.random() * 50 + 20)} points</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button variant="outline" className="h-auto flex flex-col items-center py-3">
                    <span className="text-sm">Apply Discount</span>
                  </Button>
                  <Button variant="outline" className="h-auto flex flex-col items-center py-3">
                    <span className="text-sm">Split Payment</span>
                  </Button>
                  <Button variant="outline" className="h-auto flex flex-col items-center py-3">
                    <span className="text-sm">Verify Payment</span>
                  </Button>
                  <Button variant="outline" className="h-auto flex flex-col items-center py-3">
                    <span className="text-sm">Redeem Points</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
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
      <Dialog open={showNewSessionModal} onOpenChange={setShowNewSessionModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Start New Gaming Session</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <label className="text-sm font-medium">Select Game</label>
              <Select
                onValueChange={setSelectedGame}
                value={selectedGame || undefined}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a game" />
                </SelectTrigger>
                <SelectContent>
                  {games.filter(game => game.isActive).map(game => (
                    <SelectItem key={game.id} value={game.name}>
                      {game.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Select Customer</label>
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
              <label className="text-sm font-medium">Session Type</label>
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
              }}>
                Start Session
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      const showPayment = useState(false);
      const setShowPayment = (value: boolean) => showPayment[1](value);
      const Table = ({ children }: { children: any}) => <table className="w-full">{children}</table>;
      const TableHeader = ({ children }: { children: any}) => <thead>{children}</thead>;
      const TableRow = ({ children }: { children: any}) => <tr className="border-b border-gray-200">{children}</tr>;
      const TableHead = ({ children }: { children: any}) => <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{children}</th>;
      const TableBody = ({ children }: { children: any}) => <tbody>{children}</tbody>;
      const TableCell = ({ children }: { children: any}) => <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{children}</td>;
      const PaymentModal = ({ station, onClose }: { station: any, onClose: () => void}) => <div></div>;
    </div>
  );
}
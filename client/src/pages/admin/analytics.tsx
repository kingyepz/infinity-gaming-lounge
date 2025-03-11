import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend, LineChart, Line } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import InfinityLogo from "@/components/animations/InfinityLogo";
import {
  GamepadIcon,
  BarChart2Icon,
  DollarSignIcon,
  UsersIcon,
  DownloadIcon,
  LogOutIcon,
  SettingsIcon,
  PlusCircleIcon,
  RefreshCwIcon,
  TrophyIcon,
  CalendarIcon
} from "lucide-react";
import { useLocation } from "wouter";
import axios from "axios";
import type { GameStation, Game, User, Transaction } from "@shared/schema";

export default function AdminAnalytics() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddStationDialog, setShowAddStationDialog] = useState(false);
  const [showAddGameDialog, setShowAddGameDialog] = useState(false);
  const [newStationName, setNewStationName] = useState("");
  const [newGameName, setNewGameName] = useState("");
  const [newGameDescription, setNewGameDescription] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Main queries for data
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/transactions"],
  });

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

  // Calculate revenue metrics
  const totalRevenue = transactions?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;
  
  const dailyRevenue = transactions?.reduce((acc, tx) => {
    const date = new Date(tx.createdAt).toLocaleDateString();
    acc[date] = (acc[date] || 0) + Number(tx.amount);
    return acc;
  }, {});

  // Calculated statistics
  const activeStations = stations.filter((s) => s.currentCustomer)?.length || 0;
  const completedTransactions = transactions.filter((tx) => tx.paymentStatus === "completed") || [];
  const pendingTransactions = transactions.filter((tx) => tx.paymentStatus === "pending") || [];
  const todayRevenue = transactions
    .filter((tx) => new Date(tx.createdAt).toDateString() === new Date().toDateString())
    .reduce((sum, tx) => sum + Number(tx.amount), 0);
  const newCustomers = customers
    .filter((c) => new Date(c.createdAt).toDateString() === new Date().toDateString())
    .length;

  // Payment method statistics
  const pendingAmount = pendingTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0);

  const paymentMethodStats = completedTransactions.reduce((stats, tx) => {
    if (tx.mpesaRef) {
      stats.mpesa = (stats.mpesa || 0) + 1;
    } else if (tx.airtelRef) {
      stats.airtel = (stats.airtel || 0) + 1;
    } else {
      stats.cash = (stats.cash || 0) + 1;
    }
    return stats;
  }, { cash: 0, mpesa: 0, airtel: 0 });

  // Generate chart data
  const revenueChartData = Object.entries(dailyRevenue || {}).map(([date, amount]) => ({
    date,
    amount
  }));

  const paymentMethodChartData = [
    { name: "Cash", value: paymentMethodStats.cash || 0 },
    { name: "M-Pesa", value: paymentMethodStats.mpesa || 0 },
    { name: "Airtel", value: paymentMethodStats.airtel || 0 }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

  // Popular games data
  const gameStats = transactions.reduce((acc, tx) => {
    if (tx.gameName) {
      acc[tx.gameName] = (acc[tx.gameName] || 0) + 1;
    }
    return acc;
  }, {});

  const popularGamesData = Object.entries(gameStats || {})
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Handle user logout
  const handleLogout = () => {
    localStorage.removeItem('user');
    setLocation('/');
  };

  // Handle adding a new game station
  const handleAddStation = async () => {
    if (!newStationName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a station name",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await apiRequest("POST", "/api/stations", {
        name: newStationName,
        status: "available"
      });

      if (response) {
        toast({
          title: "Success",
          description: `Station "${newStationName}" has been added`
        });
        setNewStationName("");
        setShowAddStationDialog(false);
        queryClient.invalidateQueries({ queryKey: ["/api/stations"] });
      }
    } catch (error) {
      console.error("Error adding station:", error);
      toast({
        title: "Error",
        description: "Failed to add station. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle adding a new game
  const handleAddGame = async () => {
    if (!newGameName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a game name",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await apiRequest("POST", "/api/games", {
        name: newGameName,
        description: newGameDescription,
        imageUrl: "/game-default.jpg",
        pricePerSession: 40,
        pricePerHour: 200,
        category: "General"
      });

      if (response) {
        toast({
          title: "Success",
          description: `Game "${newGameName}" has been added`
        });
        setNewGameName("");
        setNewGameDescription("");
        setShowAddGameDialog(false);
        queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      }
    } catch (error) {
      console.error("Error adding game:", error);
      toast({
        title: "Error",
        description: "Failed to add game. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle clearing a pending payment
  const handleClearPayment = async (transactionId) => {
    try {
      const transaction = pendingTransactions.find((tx) => tx.id === transactionId);

      const response = await axios.post("/api/transactions/payment", {
        transactionId: transactionId,
        amount: transaction?.amount || 0,
        paymentMethod: "cash",
      });

      toast({
        title: "Payment Cleared",
        description: "The payment has been marked as completed",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stations"] });
    } catch (error) {
      console.error("Error clearing payment:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to clear payment",
        variant: "destructive"
      });
    }
  };

  if (transactionsLoading || stationsLoading || gamesLoading || customersLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYwIiBoZWlnaHQ9IjE2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZSIgeD0iMCIgeT0iMCI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNzUiIG51bU9jdGF2ZXM9IjQiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMTYwIiBoZWlnaHQ9IjE2MCIgZmlsdGVyPSJ1cmwoI25vaXNlKSIgb3BhY2l0eT0iMC4xNSIvPjwvc3ZnPg==')] opacity-20"></div>
      </div>

      <div className="w-full flex justify-center items-center py-2 sm:py-4 z-10 relative">
        <div className="flex flex-col items-center">
          <InfinityLogo />
          <h1 className="text-xl sm:text-2xl font-bold text-primary">INFINITY GAMING LOUNGE - ADMIN</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="hover:bg-primary/20 mt-2"
          >
            <LogOutIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="flex flex-col md:flex-row w-full relative">
        <div className="w-full md:w-64 border-b md:border-r border-primary/20 p-2 sm:p-4 space-y-2 backdrop-blur-sm bg-black/50">
          <TabsList className="flex flex-row md:flex-col w-full space-x-2 md:space-x-0 md:space-y-2 overflow-x-auto md:overflow-x-visible">
            <TabsTrigger value="overview" className="flex-1 md:flex-none justify-start px-4 py-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary hover:bg-primary/10 transition-all duration-200">
              <GamepadIcon className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex-1 md:flex-none justify-start px-4 py-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary hover:bg-primary/10 transition-all duration-200">
              <BarChart2Icon className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="stations" className="flex-1 md:flex-none justify-start px-4 py-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary hover:bg-primary/10 transition-all duration-200">
              <CalendarIcon className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Stations</span>
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex-1 md:flex-none justify-start px-4 py-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary hover:bg-primary/10 transition-all duration-200">
              <UsersIcon className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Customers</span>
            </TabsTrigger>
            <TabsTrigger value="games" className="flex-1 md:flex-none justify-start px-4 py-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary hover:bg-primary/10 transition-all duration-200">
              <GamepadIcon className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Games</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex-1 md:flex-none justify-start px-4 py-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary hover:bg-primary/10 transition-all duration-200">
              <DollarSignIcon className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Payments</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-1 md:flex-none justify-start px-4 py-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary hover:bg-primary/10 transition-all duration-200">
              <SettingsIcon className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 p-2 sm:p-4 md:p-6 backdrop-blur-sm bg-black/50 overflow-x-hidden">
          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg sm:text-2xl font-bold">
                      {activeStations}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {stations.length} total stations
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg sm:text-2xl font-bold">
                      KES {todayRevenue}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {completedTransactions.filter(tx => new Date(tx.createdAt).toDateString() === new Date().toDateString()).length} transactions
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">New Customers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg sm:text-2xl font-bold">
                      {newCustomers}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {customers.length} total customers
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg sm:text-2xl font-bold">
                      KES {pendingAmount}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {pendingTransactions.length} pending transactions
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader>
                    <CardTitle>Daily Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BarChart width={500} height={300} data={revenueChartData} className="mx-auto">
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      <XAxis dataKey="date" stroke="#888" />
                      <YAxis stroke="#888" />
                      <Tooltip contentStyle={{ backgroundColor: '#222', borderColor: '#444' }} />
                      <Bar dataKey="amount" fill="hsl(var(--primary))" />
                    </BarChart>
                  </CardContent>
                </Card>
                
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader>
                    <CardTitle>Payment Methods</CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <PieChart width={300} height={300}>
                      <Pie
                        data={paymentMethodChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {paymentMethodChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#222', borderColor: '#444' }} />
                    </PieChart>
                  </CardContent>
                </Card>
              </div>
              
              <Card className="bg-black/30 border-primary/20">
                <CardHeader>
                  <CardTitle>Popular Games</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Game</TableHead>
                          <TableHead>Sessions</TableHead>
                          <TableHead>Popularity</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {popularGamesData.map((game) => (
                          <TableRow key={game.name}>
                            <TableCell>{game.name}</TableCell>
                            <TableCell>{game.count}</TableCell>
                            <TableCell>
                              <div className="w-full bg-gray-700 rounded-full h-2">
                                <div
                                  className="bg-primary rounded-full h-2"
                                  style={{ width: `${(game.count / (popularGamesData[0]?.count || 1)) * 100}%` }}
                                ></div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="space-y-4 sm:space-y-6">
              <Card className="bg-black/30 border-primary/20">
                <CardHeader>
                  <CardTitle>Revenue Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <BarChart width={800} height={300} data={revenueChartData} className="mx-auto">
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="date" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip contentStyle={{ backgroundColor: '#222', borderColor: '#444' }} />
                    <Bar dataKey="amount" fill="hsl(var(--primary))" />
                  </BarChart>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader>
                    <CardTitle>Total Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">KES {totalRevenue}</p>
                    <p className="text-sm text-muted-foreground">Lifetime earnings</p>
                  </CardContent>
                </Card>

                <Card className="bg-black/30 border-primary/20">
                  <CardHeader>
                    <CardTitle>Completed Sessions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">
                      {completedTransactions.length}
                    </p>
                    <p className="text-sm text-muted-foreground">Total completed sessions</p>
                  </CardContent>
                </Card>

                <Card className="bg-black/30 border-primary/20">
                  <CardHeader>
                    <CardTitle>Total Customers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">
                      {customers.length}
                    </p>
                    <p className="text-sm text-muted-foreground">Registered customers</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Stations Tab */}
          <TabsContent value="stations">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Gaming Stations</h2>
              <Button onClick={() => setShowAddStationDialog(true)}>
                <PlusCircleIcon className="mr-2 h-4 w-4" />
                Add Station
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {stations.map((station) => (
                <Card key={station.id} className={`bg-black/30 border-2 ${station.currentCustomer ? 'border-green-500' : 'border-primary/20'}`}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">Station {station.name}</CardTitle>
                      <Badge variant={station.currentCustomer ? "success" : "outline"}>
                        {station.currentCustomer ? "Active" : "Available"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {station.currentCustomer ? (
                      <div className="space-y-2">
                        <p className="text-sm">
                          <strong>Customer:</strong> {station.currentCustomer}
                        </p>
                        <p className="text-sm">
                          <strong>Game:</strong> {station.currentGame}
                        </p>
                        <p className="text-sm">
                          <strong>Type:</strong> {station.sessionType === "per_game" ? "Per Game" : "Hourly"}
                        </p>
                        <p className="text-sm">
                          <strong>Started:</strong> {new Date(station.sessionStartTime).toLocaleTimeString()}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">Station available for use</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Customer Management</h2>
              <Card className="bg-black/30 border-primary/20">
                <CardHeader>
                  <CardTitle>Customer List</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Gaming Name</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Loyalty Points</TableHead>
                          <TableHead>Joined</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customers.map((customer) => (
                          <TableRow key={customer.id}>
                            <TableCell>{customer.id}</TableCell>
                            <TableCell>{customer.displayName}</TableCell>
                            <TableCell>{customer.gamingName}</TableCell>
                            <TableCell>{customer.phoneNumber}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-primary/20">
                                <TrophyIcon className="mr-1 h-3 w-3" />
                                {customer.points}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(customer.createdAt).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Games Tab */}
          <TabsContent value="games">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Game Catalog</h2>
              <Button onClick={() => setShowAddGameDialog(true)}>
                <PlusCircleIcon className="mr-2 h-4 w-4" />
                Add Game
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {games.map((game) => (
                <Card key={game.id} className="bg-black/30 border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{game.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-400 mb-2">{game.description || "No description available"}</p>
                    <div className="flex justify-between text-sm">
                      <Badge variant="outline">Per Game: KES {game.pricePerSession}</Badge>
                      <Badge variant="outline">Per Hour: KES {game.pricePerHour}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Payment Management</h2>
                <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/transactions"] })}>
                  <RefreshCwIcon className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>

              <Card className="bg-black/30 border-primary/20">
                <CardHeader>
                  <CardTitle>Pending Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Game</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingTransactions.length > 0 ? (
                          pendingTransactions.map((tx) => (
                            <TableRow key={tx.id}>
                              <TableCell>{tx.id}</TableCell>
                              <TableCell>{tx.customerName}</TableCell>
                              <TableCell>{tx.gameName}</TableCell>
                              <TableCell>KES {tx.amount}</TableCell>
                              <TableCell>
                                {new Date(tx.createdAt).toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleClearPayment(tx.id)}
                                >
                                  Mark Paid
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center">No pending payments</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/30 border-primary/20">
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Game</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Payment Status</TableHead>
                          <TableHead>Method</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.slice(0, 10).map((tx) => (
                          <TableRow key={tx.id}>
                            <TableCell>{tx.id}</TableCell>
                            <TableCell>{tx.customerName}</TableCell>
                            <TableCell>{tx.gameName}</TableCell>
                            <TableCell>KES {tx.amount}</TableCell>
                            <TableCell>
                              <Badge
                                variant={tx.paymentStatus === "completed" ? "success" : "outline"}
                              >
                                {tx.paymentStatus}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {tx.mpesaRef
                                ? "M-Pesa"
                                : tx.airtelRef
                                ? "Airtel"
                                : "Cash"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">System Settings</h2>
              <Card className="bg-black/30 border-primary/20">
                <CardHeader>
                  <CardTitle>Pricing Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Per Game Pricing (KES)</label>
                      <Input type="number" defaultValue="40" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Hourly Rate (KES)</label>
                      <Input type="number" defaultValue="200" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Loyalty Points Per 10 KES</label>
                      <Input type="number" defaultValue="1" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Points Required for Free Session</label>
                      <Input type="number" defaultValue="100" />
                    </div>
                  </div>
                  <Button className="mt-4">Save Settings</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* Add Station Dialog */}
      <Dialog open={showAddStationDialog} onOpenChange={setShowAddStationDialog}>
        <DialogContent className="bg-black/80 border-primary/20">
          <DialogHeader>
            <DialogTitle>Add New Game Station</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Station Name</label>
              <Input
                placeholder="Enter station name or number"
                value={newStationName}
                onChange={(e) => setNewStationName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddStationDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddStation}>Add Station</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Game Dialog */}
      <Dialog open={showAddGameDialog} onOpenChange={setShowAddGameDialog}>
        <DialogContent className="bg-black/80 border-primary/20">
          <DialogHeader>
            <DialogTitle>Add New Game</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Game Name</label>
              <Input
                placeholder="Enter game name"
                value={newGameName}
                onChange={(e) => setNewGameName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                placeholder="Enter game description"
                value={newGameDescription}
                onChange={(e) => setNewGameDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddGameDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddGame}>Add Game</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

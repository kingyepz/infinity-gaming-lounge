import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend, LineChart, Line, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  CalendarIcon,
  PackageIcon,
  AlertTriangleIcon,
  FileTextIcon,
  TicketIcon,
  BadgePercentIcon,
  UsersRoundIcon,
  TrelloIcon,
  TagIcon,
  BellIcon,
  MailIcon,
  MessagesSquareIcon,
  CalendarDaysIcon,
  DatabaseIcon,
  ShieldIcon,
  KeyIcon,
  GlobeIcon,
  ClockIcon,
  FileIcon,
  BriefcaseIcon,
  HeartIcon,
  BugIcon,
  PercentIcon,
  AwardIcon,
  BellRingIcon,
  PhoneIcon,
  SendIcon,
  LockIcon,
  ActivityIcon,
  LineChartIcon,
  BookmarkIcon,
  ServerIcon,
  ListTodoIcon,
  UserPlusIcon,
  LayoutDashboardIcon,
  MonitorIcon
} from "lucide-react";
import { useLocation } from "wouter";
import axios from "axios";
import type { GameStation, Game, User, Transaction } from "@shared/schema";

export default function AdminAnalytics() {
  const [activeTab, setActiveTab] = useState("overview");
  // Add Station Dialog
  const [showAddStationDialog, setShowAddStationDialog] = useState(false);
  const [newStationName, setNewStationName] = useState("");
  
  // Add Game Dialog
  const [showAddGameDialog, setShowAddGameDialog] = useState(false);
  const [newGameName, setNewGameName] = useState("");
  const [newGameDescription, setNewGameDescription] = useState("");
  
  // Add Staff Dialog
  const [showAddStaffDialog, setShowAddStaffDialog] = useState(false);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffPhone, setNewStaffPhone] = useState("");
  const [newStaffRole, setNewStaffRole] = useState("staff");
  
  // Add Inventory Item Dialog
  const [showAddInventoryDialog, setShowAddInventoryDialog] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("accessory");
  const [newItemQuantity, setNewItemQuantity] = useState("1");
  const [newItemReorderLevel, setNewItemReorderLevel] = useState("5");
  
  // Add Event Dialog
  const [showAddEventDialog, setShowAddEventDialog] = useState(false);
  const [newEventName, setNewEventName] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventDescription, setNewEventDescription] = useState("");
  const [newEventCapacity, setNewEventCapacity] = useState("20");
  
  // Add Promotion Dialog
  const [showAddPromotionDialog, setShowAddPromotionDialog] = useState(false);
  const [newPromotionName, setNewPromotionName] = useState("");
  const [newPromotionDescription, setNewPromotionDescription] = useState("");
  const [newPromotionDiscount, setNewPromotionDiscount] = useState("10");
  const [newPromotionStartDate, setNewPromotionStartDate] = useState("");
  const [newPromotionEndDate, setNewPromotionEndDate] = useState("");
  
  // Add Booking/Reservation Dialog
  const [showAddReservationDialog, setShowAddReservationDialog] = useState(false);
  const [newReservationCustomer, setNewReservationCustomer] = useState("");
  const [newReservationStation, setNewReservationStation] = useState("");
  const [newReservationDate, setNewReservationDate] = useState("");
  const [newReservationStartTime, setNewReservationStartTime] = useState("");
  const [newReservationDuration, setNewReservationDuration] = useState("1");
  
  // Other state management
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

      <div className="flex w-full relative">
        <div className="w-64 border-r border-primary/20 p-4 space-y-4 backdrop-blur-sm bg-black/50 min-h-[calc(100vh-120px)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-primary">Admin Portal</h2>
          </div>
          
          <ScrollArea className="h-[calc(100vh-160px)]">
            <div className="space-y-1">
              <div className="mb-2 ml-2 mt-4 text-xs font-semibold text-gray-400 uppercase">Dashboard</div>
              <Button
                variant={activeTab === "overview" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("overview")}
              >
                <LayoutDashboardIcon className="mr-2 h-4 w-4" />
                Overview
              </Button>
              <Button
                variant={activeTab === "analytics" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("analytics")}
              >
                <BarChart2Icon className="mr-2 h-4 w-4" />
                Analytics
              </Button>
              <Button
                variant={activeTab === "export" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("export")}
              >
                <FileTextIcon className="mr-2 h-4 w-4" />
                Reports & Export
              </Button>
              
              <div className="mb-2 ml-2 mt-4 text-xs font-semibold text-gray-400 uppercase">Management</div>
              <Button
                variant={activeTab === "stations" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("stations")}
              >
                <MonitorIcon className="mr-2 h-4 w-4" />
                Game Stations
              </Button>
              <Button
                variant={activeTab === "reservations" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("reservations")}
              >
                <CalendarDaysIcon className="mr-2 h-4 w-4" />
                Reservations
              </Button>
              <Button
                variant={activeTab === "games" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("games")}
              >
                <GamepadIcon className="mr-2 h-4 w-4" />
                Game Catalog
              </Button>
              <Button
                variant={activeTab === "inventory" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("inventory")}
              >
                <PackageIcon className="mr-2 h-4 w-4" />
                Inventory
              </Button>
              <Button
                variant={activeTab === "events" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("events")}
              >
                <TicketIcon className="mr-2 h-4 w-4" />
                Events & Tournaments
              </Button>
              
              <div className="mb-2 ml-2 mt-4 text-xs font-semibold text-gray-400 uppercase">Customers</div>
              <Button
                variant={activeTab === "customers" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("customers")}
              >
                <UsersIcon className="mr-2 h-4 w-4" />
                Customer Database
              </Button>
              <Button
                variant={activeTab === "loyalty" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("loyalty")}
              >
                <TrophyIcon className="mr-2 h-4 w-4" />
                Loyalty Program
              </Button>
              <Button
                variant={activeTab === "promotions" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("promotions")}
              >
                <BadgePercentIcon className="mr-2 h-4 w-4" />
                Promotions
              </Button>
              
              <div className="mb-2 ml-2 mt-4 text-xs font-semibold text-gray-400 uppercase">Financial</div>
              <Button
                variant={activeTab === "payments" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("payments")}
              >
                <DollarSignIcon className="mr-2 h-4 w-4" />
                Payments
              </Button>
              <Button
                variant={activeTab === "finances" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("finances")}
              >
                <BriefcaseIcon className="mr-2 h-4 w-4" />
                Financial Management
              </Button>
              
              <div className="mb-2 ml-2 mt-4 text-xs font-semibold text-gray-400 uppercase">Administration</div>
              <Button
                variant={activeTab === "staff" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("staff")}
              >
                <UsersRoundIcon className="mr-2 h-4 w-4" />
                Staff Management
              </Button>
              <Button
                variant={activeTab === "security" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("security")}
              >
                <ShieldIcon className="mr-2 h-4 w-4" />
                Security
              </Button>
              <Button
                variant={activeTab === "settings" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("settings")}
              >
                <SettingsIcon className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1 p-2 sm:p-4 md:p-6 backdrop-blur-sm bg-black/50 overflow-x-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="hidden">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="stations">Stations</TabsTrigger>
              <TabsTrigger value="customers">Customers</TabsTrigger>
              <TabsTrigger value="games">Games</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="staff">Staff</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
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

          {/* Inventory Management Tab */}
          <TabsContent value="inventory">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Inventory Management</h2>
                <Button onClick={() => setShowAddInventoryDialog(true)}>
                  <PlusCircleIcon className="mr-2 h-4 w-4" />
                  Add Inventory Item
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Inventory Summary Cards */}
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">128</div>
                    <p className="text-xs text-gray-400">5 categories</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-500">6</div>
                    <p className="text-xs text-gray-400">Items below threshold</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-500">2</div>
                    <p className="text-xs text-gray-400">Require immediate attention</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Value</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">KES 235,800</div>
                    <p className="text-xs text-gray-400">Total inventory value</p>
                  </CardContent>
                </Card>
              </div>
              
              <Card className="bg-black/30 border-primary/20">
                <CardHeader>
                  <CardTitle>Inventory Items</CardTitle>
                  <CardDescription>Manage your gaming accessories and peripherals</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>In Stock</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Last Updated</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>
                            <div className="font-medium">PS5 Controller</div>
                            <div className="text-xs text-gray-400">SKU: CTL-PS5-001</div>
                          </TableCell>
                          <TableCell>Peripheral</TableCell>
                          <TableCell>12</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-900/20 text-green-400 border-green-800">
                              In Stock
                            </Badge>
                          </TableCell>
                          <TableCell>Today, 9:45 AM</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="icon">
                                <SettingsIcon className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <RefreshCwIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <div className="font-medium">Xbox Controller</div>
                            <div className="text-xs text-gray-400">SKU: CTL-XBX-001</div>
                          </TableCell>
                          <TableCell>Peripheral</TableCell>
                          <TableCell>8</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-900/20 text-green-400 border-green-800">
                              In Stock
                            </Badge>
                          </TableCell>
                          <TableCell>Yesterday, 2:30 PM</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="icon">
                                <SettingsIcon className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <RefreshCwIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <div className="font-medium">Gaming Headset</div>
                            <div className="text-xs text-gray-400">SKU: AUD-HDT-003</div>
                          </TableCell>
                          <TableCell>Accessory</TableCell>
                          <TableCell>4</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-yellow-900/20 text-yellow-400 border-yellow-800">
                              Low Stock
                            </Badge>
                          </TableCell>
                          <TableCell>2 days ago</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="icon">
                                <SettingsIcon className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <RefreshCwIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <div className="font-medium">HDMI Cables</div>
                            <div className="text-xs text-gray-400">SKU: CBL-HDM-002</div>
                          </TableCell>
                          <TableCell>Accessory</TableCell>
                          <TableCell>0</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-red-900/20 text-red-400 border-red-800">
                              Out of Stock
                            </Badge>
                          </TableCell>
                          <TableCell>5 days ago</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="icon">
                                <SettingsIcon className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <AlertTriangleIcon className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline">
                    <FileTextIcon className="mr-2 h-4 w-4" />
                    Export Inventory
                  </Button>
                  <Button variant="outline">
                    <PlusCircleIcon className="mr-2 h-4 w-4" />
                    Order New Stock
                  </Button>
                </CardFooter>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader>
                    <CardTitle>Stock Movement</CardTitle>
                    <CardDescription>30-day inventory changes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={[
                        { day: '01', controllers: 24, headsets: 18, cables: 12 },
                        { day: '05', controllers: 22, headsets: 16, cables: 10 },
                        { day: '10', controllers: 19, headsets: 14, cables: 8 },
                        { day: '15', controllers: 17, headsets: 11, cables: 6 },
                        { day: '20', controllers: 20, headsets: 8, cables: 4 },
                        { day: '25', controllers: 18, headsets: 6, cables: 2 },
                        { day: '30', controllers: 20, headsets: 4, cables: 0 },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                        <XAxis dataKey="day" stroke="#888" />
                        <YAxis stroke="#888" />
                        <Tooltip contentStyle={{ backgroundColor: '#222', borderColor: '#444' }} />
                        <Line type="monotone" dataKey="controllers" stroke="#8884d8" />
                        <Line type="monotone" dataKey="headsets" stroke="#82ca9d" />
                        <Line type="monotone" dataKey="cables" stroke="#ffc658" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader>
                    <CardTitle>Maintenance Schedule</CardTitle>
                    <CardDescription>Upcoming maintenance tasks</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4 border-b border-gray-700 pb-2">
                        <div className="p-2 bg-blue-900/30 rounded-full">
                          <GamepadIcon className="h-4 w-4 text-blue-500" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-medium">Controller Cleaning</h3>
                          <p className="text-xs text-gray-400">Scheduled for tomorrow</p>
                        </div>
                        <Button variant="outline" size="sm">Mark Complete</Button>
                      </div>
                      <div className="flex items-center space-x-4 border-b border-gray-700 pb-2">
                        <div className="p-2 bg-green-900/30 rounded-full">
                          <SettingsIcon className="h-4 w-4 text-green-500" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-medium">Console Maintenance</h3>
                          <p className="text-xs text-gray-400">Scheduled for next week</p>
                        </div>
                        <Button variant="outline" size="sm">View Details</Button>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-purple-900/30 rounded-full">
                          <ActivityIcon className="h-4 w-4 text-purple-500" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-medium">Network Check</h3>
                          <p className="text-xs text-gray-400">Monthly routine</p>
                        </div>
                        <Button variant="outline" size="sm">Schedule</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          {/* Events Management Tab */}
          <TabsContent value="events">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Events & Tournaments</h2>
                <Button onClick={() => setShowAddEventDialog(true)}>
                  <PlusCircleIcon className="mr-2 h-4 w-4" />
                  Create New Event
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Event Summary Cards */}
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">3</div>
                    <p className="text-xs text-gray-400">Next 30 days</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">48</div>
                    <p className="text-xs text-gray-400">75% capacity filled</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Revenue Potential</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">KES 24,000</div>
                    <p className="text-xs text-gray-400">From event registrations</p>
                  </CardContent>
                </Card>
              </div>
              
              <Card className="bg-black/30 border-primary/20">
                <CardHeader>
                  <CardTitle>Upcoming Events</CardTitle>
                  <CardDescription>Manage tournaments and special gaming events</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="border border-primary/20 rounded-lg p-4 bg-black/30">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className="bg-green-900/20 text-green-400 border-green-800">
                          Upcoming
                        </Badge>
                        <div className="text-sm text-gray-400">March 15, 2025</div>
                      </div>
                      <h3 className="text-xl font-bold text-primary mb-2">FIFA Tournament</h3>
                      <p className="text-sm text-gray-300 mb-4">Compete in our monthly FIFA championship with cash prizes for the top 3 winners!</p>
                      <div className="flex justify-between items-center text-sm mb-4">
                        <div>
                          <CalendarIcon className="inline-block w-4 h-4 mr-1" />
                          2:00 PM - 8:00 PM
                        </div>
                        <div>
                          <UsersIcon className="inline-block w-4 h-4 mr-1" />
                          18/24 Registered
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                          <div className="bg-green-600 h-full rounded-full" style={{ width: '75%' }}></div>
                        </div>
                        <div className="text-xs text-gray-400 text-right">75% Capacity</div>
                      </div>
                      <div className="flex space-x-2 mt-4">
                        <Button variant="outline" size="sm" className="flex-1">View Details</Button>
                        <Button variant="default" size="sm" className="flex-1">Manage</Button>
                      </div>
                    </div>
                    
                    <div className="border border-primary/20 rounded-lg p-4 bg-black/30">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className="bg-green-900/20 text-green-400 border-green-800">
                          Upcoming
                        </Badge>
                        <div className="text-sm text-gray-400">March 20, 2025</div>
                      </div>
                      <h3 className="text-xl font-bold text-primary mb-2">Call of Duty Night</h3>
                      <p className="text-sm text-gray-300 mb-4">Team-based tournament with 4v4 matches. Bring your squad or join one on-site!</p>
                      <div className="flex justify-between items-center text-sm mb-4">
                        <div>
                          <CalendarIcon className="inline-block w-4 h-4 mr-1" />
                          6:00 PM - 11:00 PM
                        </div>
                        <div>
                          <UsersIcon className="inline-block w-4 h-4 mr-1" />
                          20/32 Registered
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                          <div className="bg-green-600 h-full rounded-full" style={{ width: '62.5%' }}></div>
                        </div>
                        <div className="text-xs text-gray-400 text-right">62.5% Capacity</div>
                      </div>
                      <div className="flex space-x-2 mt-4">
                        <Button variant="outline" size="sm" className="flex-1">View Details</Button>
                        <Button variant="default" size="sm" className="flex-1">Manage</Button>
                      </div>
                    </div>
                    
                    <div className="border border-primary/20 rounded-lg p-4 bg-black/30">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className="bg-green-900/20 text-green-400 border-green-800">
                          Upcoming
                        </Badge>
                        <div className="text-sm text-gray-400">March 28, 2025</div>
                      </div>
                      <h3 className="text-xl font-bold text-primary mb-2">Fortnite Challenge</h3>
                      <p className="text-sm text-gray-300 mb-4">Solo battle royale competition with elimination rounds and grand finale!</p>
                      <div className="flex justify-between items-center text-sm mb-4">
                        <div>
                          <CalendarIcon className="inline-block w-4 h-4 mr-1" />
                          3:00 PM - 9:00 PM
                        </div>
                        <div>
                          <UsersIcon className="inline-block w-4 h-4 mr-1" />
                          10/20 Registered
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                          <div className="bg-yellow-600 h-full rounded-full" style={{ width: '50%' }}></div>
                        </div>
                        <div className="text-xs text-gray-400 text-right">50% Capacity</div>
                      </div>
                      <div className="flex space-x-2 mt-4">
                        <Button variant="outline" size="sm" className="flex-1">View Details</Button>
                        <Button variant="default" size="sm" className="flex-1">Manage</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline">
                    <CalendarDaysIcon className="mr-2 h-4 w-4" />
                    View Calendar
                  </Button>
                  <Button variant="outline">
                    <FileTextIcon className="mr-2 h-4 w-4" />
                    Event Reports
                  </Button>
                </CardFooter>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader>
                    <CardTitle>Prize Management</CardTitle>
                    <CardDescription>Configure tournament prizes and rewards</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                        <div className="flex items-center space-x-2">
                          <TrophyIcon className="h-5 w-5 text-yellow-500" />
                          <div>
                            <h3 className="font-medium">FIFA Tournament</h3>
                            <p className="text-xs text-gray-400">1st Place</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">KES 5,000</div>
                          <p className="text-xs text-gray-400">+ Gaming Headset</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                        <div className="flex items-center space-x-2">
                          <TrophyIcon className="h-5 w-5 text-gray-400" />
                          <div>
                            <h3 className="font-medium">FIFA Tournament</h3>
                            <p className="text-xs text-gray-400">2nd Place</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">KES 2,500</div>
                          <p className="text-xs text-gray-400">+ 2-hr Free Gaming</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <TrophyIcon className="h-5 w-5 text-amber-700" />
                          <div>
                            <h3 className="font-medium">FIFA Tournament</h3>
                            <p className="text-xs text-gray-400">3rd Place</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">KES 1,000</div>
                          <p className="text-xs text-gray-400">+ 1-hr Free Gaming</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">
                      <PlusCircleIcon className="mr-2 h-4 w-4" />
                      Add New Prize
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader>
                    <CardTitle>Participant Management</CardTitle>
                    <CardDescription>Track and manage event registrations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span>FIFA Tournament</span>
                        <span className="text-green-400">18/24</span>
                      </div>
                      <div className="w-full bg-gray-700 h-2 rounded-full">
                        <div className="bg-green-600 h-full rounded-full" style={{ width: '75%' }}></div>
                      </div>
                      
                      <div className="flex justify-between items-center mt-4">
                        <span>Call of Duty Night</span>
                        <span className="text-green-400">20/32</span>
                      </div>
                      <div className="w-full bg-gray-700 h-2 rounded-full">
                        <div className="bg-green-600 h-full rounded-full" style={{ width: '62.5%' }}></div>
                      </div>
                      
                      <div className="flex justify-between items-center mt-4">
                        <span>Fortnite Challenge</span>
                        <span className="text-yellow-400">10/20</span>
                      </div>
                      <div className="w-full bg-gray-700 h-2 rounded-full">
                        <div className="bg-yellow-600 h-full rounded-full" style={{ width: '50%' }}></div>
                      </div>
                    </div>
                    
                    <div className="mt-6 space-y-2">
                      <h3 className="text-sm font-medium">Recent Registrations</h3>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback>JK</AvatarFallback>
                          </Avatar>
                          <span className="flex-1">John Kamau</span>
                          <Badge variant="outline" className="bg-blue-900/20 text-blue-400 border-blue-800">
                            FIFA
                          </Badge>
                          <span className="text-gray-400 text-xs">2 hrs ago</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback>MO</AvatarFallback>
                          </Avatar>
                          <span className="flex-1">Mary Odhiambo</span>
                          <Badge variant="outline" className="bg-purple-900/20 text-purple-400 border-purple-800">
                            COD
                          </Badge>
                          <span className="text-gray-400 text-xs">4 hrs ago</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback>TN</AvatarFallback>
                          </Avatar>
                          <span className="flex-1">Tom Njoroge</span>
                          <Badge variant="outline" className="bg-green-900/20 text-green-400 border-green-800">
                            FN
                          </Badge>
                          <span className="text-gray-400 text-xs">6 hrs ago</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">View All Participants</Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          {/* Staff Management Tab */}
          <TabsContent value="staff">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Staff Management</h2>
                <Button onClick={() => setShowAddStaffDialog(true)}>
                  <UserPlusIcon className="mr-2 h-4 w-4" />
                  Add Staff Member
                </Button>
              </div>
              
              <Card className="bg-black/30 border-primary/20">
                <CardHeader>
                  <CardTitle>Staff Directory</CardTitle>
                  <CardDescription>Manage staff accounts and permissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Last Active</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarFallback>JD</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">John Doe</p>
                                <p className="text-xs text-gray-400">john@infinitygaming.com</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-900/20 text-green-400 border-green-800">
                              Admin
                            </Badge>
                          </TableCell>
                          <TableCell>+254 700 123 456</TableCell>
                          <TableCell>Today, 2:45 PM</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-900/20 text-green-400 border-green-800">
                              Active
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="icon">
                                <SettingsIcon className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <KeyIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarFallback>JM</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">Jane Mwangi</p>
                                <p className="text-xs text-gray-400">jane@infinitygaming.com</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-blue-900/20 text-blue-400 border-blue-800">
                              Staff
                            </Badge>
                          </TableCell>
                          <TableCell>+254 700 789 012</TableCell>
                          <TableCell>Yesterday, 4:30 PM</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-900/20 text-green-400 border-green-800">
                              Active
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="icon">
                                <SettingsIcon className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <KeyIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader>
                    <CardTitle>Role Management</CardTitle>
                    <CardDescription>Define access permissions for different roles</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                        <div>
                          <h3 className="font-semibold">Administrator</h3>
                          <p className="text-sm text-gray-400">Full system access</p>
                        </div>
                        <Button variant="outline" size="sm">Edit Permissions</Button>
                      </div>
                      <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                        <div>
                          <h3 className="font-semibold">Manager</h3>
                          <p className="text-sm text-gray-400">Limited administrative access</p>
                        </div>
                        <Button variant="outline" size="sm">Edit Permissions</Button>
                      </div>
                      <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                        <div>
                          <h3 className="font-semibold">Staff</h3>
                          <p className="text-sm text-gray-400">Basic operational access</p>
                        </div>
                        <Button variant="outline" size="sm">Edit Permissions</Button>
                      </div>
                      <Button variant="default" size="sm" className="mt-2">
                        <PlusCircleIcon className="mr-2 h-4 w-4" />
                        Create New Role
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader>
                    <CardTitle>Staff Performance</CardTitle>
                    <CardDescription>Track staff activity and performance metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Jane Mwangi</span>
                          <span>45 sessions</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div className="bg-blue-500 rounded-full h-2" style={{ width: "90%" }}></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>David Kamau</span>
                          <span>32 sessions</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div className="bg-blue-500 rounded-full h-2" style={{ width: "65%" }}></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Sarah Odhiambo</span>
                          <span>28 sessions</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div className="bg-blue-500 rounded-full h-2" style={{ width: "55%" }}></div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="w-full mt-2">View Detailed Reports</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card className="bg-black/30 border-primary/20">
                <CardHeader>
                  <CardTitle>Staff Schedule</CardTitle>
                  <CardDescription>Manage staff shifts and availability</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-2 text-center">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
                      <div key={i} className="font-semibold">{day}</div>
                    ))}
                    {Array.from({ length: 28 }).map((_, i) => (
                      <div key={i} className="h-16 border border-gray-700 rounded-md p-1 text-xs">
                        {i % 7 === 0 && (
                          <div className="bg-blue-900/30 border border-blue-800 rounded p-1 mb-1">
                            Jane M.
                          </div>
                        )}
                        {i % 7 === 2 && (
                          <div className="bg-green-900/30 border border-green-800 rounded p-1 mb-1">
                            David K.
                          </div>
                        )}
                        {i % 7 === 5 && (
                          <div className="bg-purple-900/30 border border-purple-800 rounded p-1 mb-1">
                            Sarah O.
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end space-x-2">
                  <Button variant="outline">Edit Schedule</Button>
                  <Button>Publish Schedule</Button>
                </CardFooter>
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
          </Tabs>
        </div>
      </div>

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
      
      {/* Add Staff Dialog */}
      <Dialog open={showAddStaffDialog} onOpenChange={setShowAddStaffDialog}>
        <DialogContent className="bg-black/80 border-primary/20">
          <DialogHeader>
            <DialogTitle>Add Staff Member</DialogTitle>
            <DialogDescription>Create a new staff account with role-based permissions</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input
                placeholder="Enter full name"
                value={newStaffName}
                onChange={(e) => setNewStaffName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <Input
                type="email"
                placeholder="Enter email address"
                value={newStaffEmail}
                onChange={(e) => setNewStaffEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone Number</label>
              <Input
                placeholder="Enter phone number"
                value={newStaffPhone}
                onChange={(e) => setNewStaffPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select value={newStaffRole} onValueChange={(value) => setNewStaffRole(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent className="bg-black/90">
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddStaffDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast({
                title: "Staff Added",
                description: `${newStaffName} has been added as ${newStaffRole}`
              });
              setShowAddStaffDialog(false);
              setNewStaffName("");
              setNewStaffEmail("");
              setNewStaffPhone("");
              setNewStaffRole("staff");
            }}>
              Add Staff Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Inventory Dialog */}
      <Dialog open={showAddInventoryDialog} onOpenChange={setShowAddInventoryDialog}>
        <DialogContent className="bg-black/80 border-primary/20">
          <DialogHeader>
            <DialogTitle>Add Inventory Item</DialogTitle>
            <DialogDescription>Add a new item to the inventory tracking system</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Item Name</label>
              <Input
                placeholder="Enter item name"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={newItemCategory} onValueChange={(value) => setNewItemCategory(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="bg-black/90">
                  <SelectItem value="accessory">Accessory</SelectItem>
                  <SelectItem value="console">Console</SelectItem>
                  <SelectItem value="peripheral">Peripheral</SelectItem>
                  <SelectItem value="snack">Food & Beverage</SelectItem>
                  <SelectItem value="merchandise">Merchandise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity</label>
                <Input
                  type="number"
                  placeholder="Enter quantity"
                  value={newItemQuantity}
                  onChange={(e) => setNewItemQuantity(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Reorder Level</label>
                <Input
                  type="number"
                  placeholder="Enter reorder level"
                  value={newItemReorderLevel}
                  onChange={(e) => setNewItemReorderLevel(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddInventoryDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast({
                title: "Item Added",
                description: `${newItemName} has been added to inventory`
              });
              setShowAddInventoryDialog(false);
              setNewItemName("");
              setNewItemCategory("accessory");
              setNewItemQuantity("1");
              setNewItemReorderLevel("5");
            }}>
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Event Dialog */}
      <Dialog open={showAddEventDialog} onOpenChange={setShowAddEventDialog}>
        <DialogContent className="bg-black/80 border-primary/20">
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
            <DialogDescription>Schedule a gaming tournament or special event</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Event Name</label>
              <Input
                placeholder="Enter event name"
                value={newEventName}
                onChange={(e) => setNewEventName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={newEventDate}
                onChange={(e) => setNewEventDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Enter event description"
                value={newEventDescription}
                onChange={(e) => setNewEventDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Maximum Capacity</label>
              <Input
                type="number"
                placeholder="Enter maximum participants"
                value={newEventCapacity}
                onChange={(e) => setNewEventCapacity(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddEventDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast({
                title: "Event Created",
                description: `${newEventName} has been scheduled`
              });
              setShowAddEventDialog(false);
              setNewEventName("");
              setNewEventDate("");
              setNewEventDescription("");
              setNewEventCapacity("20");
            }}>
              Create Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

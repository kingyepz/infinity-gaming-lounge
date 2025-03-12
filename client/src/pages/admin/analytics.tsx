import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend, LineChart, Line, ResponsiveContainer } from "recharts";
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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  // Add Station Dialog
  const [showAddStationDialog, setShowAddStationDialog] = useState(false);
  const [newStationName, setNewStationName] = useState("");
  
  // Edit Station Dialog
  const [showEditStationDialog, setShowEditStationDialog] = useState(false);
  const [editStationId, setEditStationId] = useState<number | null>(null);
  const [editStationName, setEditStationName] = useState("");
  const [confirmDeleteStationDialog, setConfirmDeleteStationDialog] = useState(false);
  const [stationToDelete, setStationToDelete] = useState<number | null>(null);
  
  // Add Game Dialog
  const [showAddGameDialog, setShowAddGameDialog] = useState(false);
  const [newGameName, setNewGameName] = useState("");
  const [newGameDescription, setNewGameDescription] = useState("");
  
  // Edit Game Dialog
  const [showEditGameDialog, setShowEditGameDialog] = useState(false);
  const [editGameId, setEditGameId] = useState<number | null>(null);
  const [editGameName, setEditGameName] = useState("");
  const [editGameDescription, setEditGameDescription] = useState("");
  const [editGamePricePerSession, setEditGamePricePerSession] = useState("");
  const [editGamePricePerHour, setEditGamePricePerHour] = useState("");
  const [confirmDeleteGameDialog, setConfirmDeleteGameDialog] = useState(false);
  const [gameToDelete, setGameToDelete] = useState<number | null>(null);
  
  // Customers
  const [showEditCustomerDialog, setShowEditCustomerDialog] = useState(false);
  const [editCustomerId, setEditCustomerId] = useState<number | null>(null);
  const [editCustomerDisplayName, setEditCustomerDisplayName] = useState("");
  const [editCustomerGamingName, setEditCustomerGamingName] = useState("");
  const [editCustomerPhone, setEditCustomerPhone] = useState("");
  const [editCustomerPoints, setEditCustomerPoints] = useState("");
  const [confirmDeleteCustomerDialog, setConfirmDeleteCustomerDialog] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<number | null>(null);
  
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

  // Fetch stations data
  const { data: stations = [] } = useQuery({
    queryKey: ["/api/stations"],
    queryFn: () => apiRequest({ path: "/api/stations" })
  });

  // Fetch games data
  const { data: games = [] } = useQuery({
    queryKey: ["/api/games"],
    queryFn: () => apiRequest({ path: "/api/games" })
  });

  // Fetch transactions data
  const { data: transactions = [] } = useQuery({
    queryKey: ["/api/transactions"],
    queryFn: () => apiRequest({ path: "/api/transactions" })
  });

  // Fetch customers data
  const { data: customers = [] } = useQuery({
    queryKey: ["/api/users/customers"],
    queryFn: () => apiRequest({ path: "/api/users/customers" })
  });

  // Derived statistics
  const activeStations = stations.filter((station) => station.currentCustomer).length;
  const completedTransactions = transactions.filter((tx) => tx.status === "completed");
  const pendingTransactions = transactions.filter((tx) => tx.status === "pending");
  
  const todayRevenue = completedTransactions
    .filter((tx) => new Date(tx.createdAt).toDateString() === new Date().toDateString())
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const pendingAmount = pendingTransactions.reduce((acc, tx) => acc + Number(tx.amount), 0);
  const totalRevenue = completedTransactions.reduce((acc, tx) => acc + Number(tx.amount), 0);
  
  const newCustomers = customers.filter(
    (c) => new Date(c.createdAt).toDateString() === new Date().toDateString()
  ).length;

  // Chart data
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  const revenueChartData = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString('en-US', { weekday: 'short' });
    
    const dayTransactions = transactions.filter(tx => 
      new Date(tx.createdAt).toDateString() === date.toDateString() && 
      tx.status === "completed"
    );
    
    const amount = dayTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
    
    return {
      date: dateStr,
      amount: amount
    };
  }).reverse();

  const paymentMethodChartData = [
    { name: 'Cash', value: completedTransactions.filter(tx => tx.paymentMethod === 'cash').length },
    { name: 'M-Pesa', value: completedTransactions.filter(tx => tx.paymentMethod === 'mpesa').length },
    { name: 'Airtel', value: completedTransactions.filter(tx => tx.paymentMethod === 'airtel').length },
    { name: 'Card', value: completedTransactions.filter(tx => tx.paymentMethod === 'card').length },
  ].filter(item => item.value > 0);

  const popularGamesData = Object.entries(
    completedTransactions.reduce((acc, tx) => {
      const game = tx.gameName;
      if (!game) return acc;
      if (!acc[game]) acc[game] = 0;
      acc[game]++;
      return acc;
    }, {})
  )
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Event handlers
  const handleAddStation = async () => {
    if (!newStationName) {
      toast({
        title: "Error",
        description: "Please enter a station name",
        variant: "destructive"
      });
      return;
    }

    try {
      await apiRequest({
        path: "/api/stations",
        method: "POST",
        data: {
          name: newStationName,
          status: "available"
        }
      });

      toast({
        title: "Station Added",
        description: `Station ${newStationName} has been added successfully`
      });

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/stations"] });
      setShowAddStationDialog(false);
      setNewStationName("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add station",
        variant: "destructive"
      });
    }
  };

  // Function to open edit station dialog
  const handleEditStationClick = (station: GameStation) => {
    setEditStationId(station.id);
    setEditStationName(station.name);
    setShowEditStationDialog(true);
  };

  // Function to save edited station
  const handleEditStation = async () => {
    if (!editStationId || !editStationName) {
      toast({
        title: "Error",
        description: "Station name cannot be empty",
        variant: "destructive"
      });
      return;
    }

    try {
      // First, get the current station data to preserve required fields
      const currentStation = stations.find(station => station.id === editStationId);
      
      if (!currentStation) {
        toast({
          title: "Error",
          description: "Station not found",
          variant: "destructive"
        });
        return;
      }

      // Only update the name but preserve all other fields
      await apiRequest({
        path: `/api/stations/${editStationId}`,
        method: "PATCH",
        data: {
          name: editStationName,
          status: currentStation.status,
          currentCustomer: currentStation.currentCustomer || null,
          currentGame: currentStation.currentGame || null,
          sessionType: currentStation.sessionType || null,
          sessionStartTime: currentStation.sessionStartTime || null
        }
      });

      toast({
        title: "Station Updated",
        description: `Station name updated to ${editStationName}`
      });

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/stations"] });
      setShowEditStationDialog(false);
      setEditStationId(null);
      setEditStationName("");
    } catch (error) {
      console.error("Edit station error:", error);
      toast({
        title: "Error",
        description: "Failed to update station",
        variant: "destructive"
      });
    }
  };

  // Function to delete station
  const handleDeleteStation = async () => {
    if (!stationToDelete) return;

    try {
      await apiRequest({
        path: `/api/stations/${stationToDelete}`,
        method: "DELETE"
      });

      toast({
        title: "Station Deleted",
        description: "Station has been deleted successfully"
      });

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/stations"] });
      setConfirmDeleteStationDialog(false);
      setStationToDelete(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete station",
        variant: "destructive"
      });
    }
  };

  const handleAddGame = async () => {
    if (!newGameName) {
      toast({
        title: "Error",
        description: "Please enter a game name",
        variant: "destructive"
      });
      return;
    }

    try {
      await apiRequest({
        path: "/api/games",
        method: "POST",
        data: {
          name: newGameName,
          description: newGameDescription,
          pricePerHour: 200,
          pricePerSession: 40
        }
      });

      toast({
        title: "Game Added",
        description: `${newGameName} has been added successfully`
      });

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      setShowAddGameDialog(false);
      setNewGameName("");
      setNewGameDescription("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add game",
        variant: "destructive"
      });
    }
  };
  
  // Function to open edit game dialog
  const handleEditGameClick = (game: Game) => {
    setEditGameId(game.id);
    setEditGameName(game.name);
    setEditGameDescription(game.description || "");
    setEditGamePricePerSession(String(game.pricePerSession));
    setEditGamePricePerHour(String(game.pricePerHour));
    setShowEditGameDialog(true);
  };

  // Function to save edited game
  const handleEditGame = async () => {
    if (!editGameId || !editGameName) {
      toast({
        title: "Error",
        description: "Game name cannot be empty",
        variant: "destructive"
      });
      return;
    }

    try {
      await apiRequest({
        path: `/api/games/${editGameId}`,
        method: "PATCH",
        data: {
          name: editGameName,
          description: editGameDescription,
          pricePerSession: Number(editGamePricePerSession),
          pricePerHour: Number(editGamePricePerHour)
        }
      });

      toast({
        title: "Game Updated",
        description: `${editGameName} has been updated successfully`
      });

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      setShowEditGameDialog(false);
      setEditGameId(null);
      setEditGameName("");
      setEditGameDescription("");
      setEditGamePricePerSession("");
      setEditGamePricePerHour("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update game",
        variant: "destructive"
      });
    }
  };

  // Function to delete game
  const handleDeleteGame = async () => {
    if (!gameToDelete) return;

    try {
      await apiRequest({
        path: `/api/games/${gameToDelete}`,
        method: "DELETE"
      });

      toast({
        title: "Game Deleted",
        description: "Game has been deleted successfully"
      });

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      setConfirmDeleteGameDialog(false);
      setGameToDelete(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete game",
        variant: "destructive"
      });
    }
  };

  // Customer functions
  const handleEditCustomerClick = (customer: User) => {
    setEditCustomerId(customer.id);
    setEditCustomerDisplayName(customer.displayName);
    setEditCustomerGamingName(customer.gamingName);
    setEditCustomerPhone(customer.phoneNumber);
    setEditCustomerPoints(String(customer.points));
    setShowEditCustomerDialog(true);
  };

  const handleEditCustomer = async () => {
    if (!editCustomerId || !editCustomerDisplayName || !editCustomerPhone) {
      toast({
        title: "Error",
        description: "Customer name and phone number cannot be empty",
        variant: "destructive"
      });
      return;
    }

    try {
      await apiRequest({
        path: `/api/users/${editCustomerId}`,
        method: "PATCH",
        data: {
          displayName: editCustomerDisplayName,
          gamingName: editCustomerGamingName,
          phoneNumber: editCustomerPhone,
          points: Number(editCustomerPoints)
        }
      });

      toast({
        title: "Customer Updated",
        description: `${editCustomerDisplayName}'s information has been updated successfully`
      });

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/users/customers"] });
      setShowEditCustomerDialog(false);
      setEditCustomerId(null);
      setEditCustomerDisplayName("");
      setEditCustomerGamingName("");
      setEditCustomerPhone("");
      setEditCustomerPoints("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update customer",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;

    try {
      await apiRequest({
        path: `/api/users/${customerToDelete}`,
        method: "DELETE"
      });

      toast({
        title: "Customer Deleted",
        description: "Customer has been deleted successfully"
      });

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/users/customers"] });
      setConfirmDeleteCustomerDialog(false);
      setCustomerToDelete(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete customer",
        variant: "destructive"
      });
    }
  };

  // Function to get transaction details
  const getTransactionDetails = (transactionId) => {
    return transactions.find((tx) => tx.id === transactionId);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="flex-1 flex flex-col md:flex-row">
        <div className="w-full md:w-64 bg-black/50 p-6 backdrop-blur-md">
          <div className="flex flex-col items-center mb-6">
            <InfinityLogo />
            <div className="flex items-center justify-between w-full mt-3">
              <h1 className="text-xl sm:text-2xl font-bold text-primary">INFINITY GAMING LOUNGE</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation('/')}
                className="hover:bg-primary/20 mt-2"
              >
                <LogOutIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <ScrollArea className="h-[calc(100vh-220px)]">
            <div className="space-y-1">
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
                variant={activeTab === "reports" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("reports")}
              >
                <FileTextIcon className="mr-2 h-4 w-4" />
                Reports & Export
              </Button>
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
                <CalendarIcon className="mr-2 h-4 w-4" />
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
                variant={activeTab === "customers" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("customers")}
              >
                <UsersIcon className="mr-2 h-4 w-4" />
                Customers
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
                variant={activeTab === "payments" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("payments")}
              >
                <DollarSignIcon className="mr-2 h-4 w-4" />
                Payments
              </Button>
              <Button
                variant={activeTab === "financial" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("financial")}
              >
                <BriefcaseIcon className="mr-2 h-4 w-4" />
                Financial Management
              </Button>
              <Button
                variant={activeTab === "events" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("events")}
              >
                <CalendarDaysIcon className="mr-2 h-4 w-4" />
                Events
              </Button>
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
          
          {/* Logout Button */}
          <div className="mt-2 pt-2 border-t border-gray-800">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20"
              onClick={() => {
                localStorage.removeItem('user');
                setLocation('/');
                toast({
                  title: "Logged out",
                  description: "You have been logged out successfully",
                });
              }}
            >
              <LogOutIcon className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        <div className="flex-1 p-2 sm:p-4 md:p-6 backdrop-blur-sm bg-black/50 overflow-x-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="hidden">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="stations">Stations</TabsTrigger>
              <TabsTrigger value="reservations">Reservations</TabsTrigger>
              <TabsTrigger value="games">Games</TabsTrigger>
              <TabsTrigger value="customers">Customers</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
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
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={revenueChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                          <XAxis dataKey="date" stroke="#888" />
                          <YAxis stroke="#888" />
                          <Tooltip contentStyle={{ backgroundColor: '#222', borderColor: '#444' }} />
                          <Bar dataKey="amount" fill="hsl(var(--primary))" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-black/30 border-primary/20">
                    <CardHeader>
                      <CardTitle>Payment Methods</CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
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
                      </ResponsiveContainer>
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
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={revenueChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                        <XAxis dataKey="date" stroke="#888" />
                        <YAxis stroke="#888" />
                        <Tooltip contentStyle={{ backgroundColor: '#222', borderColor: '#444' }} />
                        <Bar dataKey="amount" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
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

            {/* Reports & Export Tab */}
            <TabsContent value="reports">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Reports & Export</h2>
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader>
                    <CardTitle>Generate Reports</CardTitle>
                    <CardDescription>Create and export various business reports</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Button className="flex items-center justify-between w-full">
                        <span>Revenue Report</span>
                        <DownloadIcon className="h-4 w-4" />
                      </Button>
                      <Button className="flex items-center justify-between w-full">
                        <span>Customer Activity</span>
                        <DownloadIcon className="h-4 w-4" />
                      </Button>
                      <Button className="flex items-center justify-between w-full">
                        <span>Station Usage</span>
                        <DownloadIcon className="h-4 w-4" />
                      </Button>
                      <Button className="flex items-center justify-between w-full">
                        <span>Game Popularity</span>
                        <DownloadIcon className="h-4 w-4" />
                      </Button>
                      <Button className="flex items-center justify-between w-full">
                        <span>Inventory Status</span>
                        <DownloadIcon className="h-4 w-4" />
                      </Button>
                      <Button className="flex items-center justify-between w-full">
                        <span>Financial Summary</span>
                        <DownloadIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader>
                    <CardTitle>Custom Report</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input type="date" />
                      </div>
                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input type="date" />
                      </div>
                      <div className="space-y-2">
                        <Label>Report Type</Label>
                        <Select defaultValue="revenue">
                          <SelectTrigger>
                            <SelectValue placeholder="Select report type" />
                          </SelectTrigger>
                          <SelectContent className="bg-black/90">
                            <SelectItem value="revenue">Revenue</SelectItem>
                            <SelectItem value="usage">Station Usage</SelectItem>
                            <SelectItem value="games">Game Popularity</SelectItem>
                            <SelectItem value="customers">Customer Activity</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Format</Label>
                        <Select defaultValue="csv">
                          <SelectTrigger>
                            <SelectValue placeholder="Select format" />
                          </SelectTrigger>
                          <SelectContent className="bg-black/90">
                            <SelectItem value="csv">CSV</SelectItem>
                            <SelectItem value="pdf">PDF</SelectItem>
                            <SelectItem value="excel">Excel</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button className="w-full md:w-auto">Generate Custom Report</Button>
                  </CardContent>
                </Card>
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
                    <CardFooter className="pt-0 flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditStationClick(station)}
                        disabled={!!station.currentCustomer}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => {
                          setStationToDelete(station.id);
                          setConfirmDeleteStationDialog(true);
                        }}
                        disabled={!!station.currentCustomer}
                      >
                        Delete
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
              
              {/* Edit Station Dialog */}
              <Dialog open={showEditStationDialog} onOpenChange={setShowEditStationDialog}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Station</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="stationName">Station Name</Label>
                      <Input
                        id="stationName"
                        placeholder="Enter station name"
                        value={editStationName}
                        onChange={(e) => setEditStationName(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowEditStationDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleEditStation}>Save Changes</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              {/* Delete Confirmation Dialog */}
              <Dialog open={confirmDeleteStationDialog} onOpenChange={setConfirmDeleteStationDialog}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirm Deletion</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete this station? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setConfirmDeleteStationDialog(false)}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleDeleteStation}>Delete</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>

            {/* Reservations Tab */}
            <TabsContent value="reservations">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Reservations Management</h2>
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader>
                    <CardTitle>Today's Reservations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead>Station</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell>John Doe</TableCell>
                            <TableCell>Station 3</TableCell>
                            <TableCell>4:00 PM</TableCell>
                            <TableCell>2 hours</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-yellow-500/20 text-yellow-500">
                                Upcoming
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm">Check In</Button>
                                <Button variant="destructive" size="sm">Cancel</Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Jane Smith</TableCell>
                            <TableCell>Station 5</TableCell>
                            <TableCell>6:30 PM</TableCell>
                            <TableCell>3 hours</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-yellow-500/20 text-yellow-500">
                                Upcoming
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm">Check In</Button>
                                <Button variant="destructive" size="sm">Cancel</Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Alex Johnson</TableCell>
                            <TableCell>Station 2</TableCell>
                            <TableCell>2:00 PM</TableCell>
                            <TableCell>2 hours</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-green-500/20 text-green-500">
                                Checked In
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button variant="outline" size="sm">View</Button>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="flex justify-between">
                  <Button>New Reservation</Button>
                  <Button variant="outline">View Calendar</Button>
                </div>
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
                    <CardFooter className="pt-0 flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditGameClick(game)}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => {
                          setGameToDelete(game.id);
                          setConfirmDeleteGameDialog(true);
                        }}
                      >
                        Delete
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
              
              {/* Edit Game Dialog */}
              <Dialog open={showEditGameDialog} onOpenChange={setShowEditGameDialog}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Game</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="gameName">Game Name</Label>
                      <Input
                        id="gameName"
                        placeholder="Enter game name"
                        value={editGameName}
                        onChange={(e) => setEditGameName(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="gameDescription">Description</Label>
                      <Textarea
                        id="gameDescription"
                        placeholder="Enter game description"
                        value={editGameDescription}
                        onChange={(e) => setEditGameDescription(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="pricePerSession">Price Per Game (KES)</Label>
                        <Input
                          id="pricePerSession"
                          type="number"
                          placeholder="Price per game"
                          value={editGamePricePerSession}
                          onChange={(e) => setEditGamePricePerSession(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="pricePerHour">Price Per Hour (KES)</Label>
                        <Input
                          id="pricePerHour"
                          type="number"
                          placeholder="Price per hour"
                          value={editGamePricePerHour}
                          onChange={(e) => setEditGamePricePerHour(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowEditGameDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleEditGame}>Save Changes</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              {/* Delete Confirmation Dialog */}
              <Dialog open={confirmDeleteGameDialog} onOpenChange={setConfirmDeleteGameDialog}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirm Deletion</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete this game? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setConfirmDeleteGameDialog(false)}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleDeleteGame}>Delete</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
                            <TableHead>Actions</TableHead>
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
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleEditCustomerClick(customer)}
                                  >
                                    Edit
                                  </Button>
                                  <Button 
                                    variant="destructive" 
                                    size="sm"
                                    onClick={() => {
                                      setCustomerToDelete(customer.id);
                                      setConfirmDeleteCustomerDialog(true);
                                    }}
                                  >
                                    Delete
                                  </Button>
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
              
              {/* Edit Customer Dialog */}
              <Dialog open={showEditCustomerDialog} onOpenChange={setShowEditCustomerDialog}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Customer</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                        id="displayName"
                        placeholder="Enter customer name"
                        value={editCustomerDisplayName}
                        onChange={(e) => setEditCustomerDisplayName(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="gamingName">Gaming Name</Label>
                      <Input
                        id="gamingName"
                        placeholder="Enter gaming name"
                        value={editCustomerGamingName}
                        onChange={(e) => setEditCustomerGamingName(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <Input
                        id="phoneNumber"
                        placeholder="Enter phone number"
                        value={editCustomerPhone}
                        onChange={(e) => setEditCustomerPhone(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="loyaltyPoints">Loyalty Points</Label>
                      <Input
                        id="loyaltyPoints"
                        type="number"
                        placeholder="Enter loyalty points"
                        value={editCustomerPoints}
                        onChange={(e) => setEditCustomerPoints(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowEditCustomerDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleEditCustomer}>Save Changes</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              {/* Delete Confirmation Dialog */}
              <Dialog open={confirmDeleteCustomerDialog} onOpenChange={setConfirmDeleteCustomerDialog}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirm Deletion</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete this customer? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setConfirmDeleteCustomerDialog(false)}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleDeleteCustomer}>Delete</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>

            {/* Inventory Tab */}
            <TabsContent value="inventory">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Inventory Management</h2>
                <Button onClick={() => setShowAddInventoryDialog(true)}>
                  <PlusCircleIcon className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </div>
              
              <div className="space-y-4">
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader>
                    <CardTitle>Console Inventory</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell>PlayStation 5</TableCell>
                            <TableCell>Console</TableCell>
                            <TableCell>8</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-green-500/20 text-green-500">In Stock</Badge>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Xbox Series X</TableCell>
                            <TableCell>Console</TableCell>
                            <TableCell>6</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-green-500/20 text-green-500">In Stock</Badge>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Gaming PC</TableCell>
                            <TableCell>Console</TableCell>
                            <TableCell>4</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-green-500/20 text-green-500">In Stock</Badge>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader>
                    <CardTitle>Accessories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Reorder Level</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell>PS5 Controller</TableCell>
                            <TableCell>Accessory</TableCell>
                            <TableCell>12</TableCell>
                            <TableCell>5</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-green-500/20 text-green-500">In Stock</Badge>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Xbox Controller</TableCell>
                            <TableCell>Accessory</TableCell>
                            <TableCell>8</TableCell>
                            <TableCell>5</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-green-500/20 text-green-500">In Stock</Badge>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Gaming Headset</TableCell>
                            <TableCell>Accessory</TableCell>
                            <TableCell>4</TableCell>
                            <TableCell>3</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-yellow-500/20 text-yellow-500">Low Stock</Badge>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>HDMI Cables</TableCell>
                            <TableCell>Accessory</TableCell>
                            <TableCell>2</TableCell>
                            <TableCell>5</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-red-500/20 text-red-500">Reorder</Badge>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader>
                    <CardTitle>Food & Beverages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Reorder Level</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell>Soft Drinks</TableCell>
                            <TableCell>Beverage</TableCell>
                            <TableCell>24</TableCell>
                            <TableCell>10</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-green-500/20 text-green-500">In Stock</Badge>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Energy Drinks</TableCell>
                            <TableCell>Beverage</TableCell>
                            <TableCell>18</TableCell>
                            <TableCell>8</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-green-500/20 text-green-500">In Stock</Badge>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Chips/Crisps</TableCell>
                            <TableCell>Snack</TableCell>
                            <TableCell>15</TableCell>
                            <TableCell>5</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-green-500/20 text-green-500">In Stock</Badge>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
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
                    <CardTitle>Recent Transactions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions.filter(tx => tx.paymentMethod).sort((a, b) => 
                            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                          ).slice(0, 10).map((tx) => (
                            <TableRow key={tx.id}>
                              <TableCell>{tx.id}</TableCell>
                              <TableCell>{tx.customerName}</TableCell>
                              <TableCell>KES {tx.amount}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {tx.paymentMethod}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={tx.status === "completed" ? "success" : tx.status === "pending" ? "warning" : "destructive"}>
                                  {tx.status}
                                </Badge>
                              </TableCell>
                              <TableCell>{new Date(tx.createdAt).toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-black/30 border-primary/20">
                    <CardHeader>
                      <CardTitle>Payment Methods</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span>Cash Payments</span>
                          <Switch checked id="cash-payments" />
                        </div>
                        <div className="flex justify-between">
                          <span>M-Pesa</span>
                          <Switch checked id="mpesa-payments" />
                        </div>
                        <div className="flex justify-between">
                          <span>Airtel Money</span>
                          <Switch checked id="airtel-payments" />
                        </div>
                        <div className="flex justify-between">
                          <span>Card Payments</span>
                          <Switch id="card-payments" />
                        </div>
                        <div className="flex justify-between">
                          <span>QR Code Payments</span>
                          <Switch checked id="qr-payments" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-black/30 border-primary/20">
                    <CardHeader>
                      <CardTitle>Payment Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Completed Transactions</p>
                          <p className="text-2xl font-bold">{completedTransactions.length}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Pending Transactions</p>
                          <p className="text-2xl font-bold">{pendingTransactions.length}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Average Transaction</p>
                          <p className="text-2xl font-bold">
                            KES {completedTransactions.length 
                              ? Math.round(totalRevenue / completedTransactions.length) 
                              : 0}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-black/30 border-primary/20">
                    <CardHeader>
                      <CardTitle>Payment Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button className="w-full" variant="outline">
                        <FileTextIcon className="mr-2 h-4 w-4" />
                        View Receipt History
                      </Button>
                      <Button className="w-full" variant="outline">
                        <TicketIcon className="mr-2 h-4 w-4" />
                        Manage Discounts
                      </Button>
                      <Button className="w-full" variant="outline">
                        <SettingsIcon className="mr-2 h-4 w-4" />
                        Payment Settings
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Financial Management Tab */}
            <TabsContent value="financial">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Financial Management</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-black/30 border-primary/20">
                    <CardHeader>
                      <CardTitle>Daily Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">KES {todayRevenue}</div>
                      <p className="text-sm text-muted-foreground">Today's earnings</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-black/30 border-primary/20">
                    <CardHeader>
                      <CardTitle>Monthly Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">KES {totalRevenue}</div>
                      <p className="text-sm text-muted-foreground">Current month</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-black/30 border-primary/20">
                    <CardHeader>
                      <CardTitle>Expenses</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">KES 25,000</div>
                      <p className="text-sm text-muted-foreground">Current month</p>
                    </CardContent>
                  </Card>
                </div>
                
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader>
                    <CardTitle>Revenue vs Expenses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] flex items-center justify-center">
                      <p className="text-muted-foreground">Financial chart visualization will appear here</p>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-black/30 border-primary/20">
                    <CardHeader>
                      <CardTitle>Expense Categories</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Category</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Percentage</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell>Rent</TableCell>
                              <TableCell>KES 12,000</TableCell>
                              <TableCell>48%</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Utilities</TableCell>
                              <TableCell>KES 5,000</TableCell>
                              <TableCell>20%</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Staff Salaries</TableCell>
                              <TableCell>KES 6,000</TableCell>
                              <TableCell>24%</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Supplies</TableCell>
                              <TableCell>KES 2,000</TableCell>
                              <TableCell>8%</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-black/30 border-primary/20">
                    <CardHeader>
                      <CardTitle>Financial Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button className="w-full" variant="outline">
                        <FileTextIcon className="mr-2 h-4 w-4" />
                        Record Expense
                      </Button>
                      <Button className="w-full" variant="outline">
                        <DatabaseIcon className="mr-2 h-4 w-4" />
                        View Financial Records
                      </Button>
                      <Button className="w-full" variant="outline">
                        <DownloadIcon className="mr-2 h-4 w-4" />
                        Export Financial Report
                      </Button>
                      <Button className="w-full" variant="outline">
                        <SettingsIcon className="mr-2 h-4 w-4" />
                        Financial Settings
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Events Tab */}
            <TabsContent value="events">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Events Management</h2>
                <Button onClick={() => setShowAddEventDialog(true)}>
                  <PlusCircleIcon className="mr-2 h-4 w-4" />
                  Add Event
                </Button>
              </div>
              
              <div className="space-y-4">
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader>
                    <CardTitle>Upcoming Events</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Event Name</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Capacity</TableHead>
                            <TableHead>Registrations</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell>FIFA Tournament</TableCell>
                            <TableCell>March 15, 2025</TableCell>
                            <TableCell>32</TableCell>
                            <TableCell>28</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-green-500/20 text-green-500">
                                Open
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm">Edit</Button>
                                <Button variant="outline" size="sm">View</Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Call of Duty Night</TableCell>
                            <TableCell>March 20, 2025</TableCell>
                            <TableCell>16</TableCell>
                            <TableCell>8</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-green-500/20 text-green-500">
                                Open
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm">Edit</Button>
                                <Button variant="outline" size="sm">View</Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>NBA 2K Finals</TableCell>
                            <TableCell>March 25, 2025</TableCell>
                            <TableCell>16</TableCell>
                            <TableCell>16</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-yellow-500/20 text-yellow-500">
                                Full
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm">Edit</Button>
                                <Button variant="outline" size="sm">View</Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader>
                    <CardTitle>Event Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Total Events</h4>
                        <p className="text-2xl font-bold">3</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Total Registrations</h4>
                        <p className="text-2xl font-bold">52</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Fill Rate</h4>
                        <p className="text-2xl font-bold">81%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader>
                    <CardTitle>Past Events</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Event Name</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Participants</TableHead>
                            <TableHead>Winner</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell>F1 Racing Championship</TableCell>
                            <TableCell>February 28, 2025</TableCell>
                            <TableCell>12</TableCell>
                            <TableCell>John Doe</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Midnight Fortnite Battle</TableCell>
                            <TableCell>February 15, 2025</TableCell>
                            <TableCell>24</TableCell>
                            <TableCell>Sarah Johnson</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Staff Management Tab */}
            <TabsContent value="staff">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Staff Management</h2>
                <Button onClick={() => setShowAddStaffDialog(true)}>
                  <UserPlusIcon className="mr-2 h-4 w-4" />
                  Add Staff
                </Button>
              </div>
              
              <div className="space-y-4">
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader>
                    <CardTitle>Staff Members</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="flex items-center space-x-2">
                              <Avatar>
                                <AvatarFallback>AM</AvatarFallback>
                              </Avatar>
                              <span>Alice Manager</span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-primary/20">
                                Admin
                              </Badge>
                            </TableCell>
                            <TableCell>alice@example.com</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-green-500/20 text-green-500">
                                Active
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm">Edit</Button>
                                <Button variant="destructive" size="sm">Disable</Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="flex items-center space-x-2">
                              <Avatar>
                                <AvatarFallback>BS</AvatarFallback>
                              </Avatar>
                              <span>Bob Staff</span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-blue-500/20 text-blue-500">
                                Staff
                              </Badge>
                            </TableCell>
                            <TableCell>bob@example.com</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-green-500/20 text-green-500">
                                Active
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm">Edit</Button>
                                <Button variant="destructive" size="sm">Disable</Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="flex items-center space-x-2">
                              <Avatar>
                                <AvatarFallback>CM</AvatarFallback>
                              </Avatar>
                              <span>Charlie Manager</span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-purple-500/20 text-purple-500">
                                Manager
                              </Badge>
                            </TableCell>
                            <TableCell>charlie@example.com</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-green-500/20 text-green-500">
                                Active
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm">Edit</Button>
                                <Button variant="destructive" size="sm">Disable</Button>
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
                      <CardTitle>Roles & Permissions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Admin</h4>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox id="admin-all" checked disabled />
                              <label htmlFor="admin-all">Full system access</label>
                            </div>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h4 className="font-medium mb-2">Manager</h4>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox id="manager-dashboard" checked disabled />
                              <label htmlFor="manager-dashboard">Dashboard access</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox id="manager-stations" checked disabled />
                              <label htmlFor="manager-stations">Manage stations</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox id="manager-staff" checked disabled />
                              <label htmlFor="manager-staff">Manage staff</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox id="manager-reports" checked disabled />
                              <label htmlFor="manager-reports">View reports</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox id="manager-financial" checked disabled />
                              <label htmlFor="manager-financial">View financial data</label>
                            </div>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h4 className="font-medium mb-2">Staff</h4>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox id="staff-pos" checked disabled />
                              <label htmlFor="staff-pos">POS access</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox id="staff-customers" checked disabled />
                              <label htmlFor="staff-customers">Customer management</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox id="staff-inventory" checked disabled />
                              <label htmlFor="staff-inventory">View inventory</label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-black/30 border-primary/20">
                    <CardHeader>
                      <CardTitle>Staff Schedule</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium">Today's Shifts</h4>
                          <div className="mt-2 space-y-2">
                            <div className="flex justify-between items-center p-2 bg-primary/10 rounded">
                              <div>
                                <p className="font-medium">Morning Shift</p>
                                <p className="text-xs text-muted-foreground">8:00 AM - 2:00 PM</p>
                              </div>
                              <div>
                                <Badge>Alice, Bob</Badge>
                              </div>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-primary/10 rounded">
                              <div>
                                <p className="font-medium">Evening Shift</p>
                                <p className="text-xs text-muted-foreground">2:00 PM - 8:00 PM</p>
                              </div>
                              <div>
                                <Badge>Charlie, David</Badge>
                              </div>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-primary/10 rounded">
                              <div>
                                <p className="font-medium">Night Shift</p>
                                <p className="text-xs text-muted-foreground">8:00 PM - 12:00 AM</p>
                              </div>
                              <div>
                                <Badge>Eve, Frank</Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-end">
                          <Button variant="outline">View Full Schedule</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Security</h2>
                
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader>
                    <CardTitle>Access Control</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">Two-Factor Authentication</h4>
                          <p className="text-sm text-muted-foreground">Require 2FA for all admin users</p>
                        </div>
                        <Switch id="2fa" />
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">Account Lockout</h4>
                          <p className="text-sm text-muted-foreground">Lock account after 5 failed attempts</p>
                        </div>
                        <Switch id="account-lockout" checked />
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">Password Expiry</h4>
                          <p className="text-sm text-muted-foreground">Force password change every 90 days</p>
                        </div>
                        <Switch id="password-expiry" checked />
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">Session Timeout</h4>
                          <p className="text-sm text-muted-foreground">Automatically log out after 30 minutes of inactivity</p>
                        </div>
                        <Switch id="session-timeout" checked />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader>
                    <CardTitle>Security Logs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>IP Address</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell>March 12, 2025 08:32</TableCell>
                            <TableCell>admin@example.com</TableCell>
                            <TableCell>Login successful</TableCell>
                            <TableCell>192.168.1.1</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>March 12, 2025 08:15</TableCell>
                            <TableCell>staff@example.com</TableCell>
                            <TableCell>Login successful</TableCell>
                            <TableCell>192.168.1.2</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>March 11, 2025 22:45</TableCell>
                            <TableCell>unknown@mail.com</TableCell>
                            <TableCell>Login failed</TableCell>
                            <TableCell>203.0.113.1</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>March 11, 2025 18:30</TableCell>
                            <TableCell>admin@example.com</TableCell>
                            <TableCell>Security settings changed</TableCell>
                            <TableCell>192.168.1.1</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader>
                    <CardTitle>Backup & Recovery</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Automatic Backups</h4>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">Daily backups at 2:00 AM</p>
                        <Switch checked id="daily-backup" />
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Recent Backups</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-2 bg-primary/10 rounded">
                          <div>
                            <p>March 12, 2025 - 2:00 AM</p>
                            <p className="text-xs text-muted-foreground">Size: 24.5 MB</p>
                          </div>
                          <Button variant="outline" size="sm">Restore</Button>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-primary/10 rounded">
                          <div>
                            <p>March 11, 2025 - 2:00 AM</p>
                            <p className="text-xs text-muted-foreground">Size: 24.2 MB</p>
                          </div>
                          <Button variant="outline" size="sm">Restore</Button>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-primary/10 rounded">
                          <div>
                            <p>March 10, 2025 - 2:00 AM</p>
                            <p className="text-xs text-muted-foreground">Size: 23.8 MB</p>
                          </div>
                          <Button variant="outline" size="sm">Restore</Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between">
                      <Button variant="outline">
                        <DownloadIcon className="mr-2 h-4 w-4" />
                        Create Manual Backup
                      </Button>
                      <Button variant="outline">
                        <FileIcon className="mr-2 h-4 w-4" />
                        View Backup History
                      </Button>
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
                    <CardTitle>General Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Business Name</Label>
                        <Input defaultValue="Infinity Gaming Lounge" />
                      </div>
                      <div className="space-y-2">
                        <Label>Contact Email</Label>
                        <Input defaultValue="contact@infinitygaming.com" />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone Number</Label>
                        <Input defaultValue="+254 700 000 000" />
                      </div>
                      <div className="space-y-2">
                        <Label>Address</Label>
                        <Input defaultValue="123 Gaming Street, Nairobi" />
                      </div>
                    </div>
                    <Button>Save General Settings</Button>
                  </CardContent>
                </Card>
                
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader>
                    <CardTitle>System Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">Dark Mode</h4>
                          <p className="text-sm text-muted-foreground">Use dark theme throughout the application</p>
                        </div>
                        <Switch 
                          id="dark-mode" 
                          defaultChecked={localStorage.getItem('theme') === 'dark'} 
                          onCheckedChange={(checked) => {
                            const theme = checked ? 'dark' : 'light';
                            localStorage.setItem('theme', theme);
                            document.documentElement.classList.toggle('dark', checked);
                            toast({
                              title: `${checked ? 'Dark' : 'Light'} mode enabled`,
                              description: `The application theme has been changed to ${checked ? 'dark' : 'light'} mode`,
                            });
                          }}
                        />
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">Notifications</h4>
                          <p className="text-sm text-muted-foreground">Enable system notifications</p>
                        </div>
                        <Switch 
                          id="notifications"
                          defaultChecked={true}
                          onCheckedChange={(checked) => {
                            toast({
                              title: `Notifications ${checked ? 'enabled' : 'disabled'}`,
                              description: `You will ${checked ? 'now' : 'no longer'} receive system notifications`,
                            });
                          }}
                        />
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">Sounds</h4>
                          <p className="text-sm text-muted-foreground">Enable system sounds</p>
                        </div>
                        <Switch 
                          id="sounds"
                          defaultChecked={false}
                          onCheckedChange={(checked) => {
                            toast({
                              title: `Sound effects ${checked ? 'enabled' : 'disabled'}`,
                              description: `System sound effects have been ${checked ? 'enabled' : 'disabled'}`,
                            });
                          }}
                        />
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">Automatic Updates</h4>
                          <p className="text-sm text-muted-foreground">Automatically update the system when available</p>
                        </div>
                        <Switch 
                          id="auto-updates"
                          defaultChecked={true}
                          onCheckedChange={(checked) => {
                            toast({
                              title: `Automatic updates ${checked ? 'enabled' : 'disabled'}`,
                              description: `System will ${checked ? 'now' : 'no longer'} update automatically`,
                            });
                          }}
                        />
                      </div>
                    </div>
                    <Button onClick={() => {
                      toast({
                        title: "Preferences Saved",
                        description: "Your system preferences have been updated"
                      });
                    }}>Save Preferences</Button>
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
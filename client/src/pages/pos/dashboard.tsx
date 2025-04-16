import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import PaymentModal from "@/components/shared/PaymentModal";
import StationTransactionHistoryModal from "@/components/shared/StationTransactionHistoryModal";
import type { GameStation, Game, User, Transaction } from "@shared/schema";
import { useLocation } from "wouter";
import { useWebSocket } from "@/context/WebSocketContext";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    CalendarIcon,
    GamepadIcon,
    BarChart2Icon,
    DollarSignIcon,
    UsersIcon,
    DownloadIcon,
    LogOutIcon,
    HistoryIcon,
    TrophyIcon,
    GiftIcon,
    UserIcon,
    MonitorIcon,
    PackageIcon,
    LayoutDashboardIcon,
    RefreshCwIcon, Loader2Icon
} from "lucide-react";
import InfinityLogo from "@/components/animations/InfinityLogo";
import CustomerPortal from "@/pages/customer/portal";
import axios from "axios";

export default function POSDashboard() {
    const [selectedStation, setSelectedStation] = useState<GameStation | null>(null);
    const [showNewSessionModal, setShowNewSessionModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
    const [selectedGame, setSelectedGame] = useState<string | null>(null);
    const [selectedSessionType, setSelectedSessionType] = useState<"per_game" | "hourly" | null>(null);
    const [activeTab, setActiveTab] = useState("stations"); // Default to stations tab
    const { toast } = useToast();
    const [, setLocation] = useLocation();
    const queryClient = useQueryClient();
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [showTransactionHistoryModal, setShowTransactionHistoryModal] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState(0);
    let diffMins = 0;
    const [isRefreshing, setIsRefreshing] = useState(false);

    // WebSocket and API data fetching
    const { gameStations: wsStations, connected: wsConnected, registerRole, requestStationUpdates } = useWebSocket();
    const { data: apiStations = [], isLoading: stationsLoading, refetch: refetchStations } = useQuery({
        queryKey: ["/api/stations"],
        queryFn: () => apiRequest({ path: "/api/stations" })
    });
    const stations = wsConnected && wsStations.length > 0 ? wsStations : apiStations;

    useEffect(() => {
        if (wsConnected) {
            console.log("WebSocket connected, registering as staff and requesting updates");
            registerRole("staff");
            requestStationUpdates();
        }
    }, [wsConnected, registerRole, requestStationUpdates]);

    const { data: games = [], isLoading: gamesLoading } = useQuery({
        queryKey: ["/api/games"],
        queryFn: () => apiRequest({ path: "/api/games" })
    });

    const { data: customers = [], isLoading: customersLoading } = useQuery({
        queryKey: ["/api/users/customers"],
        queryFn: () => apiRequest({ path: "/api/users/customers" })
    });

    const { data: transactions = [], refetch: refetchTransactions } = useQuery<Transaction[]>({
        queryKey: ["/api/transactions"],
        queryFn: () => apiRequest({ path: "/api/transactions" })
    });

    // Calculated statistics
    const activeStationsCount = stations.filter((s: any) => s.currentCustomer)?.length || 0;
    const completedTransactions = transactions.filter((tx: any) => tx.paymentStatus === "completed") || [];
    const todayRevenue = completedTransactions
        .filter((tx: any) => new Date(tx.createdAt).toDateString() === new Date().toDateString())
        .reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);
    const newCustomersCount = customers
        .filter((c: any) => new Date(c.createdAt).toDateString() === new Date().toDateString())
        .length;
    const pendingTransactions = transactions.filter((tx: any) => tx.paymentStatus === "pending") || [];
    const pendingAmount = pendingTransactions.reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);

    // Logout handler
    const handleLogout = () => {
        localStorage.removeItem('user');
        setLocation('/');
        toast({ title: "Logged out", description: "You have been logged out successfully" });
    };

    // Refresh handler
    const refreshAllData = async () => {
        setIsRefreshing(true);
        try {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["/api/stations"] }),
                queryClient.invalidateQueries({ queryKey: ["/api/games"] }),
                queryClient.invalidateQueries({ queryKey: ["/api/users/customers"] }),
                queryClient.invalidateQueries({ queryKey: ["/api/transactions"] })
            ]);
            toast({ title: "Data refreshed", description: "Dashboard data has been updated." });
        } catch (error) {
            toast({ title: "Refresh failed", description: "Could not refresh data.", variant: "destructive" });
        } finally {
            setIsRefreshing(false);
        }
    };

    // Session handlers
    const handleEndSession = async (station: GameStation) => {
        try {
            if (!station.sessionStartTime) {
                throw new Error("Invalid session start time");
            }
            const startTime = new Date(station.sessionStartTime);
            const now = new Date();
            diffMins = Math.floor((now.getTime() - startTime.getTime()) / 60000);
            const currentGame = games.find((g: any) => g.name === station.currentGame);
            const gamePrice = currentGame?.pricePerSession || 40;
            const hourlyPrice = currentGame?.pricePerHour || 200;
            const cost = station.sessionType === "per_game" ? gamePrice : Math.ceil(diffMins / 60) * hourlyPrice;
            const currentCustomer = customers.find((c: any) => c.displayName === station.currentCustomer);
            setSelectedCustomer(currentCustomer || null);
            setPaymentAmount(cost);
            setSelectedStation(station);
            setShowPaymentDialog(true);
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to prepare payment.", variant: "destructive" });
        }
    };

    const handleStartSession = async () => {
        try {
            if (!selectedStation || !selectedGame || !selectedCustomer || !selectedSessionType) {
                toast({ title: "Missing Information", description: "Please select game, customer, and session type", variant: "destructive" });
                return;
            }
            const currentGame = games.find((g: any) => g.id.toString() === selectedGame);
            const gamePrice = currentGame?.pricePerSession || 40;
            const hourlyPrice = currentGame?.pricePerHour || 200;
            await apiRequest({
                path: "/api/sessions/start",
                method: "POST",
                data: {
                    stationId: selectedStation.id,
                    customerId: selectedCustomer.id,
                    customerName: selectedCustomer.displayName,
                    gameId: selectedGame,
                    sessionType: selectedSessionType,
                    baseRate: gamePrice,
                    hourlyRate: hourlyPrice
                }
            });
            await queryClient.invalidateQueries({ queryKey: ["/api/stations"] });
            setShowNewSessionModal(false);
            setSelectedGame(null);
            setSelectedCustomer(null);
            setSelectedSessionType(null);
            toast({ title: "Session Started", description: "Gaming session started successfully!" });
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to start session.", variant: "destructive" });
        }
    };

    const handlePaymentComplete = async () => {
        try {
            if (selectedStation) {
                await apiRequest({
                    method: "PATCH",
                    path: `/api/stations/${selectedStation.id}`,
                    data: {
                        currentCustomer: null,
                        currentGame: null,
                        sessionType: null,
                        sessionStartTime: null,
                        status: "available"
                    }
                });
                toast({ title: "Payment Successful", description: "Session ended and payment received." });
            } else {
                toast({ title: "Payment Processed", description: "Payment successful, but station info unavailable." });
            }
            await queryClient.invalidateQueries({ queryKey: ["/api/stations"] });
            await queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
            setShowPaymentDialog(false);
            setSelectedStation(null);
        } catch (error) {
            toast({ title: "Error", description: "Error resetting station after payment.", variant: "destructive" });
            setShowPaymentDialog(false);
            await queryClient.invalidateQueries({ queryKey: ["/api/stations"] });
            await queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
        }
    };

    if (stationsLoading || gamesLoading || customersLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
                <Loader2Icon className="animate-spin w-8 h-8 text-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
            <div className="flex-1 flex flex-col md:flex-row">
                {/* Sidebar */}
                <div className="w-full md:w-64 bg-black/50 p-4 backdrop-blur-md">
                    <div className="flex flex-col items-center mb-6">
                        <InfinityLogo />
                        <div className="flex items-center justify-between w-full mt-3">
                             <h1 className="text-lg font-bold text-primary text-center flex-grow">INFINITY GAMING</h1>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleLogout}
                                className="hover:bg-primary/20 text-red-400 hover:text-red-300"
                            >
                                <LogOutIcon className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    <ScrollArea className="h-[calc(100vh-160px)]">
                        <div className="space-y-1">
                            <Button
                                variant={activeTab === "stations" ? "secondary" : "ghost"}
                                className="w-full justify-start"
                                onClick={() => setActiveTab("stations")}
                            >
                                <MonitorIcon className="mr-2 h-4 w-4" />
                                Stations
                            </Button>
                            <Button
                                variant={activeTab === "overview" ? "secondary" : "ghost"}
                                className="w-full justify-start"
                                onClick={() => setActiveTab("overview")}
                            >
                                <LayoutDashboardIcon className="mr-2 h-4 w-4" />
                                Overview
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
                                variant={activeTab === "transactions" ? "secondary" : "ghost"}
                                className="w-full justify-start"
                                onClick={() => setActiveTab("transactions")}
                            >
                                <DollarSignIcon className="mr-2 h-4 w-4" />
                                Transactions
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
                                Inventory Check
                            </Button>
                             <Button
                                variant={activeTab === "reservations" ? "secondary" : "ghost"}
                                className="w-full justify-start"
                                onClick={() => setActiveTab("reservations")}
                             >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                Reservations
                            </Button>
                        </div>
                    </ScrollArea>
                     {/* Refresh Button in Sidebar */}
                     <div className="mt-2 pt-2 border-t border-gray-800">
                         <Button
                             variant="outline"
                             onClick={refreshAllData}
                             disabled={isRefreshing}
                             className="w-full flex items-center justify-start gap-2 bg-primary/10 hover:bg-primary/20 text-primary"
                         >
                             <RefreshCwIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                             {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
                         </Button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 p-2 sm:p-4 md:p-6 backdrop-blur-sm bg-black/50 overflow-auto">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                        {/* Top Tab Navigation */}
                        <div className="mb-4 border-b border-gray-800">
                             <TabsList className="w-full flex overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                                <TabsTrigger value="stations">Stations</TabsTrigger>
                                <TabsTrigger value="overview">Overview</TabsTrigger>
                                <TabsTrigger value="customers">Customers</TabsTrigger>
                                <TabsTrigger value="transactions">Transactions</TabsTrigger>
                                <TabsTrigger value="games">Game Catalog</TabsTrigger>
                                <TabsTrigger value="inventory">Inventory</TabsTrigger>
                                <TabsTrigger value="reservations">Reservations</TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Stations Tab */}
                        <TabsContent value="stations" className="max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                             <h2 className="text-2xl font-bold mb-4">Gaming Stations</h2>
                             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {stations.map((station: any) => (
                                    <Card key={station.id} className={`${station.currentCustomer ? 'bg-black/40 border-2 border-green-500' : 'bg-black/30 border-primary/20'} relative overflow-hidden shadow-lg hover:shadow-primary/30 transition-shadow duration-300`}>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="flex items-center justify-between text-base">
                                                <span>{station.name}</span>
                                                {station.currentCustomer ? (
                                                     <Badge variant="success" className="bg-green-600">Active</Badge>
                                                ) : (
                                                     <Badge variant="outline" className="border-primary/50 text-primary">Available</Badge>
                                                )}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {station.currentCustomer ? (
                                                <div className="space-y-1 text-sm">
                                                     <p><strong className="text-muted-foreground">Customer:</strong> {station.currentCustomer}</p>
                                                     <p><strong className="text-muted-foreground">Game:</strong> {station.currentGame}</p>
                                                     <p><strong className="text-muted-foreground">Type:</strong> {station.sessionType === "per_game" ? "Per Game" : "Hourly"}</p>
                                                     <p><strong className="text-muted-foreground">Started:</strong> {new Date(station.sessionStartTime).toLocaleTimeString()}</p>
                                                     <Button
                                                         variant="destructive"
                                                         size="sm"
                                                         className="w-full mt-3"
                                                         onClick={() => handleEndSession(station)}
                                                     >
                                                         End Session & Pay
                                                     </Button>
                                                 </div>
                                            ) : (
                                                <div className="space-y-2 text-center">
                                                    <p className="text-sm text-gray-400 py-2">Ready for player</p>
                                                    <Button
                                                        className="w-full bg-primary hover:bg-primary/80"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedStation(station);
                                                            setShowNewSessionModal(true);
                                                        }}
                                                    >
                                                        Start Session
                                                    </Button>
                                                </div>
                                            )}
                                        </CardContent>
                                         <CardFooter className="pt-2 flex justify-end">
                                             <Button
                                                 variant="ghost"
                                                 size="sm"
                                                 onClick={() => {
                                                     setSelectedStation(station);
                                                     setShowTransactionHistoryModal(true);
                                                 }}
                                                 className="text-xs text-muted-foreground hover:text-primary"
                                             >
                                                 <HistoryIcon className="mr-1 h-3 w-3" /> History
                                             </Button>
                                         </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>

                        {/* Overview Tab */}
                        <TabsContent value="overview" className="max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                            <h2 className="text-2xl font-bold mb-4">Dashboard Overview</h2>
                             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                 <Card className="bg-black/30 border-primary/20">
                                     <CardHeader className="pb-2">
                                         <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                                     </CardHeader>
                                     <CardContent>
                                         <div className="text-2xl font-bold">{activeStationsCount}</div>
                                         <p className="text-xs text-gray-400">Currently playing</p>
                                     </CardContent>
                                 </Card>
                                 <Card className="bg-black/30 border-primary/20">
                                     <CardHeader className="pb-2">
                                         <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
                                     </CardHeader>
                                     <CardContent>
                                         <div className="text-2xl font-bold">KES {todayRevenue.toFixed(2)}</div>
                                         <p className="text-xs text-gray-400">From completed sessions</p>
                                     </CardContent>
                                 </Card>
                                 <Card className="bg-black/30 border-primary/20">
                                     <CardHeader className="pb-2">
                                         <CardTitle className="text-sm font-medium">New Customers Today</CardTitle>
                                     </CardHeader>
                                     <CardContent>
                                         <div className="text-2xl font-bold">{newCustomersCount}</div>
                                         <p className="text-xs text-gray-400">Joined today</p>
                                     </CardContent>
                                 </Card>
                                 <Card className="bg-black/30 border-primary/20">
                                     <CardHeader className="pb-2">
                                         <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                                     </CardHeader>
                                     <CardContent>
                                         <div className="text-2xl font-bold">KES {pendingAmount.toFixed(2)}</div>
                                         <p className="text-xs text-gray-400">From {pendingTransactions.length} sessions</p>
                                     </CardContent>
                                 </Card>
                            </div>
                             {/* Add more overview components here if needed */}
                        </TabsContent>

                         {/* Customers Tab */}
                         <TabsContent value="customers" className="max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                             <h2 className="text-2xl font-bold mb-4">Customer List</h2>
                             <Card className="bg-black/30 border-primary/20">
                                 <CardContent className="pt-4">
                                     <div className="overflow-x-auto">
                                         <Table>
                                             <TableHeader>
                                                 <TableRow>
                                                     <TableHead>ID</TableHead>
                                                     <TableHead>Name</TableHead>
                                                     <TableHead>Gaming Name</TableHead>
                                                     <TableHead>Phone</TableHead>
                                                     <TableHead>Points</TableHead>
                                                     <TableHead>Joined</TableHead>
                                                 </TableRow>
                                             </TableHeader>
                                             <TableBody>
                                                 {customers.map((customer: User) => (
                                                     <TableRow key={customer.id}>
                                                         <TableCell>{customer.id}</TableCell>
                                                         <TableCell>{customer.displayName}</TableCell>
                                                         <TableCell>{customer.gamingName || '-'}</TableCell>
                                                         <TableCell>{customer.phoneNumber}</TableCell>
                                                         <TableCell>
                                                             <Badge variant="outline" className="bg-primary/20">
                                                                 <TrophyIcon className="mr-1 h-3 w-3" />
                                                                 {customer.points}
                                                             </Badge>
                                                         </TableCell>
                                                         <TableCell>{new Date(customer.createdAt).toLocaleDateString()}</TableCell>
                                                     </TableRow>
                                                 ))}
                                             </TableBody>
                                         </Table>
                                     </div>
                                 </CardContent>
                             </Card>
                         </TabsContent>

                        {/* Transactions Tab */}
                        <TabsContent value="transactions" className="max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                            <h2 className="text-2xl font-bold mb-4">Recent Transactions</h2>
                            <Card className="bg-black/30 border-primary/20">
                                <CardContent className="pt-4">
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>ID</TableHead>
                                                    <TableHead>Customer</TableHead>
                                                    <TableHead>Station</TableHead>
                                                    <TableHead>Amount</TableHead>
                                                    <TableHead>Method</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Date</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 20).map((tx: Transaction) => (
                                                    <TableRow key={tx.id}>
                                                        <TableCell>{tx.id}</TableCell>
                                                        <TableCell>{tx.customerName}</TableCell>
                                                        <TableCell>{stations.find(s => s.id === tx.stationId)?.name || tx.stationId}</TableCell>
                                                        <TableCell>KES {tx.amount}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className="capitalize">{tx.paymentMethod || 'N/A'}</Badge>
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
                        </TabsContent>

                         {/* Games Tab */}
                         <TabsContent value="games" className="max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                             <h2 className="text-2xl font-bold mb-4">Game Catalog</h2>
                             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                 {games.map((game) => (
                                     <Card key={game.id} className="bg-black/30 border-primary/20">
                                         <CardHeader className="pb-2">
                                             <CardTitle className="text-base">{game.name}</CardTitle>
                                         </CardHeader>
                                         <CardContent>
                                             <p className="text-sm text-gray-400 mb-2 h-10 overflow-hidden">{game.description || "No description"}</p>
                                             <div className="flex justify-between text-sm">
                                                 <Badge variant="outline">Game: KES {game.pricePerSession}</Badge>
                                                 <Badge variant="outline">Hour: KES {game.pricePerHour}</Badge>
                                             </div>
                                         </CardContent>
                                     </Card>
                                 ))}
                             </div>
                         </TabsContent>

                        {/* Inventory Tab */}
                        <TabsContent value="inventory" className="max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                            <h2 className="text-2xl font-bold mb-4">Inventory Check</h2>
                             {/* Placeholder content */}
                             <Card className="bg-black/30 border-primary/20 p-6">
                                 <div className="text-center text-gray-400">
                                     <PackageIcon className="mx-auto h-12 w-12 text-primary/50 mb-4" />
                                     <p className="font-semibold">Inventory Management</p>
                                     <p className="text-sm">Track consoles, accessories, and snacks.</p>
                                     <p className="text-xs mt-2">(This feature is under development)</p>
                                 </div>
                             </Card>
                        </TabsContent>

                         {/* Reservations Tab */}
                         <TabsContent value="reservations" className="max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                             <h2 className="text-2xl font-bold mb-4">Reservations</h2>
                             {/* Placeholder content */}
                             <Card className="bg-black/30 border-primary/20 p-6">
                                 <div className="text-center text-gray-400">
                                     <CalendarIcon className="mx-auto h-12 w-12 text-primary/50 mb-4" />
                                     <p className="font-semibold">Reservation System</p>
                                     <p className="text-sm">View and manage upcoming bookings.</p>
                                     <p className="text-xs mt-2">(This feature is available in the Admin portal)</p>
                                 </div>
                             </Card>
                         </TabsContent>

                    </Tabs>
                </div>
            </div>

            {/* Session Modal */}
            <Dialog open={showNewSessionModal} onOpenChange={setShowNewSessionModal}>
                <DialogContent className="bg-[#151a23] border-[#212936] text-white">
                    <DialogHeader>
                        <DialogTitle>Start New Gaming Session</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Station</label>
                            <div className="p-2 rounded-md bg-[#1d212b] border border-[#212936]">
                                {selectedStation?.name || "No station selected"}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Customer</label>
                            <Select
                                value={selectedCustomer?.id?.toString()}
                                onValueChange={(value) => {
                                    const customer = customers.find((c: any) => c.id.toString() === value);
                                    setSelectedCustomer(customer || null);
                                }}
                            >
                                <SelectTrigger className="bg-[#1d212b] border-[#212936]">
                                    <SelectValue placeholder="Select customer" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1d212b] border-[#212936] text-white">
                                    {customers.map((customer: any) => (
                                        <SelectItem key={customer.id} value={customer.id.toString()}>
                                            {customer.displayName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Game</label>
                            <Select
                                value={selectedGame}
                                onValueChange={setSelectedGame}
                            >
                                <SelectTrigger className="bg-[#1d212b] border-[#212936]">
                                    <SelectValue placeholder="Select game" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1d212b] border-[#212936] text-white">
                                    {games.map((game: any) => (
                                        <SelectItem key={game.id} value={game.id.toString()}>
                                            {game.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Session Type</label>
                            <Select
                                value={selectedSessionType || undefined}
                                onValueChange={(value) => setSelectedSessionType(value as "per_game" | "hourly")}
                            >
                                <SelectTrigger className="bg-[#1d212b] border-[#212936]">
                                    <SelectValue placeholder="Select session type" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1d212b] border-[#212936] text-white">
                                    <SelectItem value="per_game">Per Game</SelectItem>
                                    <SelectItem value="hourly">Hourly</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setShowNewSessionModal(false)} className="border-[#212936] hover:bg-[#2a3341] hover:text-white">
                            Cancel
                        </Button>
                        <Button type="button" onClick={handleStartSession} className="bg-[#4794f8] hover:bg-[#3a7fd8]">
                            Start Session
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Payment Modal */}
            {showPaymentDialog && selectedStation && (
                <PaymentModal
                    station={selectedStation}
                    onClose={() => {
                        setShowPaymentDialog(false);
                        setSelectedStation(null);
                    }}
                    onPaymentComplete={handlePaymentComplete}
                    userId={selectedCustomer?.id}
                />
            )}

            {/* Transaction History Modal */}
            {showTransactionHistoryModal && selectedStation && (
                <StationTransactionHistoryModal
                    open={showTransactionHistoryModal}
                    onOpenChange={setShowTransactionHistoryModal}
                    station={selectedStation}
                />
            )}
        </div>
    );
}

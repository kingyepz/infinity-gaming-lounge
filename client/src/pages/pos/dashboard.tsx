import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import PaymentModal from "@/components/shared/PaymentModal";
import StationTransactionHistoryModal from "@/components/shared/StationTransactionHistoryModal";
import type { GameStation, Game, User, Transaction } from "@shared/schema";
import { useLocation } from "wouter";
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
    PrinterIcon,
    LogOutIcon,
    HistoryIcon,
} from "lucide-react";
import InfinityLogo from "@/components/animations/InfinityLogo";
import CustomerPortal from "@/pages/customer/portal";
import axios from "axios";

export default function POSDashboard() {
    const [selectedStation, setSelectedStation] = useState<GameStation | null>(null);
    const [showPayment, setShowPayment] = useState(false);
    const [showRegistration, setShowRegistration] = useState(false);
    const [showNewSessionModal, setShowNewSessionModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
    const [selectedGame, setSelectedGame] = useState<string | null>(null);
    const [selectedSessionType, setSelectedSessionType] = useState<"per_game" | "hourly" | null>(null);
    const [showCustomerRegistration, setShowCustomerRegistration] = useState(false);
    const [activeTab, setActiveTab] = useState("sessions");
    const { toast } = useToast();
    const [, setLocation] = useLocation();
    const queryClient = useQueryClient();
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [showTransactionHistoryModal, setShowTransactionHistoryModal] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [currentTransaction, setCurrentTransaction] = useState<any>(null);
    const [paymentMethod, setPaymentMethod] = useState<"cash" | "mpesa">("cash");
    let diffMins = 0;

    // Main queries for data
    const { data: stations = [], isLoading: stationsLoading, refetch: refetchStations } = useQuery({
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

    const { data: transactions = [], refetch: refetchTransactions } = useQuery<Transaction[]>({
        queryKey: ["/api/transactions"],
    });

    // Calculated statistics
    const activeStations = stations.filter((s: any) => s.currentCustomer)?.length || 0;
    const todayRevenue = transactions
        .filter((tx: any) => new Date(tx.createdAt).toDateString() === new Date().toDateString())
        .reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);
    const newCustomers = customers
        .filter((c: any) => new Date(c.createdAt).toDateString() === new Date().toDateString())
        .length;

    // Payment method statistics
    const pendingTransactions = transactions.filter((tx: any) => tx.paymentStatus === "pending") || [];
    const completedTransactions = transactions.filter((tx: any) => tx.paymentStatus === "completed") || [];
    const pendingAmount = pendingTransactions.reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);

    const paymentMethodStats = completedTransactions.reduce((stats: any, tx: any) => {
        if (tx.mpesaRef) {
            stats.mpesa = (stats.mpesa || 0) + 1;
        } else if (tx.airtelRef) {
            stats.airtel = (stats.airtel || 0) + 1;
        } else {
            stats.cash = (stats.cash || 0) + 1;
        }
        return stats;
    }, { cash: 0, mpesa: 0, airtel: 0 });

    // Handle clearing a pending payment
    const handleClearPayment = async (transactionId: number) => {
        try {
            console.log("Clearing payment for transaction ID:", transactionId);
            const transaction = pendingTransactions.find((tx: any) => tx.id === transactionId);

            const response = await axios.post("/api/transactions/payment", {
                transactionId: transactionId,
                amount: transaction?.amount || 0,
                paymentMethod: "cash",
            });

            console.log("Payment cleared successfully:", response.data);

            // Refresh transactions list
            refetchTransactions();

            toast({
                title: "Payment Cleared",
                description: "The payment has been marked as completed",
            });

            // Refresh data and update the UI
            refetchTransactions();
            refetchStations();
        } catch (error: any) {
            console.error("Error clearing payment:", error);
            console.error("Error details:", error.response?.data || "No response data");

            toast({
                title: "Error",
                description: error.response?.data?.error || "Failed to clear payment",
                variant: "destructive"
            });
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        setLocation('/');
    };

    const switchTab = (tabValue: string) => {
        try {
            setActiveTab(tabValue);
        } catch (error) {
            toast({
                title: "Navigation Error",
                description: `Could not switch to ${tabValue} tab. Please try again.`,
                variant: "destructive"
            });
        }
    };

    const handleEndSession = async (station: GameStation) => {
        try {
            if (!station.sessionStartTime) {
                throw new Error("Invalid session start time");
            }

            const startTime = new Date(station.sessionStartTime);
            const now = new Date();
            const diffMs = now.getTime() - startTime.getTime();
            diffMins = Math.floor(diffMs / 60000);

            const cost = station.sessionType === "per_game"
                ? 40 // Fixed rate per game
                : Math.ceil(diffMins / 60) * 200; // 200 KES per hour

            // Look up the customer in the customers list
            const currentCustomer = customers.find((c: any) => 
                c.displayName === station.currentCustomer
            );
            
            if (currentCustomer) {
                console.log("Found customer for payment:", currentCustomer.id, currentCustomer.displayName);
                setSelectedCustomer(currentCustomer);
            } else {
                console.log("No customer found for station:", station.currentCustomer);
                setSelectedCustomer(null);
            }

            setPaymentAmount(cost);
            setSelectedStation(station);
            setShowPaymentDialog(true);

        } catch (error: any) {
            console.error("Error preparing payment:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to prepare payment. Please try again.",
                variant: "destructive"
            });
        }
    };

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

            const response = await apiRequest("POST", "/api/sessions/start", {
                stationId: selectedStation.id,
                customerId: selectedCustomer.id,
                customerName: selectedCustomer.displayName,
                gameId: selectedGame,
                sessionType: selectedSessionType,
                baseRate: 40, // Fixed rate per game
                hourlyRate: 200 // Fixed hourly rate
            });

            if (!response) {
                throw new Error("Failed to start session");
            }

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
                description: error.message || "Failed to start session. Please try again.",
                variant: "destructive"
            });
        }
    };

    if (stationsLoading || gamesLoading || customersLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    const handlePaymentComplete = async () => {
        toast({
            title: "Payment Successful",
            description: "The session has been ended and payment received."
        });
        await queryClient.invalidateQueries({ queryKey: ["/api/stations"] });
        await queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
        setShowPaymentDialog(false);
        setSelectedStation(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYwIiBoZWlnaHQ9IjE2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZSIgeD0iMCIgeT0iMCI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNzUiIG51bU9jdGF2ZXM9IjQiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMTYwIiBoZWlnaHQ9IjE2MCIgZmlsdGVyPSJ1cmwoI25vaXNlKSIgb3BhY2l0eT0iMC4xNSIvPjwvc3ZnPg==')] opacity-20"></div>
            </div>

            <div className="w-full flex justify-center items-center py-2 sm:py-4 z-10 relative">
                <div className="flex flex-col items-center">
                    <InfinityLogo />
                    <h1 className="text-xl sm:text-2xl font-bold text-primary">INFINITY GAMING LOUNGE</h1>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleLogout}
                        className="hover:bg-primary/20 mt-2"
                    >
                        <UsersIcon className="w-4 h-4" />
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
                        <TabsTrigger value="sessions" className="flex-1 md:flex-none justify-start px-4 py-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary hover:bg-primary/10 transition-all duration-200">
                            <CalendarIcon className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">Sessions</span>
                        </TabsTrigger>
                        <TabsTrigger value="customers" className="flex-1 md:flex-none justify-start px-4 py-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary hover:bg-primary/10 transition-all duration-200">
                            <UsersIcon className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">Customers</span>
                        </TabsTrigger>
                        <TabsTrigger value="analytics" className="flex-1 md:flex-none justify-start px-4 py-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary hover:bg-primary/10 transition-all duration-200">
                            <BarChart2Icon className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">Analytics</span>
                        </TabsTrigger>
                        <TabsTrigger value="reports" className="flex-1 md:flex-none justify-start px-4 py-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary hover:bg-primary/10 transition-all duration-200">
                            <DownloadIcon className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">Reports</span>
                        </TabsTrigger>
                        <TabsTrigger value="payments" className="flex-1 md:flex-none justify-start px-4 py-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary hover:bg-primary/10 transition-all duration-200">
                            <DollarSignIcon className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">Payments</span>
                        </TabsTrigger>
                        <TabsTrigger value="loyalty" className="flex-1 md:flex-none justify-start px-4 py-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary hover:bg-primary/10 transition-all duration-200">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2">
                                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                            </svg>
                            <span className="hidden sm:inline">Loyalty</span>
                        </TabsTrigger>
                    </TabsList>
                </div>

                <div className="flex-1 p-2 sm:p-4 md:p-6 backdrop-blur-sm bg-black/50 overflow-x-hidden">
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
                                        <p className="text-xs text-muted-foreground">+2 from last hour</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-black/30 border-primary/20">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-lg sm:text-2xl font-bold">KES {todayRevenue.toFixed(2)}</div>
                                        <p className="text-xs text-muted-foreground">+$350 from yesterday</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-black/30 border-primary/20">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">New Customers</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-lg sm:text-2xl font-bold">{newCustomers}</div>
                                        <p className="text-xs text-muted-foreground">+3 from yesterday</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-black/30 border-primary/20">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Total Points Awarded</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-lg sm:text-2xl font-bold">1,850</div>
                                        <p className="text-xs text-muted-foreground">+220 from yesterday</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="sessions">
                        <div className="flex justify-between mb-4">
                            <h2 className="text-xl sm:text-2xl font-bold">Gaming Stations</h2>
                            <Button onClick={() => setShowNewSessionModal(true)} size="sm">
                                New Session
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {stations.map((station: any) => (
                                <Card key={station.id} className={`${station.currentCustomer ? 'bg-primary/10 border-primary/50' : 'bg-black/30 border-primary/20'} relative overflow-hidden`}>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center justify-between">
                                            <span>{station.name}</span>
                                            {station.currentCustomer && (
                                                <Badge variant="default">Active</Badge>
                                            )}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {station.currentCustomer ? (
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Customer</p>
                                                    <p className="font-bold">{station.currentCustomer}</p>
                                                </div>

                                                <div>
                                                    <p className="text-sm text-muted-foreground">Playing</p>
                                                    <p className="font-medium">{station.currentGame || "Unknown Game"}</p>
                                                </div>

                                                <div>
                                                    <p className="text-sm text-muted-foreground">Started</p>
                                                    <p className="font-medium">
                                                        {station.sessionStartTime ? new Date(station.sessionStartTime).toLocaleTimeString() : "Unknown"}
                                                    </p>
                                                </div>

                                                <Button
                                                    onClick={() => handleEndSession(station)}
                                                    className="w-full mt-3"
                                                    variant="destructive"
                                                >
                                                    End Session
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <p className="text-sm text-muted-foreground">Station is available</p>
                                                <Button
                                                    onClick={() => {
                                                        setSelectedStation(station);
                                                        setShowNewSessionModal(true);
                                                    }}
                                                    className="w-full mt-3"
                                                    variant="outline"
                                                >
                                                    Start Session
                                                </Button>
                                            </div>
                                        )}

                                        <div className="mt-3 flex justify-end">
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                className="text-xs"
                                                onClick={() => {
                                                    setSelectedStation(station);
                                                    setShowTransactionHistoryModal(true);
                                                }}
                                            >
                                                <HistoryIcon className="h-3 w-3 mr-1" />
                                                Transaction History
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Transaction History Modal */}
                        <StationTransactionHistoryModal
                            open={showTransactionHistoryModal}
                            onOpenChange={setShowTransactionHistoryModal}
                            station={selectedStation}
                        />
                    </TabsContent>

                    <TabsContent value="customers">
                        <div className="flex flex-col space-y-4">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl sm:text-2xl font-bold">Customers</h2>
                                <Button onClick={() => setShowCustomerRegistration(true)} size="sm">
                                    New Customer
                                </Button>
                            </div>

                            <Card className="overflow-hidden bg-black/30 border-primary/20">
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[50px]">#</TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Gaming Name</TableHead>
                                                <TableHead>Contact</TableHead>
                                                <TableHead>Points</TableHead>
                                                <TableHead className="text-right">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {customers.map((customer: any, index: number) => (
                                                <TableRow key={customer.id}>
                                                    <TableCell className="font-medium">{index + 1}</TableCell>
                                                    <TableCell>{customer.displayName}</TableCell>
                                                    <TableCell>{customer.gamingName}</TableCell>
                                                    <TableCell>{customer.phoneNumber}</TableCell>
                                                    <TableCell>{customer.points}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="sm">
                                                            View
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="payments">
                        <div className="flex flex-col space-y-4">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl sm:text-2xl font-bold">Payments</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card className="overflow-hidden bg-black/30 border-primary/20">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">KES {pendingAmount.toFixed(2)}</div>
                                        <p className="text-sm text-muted-foreground">{pendingTransactions.length} transactions</p>
                                    </CardContent>
                                </Card>
                                <Card className="overflow-hidden bg-black/30 border-primary/20">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Payment Methods</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center space-x-4 text-sm">
                                            <div className="flex items-center">
                                                <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                                                <span>Cash: {paymentMethodStats.cash}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
                                                <span>M-Pesa: {paymentMethodStats.mpesa}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
                                                <span>Airtel: {paymentMethodStats.airtel}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card className="overflow-hidden bg-black/30 border-primary/20">
                                <CardHeader>
                                    <CardTitle className="text-base sm:text-lg">Recent Transactions</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[80px]">ID</TableHead>
                                                <TableHead>Customer</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Method</TableHead>
                                                <TableHead className="text-right">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {transactions.map((tx: any) => (
                                                <TableRow key={tx.id}>
                                                    <TableCell className="font-medium">#{tx.id}</TableCell>
                                                    <TableCell>{tx.customerName}</TableCell>
                                                    <TableCell>KES {Number(tx.amount).toFixed(2)}</TableCell>
                                                    <TableCell>{new Date(tx.createdAt).toLocaleDateString()}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={tx.paymentStatus === "completed" ? "default" : 
                                                                tx.paymentStatus === "pending" ? "secondary" : 
                                                                "destructive"}>
                                                            {tx.paymentStatus}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {tx.mpesaRef ? "M-Pesa" : tx.airtelRef ? "Airtel" : "Cash"}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {tx.paymentStatus === "pending" && (
                                                            <Button 
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleClearPayment(tx.id)}
                                                            >
                                                                Mark Paid
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="loyalty">
                        <div className="flex flex-col space-y-4">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl sm:text-2xl font-bold">Loyalty Program</h2>
                                <Button onClick={() => setActiveTab("customers")} size="sm">
                                    View Customers
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card className="overflow-hidden bg-black/30 border-primary/20">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Total Points Awarded</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">1,850</div>
                                        <p className="text-sm text-muted-foreground">All time</p>
                                    </CardContent>
                                </Card>
                                <Card className="overflow-hidden bg-black/30 border-primary/20">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Points Redeemed</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">780</div>
                                        <p className="text-sm text-muted-foreground">All time</p>
                                    </CardContent>
                                </Card>
                                <Card className="overflow-hidden bg-black/30 border-primary/20">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Points Exchange Rate</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">1 KES = 0.1 points</div>
                                        <p className="text-sm text-muted-foreground">10 KES = 1 point</p>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card className="overflow-hidden bg-black/30 border-primary/20">
                                <CardHeader>
                                    <CardTitle>Top Customers by Points</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[50px]">Rank</TableHead>
                                                <TableHead>Customer</TableHead>
                                                <TableHead>Gaming Name</TableHead>
                                                <TableHead>Total Points</TableHead>
                                                <TableHead>Points Used</TableHead>
                                                <TableHead>Available</TableHead>
                                                <TableHead className="text-right">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {customers
                                                .sort((a: any, b: any) => b.points - a.points)
                                                .slice(0, 10)
                                                .map((customer: any, index: number) => (
                                                    <TableRow key={customer.id}>
                                                        <TableCell className="font-medium">{index + 1}</TableCell>
                                                        <TableCell>{customer.displayName}</TableCell>
                                                        <TableCell>{customer.gamingName}</TableCell>
                                                        <TableCell>{customer.totalPoints || customer.points}</TableCell>
                                                        <TableCell>{customer.pointsUsed || 0}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="default" className="bg-primary/30">
                                                                {customer.points || 0}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button variant="outline" size="sm" className="text-xs">
                                                                Redeem Points
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                            
                            <Card className="overflow-hidden bg-black/30 border-primary/20">
                                <CardHeader>
                                    <CardTitle>How Points Work</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-start space-x-3">
                                            <div className="rounded-full bg-primary/30 text-primary p-2">
                                                <TrophyIcon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-medium">Earning Points</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    Customers earn 1 point for every 10 KES spent on gaming sessions.
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-start space-x-3">
                                            <div className="rounded-full bg-primary/30 text-primary p-2">
                                                <GiftIcon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-medium">Redeeming Points</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    100 points can be redeemed for a free 30-minute gaming session on any station.
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-start space-x-3">
                                            <div className="rounded-full bg-primary/30 text-primary p-2">
                                                <UserIcon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-medium">Membership Tiers</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    Bronze (0-500 pts), Silver (501-1000 pts), Gold (1001+ pts) with increasing benefits.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </div>
            </Tabs>

            {/* Session Modal */}
            <Dialog open={showNewSessionModal} onOpenChange={setShowNewSessionModal}>
                <DialogContent className="sm:max-w-[425px] bg-gray-900 text-white">
                    <DialogHeader>
                        <DialogTitle>Start New Gaming Session</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <label htmlFor="game">Select Game</label>
                            <Select value={selectedGame || ""} onValueChange={setSelectedGame}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a game" />
                                </SelectTrigger>
                                <SelectContent>
                                    {games.map((game: any) => (
                                        <SelectItem key={game.id} value={game.id.toString()}>
                                            {game.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <label htmlFor="customer">Select Customer</label>
                            <Select value={selectedCustomer?.id.toString() || ""} onValueChange={(value) => {
                                const customer = customers.find((c: any) => c.id.toString() === value);
                                setSelectedCustomer(customer);
                            }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a customer" />
                                </SelectTrigger>
                                <SelectContent>
                                    {customers.map((customer: any) => (
                                        <SelectItem key={customer.id} value={customer.id.toString()}>
                                            {customer.displayName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <label htmlFor="sessionType">Session Type</label>
                            <Select value={selectedSessionType || ""} onValueChange={(value: any) => setSelectedSessionType(value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select pricing model" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="per_game">Per Game (KES 40)</SelectItem>
                                    <SelectItem value="hourly">Hourly (KES 200 / hour)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setShowNewSessionModal(false)}>
                            Cancel
                        </Button>
                        <Button type="button" onClick={handleStartSession}>
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
        </div>
    );
}
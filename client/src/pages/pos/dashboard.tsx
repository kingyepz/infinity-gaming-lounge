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
    ChevronLeftIcon,
    ChevronRightIcon,
    MenuIcon,
    DownloadIcon,
    PrinterIcon,
    LogOutIcon,
    HistoryIcon,
    TrophyIcon,
    GiftIcon,
    UserIcon
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
    const [activeTab, setActiveTab] = useState("overview");
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
    // Get WebSocket context for real-time updates
    const { gameStations: wsStations, connected: wsConnected, registerRole, requestStationUpdates } = useWebSocket();
    
    // Regular API query as fallback and initial data load
    const { data: apiStations = [], isLoading: stationsLoading, refetch: refetchStations } = useQuery({
        queryKey: ["/api/stations"],
        queryFn: () => apiRequest({ path: "/api/stations" })
    });
    
    // Use WebSocket data if available, otherwise use API data
    const stations = wsConnected && wsStations.length > 0 ? wsStations : apiStations;
    
    // Initialize WebSocket connection and register as staff
    useEffect(() => {
        if (wsConnected) {
            console.log("WebSocket connected, registering as staff and requesting updates");
            // Register as staff role
            registerRole("staff");
            // Request initial data
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

            // Find the game to get its pricing
            const currentGame = games.find((g: any) => 
                g.name === station.currentGame
            );
            
            // Default to old pricing if game not found
            const gamePrice = currentGame?.pricePerSession || 40;
            const hourlyPrice = currentGame?.pricePerHour || 200;
            
            const cost = station.sessionType === "per_game"
                ? gamePrice // Game-specific per session rate
                : Math.ceil(diffMins / 60) * hourlyPrice; // Game-specific hourly rate

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
            console.log("Starting session with values:", {
                selectedStation,
                selectedGame,
                selectedCustomer,
                selectedSessionType
            });
            
            if (!selectedStation || !selectedGame || !selectedCustomer || !selectedSessionType) {
                console.error("Missing information for session start:", {
                    hasStation: !!selectedStation,
                    hasGame: !!selectedGame,
                    hasCustomer: !!selectedCustomer,
                    hasSessionType: !!selectedSessionType
                });
                
                toast({
                    title: "Missing Information",
                    description: "Please select a game, customer, and session type",
                    variant: "destructive"
                });
                return;
            }
            
            // Find the selected game to get its pricing
            const currentGame = games.find((g: any) => g.id.toString() === selectedGame);
            
            // Default to old pricing if game not found
            const gamePrice = currentGame?.pricePerSession || 40;
            const hourlyPrice = currentGame?.pricePerHour || 200;

            const response = await apiRequest({
                path: "/api/sessions/start",
                method: "POST",
                data: {
                    stationId: selectedStation.id,
                    customerId: selectedCustomer.id,
                    customerName: selectedCustomer.displayName,
                    gameId: selectedGame,
                    sessionType: selectedSessionType,
                    baseRate: gamePrice, // Game-specific per session rate
                    hourlyRate: hourlyPrice // Game-specific hourly rate
                }
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
        try {
            // Reset the station status after payment is complete
            if (selectedStation) {
                console.log("Resetting station after payment:", selectedStation.id);
                
                // Call API to update station status
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
                
                toast({
                    title: "Payment Successful",
                    description: "The session has been ended and payment received."
                });
            } else {
                console.warn("No station selected for reset after payment");
                toast({
                    title: "Payment Processed",
                    description: "Payment was successful, but station information is unavailable."
                });
            }
            
            // Refresh data
            await queryClient.invalidateQueries({ queryKey: ["/api/stations"] });
            await queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
            setShowPaymentDialog(false);
            setSelectedStation(null);
        } catch (error) {
            console.error("Error resetting station after payment:", error);
            toast({
                title: "Error",
                description: "Payment was processed but there was an error resetting the station. Please refresh the page.",
                variant: "destructive"
            });
            // Still close the dialog and refresh data
            setShowPaymentDialog(false);
            await queryClient.invalidateQueries({ queryKey: ["/api/stations"] });
            await queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
        }
    };

    return (
        <div className="min-h-screen bg-[#0f1218] text-white relative overflow-hidden">
            {/* Header with Logo */}
            <div className="py-4 px-4 border-b border-[#212936] bg-[#151a23]">
                <h1 className="text-xl font-bold text-[#4794f8] text-center">INFINITY GAMING LOUNGE</h1>
            </div>
            
            {/* Main content */}
            <div className="flex-1 flex flex-col h-[calc(100vh-64px)]">
                {/* Main content area with bottom navigation */}
                <div className="flex-1 p-6 overflow-auto">
                    <Tabs defaultValue={activeTab} value={activeTab} className="w-full">
                        <TabsContent value="overview" className="mt-0 outline-none">
                            <div className="space-y-4 sm:space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <Card className="bg-[#151a23] border-[#212936]">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">
                                                {activeStations}
                                            </div>
                                            <p className="text-xs text-gray-400">+2 from last hour</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-[#151a23] border-[#212936]">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">KES {todayRevenue.toFixed(2)}</div>
                                            <p className="text-xs text-gray-400">+350 from yesterday</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-[#151a23] border-[#212936]">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium">New Customers</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{newCustomers}</div>
                                            <p className="text-xs text-gray-400">+3 from yesterday</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-[#151a23] border-[#212936]">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium">Total Points Awarded</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">1,850</div>
                                            <p className="text-xs text-gray-400">+220 from yesterday</p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </TabsContent>
                        
                        <TabsContent value="analytics" className="mt-0 outline-none">
                            <h2 className="text-2xl font-bold mb-4">Analytics Dashboard</h2>
                            <p>Analytics content will appear here</p>
                        </TabsContent>
                        
                        <TabsContent value="reports" className="mt-0 outline-none">
                            <h2 className="text-2xl font-bold mb-4">Reports</h2>
                            <p>Reports content will appear here</p>
                        </TabsContent>
                        
                        <TabsContent value="stations" className="mt-0 outline-none">
                            <h2 className="text-2xl font-bold mb-4">Gaming Stations</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {stations.map((station: any) => (
                                    <Card key={station.id} className={`${station.currentCustomer ? 'bg-[#213045] border-[#4794f8]/30' : 'bg-[#151a23] border-[#212936]'} relative overflow-hidden`}>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="flex items-center justify-between">
                                                <span>{station.name}</span>
                                                {station.currentCustomer && (
                                                    <Badge className="bg-[#4794f8] hover:bg-[#3a7fd8]">Active</Badge>
                                                )}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {station.currentCustomer ? (
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-400">Customer:</span>
                                                        <span>{station.currentCustomer}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-400">Game:</span>
                                                        <span>{station.currentGame}</span>
                                                    </div>
                                                    <div className="flex justify-center mt-3 gap-2">
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            className="w-full border-[#4794f8]/30 hover:bg-[#4794f8]/20"
                                                            onClick={() => handleEndSession(station)}
                                                        >
                                                            End Session
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <p className="text-center text-gray-400 py-2">Station Available</p>
                                                    <Button 
                                                        className="w-full bg-[#4794f8] hover:bg-[#3a7fd8]"
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
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>
                        
                        <TabsContent value="reservations" className="mt-0 outline-none">
                            <h2 className="text-2xl font-bold mb-4">Reservations</h2>
                            <p>Reservations content will appear here</p>
                        </TabsContent>
                        
                        <TabsContent value="inventory" className="mt-0 outline-none">
                            <h2 className="text-2xl font-bold mb-4">Inventory</h2>
                            <p>Inventory management content will appear here</p>
                        </TabsContent>
                    </Tabs>
                </div>
                
                {/* Bottom horizontal navigation */}
                <div className="h-16 border-t border-[#212936] flex items-center justify-center px-4 bg-[#151a23]">
                    <div className="flex space-x-8">
                        <div 
                            className={`cursor-pointer flex flex-col items-center py-1 px-3 ${activeTab === 'overview' ? 'text-[#4794f8]' : 'text-gray-300 hover:text-white'}`}
                            onClick={() => switchTab('overview')}
                        >
                            <BarChart2Icon className="h-5 w-5 mb-1" />
                            <span className="text-xs">Overview</span>
                        </div>
                        <div 
                            className={`cursor-pointer flex flex-col items-center py-1 px-3 ${activeTab === 'analytics' ? 'text-[#4794f8]' : 'text-gray-300 hover:text-white'}`}
                            onClick={() => switchTab('analytics')}
                        >
                            <BarChart2Icon className="h-5 w-5 mb-1" />
                            <span className="text-xs">Analytics</span>
                        </div>
                        <div 
                            className={`cursor-pointer flex flex-col items-center py-1 px-3 ${activeTab === 'reports' ? 'text-[#4794f8]' : 'text-gray-300 hover:text-white'}`}
                            onClick={() => switchTab('reports')}
                        >
                            <DownloadIcon className="h-5 w-5 mb-1" />
                            <span className="text-xs">Reports</span>
                        </div>
                        <div 
                            className={`cursor-pointer flex flex-col items-center py-1 px-3 ${activeTab === 'stations' ? 'text-[#4794f8]' : 'text-gray-300 hover:text-white'}`}
                            onClick={() => switchTab('stations')}
                        >
                            <GamepadIcon className="h-5 w-5 mb-1" />
                            <span className="text-xs">Stations</span>
                        </div>
                        <div 
                            className={`cursor-pointer flex flex-col items-center py-1 px-3 ${activeTab === 'reservations' ? 'text-[#4794f8]' : 'text-gray-300 hover:text-white'}`}
                            onClick={() => switchTab('reservations')}
                        >
                            <CalendarIcon className="h-5 w-5 mb-1" />
                            <span className="text-xs">Reserve</span>
                        </div>
                        <div 
                            className={`cursor-pointer flex flex-col items-center py-1 px-3 ${activeTab === 'inventory' ? 'text-[#4794f8]' : 'text-gray-300 hover:text-white'}`}
                            onClick={() => switchTab('inventory')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 3h18v18H3z"/>
                                <path d="M8 12h8"/>
                                <path d="M12 8v8"/>
                            </svg>
                            <span className="text-xs">Inventory</span>
                        </div>
                    </div>
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
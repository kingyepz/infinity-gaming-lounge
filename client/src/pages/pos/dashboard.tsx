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
            <div className="w-full flex justify-center items-center py-4">
                <div className="flex flex-col items-center">
                    <InfinityLogo />
                    <h1 className="text-2xl font-bold text-[#4794f8]">INFINITY GAMING LOUNGE</h1>
                </div>
            </div>
            
            <div className="flex">
                {/* Left Sidebar */}
                <div className="w-64 bg-[#151a23] min-h-[calc(100vh-120px)] border-r border-[#212936]">
                    <div className="p-1">
                        <Button
                            variant="ghost"
                            className={`w-full justify-start py-2 px-3 mb-1 ${activeTab === 'reservations' ? 'bg-[#212936] text-[#4794f8]' : 'hover:bg-[#212936] hover:text-white text-gray-300'}`}
                            onClick={() => switchTab('reservations')}
                        >
                            <CalendarIcon className="mr-2 h-5 w-5" />
                            <span>Reservations</span>
                        </Button>
                        
                        <Button
                            variant="ghost"
                            className={`w-full justify-start py-2 px-3 mb-1 ${activeTab === 'games' ? 'bg-[#212936] text-[#4794f8]' : 'hover:bg-[#212936] hover:text-white text-gray-300'}`}
                            onClick={() => switchTab('games')}
                        >
                            <GamepadIcon className="mr-2 h-5 w-5" />
                            <span>Game Catalog</span>
                        </Button>
                        
                        <Button
                            variant="ghost"
                            className={`w-full justify-start py-2 px-3 mb-1 ${activeTab === 'customers' ? 'bg-[#212936] text-[#4794f8]' : 'hover:bg-[#212936] hover:text-white text-gray-300'}`}
                            onClick={() => switchTab('customers')}
                        >
                            <UsersIcon className="mr-2 h-5 w-5" />
                            <span>Customers</span>
                        </Button>
                        
                        <Button
                            variant="ghost"
                            className={`w-full justify-start py-2 px-3 mb-1 ${activeTab === 'inventory' ? 'bg-[#212936] text-[#4794f8]' : 'hover:bg-[#212936] hover:text-white text-gray-300'}`}
                            onClick={() => switchTab('inventory')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 3h18v18H3z"/>
                                <path d="M8 12h8"/>
                                <path d="M12 8v8"/>
                            </svg>
                            <span>Inventory</span>
                        </Button>
                        
                        <Button
                            variant="ghost"
                            className={`w-full justify-start py-2 px-3 mb-1 ${activeTab === 'payments' ? 'bg-[#212936] text-[#4794f8]' : 'hover:bg-[#212936] hover:text-white text-gray-300'}`}
                            onClick={() => switchTab('payments')}
                        >
                            <DollarSignIcon className="mr-2 h-5 w-5" />
                            <span>Payments</span>
                        </Button>
                        
                        <Button
                            variant="ghost"
                            className={`w-full justify-start py-2 px-3 mb-1 ${activeTab === 'financial' ? 'bg-[#212936] text-[#4794f8]' : 'hover:bg-[#212936] hover:text-white text-gray-300'}`}
                            onClick={() => switchTab('financial')}
                        >
                            <BarChart2Icon className="mr-2 h-5 w-5" />
                            <span>Financial Management</span>
                        </Button>
                        
                        <Button
                            variant="ghost"
                            className={`w-full justify-start py-2 px-3 mb-1 ${activeTab === 'events' ? 'bg-[#212936] text-[#4794f8]' : 'hover:bg-[#212936] hover:text-white text-gray-300'}`}
                            onClick={() => switchTab('events')}
                        >
                            <CalendarIcon className="mr-2 h-5 w-5" />
                            <span>Events</span>
                        </Button>
                        
                        <Button
                            variant="ghost"
                            className={`w-full justify-start py-2 px-3 mb-1 ${activeTab === 'staff' ? 'bg-[#212936] text-[#4794f8]' : 'hover:bg-[#212936] hover:text-white text-gray-300'}`}
                            onClick={() => switchTab('staff')}
                        >
                            <UsersIcon className="mr-2 h-5 w-5" />
                            <span>Staff Management</span>
                        </Button>
                        
                        <Button
                            variant="ghost"
                            className={`w-full justify-start py-2 px-3 mb-1 ${activeTab === 'security' ? 'bg-[#212936] text-[#4794f8]' : 'hover:bg-[#212936] hover:text-white text-gray-300'}`}
                            onClick={() => switchTab('security')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2s8 3 8 10v3.5c0 1.5.8 3 2 4"/>
                                <path d="M12 2s-8 3-8 10v3.5c0 1.5-.8 3-2 4"/>
                                <path d="M12 17v5"/>
                                <path d="M8 17h8"/>
                            </svg>
                            <span>Security</span>
                        </Button>
                        
                        <Button
                            variant="ghost"
                            className={`w-full justify-start py-2 px-3 mb-1 ${activeTab === 'settings' ? 'bg-[#212936] text-[#4794f8]' : 'hover:bg-[#212936] hover:text-white text-gray-300'}`}
                            onClick={() => switchTab('settings')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2a1 1 0 0 1 .866.5l1.732 3 3.464.5a1 1 0 0 1 .555 1.705l-2.5 2.5.5 3.464a1 1 0 0 1-1.45 1.05L12 13l-3.166 1.67a1 1 0 0 1-1.45-1.05l.5-3.465-2.5-2.5a1 1 0 0 1 .555-1.705l3.464-.5 1.732-3A1 1 0 0 1 12 2z"/>
                            </svg>
                            <span>Settings</span>
                        </Button>
                        
                        <div className="mt-8">
                            <Button
                                variant="ghost"
                                className="w-full justify-start py-2 px-3 text-red-400 hover:bg-[#212936] hover:text-red-300"
                                onClick={handleLogout}
                            >
                                <LogOutIcon className="mr-2 h-5 w-5" />
                                <span>Logout</span>
                            </Button>
                        </div>
                    </div>
                </div>
                
                {/* Main content */}
                <div className="flex-1 flex flex-col">
                    {/* Top horizontal nav bar */}
                    <div className="h-10 border-b border-[#212936] flex items-center px-4 bg-[#151a23]">
                        <div className="flex space-x-8">
                            <Button 
                                variant="ghost" 
                                className={`py-1 px-3 rounded-none border-b-2 ${activeTab === 'overview' ? 'border-[#4794f8] text-[#4794f8]' : 'border-transparent hover:text-white text-gray-300'}`}
                                onClick={() => switchTab('overview')}
                            >
                                Overview
                            </Button>
                            <Button 
                                variant="ghost" 
                                className={`py-1 px-3 rounded-none border-b-2 ${activeTab === 'analytics' ? 'border-[#4794f8] text-[#4794f8]' : 'border-transparent hover:text-white text-gray-300'}`}
                                onClick={() => switchTab('analytics')}
                            >
                                Analytics
                            </Button>
                            <Button 
                                variant="ghost" 
                                className={`py-1 px-3 rounded-none border-b-2 ${activeTab === 'reports' ? 'border-[#4794f8] text-[#4794f8]' : 'border-transparent hover:text-white text-gray-300'}`}
                                onClick={() => switchTab('reports')}
                            >
                                Reports
                            </Button>
                            <Button 
                                variant="ghost" 
                                className={`py-1 px-3 rounded-none border-b-2 ${activeTab === 'stations' ? 'border-[#4794f8] text-[#4794f8]' : 'border-transparent hover:text-white text-gray-300'}`}
                                onClick={() => switchTab('stations')}
                            >
                                Stations
                            </Button>
                            <Button 
                                variant="ghost" 
                                className={`py-1 px-3 rounded-none border-b-2 ${activeTab === 'reserve' ? 'border-[#4794f8] text-[#4794f8]' : 'border-transparent hover:text-white text-gray-300'}`}
                                onClick={() => switchTab('reserve')}
                            >
                                Reservations
                            </Button>
                        </div>
                    </div>

                    {/* Main content area */}
                    <div className="flex-1 bg-[#0f1218] p-6 overflow-auto">
                        <Tabs defaultValue={activeTab} value={activeTab} className="w-full mt-2">
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
                                    
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        <Card className="bg-[#151a23] border-[#212936]">
                                            <CardHeader>
                                                <CardTitle className="text-base">Gaming Stations</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    {stations.slice(0, 4).map((station: any) => (
                                                        <div key={station.id} className={`px-4 py-3 rounded-md flex items-center justify-between ${station.currentCustomer ? 'bg-[#213045]' : 'bg-[#1d212b]'}`}>
                                                            <div>
                                                                <div className="font-medium">{station.name}</div>
                                                                <div className="text-xs text-gray-400">
                                                                    {station.currentCustomer ? `${station.currentCustomer} • ${station.currentGame || ''}` : 'Available'}
                                                                </div>
                                                            </div>
                                                            {station.currentCustomer ? (
                                                                <Badge className="bg-[#4794f8] hover:bg-[#3a7fd8]">Active</Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Free</Badge>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="w-full mt-3"
                                                    onClick={() => switchTab('stations')}
                                                >
                                                    View All Stations
                                                </Button>
                                            </CardContent>
                                        </Card>
                                        
                                        <Card className="bg-[#151a23] border-[#212936]">
                                            <CardHeader>
                                                <CardTitle className="text-base">Recent Transactions</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-2">
                                                    {transactions.slice(0, 4).map((tx: any) => (
                                                        <div key={tx.id} className="px-4 py-2 rounded-md flex items-center justify-between bg-[#1d212b]">
                                                            <div>
                                                                <div className="font-medium">{tx.customerName || "Unknown customer"}</div>
                                                                <div className="text-xs text-gray-400">
                                                                    {new Date(tx.createdAt).toLocaleString()}
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="font-medium">KES {Number(tx.amount).toFixed(2)}</div>
                                                                <div className="text-xs">
                                                                    {tx.paymentStatus === "completed" ? (
                                                                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                                                                            Paid
                                                                        </Badge>
                                                                    ) : (
                                                                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                                                                            Pending
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="w-full mt-3"
                                                    onClick={() => switchTab('payments')}
                                                >
                                                    View All Transactions
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            </TabsContent>
                            
                            <TabsContent value="stations" className="mt-0 outline-none">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-2xl font-bold">Gaming Stations</h2>
                                    <Button 
                                        onClick={() => {
                                            // Find the first available station and set it as selected
                                            const availableStation = stations.find((s: any) => !s.currentCustomer);
                                            if (availableStation) {
                                                setSelectedStation(availableStation);
                                                setShowNewSessionModal(true);
                                            } else {
                                                toast({
                                                    title: "No Available Stations",
                                                    description: "All stations are currently in use.",
                                                    variant: "destructive"
                                                });
                                            }
                                        }} 
                                        size="sm"
                                        className="bg-[#4794f8] hover:bg-[#3a7fd8]"
                                    >
                                        New Session
                                    </Button>
                                </div>
                                
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
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-gray-400">Session Type:</span>
                                                            <span>{station.sessionType === 'hourly' ? 'Hourly' : 'Per Game'}</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-gray-400">Started:</span>
                                                            <span>{new Date(station.sessionStartTime).toLocaleTimeString()}</span>
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
                                                            <Button 
                                                                variant="ghost" 
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedStation(station);
                                                                    setShowTransactionHistoryModal(true);
                                                                }}
                                                            >
                                                                <HistoryIcon className="h-4 w-4" />
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
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            className="w-full"
                                                            onClick={() => {
                                                                setSelectedStation(station);
                                                                setShowTransactionHistoryModal(true);
                                                            }}
                                                        >
                                                            View History
                                                        </Button>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </TabsContent>

                            <TabsContent value="payments" className="mt-0 outline-none">
                                <h2 className="text-2xl font-bold mb-4">Payments</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                                            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">KES {pendingAmount.toFixed(2)}</div>
                                            <p className="text-xs text-gray-400">{pendingTransactions.length} transactions</p>
                                        </CardContent>
                                    </Card>
                                    
                                    <Card className="bg-[#151a23] border-[#212936]">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium">Cash Payments</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{paymentMethodStats.cash || 0}</div>
                                            <p className="text-xs text-gray-400">Most popular method</p>
                                        </CardContent>
                                    </Card>
                                    
                                    <Card className="bg-[#151a23] border-[#212936]">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium">M-Pesa Payments</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{paymentMethodStats.mpesa || 0}</div>
                                            <p className="text-xs text-gray-400">Mobile money</p>
                                        </CardContent>
                                    </Card>
                                </div>
                                
                                <h3 className="text-xl font-semibold mb-4">Pending Transactions</h3>
                                <Card className="bg-[#151a23] border-[#212936] overflow-hidden">
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="hover:bg-[#212936]/50">
                                                    <TableHead>ID</TableHead>
                                                    <TableHead>Customer</TableHead>
                                                    <TableHead>Amount</TableHead>
                                                    <TableHead>Date</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead className="text-right">Action</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {pendingTransactions.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={6} className="text-center text-gray-400">No pending transactions</TableCell>
                                                    </TableRow>
                                                ) : (
                                                    pendingTransactions.map((tx: any) => (
                                                        <TableRow key={tx.id} className="hover:bg-[#212936]/50">
                                                            <TableCell className="font-medium">{tx.id}</TableCell>
                                                            <TableCell>{tx.customerName || "Unknown"}</TableCell>
                                                            <TableCell>KES {Number(tx.amount).toFixed(2)}</TableCell>
                                                            <TableCell>{new Date(tx.createdAt).toLocaleString()}</TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                                                                    Pending
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <Button 
                                                                    variant="outline" 
                                                                    size="sm"
                                                                    onClick={() => handleClearPayment(tx.id)}
                                                                >
                                                                    Mark as Paid
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="analytics" className="mt-0 outline-none">
                                <h2 className="text-2xl font-bold mb-4">Analytics</h2>
                                <Card className="bg-[#151a23] border-[#212936]">
                                    <CardContent className="pt-6">
                                        <p className="text-gray-400">Analytics dashboard coming soon</p>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            
                            <TabsContent value="reports" className="mt-0 outline-none">
                                <h2 className="text-2xl font-bold mb-4">Reports</h2>
                                <Card className="bg-[#151a23] border-[#212936]">
                                    <CardContent className="pt-6">
                                        <p className="text-gray-400">Reports dashboard coming soon</p>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
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
                                    {selectedGame ? (
                                        (() => {
                                            const game = games.find((g: any) => g.id.toString() === selectedGame);
                                            const perSessionPrice = game?.pricePerSession || 40;
                                            const hourlyPrice = game?.pricePerHour || 200;
                                            return (
                                                <>
                                                    <SelectItem value="per_game">Per Game (KES {perSessionPrice})</SelectItem>
                                                    <SelectItem value="hourly">Hourly (KES {hourlyPrice} / hour)</SelectItem>
                                                </>
                                            );
                                        })()
                                    ) : (
                                        <>
                                            <SelectItem value="per_game">Per Game (Select a game first)</SelectItem>
                                            <SelectItem value="hourly">Hourly (Select a game first)</SelectItem>
                                        </>
                                    )}
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
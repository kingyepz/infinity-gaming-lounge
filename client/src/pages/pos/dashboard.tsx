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
} from "lucide-react";
import InfinityLogo from "@/components/animations/InfinityLogo";
import CustomerPortal from "@/pages/customer/portal";


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
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [currentTransaction, setCurrentTransaction] = useState<any>(null);
    const [paymentMethod, setPaymentMethod] = useState<"cash" | "mpesa">("cash");
    let diffMins: number;


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

    const { data: transactions = [] } = useQuery<Transaction[]>({
        queryKey: ["/api/transactions"],
    });


    const activeStations = stations.filter(s => s.currentCustomer)?.length || 0;
    const todayRevenue = transactions
        .filter(tx => new Date(tx.createdAt).toDateString() === new Date().toDateString())
        .reduce((sum, tx) => sum + tx.amount, 0);
    const newCustomers = customers
        .filter(c => new Date(c.createdAt).toDateString() === new Date().toDateString())
        .length;

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

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYwIiBoZWlnaHQ9IjE2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZSIgeD0iMCIgeT0iMCI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNzUiIG51bU9jdGF2ZXM9IjQiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMTYwIiBoZWlnaHQ9IjE2MCIgZmlsdGVyPSJ1cmwoI25vaXNlKSIgb3BhY2l0eT0iMC4xNSIvPjwvc3ZnPg==')] opacity-20"></div>
            </div>

            <div className="w-full flex justify-center items-center py-2 sm:py-4 z-10 relative">
                <div className="flex flex-col items-center">
                    <InfinityLogo className="w-16 h-16 sm:w-24 sm:h-24" />
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

                            <h3 className="text-lg sm:text-xl font-semibold mt-6 sm:mt-8 mb-4">Recent Activity</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                <Card className="bg-black/30 border-primary/20">
                                    <CardHeader>
                                        <CardTitle className="text-base sm:text-lg">Station Activity</CardTitle>
                                    </CardHeader>
                                    <CardContent className="max-h-[300px] overflow-auto">
                                        <div className="space-y-3 sm:space-y-4">
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <div key={i} className="flex justify-between items-center">
                                                    <div>
                                                        <p className="font-medium">Station {i}</p>
                                                        <p className="text-sm text-muted-foreground">Call of Duty: Warzone</p>
                                                    </div>

                                                    <Badge variant={i % 2 === 0 ? "default" : "secondary"}>
                                                        {i % 2 === 0 ? "Active" : "Ending Soon"}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-black/40 border-primary/20 mt-6">
                                    <CardHeader>
                                        <CardTitle>Upcoming Reservations</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {[
                                                { name: "John Doe", time: "3:00 PM", duration: "2 hours", stations: 2, status: "confirmed" },
                                                { name: "Jane Smith", time: "4:30 PM", duration: "3 hours", stations: 1, status: "pending" },
                                                { name: "Team Apex", time: "6:00 PM", duration: "4 hours", stations: 4, status: "confirmed" },
                                            ].map((reservation, i) => (
                                                <div key={i} className="flex items-center justify-between bg-black/20 p-3 rounded-md">
                                                    <div>
                                                        <div className="font-medium">{reservation.name}</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {reservation.time} • {reservation.duration} • {reservation.stations} {reservation.stations > 1 ? 'stations' : 'station'}
                                                        </div>
                                                    </div>
                                                    <Badge variant={reservation.status === "confirmed" ? "default" : "outline"}>
                                                        {reservation.status}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="mt-4 sm:mt-6">
                                <h3 className="text-lg sm:text-xl font-semibold mb-4">Quick Actions</h3>
                                <Card className="bg-black/30 border-primary/20">
                                    <CardContent className="p-4 mt-2">
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                            <Button
                                                variant="default"
                                                className="h-auto flex flex-col items-center p-3 hover:bg-primary/80"
                                                onClick={() => {
                                                    const availableStation = stations?.find(s => !s.currentCustomer);
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
                                                }}
                                            >
                                                <GamepadIcon className="h-6 w-6 mb-2" />
                                                <span className="text-sm font-medium">New Session</span>
                                            </Button>

                                            <Button
                                                variant="outline"
                                                className="h-auto flex flex-col items-center p-3 hover:bg-primary/20"
                                                onClick={() => switchTab("reports")}
                                            >
                                                <BarChart2Icon className="h-6 w-6 mb-2" />
                                                <span className="text-sm font-medium">View Reports</span>
                                            </Button>

                                            <Button
                                                variant="outline"
                                                className="h-auto flex flex-col items-center p-3 hover:bg-primary/20"
                                                onClick={() => switchTab("sessions")}
                                            >
                                                <CalendarIcon className="h-6 w-6 mb-2" />
                                                <span className="text-sm font-medium">Manage Sessions</span>
                                            </Button>

                                            <Button
                                                variant="outline"
                                                className="h-auto flex flex-col items-center p-3 hover:bg-primary/20"
                                                onClick={() => switchTab("customers")}
                                            >
                                                <UsersIcon className="h-6 w-6 mb-2" />
                                                <span className="text-sm font-medium">Customers</span>
                                            </Button>

                                            <Button
                                                variant="outline"
                                                className="h-auto flex flex-col items-center p-3 hover:bg-primary/20"
                                                onClick={() => switchTab("payments")}
                                            >
                                                <DollarSignIcon className="h-6 w-6 mb-2" />
                                                <span className="text-sm font-medium">Payments</span>
                                            </Button>

                                            <Button
                                                variant="outline"
                                                className="h-auto flex flex-col items-center p-3 hover:bg-primary/20"
                                                onClick={() => switchTab("analytics")}
                                            >
                                                <BarChart2Icon className="h-6 w-6 mb-2" />
                                                <span className="text-sm font-medium">Analytics</span>
                                            </Button>

                                            <Button
                                                variant="outline"
                                                className="h-auto flex flex-col items-center p-3 hover:bg-primary/20"
                                                onClick={async () => {
                                                    try {
                                                        toast({
                                                            title: "Printing Receipt",
                                                            description: "Receipt printing feature coming soon.",
                                                        });
                                                    } catch (error) {
                                                        toast({
                                                            title: "Print Error",
                                                            description: "Could not print receipt. Please try again.",
                                                            variant: "destructive"
                                                        });
                                                    }
                                                }}
                                            >
                                                <PrinterIcon className="h-6 w-6 mb-2" />
                                                <span className="text-sm font-medium">Print Receipt</span>
                                            </Button>

                                            <Button
                                                variant="outline"
                                                className="h-auto flex flex-col items-center p-3 bg-red-900/20 hover:bg-red-900/30"
                                                onClick={() => {
                                                    try {
                                                        localStorage.removeItem('user');
                                                        setLocation('/');
                                                        toast({
                                                            title: "Logged Out",
                                                            description: "You have been successfully logged out.",
                                                        });
                                                    } catch (error) {
                                                        toast({
                                                            title: "Logout Error",
                                                            description: "Could not log out. Please try again.",
                                                            variant: "destructive"
                                                        });
                                                    }
                                                }}
                                            >
                                                <LogOutIcon className="h-6 w-6 mb-2" />
                                                <span className="text-sm font-medium">Logout</span>
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="sessions">
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold">Gaming Sessions</h2>
                                <Button variant="default" onClick={() => {
                                    const availableStation = stations?.find(s => !s.currentCustomer);
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

                            <Card className="bg-black/30 border-primary/20">
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
                                                                    <p className="font-medium">KES {cost}</p>
                                                                </div>
                                                            </div>

                                                            <Button
                                                                variant="destructive"
                                                                className="w-full"
                                                                onClick={() => handleEndSession(station)}
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

                            <Card className="bg-black/30 border-primary/20">
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

                    <TabsContent value="customers">
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold">Customer Management</h2>
                                <Button variant="default" onClick={() => setShowRegistration(true)}>
                                    Register New Customer
                                </Button>
                            </div>

                            {showRegistration && (
                                <Card className="bg-black/30 border-primary/20">
                                    <CardHeader>
                                        <CardTitle>Register New Customer</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <form onSubmit={async (e) => {
                                            e.preventDefault();
                                            const formData = new FormData(e.target as HTMLFormElement);

                                            try {
                                                const response = await apiRequest("POST", "/api/users/register", {
                                                    displayName: formData.get("displayName"),
                                                    gamingName: formData.get("gamingName"),
                                                    phoneNumber: formData.get("phoneNumber"),
                                                    role: "customer"
                                                });

                                                toast({
                                                    title: "Success",
                                                    description: "Customer registered successfully!"
                                                });

                                                await queryClient.invalidateQueries({ queryKey: ["/api/users/customers"] });

                                                setShowRegistration(false);
                                                (e.target as HTMLFormElement).reset();
                                            } catch (error: any) {
                                                toast({
                                                    variant: "destructive",
                                                    title: "Registration failed",
                                                    description: error.message || "Failed to register customer"
                                                });
                                            }
                                        }}
                                            className="space-y-4">
                                            <div>
                                                <label className="text-sm text-muted-foreground">Display Name</label>
                                                <Input name="displayName" required placeholder="John Doe" />
                                            </div>
                                            <div>
                                                <label className="text-sm text-muted-foreground">Gaming Name</label>
                                                <Input name="gamingName" required placeholder="ProGamer123" />
                                            </div>
                                            <div>
                                                <label className="text-sm text-muted-foreground">Phone Number</label>
                                                <Input
                                                    name="phoneNumber"
                                                    required
                                                    placeholder="254700000000"
                                                    pattern="^254[0-9]{9}$"
                                                    title="Please enter a valid Kenyan phone number starting with 254"
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <Button type="submit">Register Customer</Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => setShowRegistration(false)}
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </form>
                                    </CardContent>
                                </Card>
                            )}

                            <CustomerPortal />
                        </div>
                    </TabsContent>

                    <TabsContent value="analytics">
                        <div className="space-y6">
                            <h2 className="text-3xl font-bold">Analytics Dashboard</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                <Card className="bg-black/40 border-primary/20">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Total Revenue (Today)</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">KES {stations?.reduce((sum, station) => {
                                            if (station.currentCustomer) {
                                                return sum + (station.sessionType === "per_game" ? station.baseRate : station.hourlyRate)
                                            }
                                            return sum
                                        }, 0) || 0}</div>
                                        <p className="text-xs text-muted-foreground">+2.5% from yesterday</p>
                                    </CardContent>
                                </Card>

                                <Card className="bg-black/40 border-primary/20">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{stations?.filter(s => s.currentCustomer).length || 0}</div>
                                        <p className="text-xs text-muted-foreground">Out of {stations?.length || 0} stations</p>
                                    </CardContent>
                                </Card>

                                <Card className="bg-black/40 border-primary/20">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Most Popular Game</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {(() => {
                                                const gameCounts = {};
                                                stations?.forEach(station => {
                                                    if (station.currentGame) {                                                        gameCounts[station.currentGame] = (gameCounts[station.currentGame] || 0) + 1;
                                                    }
                                                });
                                                const entries = Object.entries(gameCounts);
                                                if (entries.length === 0) return "N/A";
                                                return entries.sort((a, b) => b[1] - a[1])[0][0];
                                            })()}
                                        </div>
                                        <p className="text-xs text-muted-foreground">Currently being played</p>
                                    </CardContent>
                                </Card>

                                <Card className="bg-black/40 border-primary/20">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Average Session Time</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {(() => {
                                                const activeSessions = stations?.filter(s => s.sessionStartTime && s.currentCustomer) || [];
                                                if (activeSessions.length === 0) return "0 min";
                                                const totalMinutes = activeSessions.reduce((sum, s) => {
                                                    const startTime = new Date(s.sessionStartTime);
                                                    const now = new Date();
                                                    return sum + Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
                                                }, 0);
                                                return `${Math.floor(totalMinutes / activeSessions.length)} min`;
                                            })()}
                                        </div>
                                        <p className="text-xs text-muted-foreground">For active sessions</p>
                                    </CardContent>
                                </Card>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                                <Card className="bg-black/40 border-primary/20 col-span-1">
                                    <CardHeader>
                                        <CardTitle>Station Utilization</CardTitle>
                                    </CardHeader>
                                    <CardContent className="h-80 relative">
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-full h-full flex flex-col">
                                                <div className="flex-1 flex items-center justify-center relative">
                                                    <div className="w-48 h-48 rounded-full border-8 border-primary/20 relative">
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
                                                </div>
                                                <div className="flex justify-between px-4 py-4">
                                                    <div className="flex items-center">
                                                        <div className="w-3 h-3 rounded-full bg-primary mr-2"></div>
                                                        <span className="text-xs">Active</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <div className="w3 h-3 rounded-full bgprimary/20 relative"></div>
                                                        <span className="text-xs">Available</span>
                                                    </div>
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

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                                                    <p className="font-bold">KES {(Math.random() * 500 + 200).toFixed(2)}</p>
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
                                            <p className="text-sm text-mutedforeground">Today</p>
                                            <p className="text-xl font-bold">KES 12,500</p>
                                            <p className="text-xs text-green-500">+15% from yesterday</p>
                                        </div>
                                        <div className="bg-primary/5 p-3 rounded-md">
                                            <p className="text-sm text-muted-foreground">This Week</p>
                                            <p className="text-xl font-bold">KES 68,200</p>
                                            <p className="text-xs text-green-500">+8% from last week</p>
                                        </div>
                                        <div className="bg-primary/5 p-3 rounded-md">
                                            <p className="text-sm text-muted-foreground">This Month</p>
                                            <p className="text-xl font-bold">KES 245,800</p>
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
                                                    <p className="font-bold">KES {(Math.random() * 500 + 200).toFixed(2)}</p>
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
                </div>
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
                                value={selectedCustomer?.id?.toString() || undefined}
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
            {showPaymentDialog && selectedStation && (
                <PaymentModal
                    amount={paymentAmount}
                    station={selectedStation}
                    onSuccess={async () => {
                        try {
                            const transaction = await apiRequest("POST", "/api/transactions", {
                                stationId: selectedStation.id,
                                customerName: selectedStation.currentCustomer,
                                gameName: selectedStation.currentGame,
                                sessionType: selectedStation.sessionType,
                                amount: paymentAmount,
                                duration: diffMins,
                                paymentStatus: "completed"
                            });

                            if (!transaction) {
                                throw new Error("Failed to create transaction");
                            }

                            const response = await apiRequest("POST", "/api/sessions/end", {
                                stationId: selectedStation.id
                            });

                            if (!response) {
                                throw new Error("Failed to end session");
                            }

                            await queryClient.invalidateQueries({ queryKey: ["/api/stations"] });
                            await queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });

                            setShowPaymentDialog(false);
                            setSelectedStation(null);

                            toast({
                                title: "Session Ended",
                                description: `Session completed. Payment received: KES ${paymentAmount}`,
                            });
                        } catch (error: any) {
                            console.error("Error ending session:", error);
                            toast({
                                title: "Error",
                                description: error.message || "Failed to end session. Please try again.",
                                variant: "destructive"
                            });
                        }
                    }}
                    onClose={() => {
                        setShowPaymentDialog(false);
                        setSelectedStation(null);
                    }}
                />
            )}
        </div>
    );
}
import React, { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, PieChart, Pie, Cell, Legend, LineChart, Line, ResponsiveContainer } from "recharts";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import {
  LayoutDashboardIcon,
  BarChart2Icon,
  FileTextIcon,
  MonitorIcon,
  GamepadIcon,
  UsersIcon,
  PackageIcon,
  DollarSignIcon,
  CalendarDaysIcon,
  SettingsIcon,
  RefreshCwIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  LogOutIcon,
  MousePointerIcon
} from "lucide-react";

export default function AdminAnalytics() {
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
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
  
  // Calculate some basic stats
  const activeStations = stations.filter((station: any) => station.status === 'active').length;
  const dailyStats = { totalRevenue: 0, completedSessions: 0, averageRevenue: 0 };
  const pendingTransactions = transactions.filter((tx: any) => tx.status === 'pending');
  const pendingAmount = pendingTransactions.reduce((sum: number, tx: any) => sum + tx.amount, 0);
  
  // Helper function to refresh data
  const refreshAllData = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/stations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/customers"] });
      
      setIsRefreshing(false);
      toast({
        title: "Data Refreshed",
        description: "Dashboard data has been refreshed"
      });
    }, 1500);
  }, [toast, queryClient]);

  return (
    <div className="flex flex-col min-h-screen bg-black/90 text-white">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 border-b border-gray-800 bg-black/70 backdrop-blur-md">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-lg sm:text-xl font-bold mr-2">
                Infinity <span className="text-primary">Admin</span>
              </h1>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  localStorage.removeItem('user');
                  setLocation('/');
                  toast({
                    title: "Logged out",
                    description: "You have been logged out successfully",
                  });
                }}
              >
                <LogOutIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main navigation bar */}
      <div className="border-b border-gray-800 bg-black/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center overflow-x-auto py-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            <div 
              className={`cursor-pointer flex flex-col items-center py-1 px-3 ${activeTab === 'overview' ? 'text-primary' : 'text-gray-300 hover:text-white'}`}
              onClick={() => setActiveTab('overview')}
            >
              <LayoutDashboardIcon className="h-5 w-5 mb-1" />
              <span className="text-xs">Overview</span>
            </div>
            <div 
              className={`cursor-pointer flex flex-col items-center py-1 px-3 ${activeTab === 'analytics' ? 'text-primary' : 'text-gray-300 hover:text-white'}`}
              onClick={() => setActiveTab('analytics')}
            >
              <BarChart2Icon className="h-5 w-5 mb-1" />
              <span className="text-xs">Analytics</span>
            </div>
            <div 
              className={`cursor-pointer flex flex-col items-center py-1 px-3 ${activeTab === 'reports' ? 'text-primary' : 'text-gray-300 hover:text-white'}`}
              onClick={() => setActiveTab('reports')}
            >
              <FileTextIcon className="h-5 w-5 mb-1" />
              <span className="text-xs">Reports</span>
            </div>
            <div 
              className={`cursor-pointer flex flex-col items-center py-1 px-3 ${activeTab === 'stations' ? 'text-primary' : 'text-gray-300 hover:text-white'}`}
              onClick={() => setActiveTab('stations')}
            >
              <MonitorIcon className="h-5 w-5 mb-1" />
              <span className="text-xs">Stations</span>
            </div>
            <div 
              className={`cursor-pointer flex flex-col items-center py-1 px-3 ${activeTab === 'games' ? 'text-primary' : 'text-gray-300 hover:text-white'}`}
              onClick={() => setActiveTab('games')}
            >
              <GamepadIcon className="h-5 w-5 mb-1" />
              <span className="text-xs">Games</span>
            </div>
            <div 
              className={`cursor-pointer flex flex-col items-center py-1 px-3 ${activeTab === 'customers' ? 'text-primary' : 'text-gray-300 hover:text-white'}`}
              onClick={() => setActiveTab('customers')}
            >
              <UsersIcon className="h-5 w-5 mb-1" />
              <span className="text-xs">Customers</span>
            </div>
            <div 
              className={`cursor-pointer flex flex-col items-center py-1 px-3 ${activeTab === 'inventory' ? 'text-primary' : 'text-gray-300 hover:text-white'}`}
              onClick={() => setActiveTab('inventory')}
            >
              <PackageIcon className="h-5 w-5 mb-1" />
              <span className="text-xs">Inventory</span>
            </div>
            <div 
              className={`cursor-pointer flex flex-col items-center py-1 px-3 ${activeTab === 'payments' ? 'text-primary' : 'text-gray-300 hover:text-white'}`}
              onClick={() => setActiveTab('payments')}
            >
              <DollarSignIcon className="h-5 w-5 mb-1" />
              <span className="text-xs">Payments</span>
            </div>
            <div 
              className={`cursor-pointer flex flex-col items-center py-1 px-3 ${activeTab === 'events' ? 'text-primary' : 'text-gray-300 hover:text-white'}`}
              onClick={() => setActiveTab('events')}
            >
              <CalendarDaysIcon className="h-5 w-5 mb-1" />
              <span className="text-xs">Events</span>
            </div>
            <div 
              className={`cursor-pointer flex flex-col items-center py-1 px-3 ${activeTab === 'settings' ? 'text-primary' : 'text-gray-300 hover:text-white'}`}
              onClick={() => setActiveTab('settings')}
            >
              <SettingsIcon className="h-5 w-5 mb-1" />
              <span className="text-xs">Settings</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-2 sm:p-4 md:p-6 backdrop-blur-sm bg-black/50 overflow-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          {/* Global Refresh Button */}
          <div className="flex justify-end mb-4">
            <Button 
              variant="outline"
              onClick={refreshAllData}
              disabled={isRefreshing}
              className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary"
            >
              <RefreshCwIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh All Data'}
            </Button>
          </div>
          
          {/* Tab Content */}
          <TabsContent value="overview" className="max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
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
                    <div className="mt-2">
                      <Progress 
                        value={Math.round((activeStations / (stations.length || 1)) * 100)} 
                        className="h-2" 
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {Math.round((activeStations / (stations.length || 1)) * 100)}% of {stations.length} stations
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg sm:text-2xl font-bold">
                      KES {dailyStats?.totalRevenue || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {dailyStats?.completedSessions || 0} transactions
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">New Customers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg sm:text-2xl font-bold">
                      0
                    </div>
                    <p className="text-xs text-muted-foreground">
                      0 returning customers
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
            </div>
          </TabsContent>
          
          <TabsContent value="analytics">
            <div className="bg-black/30 rounded-lg p-4 border border-primary/20">
              <h2 className="text-xl font-bold mb-4">Analytics Dashboard</h2>
              <p>Interactive analytics content will appear here.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="reports">
            <div className="bg-black/30 rounded-lg p-4 border border-primary/20">
              <h2 className="text-xl font-bold mb-4">Reports & Exports</h2>
              <p>Reports and export functionality will appear here.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="stations">
            <div className="bg-black/30 rounded-lg p-4 border border-primary/20">
              <h2 className="text-xl font-bold mb-4">Game Stations Management</h2>
              <p>Station management functionality will appear here.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="games">
            <div className="bg-black/30 rounded-lg p-4 border border-primary/20">
              <h2 className="text-xl font-bold mb-4">Games Catalog</h2>
              <p>Games catalog management will appear here.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="customers">
            <div className="bg-black/30 rounded-lg p-4 border border-primary/20">
              <h2 className="text-xl font-bold mb-4">Customer Management</h2>
              <p>Customer management functionality will appear here.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="inventory">
            <div className="bg-black/30 rounded-lg p-4 border border-primary/20">
              <h2 className="text-xl font-bold mb-4">Inventory Management</h2>
              <p>Inventory management functionality will appear here.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="payments">
            <div className="bg-black/30 rounded-lg p-4 border border-primary/20">
              <h2 className="text-xl font-bold mb-4">Payment Management</h2>
              <p>Payment management functionality will appear here.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="events">
            <div className="bg-black/30 rounded-lg p-4 border border-primary/20">
              <h2 className="text-xl font-bold mb-4">Events Management</h2>
              <p>Events management functionality will appear here.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="settings">
            <div className="bg-black/30 rounded-lg p-4 border border-primary/20">
              <h2 className="text-xl font-bold mb-4">System Settings</h2>
              <p>System settings will appear here.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
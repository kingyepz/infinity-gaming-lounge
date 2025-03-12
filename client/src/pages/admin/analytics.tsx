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
  MousePointerIcon,
  DownloadIcon
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
            <div className="space-y-6">
              <div className="bg-black/30 rounded-lg p-4 border border-primary/20">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Revenue Analysis</h2>
                  <Select defaultValue="monthly">
                    <SelectTrigger className="w-[180px] bg-black/60">
                      <SelectValue placeholder="Select Period" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-primary/20">
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: 'Jan', revenue: 12400 },
                        { name: 'Feb', revenue: 14800 },
                        { name: 'Mar', revenue: 13200 },
                        { name: 'Apr', revenue: 15800 },
                        { name: 'May', revenue: 16800 },
                        { name: 'Jun', revenue: 18200 },
                        { name: 'Jul', revenue: 19100 },
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="name" stroke="#999" />
                      <YAxis stroke="#999" />
                      <RechartsTooltip 
                        formatter={(value: any) => [`KES ${value}`, 'Revenue']}
                        contentStyle={{ backgroundColor: '#111', borderColor: '#333' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Bar 
                        dataKey="revenue" 
                        fill="var(--primary)" 
                        radius={[4, 4, 0, 0]}
                        barSize={40}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-black/30 rounded-lg p-4 border border-primary/20">
                  <h3 className="text-lg font-bold mb-4">Popular Games</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Call of Duty', value: 120 },
                            { name: 'FIFA 23', value: 85 },
                            { name: 'GTA V', value: 65 },
                            { name: 'Fortnite', value: 45 },
                            { name: 'Battlefield', value: 28 },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {[
                            { name: 'Call of Duty', value: 120, color: '#6366F1' },
                            { name: 'FIFA 23', value: 85, color: '#8B5CF6' },
                            { name: 'GTA V', value: 65, color: '#EC4899' },
                            { name: 'Fortnite', value: 45, color: '#F43F5E' },
                            { name: 'Battlefield', value: 28, color: '#F97316' },
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#111', borderColor: '#333' }}
                          formatter={(value: any, name: any) => [`${value} sessions`, name]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-black/30 rounded-lg p-4 border border-primary/20">
                  <h3 className="text-lg font-bold mb-4">Station Utilization</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={[
                          { name: 'PS5 Station 1', utilization: 76 },
                          { name: 'PS5 Station 2', utilization: 68 },
                          { name: 'PS5 Station 3', utilization: 82 },
                          { name: 'Xbox Station 1', utilization: 65 },
                          { name: 'PC Station 1', utilization: 92 },
                          { name: 'PC Station 2', utilization: 88 },
                        ]}
                        margin={{ top: 20, right: 30, left: 80, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                        <XAxis type="number" domain={[0, 100]} stroke="#999" />
                        <YAxis dataKey="name" type="category" scale="band" stroke="#999" />
                        <RechartsTooltip 
                          formatter={(value: any) => [`${value}%`, 'Utilization']}
                          contentStyle={{ backgroundColor: '#111', borderColor: '#333' }}
                        />
                        <Bar 
                          dataKey="utilization" 
                          fill="var(--primary)" 
                          radius={[0, 4, 4, 0]}
                          barSize={15} 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-black/30 rounded-lg p-4 border border-primary/20">
                  <h3 className="text-lg font-bold mb-4">Customer Segments</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'New', value: 25 },
                            { name: 'Occasional', value: 35 },
                            { name: 'Regular', value: 30 },
                            { name: 'Loyal', value: 10 },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          innerRadius={0}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {[
                            { name: 'New', value: 25, color: '#6366F1' },
                            { name: 'Occasional', value: 35, color: '#8B5CF6' },
                            { name: 'Regular', value: 30, color: '#EC4899' },
                            { name: 'Loyal', value: 10, color: '#F97316' },
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#111', borderColor: '#333' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-black/30 rounded-lg p-4 border border-primary/20">
                  <h3 className="text-lg font-bold mb-4">Hourly Traffic</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={[
                          { hour: '9AM', traffic: 10 },
                          { hour: '10AM', traffic: 18 },
                          { hour: '11AM', traffic: 22 },
                          { hour: '12PM', traffic: 35 },
                          { hour: '1PM', traffic: 42 },
                          { hour: '2PM', traffic: 38 },
                          { hour: '3PM', traffic: 30 },
                          { hour: '4PM', traffic: 35 },
                          { hour: '5PM', traffic: 48 },
                          { hour: '6PM', traffic: 62 },
                          { hour: '7PM', traffic: 75 },
                          { hour: '8PM', traffic: 82 },
                          { hour: '9PM', traffic: 70 },
                          { hour: '10PM', traffic: 58 },
                          { hour: '11PM', traffic: 40 },
                        ]}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="hour" stroke="#999" />
                        <YAxis stroke="#999" />
                        <RechartsTooltip
                          contentStyle={{ backgroundColor: '#111', borderColor: '#333' }}
                          formatter={(value: any) => [`${value} customers`, 'Traffic']}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="traffic" 
                          stroke="var(--primary)" 
                          strokeWidth={2}
                          dot={{ stroke: 'var(--primary)', strokeWidth: 2, r: 4, fill: '#111' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-black/30 rounded-lg p-4 border border-primary/20">
                  <h3 className="text-lg font-bold mb-4">Payment Methods</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Cash', value: 40 },
                            { name: 'M-Pesa', value: 48 },
                            { name: 'QR Code', value: 8 },
                            { name: 'Airtel Money', value: 4 },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          innerRadius={40}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {[
                            { name: 'Cash', value: 40, color: '#10B981' },
                            { name: 'M-Pesa', value: 48, color: '#6366F1' },
                            { name: 'QR Code', value: 8, color: '#F43F5E' },
                            { name: 'Airtel Money', value: 4, color: '#F97316' },
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          contentStyle={{ backgroundColor: '#111', borderColor: '#333' }}
                          formatter={(value: any, name: any) => [`${value}%`, name]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="reports">
            <div className="space-y-6">
              <div className="bg-black/30 rounded-lg p-4 border border-primary/20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <h2 className="text-xl font-bold">Export Reports</h2>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="bg-black/60 border-primary/30 text-primary hover:bg-primary/10"
                        onClick={() => toast({
                          title: "Report Generated",
                          description: "Revenue report has been downloaded as CSV"
                        })}
                      >
                        <FileTextIcon className="mr-2 h-4 w-4" />
                        CSV Export
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="bg-black/60 border-primary/30 text-primary hover:bg-primary/10"
                        onClick={() => toast({
                          title: "Report Generated",
                          description: "Revenue report has been downloaded as PDF"
                        })}
                      >
                        <FileTextIcon className="mr-2 h-4 w-4" />
                        PDF Export
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="bg-black/60 border-primary/30 text-primary hover:bg-primary/10"
                        onClick={() => toast({
                          title: "Report Generated",
                          description: "Revenue report has been downloaded as Excel"
                        })}
                      >
                        <FileTextIcon className="mr-2 h-4 w-4" />
                        Excel Export
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="bg-black/60 border-primary/30 text-primary hover:bg-primary/10"
                        onClick={() => toast({
                          title: "Report Generated",
                          description: "Revenue report has been downloaded as JSON"
                        })}
                      >
                        <FileTextIcon className="mr-2 h-4 w-4" />
                        JSON Export
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <Label htmlFor="report-type">Report Type</Label>
                    <Select defaultValue="revenue">
                      <SelectTrigger id="report-type" className="bg-black/60">
                        <SelectValue placeholder="Select Type" />
                      </SelectTrigger>
                      <SelectContent className="bg-black border-primary/20">
                        <SelectItem value="revenue">Revenue</SelectItem>
                        <SelectItem value="usage">Station Usage</SelectItem>
                        <SelectItem value="games">Game Popularity</SelectItem>
                        <SelectItem value="customers">Customer Activity</SelectItem>
                        <SelectItem value="inventory">Inventory Status</SelectItem>
                        <SelectItem value="financial">Financial Summary</SelectItem>
                        <SelectItem value="loyalty">Loyalty Points</SelectItem>
                        <SelectItem value="hourly">Hourly Distribution</SelectItem>
                        <SelectItem value="comparative">Comparative Analysis</SelectItem>
                        <SelectItem value="predictive">Predictive Analysis</SelectItem>
                        <SelectItem value="heatmap">Usage Heatmap</SelectItem>
                        <SelectItem value="segmentation">Customer Segmentation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="report-format">Format</Label>
                    <Select defaultValue="csv">
                      <SelectTrigger id="report-format" className="bg-black/60">
                        <SelectValue placeholder="Select Format" />
                      </SelectTrigger>
                      <SelectContent className="bg-black border-primary/20">
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="excel">Excel</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="date-from">From Date</Label>
                    <Input 
                      id="date-from"
                      type="date" 
                      className="bg-black/60 border-primary/30"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="date-to">To Date</Label>
                    <Input 
                      id="date-to"
                      type="date" 
                      className="bg-black/60 border-primary/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <Label htmlFor="time-preset">Time of Day</Label>
                    <Select defaultValue="all">
                      <SelectTrigger id="time-preset" className="bg-black/60">
                        <SelectValue placeholder="Select Time Range" />
                      </SelectTrigger>
                      <SelectContent className="bg-black border-primary/20">
                        <SelectItem value="all">All Hours</SelectItem>
                        <SelectItem value="morning">Morning (8AM-12PM)</SelectItem>
                        <SelectItem value="afternoon">Afternoon (12PM-5PM)</SelectItem>
                        <SelectItem value="evening">Evening (5PM-12AM)</SelectItem>
                        <SelectItem value="custom">Custom Hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="start-hour">Start Hour</Label>
                    <Select defaultValue="0">
                      <SelectTrigger id="start-hour" className="bg-black/60">
                        <SelectValue placeholder="Start Hour" />
                      </SelectTrigger>
                      <SelectContent className="bg-black border-primary/20">
                        {Array.from({ length: 24 }).map((_, i) => (
                          <SelectItem key={i} value={i.toString()}>
                            {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="end-hour">End Hour</Label>
                    <Select defaultValue="23">
                      <SelectTrigger id="end-hour" className="bg-black/60">
                        <SelectValue placeholder="End Hour" />
                      </SelectTrigger>
                      <SelectContent className="bg-black border-primary/20">
                        {Array.from({ length: 24 }).map((_, i) => (
                          <SelectItem key={i} value={i.toString()}>
                            {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button 
                      className="w-full bg-primary/90 hover:bg-primary"
                      onClick={() => toast({
                        title: "Generating Report",
                        description: "Your report is being generated and will download shortly."
                      })}
                    >
                      Generate Report
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-black/30 rounded-lg p-4 border border-primary/20">
                <h2 className="text-xl font-bold mb-4">Saved Reports</h2>
                <ScrollArea className="h-72 rounded-md border border-primary/20 p-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[180px]">Report Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Date Range</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Monthly Revenue</TableCell>
                        <TableCell>Revenue</TableCell>
                        <TableCell>Mar 1 - Mar 31, 2025</TableCell>
                        <TableCell>Today at 10:24 AM</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <DownloadIcon className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Weekly Station Usage</TableCell>
                        <TableCell>Usage</TableCell>
                        <TableCell>Mar 5 - Mar 12, 2025</TableCell>
                        <TableCell>Yesterday at 2:30 PM</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <DownloadIcon className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Game Popularity</TableCell>
                        <TableCell>Games</TableCell>
                        <TableCell>Feb 1 - Mar 1, 2025</TableCell>
                        <TableCell>Mar 2, 2025</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <DownloadIcon className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Customer Activity</TableCell>
                        <TableCell>Customers</TableCell>
                        <TableCell>Jan 1 - Mar 1, 2025</TableCell>
                        <TableCell>Mar 2, 2025</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <DownloadIcon className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Financial Summary Q1</TableCell>
                        <TableCell>Financial</TableCell>
                        <TableCell>Jan 1 - Mar 31, 2025</TableCell>
                        <TableCell>Apr 1, 2025</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <DownloadIcon className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>

              <div className="bg-black/30 rounded-lg p-4 border border-primary/20">
                <h2 className="text-xl font-bold mb-4">Schedule Reports</h2>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 items-end">
                  <div>
                    <Label htmlFor="scheduled-report">Report Type</Label>
                    <Select defaultValue="revenue">
                      <SelectTrigger id="scheduled-report" className="bg-black/60">
                        <SelectValue placeholder="Select Type" />
                      </SelectTrigger>
                      <SelectContent className="bg-black border-primary/20">
                        <SelectItem value="revenue">Revenue Summary</SelectItem>
                        <SelectItem value="usage">Usage Analytics</SelectItem>
                        <SelectItem value="customers">Customer Activity</SelectItem>
                        <SelectItem value="complete">Complete Report</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select defaultValue="weekly">
                      <SelectTrigger id="frequency" className="bg-black/60">
                        <SelectValue placeholder="Select Frequency" />
                      </SelectTrigger>
                      <SelectContent className="bg-black border-primary/20">
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="format">Format</Label>
                    <Select defaultValue="pdf">
                      <SelectTrigger id="format" className="bg-black/60">
                        <SelectValue placeholder="Select Format" />
                      </SelectTrigger>
                      <SelectContent className="bg-black border-primary/20">
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="excel">Excel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email To</Label>
                    <Input 
                      id="email"
                      type="email" 
                      placeholder="email@example.com"
                      className="bg-black/60 border-primary/30"
                    />
                  </div>
                  
                  <div>
                    <Button 
                      className="w-full bg-primary/90 hover:bg-primary"
                      onClick={() => toast({
                        title: "Report Scheduled",
                        description: "Your report has been scheduled successfully"
                      })}
                    >
                      Schedule Report
                    </Button>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold mb-2">Active Scheduled Reports</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-md bg-black/40 p-2">
                      <div>
                        <span className="text-sm font-medium">Weekly Revenue Report</span>
                        <div className="text-xs text-gray-400">Every Monday at 8:00 AM • PDF Format</div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8">
                        <TrashIcon className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                    <div className="flex items-center justify-between rounded-md bg-black/40 p-2">
                      <div>
                        <span className="text-sm font-medium">Monthly Complete Report</span>
                        <div className="text-xs text-gray-400">1st of every month at 6:00 AM • Excel Format</div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8">
                        <TrashIcon className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="stations">
            <div className="space-y-6">
              <div className="bg-black/30 rounded-lg p-4 border border-primary/20">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Game Stations</h2>
                  <Button className="bg-primary/90 hover:bg-primary">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Station
                  </Button>
                </div>
                <div className="rounded-md border border-primary/20">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stations.map((station: any) => (
                        <TableRow key={station.id}>
                          <TableCell className="font-medium">{station.id}</TableCell>
                          <TableCell>{station.name}</TableCell>
                          <TableCell>{station.categoryName || 'Standard'}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={station.status === 'active' ? 'default' : 
                                      station.status === 'maintenance' ? 'destructive' : 
                                      'secondary'}
                              className={station.status === 'active' ? 'bg-green-600' : 
                                         station.status === 'maintenance' ? 'bg-red-600' : 
                                         'bg-slate-600'}
                            >
                              {station.status === 'active' ? 'Active' : 
                               station.status === 'maintenance' ? 'Maintenance' : 
                               'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {station.location || 'Main Area'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end items-center gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <PencilIcon className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-black/30 rounded-lg p-4 border border-primary/20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">Station Categories</h3>
                    <Button size="sm" className="bg-primary/90 hover:bg-primary">
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Category
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 rounded-md bg-black/40 border border-primary/20">
                      <div>
                        <h4 className="font-medium">Standard</h4>
                        <p className="text-xs text-gray-400">Basic gaming stations - KES 100/hr</p>
                      </div>
                      <div className="flex items-center">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-md bg-black/40 border border-primary/20">
                      <div>
                        <h4 className="font-medium">Premium</h4>
                        <p className="text-xs text-gray-400">High-end setups - KES 200/hr</p>
                      </div>
                      <div className="flex items-center">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-md bg-black/40 border border-primary/20">
                      <div>
                        <h4 className="font-medium">VIP</h4>
                        <p className="text-xs text-gray-400">Private gaming rooms - KES 350/hr</p>
                      </div>
                      <div className="flex items-center">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-black/30 rounded-lg p-4 border border-primary/20">
                  <h3 className="text-lg font-bold mb-4">Station Maintenance Schedule</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 rounded-md bg-black/40 border border-primary/20">
                      <div className="flex items-center gap-3">
                        <div className="bg-red-500 w-2 h-8 rounded-full"></div>
                        <div>
                          <h4 className="font-medium">PS5 Station 2</h4>
                          <p className="text-xs text-gray-400">Controller replacement - Tomorrow 10:00 AM</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">Complete</Button>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-md bg-black/40 border border-primary/20">
                      <div className="flex items-center gap-3">
                        <div className="bg-orange-500 w-2 h-8 rounded-full"></div>
                        <div>
                          <h4 className="font-medium">Xbox Station 1</h4>
                          <p className="text-xs text-gray-400">Routine checkup - Mar 15, 9:00 AM</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">Reschedule</Button>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-md bg-black/40 border border-primary/20">
                      <div className="flex items-center gap-3">
                        <div className="bg-green-500 w-2 h-8 rounded-full"></div>
                        <div>
                          <h4 className="font-medium">PC Station 3</h4>
                          <p className="text-xs text-gray-400">Monthly cleaning - Mar 20, 8:00 AM</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">Reschedule</Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-black/30 rounded-lg p-4 border border-primary/20">
                <h3 className="text-lg font-bold mb-4">Station Layout Map</h3>
                <div className="p-6 rounded-md bg-black/40 border border-gray-800 h-96 flex items-center justify-center">
                  <div className="text-center">
                    <MousePointerIcon className="h-16 w-16 mx-auto mb-4 text-primary/70" />
                    <h4 className="font-medium text-lg">Interactive Floor Map</h4>
                    <p className="text-sm text-gray-400 max-w-md">
                      An interactive map showing station locations and status will be displayed here. Admins will be able to drag and rearrange stations.
                    </p>
                  </div>
                </div>
              </div>
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
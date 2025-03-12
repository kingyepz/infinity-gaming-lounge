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
            <div className="space-y-6">
              <div className="bg-black/30 rounded-lg p-4 border border-primary/20">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Games Catalog</h2>
                  <Button className="bg-primary/90 hover:bg-primary">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Game
                  </Button>
                </div>
                <div className="rounded-md border border-primary/20">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Platform</TableHead>
                        <TableHead>Pricing Model</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {games.map((game: any) => (
                        <TableRow key={game.id}>
                          <TableCell className="font-medium">{game.id}</TableCell>
                          <TableCell>{game.name}</TableCell>
                          <TableCell>{game.platform || 'Multiple'}</TableCell>
                          <TableCell>
                            {game.pricingType === 'hourly' ? 'Per Hour' : 
                             game.pricingType === 'session' ? 'Per Session' : 'Free'}
                          </TableCell>
                          <TableCell>
                            {game.pricingType === 'hourly' ? `KES ${game.pricePerHour || 0}/hr` : 
                             game.pricingType === 'session' ? `KES ${game.pricePerSession || 0}` : 'Free'}
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
                  <h3 className="text-lg font-bold mb-4">Game Popularity</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: 'Call of Duty', sessions: 164 },
                          { name: 'FIFA 23', sessions: 145 },
                          { name: 'GTA V', sessions: 118 },
                          { name: 'Fortnite', sessions: 97 },
                          { name: 'Battlefield', sessions: 76 },
                          { name: 'Apex Legends', sessions: 65 },
                          { name: 'Rocket League', sessions: 54 },
                        ]}
                        margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="name" stroke="#999" />
                        <YAxis stroke="#999" />
                        <RechartsTooltip
                          contentStyle={{ backgroundColor: '#111', borderColor: '#333' }}
                          formatter={(value: any) => [`${value} sessions`, 'Usage']}
                        />
                        <Bar 
                          dataKey="sessions" 
                          fill="var(--primary)" 
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-black/30 rounded-lg p-4 border border-primary/20">
                  <h3 className="text-lg font-bold mb-4">Game Categories</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 rounded-md bg-black/40 border border-primary/20">
                      <div>
                        <h4 className="font-medium">First Person Shooter</h4>
                        <p className="text-xs text-gray-400">Call of Duty, Battlefield, CS:GO, Valorant</p>
                      </div>
                      <Badge className="bg-primary/80">12 Games</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-md bg-black/40 border border-primary/20">
                      <div>
                        <h4 className="font-medium">Sports</h4>
                        <p className="text-xs text-gray-400">FIFA, NBA 2K, F1, Rocket League</p>
                      </div>
                      <Badge className="bg-primary/80">8 Games</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-md bg-black/40 border border-primary/20">
                      <div>
                        <h4 className="font-medium">Battle Royale</h4>
                        <p className="text-xs text-gray-400">Fortnite, Apex Legends, PUBG</p>
                      </div>
                      <Badge className="bg-primary/80">6 Games</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-md bg-black/40 border border-primary/20">
                      <div>
                        <h4 className="font-medium">Open World</h4>
                        <p className="text-xs text-gray-400">GTA V, Red Dead Redemption 2</p>
                      </div>
                      <Badge className="bg-primary/80">5 Games</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-md bg-black/40 border border-primary/20">
                      <div>
                        <h4 className="font-medium">MOBA</h4>
                        <p className="text-xs text-gray-400">League of Legends, Dota 2</p>
                      </div>
                      <Badge className="bg-primary/80">3 Games</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-black/30 rounded-lg p-4 border border-primary/20">
                <h3 className="text-lg font-bold mb-4">Game Licensing Status</h3>
                <div className="rounded-md border border-primary/20">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Game Title</TableHead>
                        <TableHead>License Type</TableHead>
                        <TableHead>Expiration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Call of Duty: Modern Warfare 3</TableCell>
                        <TableCell>Commercial (5 copies)</TableCell>
                        <TableCell>Dec 31, 2025</TableCell>
                        <TableCell>
                          <Badge className="bg-green-600">Active</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" className="h-8">
                            Renew
                          </Button>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">FIFA 23</TableCell>
                        <TableCell>Commercial (8 copies)</TableCell>
                        <TableCell>Oct 15, 2025</TableCell>
                        <TableCell>
                          <Badge className="bg-green-600">Active</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" className="h-8">
                            Renew
                          </Button>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Grand Theft Auto V</TableCell>
                        <TableCell>Commercial (6 copies)</TableCell>
                        <TableCell>May 08, 2025</TableCell>
                        <TableCell>
                          <Badge className="bg-yellow-600">Expiring Soon</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" className="h-8">
                            Renew
                          </Button>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Fortnite</TableCell>
                        <TableCell>Free-to-play (Unlimited)</TableCell>
                        <TableCell>N/A</TableCell>
                        <TableCell>
                          <Badge className="bg-green-600">Active</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" className="h-8">
                            Update
                          </Button>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Apex Legends</TableCell>
                        <TableCell>Free-to-play (Unlimited)</TableCell>
                        <TableCell>N/A</TableCell>
                        <TableCell>
                          <Badge className="bg-green-600">Active</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" className="h-8">
                            Update
                          </Button>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="customers">
            <div className="space-y-6">
              <div className="bg-black/30 rounded-lg p-4 border border-primary/20">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Customer Database</h2>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Input 
                        type="search" 
                        placeholder="Search customers..." 
                        className="w-[250px] bg-black/60 border-primary/20 pr-8"
                      />
                      <div className="absolute right-2 top-2.5 text-muted-foreground">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="11" cy="11" r="8" />
                          <path d="m21 21-4.3-4.3" />
                        </svg>
                      </div>
                    </div>
                    <Button className="bg-primary/90 hover:bg-primary">
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Customer
                    </Button>
                  </div>
                </div>

                <div className="rounded-md border border-primary/20">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Gaming Name</TableHead>
                        <TableHead>Phone Number</TableHead>
                        <TableHead>Loyalty Points</TableHead>
                        <TableHead>Last Visit</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...Array(5)].map((_, index) => {
                        // This would normally come from API data
                        const mockCustomers = [
                          { id: 1, displayName: "John Doe", gamingName: "ShadowHunter", phoneNumber: "254700123456", points: 850, lastVisit: "Today" },
                          { id: 2, displayName: "Jane Smith", gamingName: "CyberNinja", phoneNumber: "254711234567", points: 1200, lastVisit: "Yesterday" },
                          { id: 3, displayName: "David Wilson", gamingName: "MasterBlaster", phoneNumber: "254722345678", points: 450, lastVisit: "2 days ago" },
                          { id: 4, displayName: "Emily Brown", gamingName: "PixelQueen", phoneNumber: "254733456789", points: 950, lastVisit: "3 days ago" },
                          { id: 5, displayName: "Michael Johnson", gamingName: "LegendKiller", phoneNumber: "254744567890", points: 750, lastVisit: "1 week ago" },
                        ];
                        const customer = mockCustomers[index];
                        
                        return (
                          <TableRow key={customer.id}>
                            <TableCell className="font-medium">{customer.id}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>{customer.displayName.charAt(0)}{customer.displayName.split(' ')[1]?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                {customer.displayName}
                              </div>
                            </TableCell>
                            <TableCell>{customer.gamingName}</TableCell>
                            <TableCell>{customer.phoneNumber}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span>{customer.points}</span>
                                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                  {customer.points > 1000 ? 'GOLD' : customer.points > 500 ? 'SILVER' : 'BRONZE'}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>{customer.lastVisit}</TableCell>
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
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-black/30 rounded-lg p-4 border border-primary/20">
                  <h3 className="text-lg font-bold mb-4">Customer Metrics</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card className="bg-black/30 border-primary/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">New Customers</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">28</div>
                        <p className="text-xs text-muted-foreground">
                          +12% from last month
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-black/30 border-primary/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Returning Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">68%</div>
                        <p className="text-xs text-muted-foreground">
                          +5% from last month
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-black/30 border-primary/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Avg Session Length</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">2.4 hrs</div>
                        <p className="text-xs text-muted-foreground">
                          -0.2 hrs from last month
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-black/30 border-primary/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">342</div>
                        <p className="text-xs text-muted-foreground">
                          All-time registered customers
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div className="bg-black/30 rounded-lg p-4 border border-primary/20">
                  <h3 className="text-lg font-bold mb-4">Loyalty Program Summary</h3>
                  <div className="space-y-4">
                    <div className="flex flex-col">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Bronze Tier (0-500 pts)</span>
                        <span className="text-sm">216 customers</span>
                      </div>
                      <Progress value={63} className="h-2" />
                      <span className="text-xs text-muted-foreground mt-1">63% of customer base</span>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Silver Tier (501-1000 pts)</span>
                        <span className="text-sm">95 customers</span>
                      </div>
                      <Progress value={28} className="h-2" />
                      <span className="text-xs text-muted-foreground mt-1">28% of customer base</span>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Gold Tier (1001+ pts)</span>
                        <span className="text-sm">31 customers</span>
                      </div>
                      <Progress value={9} className="h-2" />
                      <span className="text-xs text-muted-foreground mt-1">9% of customer base</span>
                    </div>
                    <div className="rounded-md p-3 bg-black/40 border border-primary/20 mt-4">
                      <h4 className="font-medium text-sm">Top Loyalty Customer</h4>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>JS</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">Jane Smith</p>
                            <p className="text-xs text-muted-foreground">CyberNinja</p>
                          </div>
                        </div>
                        <Badge className="bg-yellow-600">
                          1,200 points
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-black/30 rounded-lg p-4 border border-primary/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">Recent Activity</h3>
                  <Button variant="outline" size="sm" className="h-8">
                    View All
                  </Button>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 rounded-md bg-black/40 border border-primary/20">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="text-sm font-medium">John Doe started a gaming session</p>
                        <span className="text-xs text-muted-foreground">Today, 3:45 PM</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Station: PS5 Station 1 • Game: Call of Duty: Modern Warfare 3
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-md bg-black/40 border border-primary/20">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>EB</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="text-sm font-medium">Emily Brown redeemed loyalty points</p>
                        <span className="text-xs text-muted-foreground">Today, 1:32 PM</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Redeemed 200 points for a 2-hour free gaming session
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-md bg-black/40 border border-primary/20">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>MJ</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="text-sm font-medium">Michael Johnson registered as a new customer</p>
                        <span className="text-xs text-muted-foreground">Yesterday, 5:20 PM</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Gamertag: LegendKiller • Initial points: 50
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="inventory">
            <div className="space-y-6">
              <div className="bg-black/30 rounded-lg p-4 border border-primary/20">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Inventory Management</h2>
                  <div className="flex gap-2">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[180px] bg-black/60">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent className="bg-black border-primary/20">
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="peripherals">Peripherals</SelectItem>
                        <SelectItem value="accessories">Accessories</SelectItem>
                        <SelectItem value="hardware">Hardware</SelectItem>
                        <SelectItem value="games">Physical Games</SelectItem>
                        <SelectItem value="refreshments">Refreshments</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button className="bg-primary/90 hover:bg-primary">
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                </div>

                <div className="rounded-md border border-primary/20">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">SKU</TableHead>
                        <TableHead>Item Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">PS-CTL-001</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-md bg-black/60 flex items-center justify-center">
                              <GamepadIcon className="h-4 w-4" />
                            </div>
                            PS5 Controller (Black)
                          </div>
                        </TableCell>
                        <TableCell>Peripherals</TableCell>
                        <TableCell>12</TableCell>
                        <TableCell>KES 8,500</TableCell>
                        <TableCell>
                          <Badge className="bg-green-600">In Stock</Badge>
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
                      <TableRow>
                        <TableCell className="font-medium">HDM-CBL-002</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-md bg-black/60 flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6c0-1.1.9-2 2-2zm0 6h14"/></svg>
                            </div>
                            HDMI Cable 2.1 (2m)
                          </div>
                        </TableCell>
                        <TableCell>Accessories</TableCell>
                        <TableCell>28</TableCell>
                        <TableCell>KES 1,800</TableCell>
                        <TableCell>
                          <Badge className="bg-green-600">In Stock</Badge>
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
                      <TableRow>
                        <TableCell className="font-medium">XB-CTL-003</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-md bg-black/60 flex items-center justify-center">
                              <GamepadIcon className="h-4 w-4" />
                            </div>
                            Xbox Controller (Elite)
                          </div>
                        </TableCell>
                        <TableCell>Peripherals</TableCell>
                        <TableCell>3</TableCell>
                        <TableCell>KES 18,000</TableCell>
                        <TableCell>
                          <Badge className="bg-yellow-600">Low Stock</Badge>
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
                      <TableRow>
                        <TableCell className="font-medium">SSD-1TB-004</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-md bg-black/60 flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                            </div>
                            1TB SSD Storage Drive
                          </div>
                        </TableCell>
                        <TableCell>Hardware</TableCell>
                        <TableCell>0</TableCell>
                        <TableCell>KES 15,500</TableCell>
                        <TableCell>
                          <Badge className="bg-red-600">Out of Stock</Badge>
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
                      <TableRow>
                        <TableCell className="font-medium">SODA-CAN-005</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-md bg-black/60 flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2h8"/><path d="M9 2v2.789a4 4 0 0 1-.672 2.219l-.656.984A4 4 0 0 0 7 10.212V20a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-9.789a4 4 0 0 0-.672-2.219l-.656-.984A4 4 0 0 1 15 4.788V2"/></svg>
                            </div>
                            Soda Can (Assorted)
                          </div>
                        </TableCell>
                        <TableCell>Refreshments</TableCell>
                        <TableCell>48</TableCell>
                        <TableCell>KES 120</TableCell>
                        <TableCell>
                          <Badge className="bg-green-600">In Stock</Badge>
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
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-black/30 rounded-lg p-4 border border-primary/20">
                  <h3 className="text-lg font-bold mb-4">Inventory Summary</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total Items</span>
                      <span className="font-medium">128</span>
                    </div>
                    <Separator className="bg-primary/10" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Categories</span>
                      <span className="font-medium">6</span>
                    </div>
                    <Separator className="bg-primary/10" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Low Stock Items</span>
                      <span className="font-medium text-yellow-500">8</span>
                    </div>
                    <Separator className="bg-primary/10" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Out of Stock</span>
                      <span className="font-medium text-red-500">3</span>
                    </div>
                    <Separator className="bg-primary/10" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Inventory Value</span>
                      <span className="font-medium">KES 548,720</span>
                    </div>
                  </div>
                </div>

                <div className="bg-black/30 rounded-lg p-4 border border-primary/20">
                  <h3 className="text-lg font-bold mb-4">Category Distribution</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Peripherals', value: 42 },
                            { name: 'Accessories', value: 28 },
                            { name: 'Hardware', value: 15 },
                            { name: 'Physical Games', value: 18 },
                            { name: 'Refreshments', value: 25 },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {[
                            { name: 'Peripherals', color: '#6366F1' },
                            { name: 'Accessories', color: '#8B5CF6' },
                            { name: 'Hardware', color: '#EC4899' },
                            { name: 'Physical Games', color: '#F43F5E' },
                            { name: 'Refreshments', color: '#F97316' },
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#111', borderColor: '#333' }}
                          formatter={(value: any, name: any) => [`${value} items`, name]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-black/30 rounded-lg p-4 border border-primary/20">
                  <h3 className="text-lg font-bold mb-4">Recent Inventory Activity</h3>
                  <div className="space-y-3">
                    <div className="p-3 rounded-md bg-black/40 border border-primary/20">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Item Restocked</span>
                        <span className="text-xs text-muted-foreground">Today, 10:45 AM</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">PS5 Controller (Black) +15 units</p>
                    </div>
                    <div className="p-3 rounded-md bg-black/40 border border-primary/20">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Item Out of Stock</span>
                        <span className="text-xs text-muted-foreground">Yesterday, 2:30 PM</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">1TB SSD Storage Drive (0 remaining)</p>
                    </div>
                    <div className="p-3 rounded-md bg-black/40 border border-primary/20">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">New Item Added</span>
                        <span className="text-xs text-muted-foreground">Mar 10, 11:20 AM</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Gaming Headset (Wireless) - Initial stock: 10</p>
                    </div>
                    <div className="p-3 rounded-md bg-black/40 border border-primary/20">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Item Updated</span>
                        <span className="text-xs text-muted-foreground">Mar 9, 4:15 PM</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">HDMI Cable 2.1 - Price updated: KES 1,800 (was KES 1,500)</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-black/30 rounded-lg p-4 border border-primary/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">Inventory Alerts</h3>
                  <Badge className="bg-red-600">3 Critical Alerts</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-md bg-red-950/30 border border-red-600/30">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-red-600/20 flex items-center justify-center text-red-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium">1TB SSD Storage Drive is out of stock</p>
                        <p className="text-xs text-muted-foreground">Reorder immediately - high demand item</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="h-8 border-red-600/30 text-red-400 hover:text-red-300 hover:bg-red-950/50">
                      Reorder
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-md bg-yellow-950/30 border border-yellow-600/30">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-yellow-600/20 flex items-center justify-center text-yellow-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Xbox Controller (Elite) is low in stock (3 remaining)</p>
                        <p className="text-xs text-muted-foreground">Below minimum threshold of 5 units</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="h-8 border-yellow-600/30 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-950/50">
                      Reorder
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-md bg-yellow-950/30 border border-yellow-600/30">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-yellow-600/20 flex items-center justify-center text-yellow-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Gaming Mouse - Wired is low in stock (4 remaining)</p>
                        <p className="text-xs text-muted-foreground">Below minimum threshold of 8 units</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="h-8 border-yellow-600/30 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-950/50">
                      Reorder
                    </Button>
                  </div>
                </div>
              </div>
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
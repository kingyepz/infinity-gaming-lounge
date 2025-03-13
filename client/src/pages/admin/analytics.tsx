import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import StationTransactionHistory from "@/components/shared/StationTransactionHistory";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import InfinityLogo from "@/components/animations/InfinityLogo";
import { 
  GamepadIcon,
  BarChart2Icon,
  DollarSignIcon,
  UsersIcon,
  DownloadIcon,
  LogOutIcon,
  HeadphonesIcon,
  EyeIcon,
  CarIcon,
  SmartphoneIcon,
  PlusIcon,
  Pencil as PencilIcon,
  Trash as TrashIcon,
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
  MonitorIcon,
  Loader2Icon,
  MousePointer as MousePointerIcon,
  Tv as TvIcon,
  X
} from "lucide-react";
import { useLocation } from "wouter";
import axios from "axios";
import type { GameStation, Game, User, Transaction, StationCategory, Booking } from "@shared/schema";

// Reservation Form Component
interface ReservationFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  customers: User[];
  stations: GameStation[];
  initialData?: Booking;
  isEditing?: boolean;
}

function ReservationForm({ onSubmit, onCancel, customers, stations, initialData, isEditing = false }: ReservationFormProps) {
  const form = useForm<z.infer<typeof reservationFormSchema>>({
    resolver: zodResolver(reservationFormSchema),
    defaultValues: initialData ? {
      userId: initialData.userId,
      stationId: initialData.stationId,
      date: initialData.date,
      time: initialData.time,
      duration: initialData.duration,
      note: initialData.note || "",
      status: initialData.status as "pending" | "confirmed" | "completed" | "cancelled"
    } : {
      userId: undefined,
      stationId: undefined,
      date: new Date().toISOString().split('T')[0],
      time: "12:00",
      duration: 1,
      note: "",
      status: "pending"
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="userId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Customer</FormLabel>
              <Select 
                onValueChange={(value) => field.onChange(parseInt(value))}
                defaultValue={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.displayName} ({customer.phoneNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="stationId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Game Station</FormLabel>
              <Select 
                onValueChange={(value) => field.onChange(parseInt(value))}
                defaultValue={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select station" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {stations.map((station) => (
                    <SelectItem key={station.id} value={station.id.toString()}>
                      {station.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duration (hours)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  {...field} 
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                  min={1}
                  max={12}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormDescription>
                Any special requests or additional information
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {isEditing && (
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select 
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {isEditing ? "Update Reservation" : "Create Reservation"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// Variable used in ReservationForm - need to define it here at the module level
const reservationFormSchema = z.object({
  userId: z.number({
    required_error: "Customer is required",
  }),
  stationId: z.number({
    required_error: "Station is required",
  }),
  date: z.string({
    required_error: "Date is required",
  }),
  time: z.string({
    required_error: "Time is required",
  }),
  duration: z.number({
    required_error: "Duration is required",
  }).min(1, "Duration must be at least 1 hour"),
  note: z.string().optional(),
  status: z.enum(["pending", "confirmed", "completed", "cancelled"], {
    required_error: "Status is required",
  }),
});

export default function AdminAnalytics() {
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  // Initialize state variables
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [reportStartDate, setReportStartDate] = useState<string>('');
  const [reportEndDate, setReportEndDate] = useState<string>('');
  const [reportType, setReportType] = useState<string>('revenue');
  const [reportFormat, setReportFormat] = useState<string>('csv');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  
  // Report time-based filtering
  const [reportStartHour, setReportStartHour] = useState<number>(0);
  const [reportEndHour, setReportEndHour] = useState<number>(23);
  const [timePreset, setTimePreset] = useState<string>('all');
  
  // Interactive dashboard filters
  const [dashboardPeriod, setDashboardPeriod] = useState<string>('month');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [timeOfDayFilter, setTimeOfDayFilter] = useState<string>('all');
  const [startHour, setStartHour] = useState<number>(0);
  const [endHour, setEndHour] = useState<number>(23);
  const [isApplyingFilter, setIsApplyingFilter] = useState(false);
  const [filteredData, setFilteredData] = useState<any>(null);
  
  // Add Station Dialog
  const [showAddStationDialog, setShowAddStationDialog] = useState(false);
  const [newStationName, setNewStationName] = useState("");
  
  // Station utilization sorting
  const [stationSortOrder, setStationSortOrder] = useState<string>("name_asc");
  
  // Edit Station Dialog
  const [showEditStationDialog, setShowEditStationDialog] = useState(false);
  const [editStationId, setEditStationId] = useState<number | null>(null);
  const [editStationName, setEditStationName] = useState("");
  const [confirmDeleteStationDialog, setConfirmDeleteStationDialog] = useState(false);
  const [stationToDelete, setStationToDelete] = useState<number | null>(null);
  
  // Station Category Management
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryType, setNewCategoryType] = useState<string>("standard");
  const [newCategoryHourlyRate, setNewCategoryHourlyRate] = useState("");
  const [newCategoryPeakHourRate, setNewCategoryPeakHourRate] = useState("");
  const [newCategoryOffPeakRate, setNewCategoryOffPeakRate] = useState("");
  const [newCategoryWeekendRate, setNewCategoryWeekendRate] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#6366F1");
  const [newCategoryIcon, setNewCategoryIcon] = useState("gamepad");
  
  // Edit Category Dialog
  const [showEditCategoryDialog, setShowEditCategoryDialog] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategoryType, setEditCategoryType] = useState<string>("standard");
  const [editCategoryHourlyRate, setEditCategoryHourlyRate] = useState("");
  const [editCategoryPeakHourRate, setEditCategoryPeakHourRate] = useState("");
  const [editCategoryOffPeakRate, setEditCategoryOffPeakRate] = useState("");
  const [editCategoryWeekendRate, setEditCategoryWeekendRate] = useState("");
  const [editCategoryDescription, setEditCategoryDescription] = useState("");
  const [editCategoryColor, setEditCategoryColor] = useState("#6366F1");
  const [editCategoryIcon, setEditCategoryIcon] = useState("gamepad");
  const [confirmDeleteCategoryDialog, setConfirmDeleteCategoryDialog] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);
  
  // Transaction History Dialog
  const [showTransactionHistoryDialog, setShowTransactionHistoryDialog] = useState(false);
  const [selectedStation, setSelectedStation] = useState<any>(null);
  
  // Import the formatCurrency function from payment.ts
  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2
    }).format(numAmount);
  };
  
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
  
  // Fetch data on component mount
  useEffect(() => {
    refreshAllData();
  }, []);
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
  
  // Fetch analytics data from reports endpoints
  const { data: dailyStats = { totalRevenue: 0, completedSessions: 0, averageRevenue: 0 } } = useQuery({
    queryKey: ["/api/reports/daily"],
    queryFn: () => apiRequest({ path: "/api/reports/daily" })
  });
  
  const { data: revenueByTimeFrame = [] } = useQuery({
    queryKey: ["/api/reports/revenue/weekly"],
    queryFn: () => apiRequest({ path: "/api/reports/revenue/weekly" })
  });
  
  const { data: popularGamesStats = [] } = useQuery({
    queryKey: ["/api/reports/popular-games"],
    queryFn: () => apiRequest({ path: "/api/reports/popular-games" })
  });
  
  const { data: stationUtilization = [] } = useQuery({
    queryKey: ["/api/reports/station-utilization"],
    queryFn: () => apiRequest({ path: "/api/reports/station-utilization" })
  });
  
  const { data: customerActivity = { 
    newCustomers: 0, 
    returningCustomers: 0,
    returnRate: 0,
    avgSessionDuration: 0
  } } = useQuery({
    queryKey: ["/api/reports/customer-activity"],
    queryFn: () => apiRequest({ path: "/api/reports/customer-activity" })
  });
  
  const { data: paymentMethodStats = [] } = useQuery({
    queryKey: ["/api/reports/payment-methods"],
    queryFn: () => apiRequest({ path: "/api/reports/payment-methods" })
  });
  
  // Added advanced analytics queries
  const { data: hourlyDistribution = [] } = useQuery({
    queryKey: ["/api/reports/hourly-distribution"],
    queryFn: () => apiRequest({ path: "/api/reports/hourly-distribution" })
  });
  
  const { data: customerRetention = { customerDetails: [], summary: {} } } = useQuery({
    queryKey: ["/api/reports/customer-retention"],
    queryFn: () => apiRequest({ path: "/api/reports/customer-retention" })
  });
  
  const { data: stationHeatmap = [] } = useQuery({
    queryKey: ["/api/reports/station-heatmap"],
    queryFn: () => apiRequest({ path: "/api/reports/station-heatmap" })
  });
  
  const { data: gamePerformance = [] } = useQuery({
    queryKey: ["/api/reports/game-performance"],
    queryFn: () => apiRequest({ path: "/api/reports/game-performance" })
  });
  
  const { data: revenueBreakdown = { categories: [], totalRevenue: 0 } } = useQuery({
    queryKey: ["/api/reports/revenue-breakdown"],
    queryFn: () => apiRequest({ path: "/api/reports/revenue-breakdown" })
  });
  
  const { data: loyaltyAnalytics = { segments: [], topCustomers: [] } } = useQuery({
    queryKey: ["/api/reports/loyalty-analytics"],
    queryFn: () => apiRequest({ path: "/api/reports/loyalty-analytics" })
  });
  
  // Fetch station categories data
  const { data: stationCategories = [] } = useQuery({
    queryKey: ["/api/station-categories"],
    queryFn: () => apiRequest({ path: "/api/station-categories" })
  });
  
  // State for comparative analysis period selection
  const [comparePeriod, setComparePeriod] = useState('monthly');
  
  const { data: comparativeAnalysis = { 
    periodType: 'monthly', 
    currentPeriod: { metrics: {} }, 
    previousPeriod: { metrics: {} }, 
    changes: {} 
  } } = useQuery({
    queryKey: ["/api/reports/comparative-analysis", comparePeriod],
    queryFn: () => apiRequest({ 
      path: `/api/reports/comparative-analysis?period=${comparePeriod}` 
    }),
    enabled: true,
  });
  
  const { data: predictiveAnalytics = { dayAverages: [], forecast: [], nextWeekTotal: 0 } } = useQuery({
    queryKey: ["/api/reports/predictive-analytics"],
    queryFn: () => apiRequest({ path: "/api/reports/predictive-analytics" })
  });
  
  // Fetch bookings data for reservations management
  const { data: bookings = [] } = useQuery({
    queryKey: ["/api/bookings"],
    queryFn: () => apiRequest({ path: "/api/bookings" })
  });
  
  // Reservations management state
  const [showAddReservationDialog, setShowAddReservationDialog] = useState(false);
  const [showEditReservationDialog, setShowEditReservationDialog] = useState(false);
  const [editReservationId, setEditReservationId] = useState<number | null>(null);
  const [confirmDeleteReservationDialog, setConfirmDeleteReservationDialog] = useState(false);
  const [reservationToDelete, setReservationToDelete] = useState<number | null>(null);
  const [reservationFilterDate, setReservationFilterDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reservationDateFilter, setReservationDateFilter] = useState<string>("today");
  
  // Using the reservationFormSchema defined at the module level
  
  // Current reservation filter date
  const formatReservationFilterDate = (filter: string) => {
    const today = new Date();
    
    switch (filter) {
      case "today":
        return today.toISOString().split('T')[0];
      case "tomorrow":
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
      case "next7days":
        return ""; // Special case - handled in filtering logic
      case "custom":
        return reservationFilterDate;
      default:
        return today.toISOString().split('T')[0];
    }
  };
  
  // Filter reservations based on date filter
  const filteredReservations = useMemo(() => {
    if (!bookings.length) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const next7Days = new Date(today);
    next7Days.setDate(next7Days.getDate() + 7);
    
    return bookings.filter((booking: Booking) => {
      const bookingDate = new Date(booking.date);
      bookingDate.setHours(0, 0, 0, 0); // Set to start of day
      
      if (reservationDateFilter === "today") {
        return bookingDate.getTime() === today.getTime();
      } else if (reservationDateFilter === "tomorrow") {
        return bookingDate.getTime() === tomorrow.getTime();
      } else if (reservationDateFilter === "next7days") {
        return bookingDate >= today && bookingDate < next7Days;
      } else if (reservationDateFilter === "custom" && reservationFilterDate) {
        const filterDate = new Date(reservationFilterDate);
        filterDate.setHours(0, 0, 0, 0);
        return bookingDate.getTime() === filterDate.getTime();
      }
      
      return true; // Default to showing all
    });
  }, [bookings, reservationDateFilter, reservationFilterDate]);
  
  // Reservation Management Handlers
  const handleAddReservation = async (data: z.infer<typeof reservationFormSchema>) => {
    try {
      await apiRequest({
        path: "/api/bookings",
        method: "POST",
        data
      });
      
      toast({
        title: "Reservation Added",
        description: "The reservation has been successfully added.",
      });
      
      setShowAddReservationDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
    } catch (error: any) {
      console.error("Error adding reservation:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add reservation. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleEditReservation = async (data: z.infer<typeof reservationFormSchema>) => {
    if (!editReservationId) return;
    
    try {
      await apiRequest({
        path: `/api/bookings/${editReservationId}`,
        method: "PATCH",
        data
      });
      
      toast({
        title: "Reservation Updated",
        description: "The reservation has been successfully updated.",
      });
      
      setShowEditReservationDialog(false);
      setEditReservationId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
    } catch (error: any) {
      console.error("Error updating reservation:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update reservation. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleCheckInReservation = async (reservationId: number) => {
    try {
      await apiRequest({
        path: `/api/bookings/${reservationId}/check-in`,
        method: "PATCH"
      });
      
      toast({
        title: "Customer Checked In",
        description: "The customer has been successfully checked in.",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
    } catch (error: any) {
      console.error("Error checking in reservation:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to check in customer. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleCancelReservation = async (reservationId: number) => {
    try {
      await apiRequest({
        path: `/api/bookings/${reservationId}/cancel`,
        method: "PATCH"
      });
      
      toast({
        title: "Reservation Cancelled",
        description: "The reservation has been cancelled successfully.",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
    } catch (error: any) {
      console.error("Error cancelling reservation:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to cancel reservation. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleDeleteReservation = async () => {
    if (!reservationToDelete) return;
    
    try {
      await apiRequest({
        path: `/api/bookings/${reservationToDelete}`,
        method: "DELETE"
      });
      
      toast({
        title: "Reservation Deleted",
        description: "The reservation has been deleted successfully.",
      });
      
      setConfirmDeleteReservationDialog(false);
      setReservationToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
    } catch (error: any) {
      console.error("Error deleting reservation:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete reservation. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Function to handle confirming delete reservation
  const handleDeleteReservationClick = (reservationId: number) => {
    setReservationToDelete(reservationId);
    setConfirmDeleteReservationDialog(true);
  };
  
  // Function to open edit reservation dialog
  const handleEditReservationClick = (reservation: Booking) => {
    setEditReservationId(reservation.id);
    setShowEditReservationDialog(true);
  };

  // Date and time filter functions
  const applyDateFilter = useCallback(async () => {
    setIsApplyingFilter(true);
    
    try {
      // Validate date inputs when "Custom" period is selected
      if (dashboardPeriod === 'custom') {
        if (!customStartDate || !customEndDate) {
          toast({
            title: "Date Selection Required",
            description: "Please select both start and end dates for a custom range",
            variant: "destructive"
          });
          setIsApplyingFilter(false);
          return;
        }
        
        // Validate date range (start date should be before end date)
        const startDate = new Date(customStartDate);
        const endDate = new Date(customEndDate);
        
        if (startDate > endDate) {
          toast({
            title: "Invalid Date Range",
            description: "Start date must be before end date",
            variant: "destructive"
          });
          setIsApplyingFilter(false);
          return;
        }
      }
      
      // Validate time range (start hour should be before or equal to end hour)
      if (startHour > endHour) {
        toast({
          title: "Invalid Time Range",
          description: "Start hour must be before or equal to end hour",
          variant: "destructive"
        });
        setIsApplyingFilter(false);
        return;
      }
      
      // Build filter parameters based on selected period
      let params: Record<string, string | number> = {};
      
      if (dashboardPeriod === 'day') {
        const today = new Date();
        params = { 
          startDate: today.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0] 
        };
      } else if (dashboardPeriod === 'week') {
        const today = new Date();
        const weekAgo = new Date();
        weekAgo.setDate(today.getDate() - 7);
        params = { 
          startDate: weekAgo.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0] 
        };
      } else if (dashboardPeriod === 'month') {
        const today = new Date();
        const monthAgo = new Date();
        monthAgo.setMonth(today.getMonth() - 1);
        params = { 
          startDate: monthAgo.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0] 
        };
      } else if (dashboardPeriod === 'custom') {
        params = { 
          startDate: customStartDate,
          endDate: customEndDate 
        };
      }
      
      // Add time range parameters - use preset if available, otherwise use hours
      if (timeOfDayFilter && timeOfDayFilter !== 'custom') {
        // Send the named preset as the source of truth
        params.timePreset = timeOfDayFilter;
      } else {
        // Custom time range - fall back to direct hour values
        params.startHour = startHour;
        params.endHour = endHour;
      }
      
      // Make API request with filter parameters
      const filteredResponse = await apiRequest({
        path: `/api/reports/filtered`,
        method: 'GET',
        params
      });
      
      // Update state with filtered data
      setFilteredData(filteredResponse);
      
      // Determine what to show in toast message
      let filterDescription = "Dashboard data has been filtered by the selected date range";
      
      if (timeOfDayFilter !== 'all') {
        filterDescription += ` and time of day (${startHour}:00 - ${endHour}:00)`;
      }
      
      toast({
        title: "Filter Applied",
        description: filterDescription,
      });
    } catch (error) {
      console.error("Error applying filter:", error);
      toast({
        title: "Filter Failed",
        description: "There was a problem applying the filter",
        variant: "destructive"
      });
    } finally {
      setIsApplyingFilter(false);
    }
  }, [dashboardPeriod, customStartDate, customEndDate, startHour, endHour, timeOfDayFilter, toast]);

  // Clear applied filters
  const clearDateFilter = useCallback(async () => {
    setDashboardPeriod('month');
    setCustomStartDate('');
    setCustomEndDate('');
    setTimeOfDayFilter('all');
    setStartHour(0);
    setEndHour(23);
    
    // Reset filter UI but also fetch default dashboard data
    try {
      const today = new Date();
      const monthAgo = new Date();
      monthAgo.setMonth(today.getMonth() - 1);
      
      // Clear filtered data first
      setFilteredData(null);
      
      toast({
        title: "Filter Cleared",
        description: "Showing all data without filters"
      });
      
      // Refresh data to ensure we have the complete dataset
      refreshAllData();
    } catch (error) {
      console.error("Error resetting dashboard:", error);
      toast({
        title: "Error",
        description: "Failed to reset dashboard data",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Refresh functionality
  const refreshAllData = async () => {
    setIsRefreshing(true);
    try {
      console.log("Refreshing all dashboard data...");
      // Invalidate all queries to force refetch
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/stations"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/games"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/users/customers"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/station-categories"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/bookings"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/reports/daily"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/reports/revenue/weekly"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/reports/popular-games"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/reports/station-utilization"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/reports/customer-activity"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/reports/payment-methods"] }),
        // New advanced analytics endpoints
        queryClient.invalidateQueries({ queryKey: ["/api/reports/hourly-distribution"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/reports/customer-retention"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/reports/station-heatmap"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/reports/game-performance"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/reports/revenue-breakdown"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/reports/loyalty-analytics"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/reports/comparative-analysis"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/reports/predictive-analytics"] })
      ]);
      
      toast({
        title: "Data refreshed",
        description: "All dashboard data has been updated from the database."
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast({
        title: "Refresh failed",
        description: "There was a problem updating the dashboard data.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Derived statistics for fallback data
  const activeStations = stations.filter((station) => station.currentCustomer).length;
  const completedTransactions = transactions.filter((tx) => tx.paymentStatus === "completed" || tx.status === "completed");
  const pendingTransactions = transactions.filter((tx) => tx.paymentStatus === "pending" || tx.status === "pending");
  
  // Client-side calculated stats (used only as fallback when API data is not available)
  const clientTodayRevenue = completedTransactions
    .filter((tx) => new Date(tx.createdAt).toDateString() === new Date().toDateString())
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const pendingAmount = pendingTransactions.reduce((acc, tx) => acc + Number(tx.amount), 0);
  const clientTotalRevenue = completedTransactions.reduce((acc, tx) => acc + Number(tx.amount), 0);
  
  const clientNewCustomers = customers.filter(
    (c) => new Date(c.createdAt).toDateString() === new Date().toDateString()
  ).length;
  
  // Use API data where available
  const todayRevenue = dailyStats?.totalRevenue || clientTodayRevenue;
  const totalRevenue = customerActivity?.totalRevenue || clientTotalRevenue;
  const newCustomers = customerActivity?.newCustomers || clientNewCustomers;
  const totalSessions = customerActivity?.totalSessions || completedTransactions.length;

  // Chart data
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  // Use API data if available, otherwise calculate from transactions
  const revenueChartData = Array.isArray(revenueByTimeFrame) && revenueByTimeFrame.length > 0 ? 
    // Use the API data directly
    revenueByTimeFrame.map(item => ({
      date: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
      amount: Number(item.amount)
    })) :
    // Fallback to calculated data
    Array.from({ length: 7 }).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      const dayTransactions = transactions.filter(tx => 
        new Date(tx.createdAt).toDateString() === date.toDateString() && 
        tx.paymentStatus === "completed"
      );
      
      const amount = dayTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
      
      return {
        date: dateStr,
        amount: amount
      };
    }).reverse();

  // Use payment method stats from API if available, otherwise generate from transactions
  const paymentMethodChartData = paymentMethodStats.length > 0 
    ? [
        { name: 'Cash', value: paymentMethodStats.find(p => p.method === 'cash')?.count || 0 },
        { name: 'M-Pesa', value: paymentMethodStats.find(p => p.method === 'mpesa')?.count || 0 },
        { name: 'Airtel', value: paymentMethodStats.find(p => p.method === 'airtel')?.count || 0 },
        { name: 'Card', value: paymentMethodStats.find(p => p.method === 'card')?.count || 0 },
        { name: 'QR Code', value: paymentMethodStats.find(p => p.method === 'qr' || p.method === 'qr-mpesa')?.count || 0 },
      ].filter(item => item.value > 0)
    : [
        { name: 'Cash', value: completedTransactions.filter(tx => !tx.mpesaRef || tx.paymentMethod === 'cash').length },
        { name: 'M-Pesa', value: completedTransactions.filter(tx => 
          (tx.mpesaRef && !tx.mpesaRef.startsWith('QR-') && !tx.mpesaRef.startsWith('SIM-AIRTEL-') && !tx.mpesaRef.startsWith('AR-')) || 
          tx.paymentMethod === 'mpesa'
        ).length },
        { name: 'Airtel', value: completedTransactions.filter(tx => 
          (tx.mpesaRef && (tx.mpesaRef.startsWith('SIM-AIRTEL-') || tx.mpesaRef.startsWith('AR-'))) || 
          tx.paymentMethod === 'airtel'
        ).length },
        { name: 'QR Code', value: completedTransactions.filter(tx => 
          (tx.mpesaRef && tx.mpesaRef.startsWith('QR-')) || 
          tx.paymentMethod === 'qr' || 
          tx.paymentMethod === 'qr-mpesa'
        ).length },
      ].filter(item => item.value > 0);

  // Use API data for popular games if available, otherwise calculate from transactions
  const popularGamesData = popularGamesStats.length > 0 
    ? popularGamesStats.map(game => ({ 
        name: game.name, 
        count: game.sessions, // API now returns sessions directly
        revenue: game.revenue 
      }))
    : Object.entries(
        completedTransactions.reduce((acc, tx) => {
          const game = tx.gameName;
          if (!game) return acc;
          if (!acc[game]) acc[game] = 0;
          acc[game]++;
          return acc;
        }, {})
      )
      .map(([name, count]) => ({ name, count, revenue: 0 }))
      .sort((a, b) => (b.count as number) - (a.count as number))
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
  
  // Handle viewing transaction history for a station
  const handleViewTransactionHistory = (station: any) => {
    if (!station) return;
    
    setSelectedStation(station);
    setShowTransactionHistoryDialog(true);
  };
  
  // Category Management Handlers
  const handleAddCategory = async () => {
    if (!newCategoryName) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const hourlyRate = newCategoryHourlyRate 
        ? parseFloat(newCategoryHourlyRate) 
        : null;
      
      const peakHourRate = newCategoryPeakHourRate 
        ? parseFloat(newCategoryPeakHourRate) 
        : null;
      
      const offPeakRate = newCategoryOffPeakRate 
        ? parseFloat(newCategoryOffPeakRate) 
        : null;
      
      const weekendRate = newCategoryWeekendRate 
        ? parseFloat(newCategoryWeekendRate) 
        : null;
      
      await apiRequest({
        path: "/api/station-categories",
        method: "POST",
        data: {
          name: newCategoryName,
          type: newCategoryType,
          hourlyRate,
          peakHourRate,
          offPeakRate,
          weekendRate,
          description: newCategoryDescription,
          color: newCategoryColor,
          icon: newCategoryIcon
        }
      });
      
      toast({
        title: "Success",
        description: `Category "${newCategoryName}" has been added successfully`,
        variant: "success"
      });
      
      // Reset form and refresh data
      setNewCategoryName("");
      setNewCategoryType("standard");
      setNewCategoryHourlyRate("");
      setNewCategoryPeakHourRate("");
      setNewCategoryOffPeakRate("");
      setNewCategoryWeekendRate("");
      setNewCategoryDescription("");
      setShowAddCategoryDialog(false);
      
      // Refresh categories data
      queryClient.invalidateQueries({ queryKey: ["/api/station-categories"] });
    } catch (error) {
      console.error("Error adding category:", error);
      toast({
        title: "Error",
        description: "Failed to add category. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Function to open edit category dialog
  const handleEditCategoryClick = (category: StationCategory) => {
    setEditCategoryId(category.id);
    setEditCategoryName(category.name);
    setEditCategoryType(category.type);
    setEditCategoryHourlyRate(category.hourlyRate ? category.hourlyRate.toString() : "");
    setEditCategoryPeakHourRate(category.peakHourRate ? category.peakHourRate.toString() : "");
    setEditCategoryOffPeakRate(category.offPeakRate ? category.offPeakRate.toString() : "");
    setEditCategoryWeekendRate(category.weekendRate ? category.weekendRate.toString() : "");
    setEditCategoryDescription(category.description || "");
    setEditCategoryColor(category.color || "#6366F1");
    setEditCategoryIcon(category.icon || "gamepad");
    setShowEditCategoryDialog(true);
  };
  
  // Function to update category
  const handleUpdateCategory = async () => {
    if (!editCategoryId || !editCategoryName) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const hourlyRate = editCategoryHourlyRate 
        ? parseFloat(editCategoryHourlyRate) 
        : null;
      
      const peakHourRate = editCategoryPeakHourRate 
        ? parseFloat(editCategoryPeakHourRate) 
        : null;
      
      const offPeakRate = editCategoryOffPeakRate 
        ? parseFloat(editCategoryOffPeakRate) 
        : null;
      
      const weekendRate = editCategoryWeekendRate 
        ? parseFloat(editCategoryWeekendRate) 
        : null;
      
      await apiRequest({
        path: `/api/station-categories/${editCategoryId}`,
        method: "PATCH",
        data: {
          name: editCategoryName,
          type: editCategoryType,
          hourlyRate,
          peakHourRate,
          offPeakRate,
          weekendRate,
          description: editCategoryDescription,
          color: editCategoryColor,
          icon: editCategoryIcon
        }
      });
      
      toast({
        title: "Success",
        description: `Category "${editCategoryName}" has been updated successfully`,
        variant: "success"
      });
      
      // Close dialog and refresh data
      setShowEditCategoryDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/station-categories"] });
    } catch (error) {
      console.error("Error updating category:", error);
      toast({
        title: "Error",
        description: "Failed to update category. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Function to confirm delete category
  const handleDeleteCategoryClick = (categoryId: number) => {
    setCategoryToDelete(categoryId);
    setConfirmDeleteCategoryDialog(true);
  };
  
  // Function to delete category
  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    
    try {
      await apiRequest({
        path: `/api/station-categories/${categoryToDelete}`,
        method: "DELETE"
      });
      
      toast({
        title: "Success",
        description: "Category has been deleted successfully",
        variant: "success"
      });
      
      // Close dialog and refresh data
      setConfirmDeleteCategoryDialog(false);
      setCategoryToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["/api/station-categories"] });
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        title: "Error",
        description: "Failed to delete category. It may be in use by one or more stations.",
        variant: "destructive"
      });
    }
  };

  // Report generation handlers
  const handleGenerateReport = async (type: string, format: string) => {
    try {
      setIsGeneratingReport(true);
      
      // Construct the report URL
      const reportUrl = `/api/export/report/${type}/${format}`;
      
      // Open in a new window to trigger download
      window.open(reportUrl, '_blank');
      
      toast({
        title: "Report Generated",
        description: `Your ${type} report has been generated in ${format.toUpperCase()} format.`
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Generation Failed",
        description: "There was a problem generating the report.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };
  
  // Function to generate custom report
  const handleGenerateCustomReport = async () => {
    try {
      setIsGeneratingReport(true);
      
      if (!reportType || !reportFormat) {
        toast({
          title: "Missing Information",
          description: "Please select a report type and format.",
          variant: "destructive"
        });
        return;
      }
      
      // Validate time range if provided
      if (reportStartHour > reportEndHour) {
        toast({
          title: "Invalid Time Range",
          description: "Start hour must be before or equal to end hour",
          variant: "destructive"
        });
        return;
      }
      
      // Build the URL with query parameters
      let reportUrl = `/api/export/report/${reportType}/${reportFormat}`;
      
      // Add date range and time of day parameters
      const params = new URLSearchParams();
      
      // Date filtering
      if (reportStartDate) {
        params.append('startDate', reportStartDate);
      }
      if (reportEndDate) {
        params.append('endDate', reportEndDate);
      }
      
      // Time-of-day filtering - use preset if available, otherwise use hours
      if (timePreset && timePreset !== 'custom') {
        params.append('timePreset', timePreset);
      } else {
        // Custom time range
        params.append('startHour', reportStartHour.toString());
        params.append('endHour', reportEndHour.toString());
      }
      
      // Append parameters to URL if any were provided
      if (params.toString()) {
        reportUrl += `?${params.toString()}`;
      }
      
      // Open in a new window to trigger download
      window.open(reportUrl, '_blank');
      
      // Construct descriptive message including time filtering
      let timeDescription = '';
      if (timePreset === 'morning') {
        timeDescription = ' for morning hours (06:00-11:59)';
      } else if (timePreset === 'afternoon') {
        timeDescription = ' for afternoon hours (12:00-17:59)';
      } else if (timePreset === 'evening') {
        timeDescription = ' for evening hours (18:00-23:59)';
      } else if (reportStartHour !== 0 || reportEndHour !== 23) {
        timeDescription = ` for hours ${reportStartHour}:00-${reportEndHour}:59`;
      }
      
      toast({
        title: "Custom Report Generated",
        description: `Your custom ${reportType} report${timeDescription} has been generated in ${reportFormat.toUpperCase()} format.`
      });
    } catch (error) {
      console.error("Error generating custom report:", error);
      toast({
        title: "Generation Failed",
        description: "There was a problem generating the custom report.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingReport(false);
    }
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
      // Simpler approach: Only send the name to update
      await apiRequest({
        path: `/api/stations/${editStationId}`,
        method: "PATCH",
        data: {
          name: editStationName
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

        <div className="flex-1 p-2 sm:p-4 md:p-6 backdrop-blur-sm bg-black/50 overflow-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <div className="mb-4 border-b border-gray-800">
              <TabsList className="w-full flex overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
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
            </div>
            
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
            
            {/* Overview Tab */}
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
                        {customerActivity?.newCustomers || clientNewCustomers}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {customerActivity?.returningCustomers || (customerActivity?.totalCustomers ? customerActivity.totalCustomers - customerActivity.newCustomers : 0)} returning customers
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
                            <TableHead>Revenue</TableHead>
                            <TableHead>Popularity</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {popularGamesData.map((game) => (
                            <TableRow key={game.name}>
                              <TableCell>{game.name}</TableCell>
                              <TableCell>{game.count}</TableCell>
                              <TableCell>KES {game.revenue?.toLocaleString() || '0'}</TableCell>
                              <TableCell>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                  <div
                                    className="bg-primary rounded-full h-2"
                                    style={{ width: `${((game.count as number) / ((popularGamesData[0]?.count as number) || 1)) * 100}%` }}
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
            <TabsContent value="analytics" className="max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
              <div className="space-y-6">
                {/* Analytics Header with Tabs */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold">Advanced Analytics</h2>
                    <p className="text-muted-foreground">Comprehensive business intelligence dashboard</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={refreshAllData}
                      disabled={isRefreshing}
                      className="flex items-center gap-1"
                    >
                      <RefreshCwIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                      Refresh Data
                    </Button>
                    <Select 
                      value={comparePeriod} 
                      onValueChange={(value) => setComparePeriod(value)}
                    >
                      <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {/* Time Period Filter */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                          <CalendarIcon className="h-4 w-4" />
                          Filter Period
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="grid gap-4">
                          <div className="space-y-2">
                            <h4 className="font-medium leading-none">Date Range</h4>
                            <p className="text-sm text-muted-foreground">
                              Select a predefined period or custom date range
                            </p>
                          </div>
                          <div className="grid gap-2">
                            <div className="grid grid-cols-3 gap-2">
                              <Button 
                                variant={dashboardPeriod === 'day' ? 'default' : 'outline'} 
                                size="sm"
                                onClick={() => setDashboardPeriod('day')}
                              >
                                Today
                              </Button>
                              <Button 
                                variant={dashboardPeriod === 'week' ? 'default' : 'outline'} 
                                size="sm"
                                onClick={() => setDashboardPeriod('week')}
                              >
                                This Week
                              </Button>
                              <Button 
                                variant={dashboardPeriod === 'month' ? 'default' : 'outline'} 
                                size="sm"
                                onClick={() => setDashboardPeriod('month')}
                              >
                                This Month
                              </Button>
                            </div>
                            <Separator />
                            <div className="grid gap-2">
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <Label htmlFor="customStartDate">Start Date</Label>
                                  <Input
                                    id="customStartDate"
                                    type="date"
                                    value={customStartDate}
                                    onChange={(e) => setCustomStartDate(e.target.value)}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label htmlFor="customEndDate">End Date</Label>
                                  <Input
                                    id="customEndDate"
                                    type="date"
                                    value={customEndDate}
                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                  />
                                </div>
                              </div>
                              <Button 
                                variant={dashboardPeriod === 'custom' ? 'default' : 'outline'} 
                                size="sm"
                                onClick={() => setDashboardPeriod('custom')}
                              >
                                Custom Range
                              </Button>
                            </div>
                            
                            <Separator className="my-2" />
                            
                            <div className="space-y-2">
                              <h4 className="font-medium leading-none">Time of Day</h4>
                              <p className="text-sm text-muted-foreground">
                                Filter data by specific hours
                              </p>
                              
                              <div className="grid grid-cols-4 gap-2 mt-2">
                                <Button 
                                  variant={timeOfDayFilter === 'all' ? 'default' : 'outline'} 
                                  size="sm"
                                  onClick={() => {
                                    setTimeOfDayFilter('all');
                                    // Set the hour ranges that correspond to 'all'
                                    setStartHour(0);
                                    setEndHour(23);
                                  }}
                                >
                                  All Day
                                </Button>
                                <Button 
                                  variant={timeOfDayFilter === 'morning' ? 'default' : 'outline'} 
                                  size="sm"
                                  onClick={() => {
                                    setTimeOfDayFilter('morning');
                                    // Set the hour ranges that correspond to 'morning'
                                    setStartHour(6);
                                    setEndHour(11);
                                  }}
                                >
                                  Morning
                                </Button>
                                <Button 
                                  variant={timeOfDayFilter === 'afternoon' ? 'default' : 'outline'} 
                                  size="sm"
                                  onClick={() => {
                                    setTimeOfDayFilter('afternoon');
                                    // Set the hour ranges that correspond to 'afternoon'
                                    setStartHour(12);
                                    setEndHour(17);
                                  }}
                                >
                                  Afternoon
                                </Button>
                                <Button 
                                  variant={timeOfDayFilter === 'evening' ? 'default' : 'outline'} 
                                  size="sm"
                                  onClick={() => {
                                    setTimeOfDayFilter('evening');
                                    // Set the hour ranges that correspond to 'evening'
                                    setStartHour(18);
                                    setEndHour(23);
                                  }}
                                >
                                  Evening
                                </Button>
                              </div>
                              
                              <div className="space-y-1 mt-2">
                                <div className="flex justify-between">
                                  <Label htmlFor="customTimeRange">Custom Time Range: {startHour}:00 - {endHour}:00</Label>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <Label htmlFor="startHour">Start Hour</Label>
                                    <Select
                                      value={startHour.toString()}
                                      onValueChange={(value) => {
                                        setTimeOfDayFilter('custom');
                                        setStartHour(parseInt(value));
                                      }}
                                    >
                                      <SelectTrigger id="startHour">
                                        <SelectValue placeholder="Start hour" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {Array.from({ length: 24 }).map((_, i) => (
                                          <SelectItem key={`start-${i}`} value={i.toString()}>
                                            {i}:00
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-1">
                                    <Label htmlFor="endHour">End Hour</Label>
                                    <Select
                                      value={endHour.toString()}
                                      onValueChange={(value) => {
                                        setTimeOfDayFilter('custom');
                                        setEndHour(parseInt(value));
                                      }}
                                    >
                                      <SelectTrigger id="endHour">
                                        <SelectValue placeholder="End hour" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {Array.from({ length: 24 }).map((_, i) => (
                                          <SelectItem key={`end-${i}`} value={i.toString()}>
                                            {i}:00
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <Button 
                              onClick={applyDateFilter} 
                              disabled={isApplyingFilter}
                              className="w-full mt-4"
                            >
                              Apply Filter
                              {isApplyingFilter && <Loader2Icon className="ml-2 h-4 w-4 animate-spin" />}
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                    
                    {/* Active Filter Indicator */}
                    {filteredData && (
                      <div className="flex gap-2 items-center">
                        <Badge variant="outline" className="gap-1 px-2 py-1">
                          <CalendarIcon className="h-3 w-3" />
                          <span>Date: {filteredData?.dateRange?.startDate} to {filteredData?.dateRange?.endDate}</span>
                        </Badge>
                        <Badge variant="outline" className="gap-1 px-2 py-1">
                          <ClockIcon className="h-3 w-3" />
                          <span>Time: {filteredData?.timeRange?.startHour}:00 to {filteredData?.timeRange?.endHour}:00</span>
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5 rounded-full p-0" 
                          onClick={clearDateFilter}
                        >
                          <X className="h-3 w-3" />
                          <span className="sr-only">Clear filter</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Key Performance Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-black/30 border-primary/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <DollarSignIcon className="h-5 w-5 text-primary" />
                        Total Revenue
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col gap-1">
                        <p className="text-3xl font-bold">KES {dailyStats?.totalRevenue || 0}</p>
                        <div className="flex items-center gap-2 text-sm">
                          {comparativeAnalysis?.changes?.revenue > 0 ? (
                            <Badge variant="success" className="flex items-center gap-1">
                              <ActivityIcon className="h-3 w-3" />
                              +{comparativeAnalysis?.changes?.revenue || 0}%
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <ActivityIcon className="h-3 w-3" />
                              {comparativeAnalysis?.changes?.revenue || 0}%
                            </Badge>
                          )}
                          <span className="text-muted-foreground">vs previous {comparePeriod}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-black/30 border-primary/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <GamepadIcon className="h-5 w-5 text-primary" />
                        Completed Sessions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col gap-1">
                        <p className="text-3xl font-bold">{dailyStats?.completedSessions || 0}</p>
                        <div className="flex items-center gap-2 text-sm">
                          {comparativeAnalysis?.changes?.sessions > 0 ? (
                            <Badge variant="success" className="flex items-center gap-1">
                              <ActivityIcon className="h-3 w-3" />
                              +{comparativeAnalysis?.changes?.sessions || 0}%
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <ActivityIcon className="h-3 w-3" />
                              {comparativeAnalysis?.changes?.sessions || 0}%
                            </Badge>
                          )}
                          <span className="text-muted-foreground">vs previous {comparePeriod}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-black/30 border-primary/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <UsersIcon className="h-5 w-5 text-primary" />
                        Active Customers
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col gap-1">
                        <p className="text-3xl font-bold">{customerActivity?.returningCustomers || 0}</p>
                        <div className="flex items-center gap-2 text-sm">
                          {comparativeAnalysis?.changes?.customerRetention > 0 ? (
                            <Badge variant="success" className="flex items-center gap-1">
                              <ActivityIcon className="h-3 w-3" />
                              +{comparativeAnalysis?.changes?.customerRetention || 0}%
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <ActivityIcon className="h-3 w-3" />
                              {comparativeAnalysis?.changes?.customerRetention || 0}%
                            </Badge>
                          )}
                          <span className="text-muted-foreground">retention rate</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-black/30 border-primary/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <TrophyIcon className="h-5 w-5 text-primary" />
                        Average Revenue
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col gap-1">
                        <p className="text-3xl font-bold">KES {dailyStats?.averageRevenue || 0}</p>
                        <div className="flex items-center gap-2 text-sm">
                          {comparativeAnalysis?.changes?.averageRevenue > 0 ? (
                            <Badge variant="success" className="flex items-center gap-1">
                              <ActivityIcon className="h-3 w-3" />
                              +{comparativeAnalysis?.changes?.averageRevenue || 0}%
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <ActivityIcon className="h-3 w-3" />
                              {comparativeAnalysis?.changes?.averageRevenue || 0}%
                            </Badge>
                          )}
                          <span className="text-muted-foreground">per session</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Revenue & Predictive Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="bg-black/30 border-primary/20 lg:col-span-2">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2">
                        <BarChart2Icon className="h-5 w-5 text-primary" />
                        Revenue Trends
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={revenueChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                          <XAxis dataKey="date" stroke="#888" />
                          <YAxis stroke="#888" />
                          <Tooltip contentStyle={{ backgroundColor: '#222', borderColor: '#444' }} />
                          <Legend />
                          <Bar dataKey="amount" name="Revenue (KES)" fill="hsl(var(--primary))" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="bg-black/30 border-primary/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2">
                        <LineChartIcon className="h-5 w-5 text-primary" />
                        Revenue Forecast
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={predictiveAnalytics?.forecast || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                          <XAxis dataKey="day" stroke="#888" />
                          <YAxis stroke="#888" />
                          <Tooltip contentStyle={{ backgroundColor: '#222', borderColor: '#444' }} />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="predicted" 
                            name="Forecast (KES)" 
                            stroke="hsl(var(--primary))" 
                            activeDot={{ r: 8 }} 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="actual" 
                            name="Actual (KES)" 
                            stroke="#10b981" 
                            strokeDasharray="5 5" 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                      <div className="mt-3 border-t border-border pt-3">
                        <h4 className="font-semibold mb-1">Next Week Forecast</h4>
                        <div className="flex items-center justify-between">
                          <p>Projected Revenue</p>
                          <p className="font-bold text-primary">KES {predictiveAnalytics?.nextWeekTotal || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Customer Retention & Station Heatmap */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-black/30 border-primary/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2">
                        <UsersRoundIcon className="h-5 w-5 text-primary" />
                        Customer Retention
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex flex-col items-center justify-center p-3 bg-black/20 rounded-lg">
                          <p className="text-sm text-muted-foreground">New Customers</p>
                          <p className="text-3xl font-bold">{customerActivity?.newCustomers || 0}</p>
                          <p className="text-xs text-muted-foreground">Last 30 days</p>
                        </div>
                        <div className="flex flex-col items-center justify-center p-3 bg-black/20 rounded-lg">
                          <p className="text-sm text-muted-foreground">Return Rate</p>
                          <p className="text-3xl font-bold">{customerActivity?.returnRate || 0}%</p>
                          <p className="text-xs text-muted-foreground">Customer loyalty</p>
                        </div>
                      </div>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Returning', value: customerActivity?.returningCustomers || 0 },
                              { name: 'New', value: customerActivity?.newCustomers || 0 }
                            ]}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            innerRadius={60}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            <Cell fill="hsl(var(--primary))" />
                            <Cell fill="#10b981" />
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#222', borderColor: '#444' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="bg-black/30 border-primary/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2">
                        <TrelloIcon className="h-5 w-5 text-primary" />
                        Station Usage Heatmap
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                          <div key={day} className="text-center text-xs text-muted-foreground">{day}</div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {stationHeatmap.map((cell, idx) => {
                          const intensity = cell.value > 0 
                            ? Math.min(100, Math.max(20, cell.value * 5)) 
                            : 0;
                          
                          return (
                            <div 
                              key={`heatmap-cell-${idx}`}
                              className="aspect-square rounded-sm flex items-center justify-center text-xs"
                              style={{ 
                                backgroundColor: `hsla(var(--primary), ${intensity}%)`,
                                position: 'relative'
                              }}
                              title={`${cell.day} at ${cell.hour}:00 - ${cell.value} sessions`}
                            >
                              {cell.value > 0 && cell.value}
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-between items-center mt-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-sm bg-primary/20"></div>
                          <span className="text-xs text-muted-foreground">Low</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-sm bg-primary/50"></div>
                          <span className="text-xs text-muted-foreground">Medium</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-sm bg-primary/90"></div>
                          <span className="text-xs text-muted-foreground">High</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Game Performance & Revenue Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-black/30 border-primary/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2">
                        <PackageIcon className="h-5 w-5 text-primary" />
                        Game Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[300px] pr-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Game</TableHead>
                              <TableHead>Sessions</TableHead>
                              <TableHead>Revenue</TableHead>
                              <TableHead>Engagement</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {gamePerformance.map((game) => (
                              <TableRow key={`game-perf-${game.name}`}>
                                <TableCell className="font-medium">{game.name}</TableCell>
                                <TableCell>{game.sessions}</TableCell>
                                <TableCell>KES {game.revenue}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Progress value={game.engagement} className="h-2" />
                                    <span className="text-xs">{game.engagement}%</span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  <Card className="bg-black/30 border-primary/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2">
                        <DollarSignIcon className="h-5 w-5 text-primary" />
                        Revenue Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={revenueBreakdown?.categories || []}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {revenueBreakdown?.categories?.map((entry, index) => (
                              <Cell 
                                key={`revenue-cell-${index}`} 
                                fill={index === 0 
                                  ? 'hsl(var(--primary))' 
                                  : index === 1 
                                    ? '#10b981' 
                                    : index === 2 
                                      ? '#f59e0b' 
                                      : '#6366f1'
                                } 
                              />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#222', borderColor: '#444' }} 
                            formatter={(value) => [`KES ${value}`, 'Revenue']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Loyalty Analytics & Payment Methods */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-black/30 border-primary/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2">
                        <BadgePercentIcon className="h-5 w-5 text-primary" />
                        Loyalty Program Analytics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                        {loyaltyAnalytics?.segments?.map((segment) => (
                          <div key={segment.name} className="flex flex-col items-center justify-center p-2 bg-black/20 rounded-lg">
                            <p className="text-xs text-muted-foreground">{segment.name}</p>
                            <p className="text-lg font-bold">{segment.count}</p>
                            <p className="text-xs text-muted-foreground">customers</p>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Top Customers by Points</h4>
                        <ScrollArea className="h-[150px]">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead>Points</TableHead>
                                <TableHead>Visits</TableHead>
                                <TableHead>Value</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {loyaltyAnalytics?.topCustomers?.map((customer) => (
                                <TableRow key={customer.id}>
                                  <TableCell className="font-medium">{customer.name}</TableCell>
                                  <TableCell>{customer.points}</TableCell>
                                  <TableCell>{customer.visits}</TableCell>
                                  <TableCell>KES {customer.totalSpent}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </ScrollArea>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-black/30 border-primary/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2">
                        <TagIcon className="h-5 w-5 text-primary" />
                        Payment Methods
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Cash', value: paymentMethodStats.cash || 0 },
                              { name: 'M-Pesa', value: paymentMethodStats.mpesa || 0 },
                              { name: 'Airtel', value: paymentMethodStats.airtel || 0 },
                              { name: 'Card', value: paymentMethodStats.card || 0 },
                              { name: 'QR', value: paymentMethodStats.qr || 0 }
                            ]}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            <Cell key="payment-cell-0" fill="hsl(var(--primary))" />
                            <Cell key="payment-cell-1" fill="#10b981" />
                            <Cell key="payment-cell-2" fill="#f59e0b" />
                            <Cell key="payment-cell-3" fill="#6366f1" />
                            <Cell key="payment-cell-4" fill="#ec4899" />
                          </Pie>
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#222', borderColor: '#444' }} 
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Hourly Distribution */}
                <Card className="bg-black/30 border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2">
                      <ClockIcon className="h-5 w-5 text-primary" />
                      Hourly Traffic Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={hourlyDistribution}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                        <XAxis 
                          dataKey="hour" 
                          stroke="#888"
                          tickFormatter={(hour) => `${hour}:00`} 
                        />
                        <YAxis stroke="#888" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#222', borderColor: '#444' }}
                          formatter={(value, name) => [name === 'count' ? value : `KES ${value}`, name === 'count' ? 'Sessions' : 'Revenue']}
                          labelFormatter={(hour) => `${hour}:00 - ${hour+1}:00`}
                        />
                        <Legend />
                        <Bar dataKey="count" name="Sessions" fill="hsl(var(--primary))" />
                        <Bar dataKey="revenue" name="Revenue (KES)" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
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
                      <Button 
                        className="flex items-center justify-between w-full"
                        onClick={() => handleGenerateReport('revenue', 'pdf')}
                        disabled={isGeneratingReport}
                      >
                        <span>Revenue Report</span>
                        <DownloadIcon className="h-4 w-4" />
                      </Button>
                      <Button 
                        className="flex items-center justify-between w-full"
                        onClick={() => handleGenerateReport('customers', 'pdf')}
                        disabled={isGeneratingReport}
                      >
                        <span>Customer Activity</span>
                        <DownloadIcon className="h-4 w-4" />
                      </Button>
                      <Button 
                        className="flex items-center justify-between w-full"
                        onClick={() => handleGenerateReport('usage', 'pdf')}
                        disabled={isGeneratingReport}
                      >
                        <span>Station Usage</span>
                        <DownloadIcon className="h-4 w-4" />
                      </Button>
                      <Button 
                        className="flex items-center justify-between w-full"
                        onClick={() => handleGenerateReport('games', 'pdf')}
                        disabled={isGeneratingReport}
                      >
                        <span>Game Popularity</span>
                        <DownloadIcon className="h-4 w-4" />
                      </Button>
                      <Button 
                        className="flex items-center justify-between w-full"
                        onClick={() => handleGenerateReport('inventory', 'pdf')}
                        disabled={isGeneratingReport}
                      >
                        <span>Inventory Status</span>
                        <DownloadIcon className="h-4 w-4" />
                      </Button>
                      <Button 
                        className="flex items-center justify-between w-full"
                        onClick={() => handleGenerateReport('financial', 'pdf')}
                        disabled={isGeneratingReport}
                      >
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
                        <Input 
                          type="date" 
                          value={reportStartDate}
                          onChange={(e) => setReportStartDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input 
                          type="date" 
                          value={reportEndDate}
                          onChange={(e) => setReportEndDate(e.target.value)}
                        />
                      </div>
                      
                      {/* Time of day filtering */}
                      <div className="space-y-2">
                        <Label>Start Hour</Label>
                        <Select 
                          value={reportStartHour?.toString() || "0"}
                          onValueChange={(value) => setReportStartHour(parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select start hour" />
                          </SelectTrigger>
                          <SelectContent className="bg-black/90">
                            {Array.from({length: 24}, (_, i) => (
                              <SelectItem key={`start-hour-${i}`} value={i.toString()}>
                                {i.toString().padStart(2, '0')}:00
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>End Hour</Label>
                        <Select 
                          value={reportEndHour?.toString() || "23"}
                          onValueChange={(value) => setReportEndHour(parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select end hour" />
                          </SelectTrigger>
                          <SelectContent className="bg-black/90">
                            {Array.from({length: 24}, (_, i) => (
                              <SelectItem key={`end-hour-${i}`} value={i.toString()}>
                                {i.toString().padStart(2, '0')}:00
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Time Preset</Label>
                        <Select 
                          value={timePreset || "all"}
                          onValueChange={(value) => {
                            setTimePreset(value);
                            // Set hours based on preset
                            if (value === "morning") {
                              setReportStartHour(6);
                              setReportEndHour(11);
                            } else if (value === "afternoon") {
                              setReportStartHour(12);
                              setReportEndHour(17);
                            } else if (value === "evening") {
                              setReportStartHour(18);
                              setReportEndHour(23);
                            } else if (value === "all") {
                              setReportStartHour(0);
                              setReportEndHour(23);
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select time preset" />
                          </SelectTrigger>
                          <SelectContent className="bg-black/90">
                            <SelectItem value="all">All Day (00:00-23:59)</SelectItem>
                            <SelectItem value="morning">Morning (06:00-11:59)</SelectItem>
                            <SelectItem value="afternoon">Afternoon (12:00-17:59)</SelectItem>
                            <SelectItem value="evening">Evening (18:00-23:59)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Report Type</Label>
                        <Select 
                          value={reportType}
                          onValueChange={(value) => setReportType(value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select report type" />
                          </SelectTrigger>
                          <SelectContent className="bg-black/90">
                            <SelectItem value="revenue">Revenue</SelectItem>
                            <SelectItem value="usage">Station Usage</SelectItem>
                            <SelectItem value="games">Game Popularity</SelectItem>
                            <SelectItem value="customers">Customer Activity</SelectItem>
                            <SelectItem value="inventory">Inventory Status</SelectItem>
                            <SelectItem value="financial">Financial Summary</SelectItem>
                            {/* New advanced report types */}
                            <SelectItem value="loyalty">Loyalty Program</SelectItem>
                            <SelectItem value="hourly">Hourly Distribution</SelectItem>
                            <SelectItem value="comparative">Comparative Analysis</SelectItem>
                            <SelectItem value="predictive">Predictive Analytics</SelectItem>
                            <SelectItem value="segmentation">Customer Segmentation</SelectItem>
                            <SelectItem value="heatmap">Usage Heatmap</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Format</Label>
                        <Select 
                          value={reportFormat}
                          onValueChange={(value) => setReportFormat(value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select format" />
                          </SelectTrigger>
                          <SelectContent className="bg-black/90">
                            <SelectItem value="csv">CSV</SelectItem>
                            <SelectItem value="pdf">PDF</SelectItem>
                            <SelectItem value="excel">Excel</SelectItem>
                            <SelectItem value="json">JSON</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button 
                      className="w-full md:w-auto"
                      onClick={handleGenerateCustomReport}
                      disabled={isGeneratingReport}
                    >
                      {isGeneratingReport ? (
                        <>
                          <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        "Generate Custom Report"
                      )}
                    </Button>
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
              
              {/* Station Tabs */}
              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="bg-black/20 p-1">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="active">Active Sessions</TabsTrigger>
                  <TabsTrigger value="available">Available Stations</TabsTrigger>
                  <TabsTrigger value="analytics">Station Analytics</TabsTrigger>
                  <TabsTrigger value="categories">Categories</TabsTrigger>
                </TabsList>
                
                {/* Overview Tab - Shows all stations */}
                <TabsContent value="overview">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {stations.map((station) => (
                      <Card key={station.id} className={`bg-black/30 border-2 ${station.currentCustomer ? 'border-green-500' : 'border-primary/20'}`}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-base">{station.name}</CardTitle>
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
                </TabsContent>
                
                {/* Active Sessions Tab - Shows only stations with active sessions */}
                <TabsContent value="active">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {stations.filter(station => station.currentCustomer).length === 0 ? (
                      <Card className="col-span-full bg-black/30 border-primary/20 p-6">
                        <div className="text-center text-gray-400">
                          <p>No active gaming sessions at the moment</p>
                        </div>
                      </Card>
                    ) : (
                      stations.filter(station => station.currentCustomer).map((station) => (
                        <Card key={station.id} className="bg-black/30 border-2 border-green-500">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-base">{station.name}</CardTitle>
                              <Badge variant="success">Active</Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
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
                          </CardContent>
                          <CardFooter className="pt-0 flex justify-end space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewTransactionHistory(station)}
                            >
                              History
                            </Button>
                          </CardFooter>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>
                
                {/* Available Stations Tab - Shows only available stations */}
                <TabsContent value="available">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {stations.filter(station => !station.currentCustomer).length === 0 ? (
                      <Card className="col-span-full bg-black/30 border-primary/20 p-6">
                        <div className="text-center text-gray-400">
                          <p>All stations are currently in use</p>
                        </div>
                      </Card>
                    ) : (
                      stations.filter(station => !station.currentCustomer).map((station) => (
                        <Card key={station.id} className="bg-black/30 border-2 border-primary/20">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-base">{station.name}</CardTitle>
                              <Badge variant="outline">Available</Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-gray-400">Station available for use</p>
                          </CardContent>
                          <CardFooter className="pt-0 flex justify-end space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditStationClick(station)}
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
                            >
                              Delete
                            </Button>
                          </CardFooter>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>
                
                {/* Station Analytics Tab - Shows detailed station analytics */}
                <TabsContent value="analytics">
                  <div className="space-y-4">
                    <Card className="bg-black/30 border-primary/20">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                          <CardTitle>Station Utilization</CardTitle>
                          <CardDescription>Performance metrics for all gaming stations</CardDescription>
                        </div>
                        <Select 
                          value={stationSortOrder}
                          onValueChange={(value) => {
                            setStationSortOrder(value);
                          }}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Sort by..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                            <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                            <SelectItem value="hours_desc">Total Hours (High-Low)</SelectItem>
                            <SelectItem value="hours_asc">Total Hours (Low-High)</SelectItem>
                            <SelectItem value="utilization_desc">Utilization (High-Low)</SelectItem>
                            <SelectItem value="utilization_asc">Utilization (Low-High)</SelectItem>
                            <SelectItem value="revenue_desc">Revenue (High-Low)</SelectItem>
                            <SelectItem value="revenue_asc">Revenue (Low-High)</SelectItem>
                            <SelectItem value="status">Status (Active First)</SelectItem>
                          </SelectContent>
                        </Select>
                      </CardHeader>
                      <CardContent>
                        <div className="w-full overflow-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Station</TableHead>
                                <TableHead>Total Hours</TableHead>
                                <TableHead>Utilization Rate</TableHead>
                                <TableHead>Revenue</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {/* Apply sorting based on selected order */}
                              {stationUtilization
                                ?.slice()
                                .sort((a, b) => {
                                  // Calculate utilization rates for both stations
                                  const utilizationRateA = Math.min(Math.round((a.totalHours / 24) * 100), 100);
                                  const utilizationRateB = Math.min(Math.round((b.totalHours / 24) * 100), 100);
                                  
                                  // Apply sorting based on selected option
                                  switch (stationSortOrder) {
                                    case 'name_asc':
                                      return a.stationName.localeCompare(b.stationName);
                                    case 'name_desc':
                                      return b.stationName.localeCompare(a.stationName);
                                    case 'hours_desc':
                                      return b.totalHours - a.totalHours;
                                    case 'hours_asc':
                                      return a.totalHours - b.totalHours;
                                    case 'utilization_desc':
                                      return utilizationRateB - utilizationRateA;
                                    case 'utilization_asc':
                                      return utilizationRateA - utilizationRateB;
                                    case 'revenue_desc':
                                      return b.revenue - a.revenue;
                                    case 'revenue_asc':
                                      return a.revenue - b.revenue;
                                    case 'status':
                                      // Sort by status (active first), then by name alphabetically
                                      if (a.currentlyActive === b.currentlyActive) {
                                        // If both have the same active status, sort by name
                                        return a.stationName.localeCompare(b.stationName);
                                      }
                                      // Put active stations first
                                      return a.currentlyActive ? -1 : 1;
                                    default:
                                      return a.stationName.localeCompare(b.stationName);
                                  }
                                })
                                .map((station) => {
                                  // Calculate utilization rate from hours used
                                  const utilizationRate = Math.min(Math.round((station.totalHours / 24) * 100), 100);
                                  
                                  return (
                                    <TableRow key={station.stationId}>
                                      <TableCell className="font-medium">{station.stationName}</TableCell>
                                      <TableCell>{station.totalHours.toFixed(1)} hrs</TableCell>
                                      <TableCell>
                                        <div className="flex items-center space-x-2">
                                          <Progress value={utilizationRate} className="w-[60px]" />
                                          <span>{utilizationRate}%</span>
                                        </div>
                                      </TableCell>
                                      <TableCell>{formatCurrency(station.revenue)}</TableCell>
                                      <TableCell>
                                        {station.currentlyActive ? (
                                          <Badge className="bg-green-500">Active</Badge>
                                        ) : (
                                          <Badge variant="outline">Inactive</Badge>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => handleViewTransactionHistory(stations.find(s => s.id === station.stationId))}
                                        >
                                          View History
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Station Categories Tab */}
                <TabsContent value="categories">
                  <div className="space-y-4">
                    <Card className="bg-black/30 border-primary/20">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                          <CardTitle>Station Categories</CardTitle>
                          <CardDescription>Manage gaming station categories and types</CardDescription>
                        </div>
                        <Button 
                          onClick={() => {
                            setNewCategoryName("");
                            setNewCategoryType("pc");
                            setNewCategoryHourlyRate("");
                            setNewCategoryPeakHourRate("");
                            setNewCategoryOffPeakRate("");
                            setNewCategoryWeekendRate("");
                            setNewCategoryDescription("");
                            setNewCategoryColor("#6366F1");
                            setNewCategoryIcon("gamepad");
                            setShowAddCategoryDialog(true);
                          }} 
                          className="ml-auto"
                        >
                          <PlusIcon className="mr-2 h-4 w-4" />
                          Add Category
                        </Button>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {stationCategories.length === 0 ? (
                            <Card className="col-span-full bg-black/30 border-primary/20 p-6">
                              <div className="text-center text-gray-400">
                                <p>No categories defined. Create your first category.</p>
                              </div>
                            </Card>
                          ) : (
                            stationCategories.map((category) => (
                              <Card key={category.id} className="overflow-hidden border border-primary/20">
                                <CardHeader className="p-4" style={{ backgroundColor: category.color || '#6366F1', color: 'white' }}>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                      {category.icon === 'gamepad' && <GamepadIcon className="h-5 w-5 mr-2" />}
                                      {category.icon === 'monitor' && <MonitorIcon className="h-5 w-5 mr-2" />}
                                      {category.icon === 'headset' && <HeadphonesIcon className="h-5 w-5 mr-2" />}
                                      {category.icon === 'vr' && <EyeIcon className="h-5 w-5 mr-2" />}
                                      {category.icon === 'racing' && <CarIcon className="h-5 w-5 mr-2" />}
                                      {category.icon === 'arcade' && <GamepadIcon className="h-5 w-5 mr-2" />}
                                      {category.icon === 'mobile' && <SmartphoneIcon className="h-5 w-5 mr-2" />}
                                      <h3 className="font-bold text-white">{category.name}</h3>
                                    </div>
                                    <Badge variant="outline" className="bg-white/10 border-white/20 text-white">
                                      {category.type}
                                    </Badge>
                                  </div>
                                </CardHeader>
                                <CardContent className="p-4">
                                  <p className="text-sm text-gray-500 mb-3">
                                    {category.description || 'No description provided'}
                                  </p>
                                  <div className="flex items-center justify-between mt-2">
                                    <div>
                                      <Badge variant="secondary" className="mr-2">
                                        {stations.filter(s => s.categoryId === category.id).length} stations
                                      </Badge>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEditCategoryClick(category)}
                                      >
                                        <PencilIcon className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDeleteCategoryClick(category.id)}
                                      >
                                        <TrashIcon className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
              
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
              
              {/* Transaction History Dialog */}
              <Dialog open={showTransactionHistoryDialog} onOpenChange={setShowTransactionHistoryDialog}>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Transaction History</DialogTitle>
                  </DialogHeader>
                  <div className="max-h-[70vh] overflow-y-auto">
                    {selectedStation && (
                      <StationTransactionHistory 
                        stationId={selectedStation.id} 
                        stationName={selectedStation.name}
                      />
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowTransactionHistoryDialog(false)}>
                      Close
                    </Button>
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
                          <Switch 
                            checked={paymentMethodStats.some(p => p.method === 'cash' && p.count > 0)} 
                            id="cash-payments" 
                          />
                        </div>
                        <div className="flex justify-between">
                          <span>M-Pesa</span>
                          <Switch 
                            checked={paymentMethodStats.some(p => p.method === 'mpesa' && p.count > 0)} 
                            id="mpesa-payments" 
                          />
                        </div>
                        <div className="flex justify-between">
                          <span>Airtel Money</span>
                          <Switch 
                            checked={paymentMethodStats.some(p => p.method === 'airtel' && p.count > 0)} 
                            id="airtel-payments" 
                          />
                        </div>
                        <div className="flex justify-between">
                          <span>Card Payments</span>
                          <Switch 
                            checked={paymentMethodStats.some(p => p.method === 'card' && p.count > 0)} 
                            id="card-payments" 
                          />
                        </div>
                        <div className="flex justify-between">
                          <span>QR Code Payments</span>
                          <Switch 
                            checked={paymentMethodStats.some(p => (p.method === 'qr' || p.method === 'qr-mpesa') && p.count > 0)} 
                            id="qr-payments" 
                          />
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

      {/* Edit Category Dialog */}
      <Dialog open={showEditCategoryDialog} onOpenChange={setShowEditCategoryDialog}>
        <DialogContent className="bg-black/80 border-primary/20">
          <DialogHeader>
            <DialogTitle>Edit Station Category</DialogTitle>
            <DialogDescription>Update category details and pricing</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category Name</label>
              <Input
                placeholder="Enter category name"
                value={editCategoryName}
                onChange={(e) => setEditCategoryName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category Type</label>
              <Select value={editCategoryType} onValueChange={(value) => setEditCategoryType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category type" />
                </SelectTrigger>
                <SelectContent className="bg-black/90">
                  <SelectItem value="pc">PC Gaming</SelectItem>
                  <SelectItem value="console">Console</SelectItem>
                  <SelectItem value="vr">Virtual Reality</SelectItem>
                  <SelectItem value="racing">Racing Setup</SelectItem>
                  <SelectItem value="arcade">Arcade</SelectItem>
                  <SelectItem value="mobile">Mobile Gaming</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Standard Rate (per hour)</label>
                <Input
                  type="number"
                  placeholder="KES 300"
                  value={editCategoryHourlyRate}
                  onChange={(e) => setEditCategoryHourlyRate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Peak Hour Rate</label>
                <Input
                  type="number"
                  placeholder="KES 450"
                  value={editCategoryPeakHourRate}
                  onChange={(e) => setEditCategoryPeakHourRate(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Off-peak Rate</label>
                <Input
                  type="number"
                  placeholder="KES 250"
                  value={editCategoryOffPeakRate}
                  onChange={(e) => setEditCategoryOffPeakRate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Weekend Rate</label>
                <Input
                  type="number"
                  placeholder="KES 400"
                  value={editCategoryWeekendRate}
                  onChange={(e) => setEditCategoryWeekendRate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category Color</label>
              <div className="flex space-x-2">
                <Input
                  type="color"
                  value={editCategoryColor}
                  onChange={(e) => setEditCategoryColor(e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  placeholder="Color code"
                  value={editCategoryColor}
                  onChange={(e) => setEditCategoryColor(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category Icon</label>
              <Select value={editCategoryIcon} onValueChange={(value) => setEditCategoryIcon(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an icon" />
                </SelectTrigger>
                <SelectContent className="bg-black/90">
                  <SelectItem value="gamepad">
                    <div className="flex items-center">
                      <GamepadIcon className="mr-2 h-4 w-4" />
                      <span>Gamepad</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="monitor">
                    <div className="flex items-center">
                      <MonitorIcon className="mr-2 h-4 w-4" />
                      <span>Monitor</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="mouse">
                    <div className="flex items-center">
                      <MousePointerIcon className="mr-2 h-4 w-4" />
                      <span>Mouse</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="headset">
                    <div className="flex items-center">
                      <HeadphonesIcon className="mr-2 h-4 w-4" />
                      <span>Headset</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="joystick">
                    <div className="flex items-center">
                      <GamepadIcon className="mr-2 h-4 w-4" />
                      <span>Joystick</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="vr">
                    <div className="flex items-center">
                      <EyeIcon className="mr-2 h-4 w-4" />
                      <span>VR Headset</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="racing">
                    <div className="flex items-center">
                      <CarIcon className="mr-2 h-4 w-4" />
                      <span>Racing</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="console">
                    <div className="flex items-center">
                      <TvIcon className="mr-2 h-4 w-4" />
                      <span>Console</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Enter category description"
                value={editCategoryDescription}
                onChange={(e) => setEditCategoryDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditCategoryDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCategory}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Category Dialog */}
      <Dialog open={showAddCategoryDialog} onOpenChange={setShowAddCategoryDialog}>
        <DialogContent className="bg-black/80 border-primary/20">
          <DialogHeader>
            <DialogTitle>Add Station Category</DialogTitle>
            <DialogDescription>Create a new station category</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category Name</label>
              <Input
                placeholder="Enter category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category Type</label>
              <Select value={newCategoryType} onValueChange={(value) => setNewCategoryType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category type" />
                </SelectTrigger>
                <SelectContent className="bg-black/90">
                  <SelectItem value="pc">PC Gaming</SelectItem>
                  <SelectItem value="console">Console</SelectItem>
                  <SelectItem value="vr">Virtual Reality</SelectItem>
                  <SelectItem value="racing">Racing Setup</SelectItem>
                  <SelectItem value="arcade">Arcade</SelectItem>
                  <SelectItem value="mobile">Mobile Gaming</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Standard Rate (per hour)</label>
                <Input
                  type="number"
                  placeholder="KES 300"
                  value={newCategoryHourlyRate}
                  onChange={(e) => setNewCategoryHourlyRate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Peak Hour Rate</label>
                <Input
                  type="number"
                  placeholder="KES 450"
                  value={newCategoryPeakHourRate}
                  onChange={(e) => setNewCategoryPeakHourRate(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Off-peak Rate</label>
                <Input
                  type="number"
                  placeholder="KES 250"
                  value={newCategoryOffPeakRate}
                  onChange={(e) => setNewCategoryOffPeakRate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Weekend Rate</label>
                <Input
                  type="number"
                  placeholder="KES 400"
                  value={newCategoryWeekendRate}
                  onChange={(e) => setNewCategoryWeekendRate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category Color</label>
              <div className="flex space-x-2">
                <Input
                  type="color"
                  value={newCategoryColor}
                  onChange={(e) => setNewCategoryColor(e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  placeholder="Color code"
                  value={newCategoryColor}
                  onChange={(e) => setNewCategoryColor(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category Icon</label>
              <Select value={newCategoryIcon} onValueChange={(value) => setNewCategoryIcon(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an icon" />
                </SelectTrigger>
                <SelectContent className="bg-black/90">
                  <SelectItem value="gamepad">
                    <div className="flex items-center">
                      <GamepadIcon className="mr-2 h-4 w-4" />
                      <span>Gamepad</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="monitor">
                    <div className="flex items-center">
                      <MonitorIcon className="mr-2 h-4 w-4" />
                      <span>Monitor</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="headset">
                    <div className="flex items-center">
                      <HeadphonesIcon className="mr-2 h-4 w-4" />
                      <span>Headset</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="vr">
                    <div className="flex items-center">
                      <EyeIcon className="mr-2 h-4 w-4" />
                      <span>VR</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="racing">
                    <div className="flex items-center">
                      <CarIcon className="mr-2 h-4 w-4" />
                      <span>Racing</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="arcade">
                    <div className="flex items-center">
                      <GamepadIcon className="mr-2 h-4 w-4" />
                      <span>Arcade</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="mobile">
                    <div className="flex items-center">
                      <SmartphoneIcon className="mr-2 h-4 w-4" />
                      <span>Mobile</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Enter category description"
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCategoryDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCategory}>
              Add Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
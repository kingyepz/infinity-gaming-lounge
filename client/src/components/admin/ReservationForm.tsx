import React, { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format } from 'date-fns';
import { Booking, GameStation, User } from '@shared/schema';

// UI Components
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// Icons
import { CalendarIcon, Clock, Search, Users } from 'lucide-react';

// Validation schema
const bookingFormSchema = z.object({
  stationId: z.coerce.number({
    required_error: "Please select a station",
  }),
  userId: z.coerce.number({
    required_error: "Please select a customer",
  }),
  date: z.date({
    required_error: "Please select a date",
  }),
  time: z.string().min(1, "Please select a time"),
  duration: z.coerce.number().min(1, "Duration must be at least 1 hour"),
  status: z.enum(["pending", "confirmed", "cancelled", "completed"], {
    required_error: "Please select a status",
  }),
  price: z.coerce.number().optional(),
  note: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

interface ReservationFormProps {
  stations: GameStation[];
  customers: User[];
  initialData?: Booking;
  onSubmit: (data: BookingFormValues) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

export default function ReservationForm({
  stations,
  customers,
  initialData,
  onSubmit,
  onCancel,
  isEditing = false,
}: ReservationFormProps) {
  const [selectedStation, setSelectedStation] = useState<GameStation | null>(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');

  // Create form with validation
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: initialData ? {
      stationId: initialData.stationId,
      userId: initialData.userId,
      date: initialData.date ? new Date(initialData.date) : undefined,
      time: initialData.time || '',
      duration: initialData.duration || 1,
      status: initialData.status || 'pending',
      price: initialData.price || 0,
      note: initialData.note || '',
    } : {
      stationId: 0,
      userId: 0,
      date: new Date(),
      time: '10:00',
      duration: 1,
      status: 'pending',
      price: 0,
      note: '',
    },
  });

  // Filter customers based on search query
  const filteredCustomers = customerSearchQuery.length > 0
    ? customers.filter(customer => 
        customer.displayName?.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
        customer.phoneNumber?.includes(customerSearchQuery))
    : customers;

  // Update selected station when stationId changes
  useEffect(() => {
    const stationId = form.watch('stationId');
    const station = stations.find(s => s.id === stationId);
    setSelectedStation(station || null);
  }, [form.watch('stationId'), stations]);

  // Calculate estimated price based on station and duration
  useEffect(() => {
    if (selectedStation && selectedStation.hourlyRate) {
      const duration = form.watch('duration') || 1;
      const estimatedPrice = selectedStation.hourlyRate * duration;
      form.setValue('price', estimatedPrice);
    }
  }, [selectedStation, form.watch('duration')]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Station Selection */}
        <FormField
          control={form.control}
          name="stationId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Game Station</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                value={field.value ? field.value.toString() : ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a game station" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <ScrollArea className="h-[200px]">
                    {stations.map((station) => (
                      <SelectItem key={station.id} value={station.id.toString()}>
                        <div className="flex items-center">
                          <span>{station.name}</span>
                          {station.type && (
                            <Badge className="ml-2 capitalize" variant="outline">
                              {station.type}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
              <FormDescription>
                Select the game station for this reservation
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Customer Selection */}
        <FormField
          control={form.control}
          name="userId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Customer</FormLabel>
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search customers..."
                  className="pl-9"
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                />
              </div>
              
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                value={field.value ? field.value.toString() : ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <ScrollArea className="h-[200px]">
                    {filteredCustomers.length === 0 ? (
                      <p className="p-2 text-center text-sm text-gray-500">No customers found</p>
                    ) : (
                      filteredCustomers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary/70" />
                            <span>{customer.displayName}</span>
                            <span className="text-xs text-gray-500">({customer.phoneNumber})</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </ScrollArea>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Date & Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date("1900-01-01")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
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
                <div className="relative">
                  <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <FormControl>
                    <Input
                      type="time"
                      className="pl-9"
                      placeholder="Select time"
                      {...field}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Duration & Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration (hours)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={24}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Price & Note */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price (KES)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  {selectedStation?.hourlyRate ? 
                    `Estimated from ${selectedStation.hourlyRate} KES hourly rate` : 
                    'Enter reservation price'
                  }
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any special instructions or notes..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Form Actions */}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {isEditing ? 'Update Reservation' : 'Create Reservation'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
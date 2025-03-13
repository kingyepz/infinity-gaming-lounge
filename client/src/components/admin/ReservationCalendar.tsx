import { useState, useMemo } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import moment from 'moment';
import { format } from 'date-fns';
import type { Booking, GameStation } from '@shared/schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

// Create a proper moment localizer for react-big-calendar
const localizer = momentLocalizer(moment);

// Custom event component to show booking details
const BookingEvent = ({ event }: { event: any }) => {
  return (
    <div className="text-xs">
      <div className="font-semibold">{event.title}</div>
      <div>{event.customerName}</div>
      <Badge variant={
        event.status === 'confirmed' 
          ? 'default' 
          : event.status === 'pending' 
            ? 'secondary' 
            : event.status === 'completed' 
              ? 'success' 
              : 'destructive'
      }>
        {event.status}
      </Badge>
    </div>
  );
};

interface ReservationCalendarProps {
  bookings: Booking[];
  stations: GameStation[];
  onEditBooking: (booking: Booking) => void;
  onCancelBooking: (booking: Booking) => void;
  onCheckInBooking: (booking: Booking) => void;
}

export default function ReservationCalendar({
  bookings,
  stations,
  onEditBooking,
  onCancelBooking,
  onCheckInBooking
}: ReservationCalendarProps) {
  const [selectedView, setSelectedView] = useState('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Convert bookings to calendar events
  const events = useMemo(() => {
    return bookings.map(booking => {
      // Parse date and time strings into Date objects
      const bookingDate = booking.date;
      const bookingTime = booking.time;
      
      // Parse the date and time
      const [year, month, day] = bookingDate.split('-').map(Number);
      const [hours, minutes] = bookingTime.split(':').map(Number);
      
      // Create start date
      const start = new Date(year, month - 1, day, hours, minutes);
      
      // Create end date (adding the duration in hours)
      const end = new Date(year, month - 1, day, hours + booking.duration, minutes);

      // Find the station
      const station = stations.find(s => s.id === booking.stationId);
      
      return {
        id: booking.id,
        title: station ? station.name : `Station ${booking.stationId}`,
        start,
        end,
        status: booking.status,
        customerName: `Customer ${booking.userId}`,
        allDay: false,
        resource: booking
      };
    });
  }, [bookings, stations]);

  // Handle event selection
  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event);
    setIsDetailsOpen(true);
  };

  // Custom event styles
  const eventStyleGetter = (event: any) => {
    let backgroundColor = '#3182ce'; // default blue
    
    switch (event.status) {
      case 'confirmed':
        backgroundColor = '#10b981'; // green
        break;
      case 'pending':
        backgroundColor = '#f59e0b'; // yellow
        break;
      case 'completed':
        backgroundColor = '#6366f1'; // indigo
        break;
      case 'cancelled':
        backgroundColor = '#ef4444'; // red
        break;
    }
    
    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        color: 'white',
        border: 'none',
        padding: '2px 5px',
        display: 'block'
      }
    };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reservation Calendar</CardTitle>
        <CardDescription>
          View and manage all reservations in calendar format
        </CardDescription>
      </CardHeader>
      <CardContent className="p-1 sm:p-6">
        <Tabs value={selectedView} onValueChange={setSelectedView}>
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="agenda">Agenda</TabsTrigger>
            </TabsList>
            <Button 
              variant="outline" 
              onClick={() => setSelectedDate(new Date())}
            >
              Today
            </Button>
          </div>
          
          <TabsContent value="month" className="mt-0">
            <div className="h-[600px]">
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                onSelectEvent={handleSelectEvent}
                eventPropGetter={eventStyleGetter}
                date={selectedDate}
                onNavigate={date => setSelectedDate(date)}
                view={Views.MONTH}
                components={{
                  event: BookingEvent
                }}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="week" className="mt-0">
            <div className="h-[600px]">
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                onSelectEvent={handleSelectEvent}
                eventPropGetter={eventStyleGetter}
                date={selectedDate}
                onNavigate={date => setSelectedDate(date)}
                view={Views.WEEK}
                components={{
                  event: BookingEvent
                }}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="day" className="mt-0">
            <div className="h-[600px]">
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                onSelectEvent={handleSelectEvent}
                eventPropGetter={eventStyleGetter}
                date={selectedDate}
                onNavigate={date => setSelectedDate(date)}
                view={Views.DAY}
                components={{
                  event: BookingEvent
                }}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="agenda" className="mt-0">
            <div className="h-[600px]">
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                onSelectEvent={handleSelectEvent}
                eventPropGetter={eventStyleGetter}
                date={selectedDate}
                onNavigate={date => setSelectedDate(date)}
                view={Views.AGENDA}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Event details dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        {selectedEvent && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedEvent.title}</DialogTitle>
              <DialogDescription>
                Reservation Details
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="font-semibold">Customer:</div>
                <div>{selectedEvent.customerName}</div>
                
                <div className="font-semibold">Date:</div>
                <div>{format(selectedEvent.start, 'MMMM dd, yyyy')}</div>
                
                <div className="font-semibold">Time:</div>
                <div>{format(selectedEvent.start, 'h:mm a')} - {format(selectedEvent.end, 'h:mm a')}</div>
                
                <div className="font-semibold">Duration:</div>
                <div>{selectedEvent.resource.duration} hour(s)</div>
                
                <div className="font-semibold">Status:</div>
                <div>
                  <Badge variant={
                    selectedEvent.status === 'confirmed' 
                      ? 'default' 
                      : selectedEvent.status === 'pending' 
                        ? 'secondary' 
                        : selectedEvent.status === 'completed' 
                          ? 'success' 
                          : 'destructive'
                  }>
                    {selectedEvent.status}
                  </Badge>
                </div>
                
                {selectedEvent.resource.note && (
                  <>
                    <div className="font-semibold">Note:</div>
                    <div>{selectedEvent.resource.note}</div>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              {selectedEvent.status !== 'cancelled' && selectedEvent.status !== 'completed' && (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      onEditBooking(selectedEvent.resource);
                      setIsDetailsOpen(false);
                    }}
                  >
                    Edit
                  </Button>
                  
                  {selectedEvent.status === 'pending' && (
                    <Button 
                      variant="default"
                      onClick={() => {
                        onCheckInBooking(selectedEvent.resource);
                        setIsDetailsOpen(false);
                      }}
                    >
                      Check In
                    </Button>
                  )}
                  
                  <Button 
                    variant="destructive"
                    onClick={() => {
                      onCancelBooking(selectedEvent.resource);
                      setIsDetailsOpen(false);
                    }}
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </Card>
  );
}
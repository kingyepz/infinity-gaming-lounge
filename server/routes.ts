import { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTransactionSchema, insertBookingSchema, insertGameSchema } from "@shared/schema";
import { z } from "zod";
import { log } from "./vite";
import { db } from "./db";
import { games, transactions, gameStations, users, payments, rewards, events, bookings, friends } from "../shared/schema";
import { desc, eq, sql, inArray } from "drizzle-orm";
import { mpesaService } from "./mpesa";
import { airtelMoneyService } from "./airtel";
import { PaymentDebugger } from "./paymentDebugger";
import mpesaRoutes from "./mpesaRoutes";
import mpesaApiRoutes from "./mpesaApiRoutes";
import { websocketService } from "./websocket";
import { generateReport, ReportOptions } from "./reportGenerator";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const server = createServer(app);
  
  // Initialize WebSocket service with the HTTP server
  websocketService.initialize(server);

  // Wrap route handlers with error catching
  const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };

  // User related routes
  app.get("/api/users/customers", asyncHandler(async (_req, res) => {
    try {
      const customers = await db.select()
        .from(users)
        .where(eq(users.role, "customer"))
        .orderBy(desc(users.createdAt));
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      throw error;
    }
  }));

  // Gaming session related routes
  app.get("/api/sessions/active", asyncHandler(async (_req, res) => {
    try {
      const activeStations = await db.select()
        .from(gameStations)
        .where(eq(gameStations.isActive, true));
      res.json(activeStations);
    } catch (error) {
      console.error("Error fetching active sessions:", error);
      throw error;
    }
  }));

  app.post("/api/sessions/start", asyncHandler(async (req, res) => {
    try {
      const { stationId, customerId, customerName, gameId, sessionType, baseRate, hourlyRate } = req.body;
      
      console.log("Starting session with data:", req.body);

      // Find the game to get its name
      const game = await storage.getGameById(Number(gameId));
      if (!game) {
        throw new Error("Game not found");
      }

      const station = await storage.updateGameStation(stationId, {
        currentCustomer: customerName, // Use customer name (string) for the gameStations table
        currentGame: game.name, // Use game name (string) instead of ID
        sessionType,
        sessionStartTime: new Date(),
        baseRate: baseRate || 40,
        hourlyRate: hourlyRate || 200
      });

      if (!station) {
        throw new Error("Failed to start session");
      }
      
      // Broadcast station updates via WebSocket
      await websocketService.sendStationUpdates();
      console.log(`Session started on station ${stationId}. Broadcasting updates via WebSocket.`);
      
      // Notify about customer check-in
      websocketService.notifyCustomerCheckIn({
        customerId,
        customerName,
        stationId,
        stationName: station.name,
        gameName: game.name
      });

      res.json(station);
    } catch (error) {
      console.error("Error starting session:", error);
      throw error;
    }
  }));

  app.post("/api/sessions/end", asyncHandler(async (req, res) => {
    try {
      const { stationId } = req.body;

      const station = await storage.updateGameStation(stationId, {
        currentCustomer: null,
        currentGame: null,
        sessionType: null,
        sessionStartTime: null
      });

      if (!station) {
        throw new Error("Failed to end session");
      }
      
      // Broadcast station updates via WebSocket
      await websocketService.sendStationUpdates();
      console.log(`Session ended on station ${stationId}. Broadcasting updates via WebSocket.`);
      
      // Also broadcast transaction updates as session end might trigger a transaction
      await websocketService.sendTransactionUpdates();

      res.json(station);
    } catch (error) {
      console.error("Error ending session:", error);
      throw error;
    }
  }));

  app.get("/api/stations", asyncHandler(async (_req, res) => {
    const stations = await db.select().from(gameStations);
    res.json(stations);
  }));
  
  app.post("/api/stations", asyncHandler(async (req, res) => {
    try {
      const { name, status } = req.body;
      
      // Validate required fields
      if (!name) {
        return res.status(400).json({ 
          error: "Station name is required" 
        });
      }
      
      // Insert new station into database
      const [newStation] = await db.insert(gameStations)
        .values({
          name,
          status: status || "available",
          currentCustomer: null,
          currentGame: null,
          sessionType: null,
          baseRate: 0,
          hourlyRate: 200,
          sessionStartTime: null
        })
        .returning();
      
      // Broadcast station updates via WebSocket
      await websocketService.sendStationUpdates();
      console.log(`New station created: ${name}. Broadcasting updates via WebSocket.`);
      
      res.status(201).json(newStation);
    } catch (error) {
      console.error("Error creating station:", error);
      res.status(500).json({ 
        error: "Failed to add station",
        details: error.message 
      });
    }
  }));

  app.patch("/api/stations/:id", asyncHandler(async (req, res) => {
    try {
      const stationData = req.body;
      const updatedStation = await storage.updateGameStation(Number(req.params.id), stationData);
      
      // Broadcast station updates to all connected clients via WebSocket
      await websocketService.sendStationUpdates();
      
      // Log station update
      console.log(`Station ${req.params.id} updated. Broadcasting updates via WebSocket.`);
      
      res.json(updatedStation);
    } catch (error) {
      //This will be caught by the global error handler
      throw error;
    }
  }));

  // Station Categories API Routes
  
  // Get all station categories
  app.get("/api/station-categories", asyncHandler(async (_req, res) => {
    try {
      const categories = await storage.getStationCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error getting station categories:", error);
      throw error;
    }
  }));
  
  // Get station category by ID
  app.get("/api/station-categories/:id", asyncHandler(async (req, res) => {
    try {
      const categoryId = Number(req.params.id);
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      const category = await storage.getStationCategoryById(categoryId);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(category);
    } catch (error) {
      console.error("Error getting station category:", error);
      throw error;
    }
  }));
  
  // Create a new station category
  app.post("/api/station-categories", asyncHandler(async (req, res) => {
    try {
      const categoryData = req.body;
      const category = await storage.createStationCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating station category:", error);
      throw error;
    }
  }));
  
  // Update a station category
  app.patch("/api/station-categories/:id", asyncHandler(async (req, res) => {
    try {
      const categoryId = Number(req.params.id);
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      const categoryData = req.body;
      const category = await storage.updateStationCategory(categoryId, categoryData);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(category);
    } catch (error) {
      console.error("Error updating station category:", error);
      throw error;
    }
  }));
  
  // Delete a station category
  app.delete("/api/station-categories/:id", asyncHandler(async (req, res) => {
    try {
      const categoryId = Number(req.params.id);
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      try {
        const success = await storage.deleteStationCategory(categoryId);
        
        if (!success) {
          return res.status(404).json({ message: "Category not found" });
        }
        
        res.status(204).end();
      } catch (error) {
        if (error instanceof Error && error.message.includes("Cannot delete category")) {
          return res.status(400).json({ message: error.message });
        }
        throw error;
      }
    } catch (error) {
      console.error("Error deleting station category:", error);
      throw error;
    }
  }));

  // Booking/Reservation API Routes
  
  // Get all bookings
  app.get("/api/bookings", asyncHandler(async (_req, res) => {
    try {
      const allBookings = await storage.getBookings();
      res.json(allBookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      throw error;
    }
  }));
  
  // Get booking by ID
  app.get("/api/bookings/:id", asyncHandler(async (req, res) => {
    try {
      const bookingId = Number(req.params.id);
      if (isNaN(bookingId)) {
        return res.status(400).json({ message: "Invalid booking ID" });
      }
      
      const booking = await storage.getBookingById(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      res.json(booking);
    } catch (error) {
      console.error("Error fetching booking:", error);
      throw error;
    }
  }));
  
  // Get bookings by user ID
  app.get("/api/users/:userId/bookings", asyncHandler(async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const userBookings = await storage.getBookingsByUserId(userId);
      res.json(userBookings);
    } catch (error) {
      console.error("Error fetching user bookings:", error);
      throw error;
    }
  }));
  
  // Get bookings by station ID
  app.get("/api/stations/:stationId/bookings", asyncHandler(async (req, res) => {
    try {
      const stationId = Number(req.params.stationId);
      if (isNaN(stationId)) {
        return res.status(400).json({ message: "Invalid station ID" });
      }
      
      const stationBookings = await storage.getBookingsByStationId(stationId);
      res.json(stationBookings);
    } catch (error) {
      console.error("Error fetching station bookings:", error);
      throw error;
    }
  }));
  
  // Get bookings by date
  app.get("/api/bookings/date/:date", asyncHandler(async (req, res) => {
    try {
      const date = req.params.date;
      // Validate date format (YYYY-MM-DD)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD" });
      }
      
      const dateBookings = await storage.getBookingsByDate(date);
      res.json(dateBookings);
    } catch (error) {
      console.error("Error fetching bookings by date:", error);
      throw error;
    }
  }));
  
  // Create a new booking
  app.post("/api/bookings", asyncHandler(async (req, res) => {
    try {
      // Validate request body
      const validatedData = insertBookingSchema.parse(req.body);
      
      // Check station availability first
      const isAvailable = await storage.checkStationAvailability(
        validatedData.stationId, 
        validatedData.date, 
        validatedData.time, 
        validatedData.duration
      );
      
      if (!isAvailable) {
        return res.status(409).json({ 
          message: "The requested time slot is not available for this station"
        });
      }
      
      // Create the booking
      const booking = await storage.createBooking(validatedData);
      
      res.status(201).json(booking);
    } catch (error) {
      console.error("Error creating booking:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ 
          message: "Invalid booking data", 
          errors: error.errors 
        });
      }
      throw error;
    }
  }));
  
  // Update a booking
  app.patch("/api/bookings/:id", asyncHandler(async (req, res) => {
    try {
      const bookingId = Number(req.params.id);
      if (isNaN(bookingId)) {
        return res.status(400).json({ message: "Invalid booking ID" });
      }
      
      const bookingData = req.body;
      
      // If changing time/date/duration/stationId, check availability first
      if (bookingData.date || bookingData.time || bookingData.duration || bookingData.stationId) {
        const currentBooking = await storage.getBookingById(bookingId);
        if (!currentBooking) {
          return res.status(404).json({ message: "Booking not found" });
        }
        
        const isAvailable = await storage.checkStationAvailability(
          bookingData.stationId || currentBooking.stationId,
          bookingData.date || currentBooking.date,
          bookingData.time || currentBooking.time,
          bookingData.duration || currentBooking.duration
        );
        
        if (!isAvailable) {
          return res.status(409).json({ 
            message: "The requested time slot is not available for this station"
          });
        }
      }
      
      const booking = await storage.updateBooking(bookingId, bookingData);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      res.json(booking);
    } catch (error) {
      console.error("Error updating booking:", error);
      throw error;
    }
  }));
  
  // Delete a booking
  app.delete("/api/bookings/:id", asyncHandler(async (req, res) => {
    try {
      const bookingId = Number(req.params.id);
      if (isNaN(bookingId)) {
        return res.status(400).json({ message: "Invalid booking ID" });
      }
      
      const success = await storage.deleteBooking(bookingId);
      
      if (!success) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting booking:", error);
      throw error;
    }
  }));
  
  // Check-in a booking
  app.patch("/api/bookings/:id/check-in", asyncHandler(async (req, res) => {
    try {
      const bookingId = Number(req.params.id);
      if (isNaN(bookingId)) {
        return res.status(400).json({ message: "Invalid booking ID" });
      }
      
      const booking = await storage.getBookingById(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Only pending bookings can be checked in
      if (booking.status !== "pending") {
        return res.status(400).json({ 
          message: `Cannot check in a booking with status "${booking.status}". Only pending bookings can be checked in.` 
        });
      }
      
      // Update booking status to "completed"
      const updatedBooking = await storage.updateBooking(bookingId, { status: "completed" });
      
      if (!updatedBooking) {
        return res.status(500).json({ message: "Failed to update booking status" });
      }
      
      res.json({ 
        success: true, 
        message: "Booking checked in successfully",
        booking: updatedBooking
      });
    } catch (error) {
      console.error("Error checking in booking:", error);
      throw error;
    }
  }));
  
  // Cancel a booking
  app.patch("/api/bookings/:id/cancel", asyncHandler(async (req, res) => {
    try {
      const bookingId = Number(req.params.id);
      if (isNaN(bookingId)) {
        return res.status(400).json({ message: "Invalid booking ID" });
      }
      
      const booking = await storage.getBookingById(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Only pending or confirmed bookings can be cancelled
      if (booking.status !== "pending" && booking.status !== "confirmed") {
        return res.status(400).json({ 
          message: `Cannot cancel a booking with status "${booking.status}". Only pending or confirmed bookings can be cancelled.` 
        });
      }
      
      // Update booking status to "cancelled"
      const updatedBooking = await storage.updateBooking(bookingId, { status: "cancelled" });
      
      if (!updatedBooking) {
        return res.status(500).json({ message: "Failed to update booking status" });
      }
      
      res.json({ 
        success: true, 
        message: "Booking cancelled successfully",
        booking: updatedBooking
      });
    } catch (error) {
      console.error("Error cancelling booking:", error);
      throw error;
    }
  }));

  app.get("/api/reports/current", asyncHandler(async (_req, res) => {
    try {
      const stations = await db.select().from(gameStations);
      const activeStations = stations.filter(station => station.currentCustomer);

      const report = activeStations.map(station => {
        const duration = station.sessionStartTime
          ? Math.ceil((Date.now() - new Date(station.sessionStartTime).getTime()) / (1000 * 60)) // minutes
          : 0;

        const cost = station.sessionType === "per_game"
          ? station.baseRate
          : Math.ceil(duration / 60) * station.hourlyRate;

        return {
          stationName: station.name,
          customerName: station.currentCustomer,
          gameName: station.currentGame,
          duration: station.sessionType === "per_game"
            ? "1 game"
            : `${Math.ceil(duration / 60)} hour(s)`,
          cost
        };
      });

      res.json(report);
    } catch (error) {
      throw error;
    }
  }));

  app.get("/api/reports/hourly", asyncHandler(async (_req, res) => {
    try {
      const stations = await db.select().from(gameStations);
      const transactionsList = await db.select().from(transactions);

      const now = new Date();
      const hourAgo = new Date(now.getTime() - (60 * 60 * 1000));

      const hourlyTransactions = transactionsList.filter(tx =>
        new Date(tx.createdAt) >= hourAgo &&
        tx.paymentStatus === "completed"
      );

      // Get current active sessions data
      const activeStations = stations.filter(s => s.currentCustomer && s.sessionStartTime);
      const activeSessions = activeStations.map(station => {
        const duration = station.sessionStartTime
          ? Math.ceil((Date.now() - new Date(station.sessionStartTime).getTime()) / (1000 * 60))
          : 0;

        const estimatedAmount = station.sessionType === "per_game"
          ? station.baseRate
          : Math.ceil(duration / 60) * station.hourlyRate;

        return {
          stationName: station.name,
          customerName: station.currentCustomer,
          duration: station.sessionType === "per_game" ? "1 game" : `${duration} minutes`,
          amount: estimatedAmount
        };
      });

      const report = {
        totalRevenue: hourlyTransactions.reduce((sum, tx) => sum + tx.amount, 0),
        activeSessions: activeStations.length,
        completedSessions: hourlyTransactions.length,
        activeSessionsData: activeSessions,
        completedSessionsData: hourlyTransactions.map(tx => ({
          stationName: stations.find(s => s.id === tx.stationId)?.name,
          customerName: tx.customerName,
          gameName: tx.gameName,
          duration: tx.sessionType === "per_game" ? "1 game" : `${tx.duration} minutes`,
          amount: tx.amount
        }))
      };

      res.json(report);
    } catch (error) {
      throw error;
    }
  }));

  app.get("/api/reports/daily", asyncHandler(async (_req, res) => {
    try {
      // Get active stations
      const stations = await db.select().from(gameStations);
      const activeStations = stations.filter(s => s.currentCustomer);
      
      // Get today's date with time set to midnight
      const now = new Date();
      const dayStart = new Date(now);
      dayStart.setHours(0, 0, 0, 0);
      
      // Get transactions created today
      const dailyTransactions = await db.select()
        .from(transactions)
        .where(sql`${transactions.createdAt} >= ${dayStart}`);
      
      // Get completed transactions for today
      const completedTransactions = dailyTransactions.filter(
        tx => tx.paymentStatus === "completed"
      );
      
      // Calculate total revenue from completed transactions
      const totalRevenue = completedTransactions.reduce((sum, tx) => {
        const amount = typeof tx.amount === 'string' ? parseFloat(tx.amount) : Number(tx.amount);
        return sum + (amount || 0);
      }, 0);
      
      // Format the report with current active sessions and completed transactions
      const report = {
        totalRevenue,
        activeSessions: activeStations.length,
        completedSessions: completedTransactions.length,
        // Get both active and completed sessions for the sessions list
        sessions: [
          // First add active sessions
          ...activeStations.map(station => ({
            stationName: station.name,
            customerName: station.currentCustomer || "Unknown",
            duration: station.sessionType === "per_game" ? 
              "1 game" : 
              station.sessionStartTime ? 
                `${Math.ceil((Date.now() - new Date(station.sessionStartTime).getTime()) / (1000 * 60))} minutes` : 
                "0 minutes",
            active: true
          })),
          // Then add completed transactions
          ...completedTransactions.map(tx => {
            const station = stations.find(s => s.id === tx.stationId);
            return {
              stationName: station?.name || "Unknown",
              customerName: tx.customerName || "Unknown",
              duration: tx.sessionType === "per_game" ? 
                "1 game" : 
                `${tx.duration || 0} minutes`,
              active: false
            };
          })
        ]
      };
      
      res.json(report);
    } catch (error) {
      console.error("Error getting daily report:", error);
      throw error;
    }
  }));

  app.get("/api/reports/revenue/:timeFrame", asyncHandler(async (req, res) => {
    try {
      const timeFrame = req.params.timeFrame as 'daily' | 'weekly' | 'monthly';
      if (!['daily', 'weekly', 'monthly'].includes(timeFrame)) {
        return res.status(400).json({ error: "Invalid time frame. Use daily, weekly, or monthly." });
      }

      // Direct database query for revenue data based on timeframe
      const now = new Date();
      let startDate: Date;
      
      // Determine time range based on timeFrame
      if (timeFrame === 'daily') {
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
      } else if (timeFrame === 'weekly') {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
      } else { // monthly
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
      }
      
      // Get all completed transactions within the time range
      const completedTransactions = await db.select()
        .from(transactions)
        .where(sql`${transactions.createdAt} >= ${startDate}`)
        .where(eq(transactions.paymentStatus, "completed"));
      
      // Calculate revenue by day
      const revenueByDay: Record<string, number> = {};
      
      completedTransactions.forEach(transaction => {
        const date = new Date(transaction.createdAt).toISOString().split('T')[0];
        const amount = typeof transaction.amount === 'string' 
          ? parseFloat(transaction.amount) 
          : Number(transaction.amount);
          
        if (!revenueByDay[date]) {
          revenueByDay[date] = 0;
        }
        revenueByDay[date] += amount;
      });
      
      // Convert to array format
      const revenueData = Object.entries(revenueByDay).map(([date, amount]) => ({
        date,
        amount
      }));
      
      res.json(revenueData);
    } catch (error) {
      console.error("Error getting revenue data:", error);
      throw error;
    }
  }));

  app.get("/api/reports/popular-games", asyncHandler(async (_req, res) => {
    try {
      // Direct database query for popular games
      const gameStats = await db.select({
        gameName: transactions.gameName,
        count: sql`COUNT(*)`,
        revenue: sql`SUM(${transactions.amount}::numeric)`
      })
      .from(transactions)
      .where(sql`${transactions.gameName} IS NOT NULL`)
      .where(eq(transactions.paymentStatus, "completed"))
      .groupBy(transactions.gameName)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(5);
      
      res.json(gameStats.map(stat => ({
        name: stat.gameName,
        sessions: Number(stat.count), // Changed count to sessions to match client expectations
        revenue: stat.revenue ? Number(stat.revenue) : 0
      })));
    } catch (error) {
      console.error("Error getting popular games:", error);
      throw error;
    }
  }));

  app.get("/api/reports/station-utilization", asyncHandler(async (_req, res) => {
    try {
      // Get all stations first
      const stations = await db.select().from(gameStations);
      
      // Get completed transactions to calculate utilization
      const allTransactions = await db.select()
        .from(transactions)
        .where(eq(transactions.paymentStatus, "completed"));
      
      // Calculate utilization data
      const stationUtilization = stations.map(station => {
        // Count transactions for this station
        const stationTransactions = allTransactions.filter(
          t => t.stationId === station.id
        );
        
        // Calculate total hours used
        const totalHours = stationTransactions.reduce((total, t) => {
          if (t.sessionType === 'hourly' && t.duration) {
            return total + (t.duration / 60); // Convert minutes to hours
          } else if (t.sessionType === 'per_game') {
            return total + 0.5; // Estimate 30 minutes per game
          }
          return total;
        }, 0);
        
        return {
          stationId: station.id,
          stationName: station.name,
          sessionsCount: stationTransactions.length,
          totalHours: parseFloat(totalHours.toFixed(1)),
          revenue: stationTransactions.reduce((sum, t) => {
            const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : Number(t.amount);
            return sum + amount;
          }, 0),
          currentlyActive: station.currentCustomer !== null
        };
      });
      
      res.json(stationUtilization);
    } catch (error) {
      console.error("Error getting station utilization:", error);
      throw error;
    }
  }));

  app.get("/api/reports/customer-activity", asyncHandler(async (_req, res) => {
    try {
      // Get all customers
      const customers = await db.select()
        .from(users)
        .where(eq(users.role, "customer"));
      
      // Get completed transactions
      const allTransactions = await db.select()
        .from(transactions)
        .where(eq(transactions.paymentStatus, "completed"));
      
      // Get active sessions
      const activeStations = await db.select()
        .from(gameStations)
        .where(sql`${gameStations.currentCustomer} IS NOT NULL`);
      
      // Count new customers in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const newCustomers = customers.filter(
        c => new Date(c.createdAt) >= thirtyDaysAgo
      ).length;
      
      // Count transactions and calculate revenue
      const totalSessions = allTransactions.length;
      const totalRevenue = allTransactions.reduce((sum, t) => {
        const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : Number(t.amount);
        return sum + amount;
      }, 0);
      
      res.json({
        totalCustomers: customers.length,
        newCustomers,
        activeCustomers: activeStations.length,
        totalSessions,
        totalRevenue,
        averageRevenue: totalSessions > 0 ? (totalRevenue / totalSessions) : 0
      });
    } catch (error) {
      console.error("Error getting customer activity:", error);
      throw error;
    }
  }));

  app.get("/api/reports/payment-methods", asyncHandler(async (_req, res) => {
    try {
      // Direct query to get payment method statistics
      const paymentStats = await db.select({
        paymentMethod: payments.paymentMethod,
        count: sql`COUNT(*)`,
        amount: sql`SUM(${payments.amount}::numeric)`
      })
      .from(payments)
      .where(eq(payments.status, "completed"))
      .groupBy(payments.paymentMethod);
      
      res.json(paymentStats.map(stat => ({
        method: stat.paymentMethod,
        count: Number(stat.count),
        amount: stat.amount ? Number(stat.amount) : 0
      })));
    } catch (error) {
      console.error("Error getting payment methods:", error);
      throw error;
    }
  }));

  app.get("/api/reports/hourly-distribution", asyncHandler(async (_req, res) => {
    try {
      // Implement database query for hourly distribution data
      const hourlyDistribution = await storage.getHourlyDistribution();
      res.json(hourlyDistribution);
    } catch (error) {
      throw error;
    }
  }));

  // Customer Retention Analytics endpoint
  app.get("/api/reports/customer-retention", asyncHandler(async (_req, res) => {
    try {
      const customers = await storage.getCustomers();
      const transactions = await storage.getTransactions();
      
      // Group transactions by customer
      const customerTransactions = {};
      transactions.forEach(transaction => {
        const customerId = transaction.userId;
        if (customerId) {
          if (!customerTransactions[customerId]) {
            customerTransactions[customerId] = [];
          }
          customerTransactions[customerId].push(transaction);
        }
      });
      
      // Calculate retention metrics
      const customerRetention = customers.map(customer => {
        const customerTxs = customerTransactions[customer.id] || [];
        
        // Sort transactions by date
        customerTxs.sort((a, b) => {
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        });
        
        const firstVisit = customerTxs.length > 0 ? customerTxs[0].createdAt : null;
        const lastVisit = customerTxs.length > 0 ? customerTxs[customerTxs.length - 1].createdAt : null;
        
        // Calculate days since last visit
        const daysSinceLastVisit = lastVisit 
          ? Math.floor((new Date().getTime() - new Date(lastVisit).getTime()) / (1000 * 60 * 60 * 24)) 
          : null;
        
        // Calculate customer lifetime value (sum of all transactions)
        const lifetimeValue = customerTxs.reduce((sum, tx) => {
          const amount = typeof tx.amount === 'string' ? parseFloat(tx.amount) : Number(tx.amount);
          return sum + amount;
        }, 0);
        
        return {
          customerId: customer.id,
          customerName: customer.displayName,
          visitsCount: customerTxs.length,
          firstVisit,
          lastVisit,
          daysSinceLastVisit,
          lifetimeValue,
          avgTransactionValue: customerTxs.length > 0 ? lifetimeValue / customerTxs.length : 0,
          loyaltyPoints: customer.points || 0
        };
      });
      
      // Calculate overall retention metrics
      const activeCustomers = customerRetention.filter(c => c.daysSinceLastVisit !== null && c.daysSinceLastVisit <= 30).length;
      const atRiskCustomers = customerRetention.filter(c => c.daysSinceLastVisit !== null && c.daysSinceLastVisit > 30 && c.daysSinceLastVisit <= 90).length;
      const churned = customerRetention.filter(c => c.daysSinceLastVisit !== null && c.daysSinceLastVisit > 90).length;
      const totalWithVisits = customerRetention.filter(c => c.visitsCount > 0).length;
      
      // Calculate retention rates
      const retentionRate = totalWithVisits > 0 ? (activeCustomers / totalWithVisits) * 100 : 0;
      const churnRate = totalWithVisits > 0 ? (churned / totalWithVisits) * 100 : 0;
      
      // Calculate repeat visit rate
      const repeatVisitors = customerRetention.filter(c => c.visitsCount > 1).length;
      const repeatVisitRate = totalWithVisits > 0 ? (repeatVisitors / totalWithVisits) * 100 : 0;
      
      // Return detailed data
      res.json({
        customerDetails: customerRetention,
        summary: {
          activeCustomers,
          atRiskCustomers,
          churned,
          retentionRate,
          churnRate,
          repeatVisitRate,
          totalCustomers: customers.length,
          visitingCustomers: totalWithVisits,
          avgVisitsPerCustomer: totalWithVisits > 0 
            ? customerRetention.reduce((sum, c) => sum + c.visitsCount, 0) / totalWithVisits 
            : 0,
          avgCustomerLifetimeValue: totalWithVisits > 0
            ? customerRetention.reduce((sum, c) => sum + c.lifetimeValue, 0) / totalWithVisits
            : 0
        }
      });
    } catch (error) {
      console.error("Error calculating customer retention:", error);
      res.status(500).json({ error: "Error calculating customer retention metrics" });
    }
  }));

  // Station Utilization Heatmap endpoint
  app.get("/api/reports/station-heatmap", asyncHandler(async (_req, res) => {
    try {
      const transactions = await storage.getTransactions();
      const stations = await storage.getGameStations();
      
      // Initialize data structure
      // For each day (0-6, Sunday-Saturday) and hour (0-23)
      const heatmapData = [];
      for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
          heatmapData.push({
            day,
            hour,
            value: 0,
            count: 0,
          });
        }
      }
      
      // Process transactions
      transactions.forEach(tx => {
        if (tx.createdAt) {
          const date = new Date(tx.createdAt);
          const day = date.getDay(); // 0-6, Sunday-Saturday
          const hour = date.getHours(); // 0-23
          
          // Find the index in our heatmap array
          const index = day * 24 + hour;
          
          // Increment count
          heatmapData[index].count += 1;
          
          // For value, we use session duration if available, otherwise default values
          if (tx.duration) {
            if (tx.sessionType === 'hourly') {
              heatmapData[index].value += tx.duration / 60; // Convert minutes to hours
            } else {
              heatmapData[index].value += 0.5; // Assume 30 mins for per_game
            }
          } else {
            // If no duration, make assumptions based on session type
            heatmapData[index].value += (tx.sessionType === 'hourly') ? 1 : 0.5;
          }
        }
      });
      
      // Calculate utilization percentage
      const totalStations = stations.length;
      if (totalStations > 0) {
        heatmapData.forEach(item => {
          // Calculate utilization as percentage of stations in use
          item.utilization = Math.min(100, (item.count / totalStations) * 100);
        });
      }
      
      res.json(heatmapData);
    } catch (error) {
      console.error("Error generating station heatmap:", error);
      res.status(500).json({ error: "Error generating station utilization heatmap" });
    }
  }));

  // Game Performance Metrics endpoint
  app.get("/api/reports/game-performance", asyncHandler(async (_req, res) => {
    try {
      const transactions = await storage.getTransactions();
      const allGames = await storage.getGames();
      
      // Group transactions by game
      const gamePerformance = {};
      
      allGames.forEach(game => {
        gamePerformance[game.name] = {
          gameId: game.id,
          gameName: game.name,
          sessionCount: 0,
          totalRevenue: 0,
          totalDuration: 0,
          averageDuration: 0,
          peakHours: Array(24).fill(0),
          revenuePerHour: 0,
          pricePerSession: game.pricePerSession,
          pricePerHour: game.pricePerHour,
        };
      });
      
      // Process transactions
      transactions.forEach(tx => {
        const gameName = tx.gameName;
        if (gameName && gamePerformance[gameName]) {
          const amount = typeof tx.amount === 'string' ? parseFloat(tx.amount) : Number(tx.amount);
          
          // Update counts and revenue
          gamePerformance[gameName].sessionCount += 1;
          gamePerformance[gameName].totalRevenue += amount;
          
          // Update duration
          if (tx.duration) {
            gamePerformance[gameName].totalDuration += tx.duration;
          } else if (tx.sessionType === 'hourly') {
            gamePerformance[gameName].totalDuration += 60; // Assume 1 hour
          } else {
            gamePerformance[gameName].totalDuration += 30; // Assume 30 mins for per_game
          }
          
          // Update peak hours
          if (tx.createdAt) {
            const hour = new Date(tx.createdAt).getHours();
            gamePerformance[gameName].peakHours[hour] += 1;
          }
        }
      });
      
      // Calculate averages and derived metrics
      Object.values(gamePerformance).forEach(game => {
        if (game.sessionCount > 0) {
          game.averageDuration = game.totalDuration / game.sessionCount;
          game.revenuePerHour = (game.totalDuration > 0) 
            ? (game.totalRevenue / (game.totalDuration / 60)) 
            : 0;
        }
        
        // Find peak playing times (top 3 hours)
        game.topPlayingHours = game.peakHours
          .map((count, hour) => ({ hour, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3)
          .map(item => item.hour);
      });
      
      res.json(Object.values(gamePerformance));
    } catch (error) {
      console.error("Error calculating game performance metrics:", error);
      res.status(500).json({ error: "Error calculating game performance metrics" });
    }
  }));

  // Revenue Breakdown endpoint
  app.get("/api/reports/revenue-breakdown", asyncHandler(async (_req, res) => {
    try {
      const transactions = await storage.getTransactions();
      
      // Initialize revenue categories
      const revenueBreakdown = {
        hourly: 0,
        perGame: 0,
        food: 0,
        beverages: 0,
        merchandise: 0,
        other: 0
      };
      
      // Calculate totals for each category
      transactions.forEach(tx => {
        if (tx.paymentStatus === 'completed') {
          const amount = typeof tx.amount === 'string' ? parseFloat(tx.amount) : Number(tx.amount);
          
          if (tx.sessionType === 'hourly') {
            revenueBreakdown.hourly += amount;
          } else if (tx.sessionType === 'per_game') {
            revenueBreakdown.perGame += amount;
          } else {
            // For future extension with other transaction types
            revenueBreakdown.other += amount;
          }
        }
      });
      
      // Calculate percentages
      const totalRevenue = Object.values(revenueBreakdown).reduce((sum, val) => sum + val, 0);
      const result = {
        categories: Object.keys(revenueBreakdown).map(key => ({
          category: key,
          amount: revenueBreakdown[key],
          percentage: totalRevenue > 0 ? (revenueBreakdown[key] / totalRevenue) * 100 : 0
        })),
        totalRevenue
      };
      
      res.json(result);
    } catch (error) {
      console.error("Error calculating revenue breakdown:", error);
      res.status(500).json({ error: "Error calculating revenue breakdown" });
    }
  }));

  // Loyalty Program Analytics endpoint
  app.get("/api/reports/loyalty-analytics", asyncHandler(async (_req, res) => {
    try {
      const customers = await storage.getCustomers();
      
      // Calculate loyalty metrics
      const totalPoints = customers.reduce((sum, customer) => sum + (customer.points || 0), 0);
      const customersWithPoints = customers.filter(c => c.points && c.points > 0);
      
      // Segment customers by points
      const loyaltySegments = [
        { name: "Bronze", min: 1, max: 100, count: 0, totalPoints: 0 },
        { name: "Silver", min: 101, max: 500, count: 0, totalPoints: 0 },
        { name: "Gold", min: 501, max: 1000, count: 0, totalPoints: 0 },
        { name: "Platinum", min: 1001, max: Infinity, count: 0, totalPoints: 0 }
      ];
      
      // Count customers in each segment
      customersWithPoints.forEach(customer => {
        const points = customer.points || 0;
        for (const segment of loyaltySegments) {
          if (points >= segment.min && points <= segment.max) {
            segment.count++;
            segment.totalPoints += points;
            break;
          }
        }
      });
      
      // Calculate averages
      loyaltySegments.forEach(segment => {
        segment.avgPoints = segment.count > 0 ? segment.totalPoints / segment.count : 0;
      });
      
      // Return results
      res.json({
        totalCustomers: customers.length,
        customersWithPoints: customersWithPoints.length,
        totalPointsIssued: totalPoints,
        avgPointsPerCustomer: customersWithPoints.length > 0 ? totalPoints / customersWithPoints.length : 0,
        segments: loyaltySegments,
        topCustomers: customersWithPoints
          .sort((a, b) => (b.points || 0) - (a.points || 0))
          .slice(0, 10)
          .map(c => ({
            id: c.id,
            name: c.displayName,
            points: c.points || 0
          }))
      });
    } catch (error) {
      console.error("Error calculating loyalty analytics:", error);
      res.status(500).json({ error: "Error calculating loyalty program analytics" });
    }
  }));

  // Comparative Analysis endpoint
  app.get("/api/reports/comparative-analysis", asyncHandler(async (req, res) => {
    try {
      const { period = 'monthly', current, previous } = req.query;
      
      // Get all transactions
      const transactions = await storage.getTransactions();
      
      // Helper function to parse date ranges
      const getDateRange = (periodType, dateString) => {
        const date = dateString ? new Date(dateString) : new Date();
        let startDate = new Date(date);
        let endDate = new Date(date);
        
        if (periodType === 'monthly') {
          startDate.setDate(1);
          startDate.setHours(0, 0, 0, 0);
          
          endDate.setMonth(endDate.getMonth() + 1);
          endDate.setDate(0); // Last day of current month
          endDate.setHours(23, 59, 59, 999);
        } else if (periodType === 'weekly') {
          const day = date.getDay();
          startDate.setDate(date.getDate() - day); // Start of week (Sunday)
          startDate.setHours(0, 0, 0, 0);
          
          endDate.setDate(date.getDate() + (6 - day)); // End of week (Saturday)
          endDate.setHours(23, 59, 59, 999);
        } else if (periodType === 'yearly') {
          startDate.setMonth(0, 1);
          startDate.setHours(0, 0, 0, 0);
          
          endDate.setMonth(11, 31);
          endDate.setHours(23, 59, 59, 999);
        }
        
        return { startDate, endDate };
      };
      
      // Define current period
      const currentPeriod = getDateRange(period, current);
      
      // Define previous period
      let previousPeriod;
      if (previous) {
        previousPeriod = getDateRange(period, previous);
      } else {
        // If no previous date is specified, calculate it based on period
        previousPeriod = { startDate: new Date(currentPeriod.startDate), endDate: new Date(currentPeriod.endDate) };
        
        if (period === 'monthly') {
          previousPeriod.startDate.setMonth(previousPeriod.startDate.getMonth() - 1);
          previousPeriod.endDate.setMonth(previousPeriod.endDate.getMonth() - 1);
        } else if (period === 'weekly') {
          previousPeriod.startDate.setDate(previousPeriod.startDate.getDate() - 7);
          previousPeriod.endDate.setDate(previousPeriod.endDate.getDate() - 7);
        } else if (period === 'yearly') {
          previousPeriod.startDate.setFullYear(previousPeriod.startDate.getFullYear() - 1);
          previousPeriod.endDate.setFullYear(previousPeriod.endDate.getFullYear() - 1);
        }
      }
      
      // Filter transactions for current and previous periods
      const filterTransactionsByPeriod = (startDate, endDate) => {
        return transactions.filter(tx => {
          if (!tx.createdAt) return false;
          const txDate = new Date(tx.createdAt);
          return txDate >= startDate && txDate <= endDate;
        });
      };
      
      const currentTransactions = filterTransactionsByPeriod(
        currentPeriod.startDate, 
        currentPeriod.endDate
      );
      
      const previousTransactions = filterTransactionsByPeriod(
        previousPeriod.startDate, 
        previousPeriod.endDate
      );
      
      // Calculate metrics for each period
      const calculateMetrics = (txs) => {
        const totalRevenue = txs.reduce((sum, tx) => {
          const amount = typeof tx.amount === 'string' ? parseFloat(tx.amount) : Number(tx.amount);
          return sum + amount;
        }, 0);
        
        const completedTransactions = txs.filter(tx => tx.paymentStatus === 'completed');
        const pendingTransactions = txs.filter(tx => tx.paymentStatus === 'pending');
        
        // Group by game
        const gameStats = {};
        txs.forEach(tx => {
          if (tx.gameName) {
            if (!gameStats[tx.gameName]) {
              gameStats[tx.gameName] = { count: 0, revenue: 0 };
            }
            gameStats[tx.gameName].count++;
            const amount = typeof tx.amount === 'string' ? parseFloat(tx.amount) : Number(tx.amount);
            gameStats[tx.gameName].revenue += amount;
          }
        });
        
        // Group by station
        const stationStats = {};
        txs.forEach(tx => {
          if (tx.stationId) {
            const stationId = tx.stationId.toString();
            if (!stationStats[stationId]) {
              stationStats[stationId] = { count: 0, revenue: 0 };
            }
            stationStats[stationId].count++;
            const amount = typeof tx.amount === 'string' ? parseFloat(tx.amount) : Number(tx.amount);
            stationStats[stationId].revenue += amount;
          }
        });
        
        // Get unique customers
        const uniqueCustomers = new Set();
        txs.forEach(tx => {
          if (tx.userId) {
            uniqueCustomers.add(tx.userId);
          }
        });
        
        return {
          totalRevenue,
          transactionCount: txs.length,
          completedTransactions: completedTransactions.length,
          pendingTransactions: pendingTransactions.length,
          uniqueCustomers: uniqueCustomers.size,
          avgTransactionValue: txs.length > 0 ? totalRevenue / txs.length : 0,
          topGames: Object.entries(gameStats)
            .map(([name, stats]) => ({ name, ...stats }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5),
          topStations: Object.entries(stationStats)
            .map(([id, stats]) => ({ id, ...stats }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5)
        };
      };
      
      const currentMetrics = calculateMetrics(currentTransactions);
      const previousMetrics = calculateMetrics(previousTransactions);
      
      // Calculate percent changes
      const calculateChange = (current, previous) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      };
      
      const changes = {
        totalRevenue: calculateChange(currentMetrics.totalRevenue, previousMetrics.totalRevenue),
        transactionCount: calculateChange(currentMetrics.transactionCount, previousMetrics.transactionCount),
        uniqueCustomers: calculateChange(currentMetrics.uniqueCustomers, previousMetrics.uniqueCustomers),
        avgTransactionValue: calculateChange(currentMetrics.avgTransactionValue, previousMetrics.avgTransactionValue)
      };
      
      // Return comparative analysis
      res.json({
        periodType: period,
        currentPeriod: {
          startDate: currentPeriod.startDate,
          endDate: currentPeriod.endDate,
          metrics: currentMetrics
        },
        previousPeriod: {
          startDate: previousPeriod.startDate,
          endDate: previousPeriod.endDate,
          metrics: previousMetrics
        },
        changes
      });
    } catch (error) {
      console.error("Error generating comparative analysis:", error);
      res.status(500).json({ error: "Error generating comparative analysis" });
    }
  }));

  /**
   * Get filtered data based on date range and time of day
   * This endpoint supports filtering dashboard data by date range and time hours
   * GET /api/reports/filtered?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&startHour=0&endHour=23&timePreset=morning|afternoon|evening|all
   */
  app.get("/api/reports/filtered", asyncHandler(async (req, res) => {
    try {
      // Get date range and time filters from query parameters
      const { startDate, endDate, startHour, endHour, timePreset } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ 
          error: "Missing required parameters", 
          message: "Both startDate and endDate are required query parameters"
        });
      }
      
      // Parse dates and validate
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999); // Set to end of day
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ 
          error: "Invalid date format", 
          message: "Dates must be in YYYY-MM-DD format"
        });
      }
      
      if (start > end) {
        return res.status(400).json({ 
          error: "Invalid date range", 
          message: "Start date must be before or equal to end date"
        });
      }
      
      // Parse time range parameters based on time preset or explicit hours
      let hourStart = 0;
      let hourEnd = 23;
      
      // Apply time preset if specified (takes precedence over explicit hours)
      if (timePreset) {
        switch (timePreset) {
          case 'morning':
            hourStart = 6;
            hourEnd = 11;
            break;
          case 'afternoon':
            hourStart = 12;
            hourEnd = 17;
            break;
          case 'evening':
            hourStart = 18;
            hourEnd = 23;
            break;
          case 'all':
          default:
            hourStart = 0;
            hourEnd = 23;
        }
      } else {
        // Use explicit hour parameters if provided
        hourStart = startHour !== undefined ? parseInt(startHour as string) : 0;
        hourEnd = endHour !== undefined ? parseInt(endHour as string) : 23;
      }
      
      // Validate time range
      if (isNaN(hourStart) || isNaN(hourEnd) || hourStart < 0 || hourStart > 23 || hourEnd < 0 || hourEnd > 23) {
        return res.status(400).json({
          error: "Invalid time range",
          message: "Start and end hours must be between 0 and 23"
        });
      }
      
      if (hourStart > hourEnd) {
        return res.status(400).json({
          error: "Invalid time range",
          message: "Start hour must be less than or equal to end hour"
        });
      }
      
      // Get transactions within the date range and time range
      const allTransactions = await storage.getTransactions();
      const filteredTransactions = allTransactions.filter(tx => {
        const txDate = new Date(tx.createdAt || new Date());
        const txHour = txDate.getHours();
        
        // Check if transaction is within both date range and time range
        return txDate >= start && txDate <= end && txHour >= hourStart && txHour <= hourEnd;
      });
        
      // Get completed transactions
      const completedTransactions = filteredTransactions.filter(
        tx => tx.paymentStatus === "completed"
      );
      
      // Calculate key metrics
      const totalRevenue = completedTransactions.reduce((sum, tx) => {
        const amount = typeof tx.amount === 'string' ? parseFloat(tx.amount) : Number(tx.amount);
        return sum + (amount || 0);
      }, 0);
      
      // Group transactions by date for revenue chart
      const revenueByDay: Record<string, number> = {};
      
      completedTransactions.forEach(transaction => {
        const date = new Date(transaction.createdAt || new Date()).toISOString().split('T')[0];
        const amount = typeof transaction.amount === 'string' 
          ? parseFloat(transaction.amount) 
          : Number(transaction.amount);
          
        if (!revenueByDay[date]) {
          revenueByDay[date] = 0;
        }
        revenueByDay[date] += amount;
      });
      
      // Convert to array format for chart
      const revenueData = Object.entries(revenueByDay).map(([date, amount]) => ({
        date,
        amount
      }));
      
      // Count payment methods
      const paymentMethods: Record<string, number> = {
        cash: 0,
        mpesa: 0,
        airtel: 0,
        card: 0,
        qr: 0
      };
      
      completedTransactions.forEach(tx => {
        if (tx.paymentMethod === 'cash' || (!tx.mpesaRef && !tx.paymentMethod)) {
          paymentMethods.cash++;
        } else if (tx.paymentMethod === 'mpesa' || (tx.mpesaRef && !tx.mpesaRef.startsWith('QR-') && !tx.mpesaRef.startsWith('SIM-AIRTEL-'))) {
          paymentMethods.mpesa++;
        } else if (tx.paymentMethod === 'airtel' || (tx.mpesaRef && (tx.mpesaRef.startsWith('SIM-AIRTEL-') || tx.mpesaRef.startsWith('AR-')))) {
          paymentMethods.airtel++;
        } else if (tx.paymentMethod === 'card') {
          paymentMethods.card++;
        } else if (tx.paymentMethod === 'qr' || tx.paymentMethod === 'qr-mpesa' || (tx.mpesaRef && tx.mpesaRef.startsWith('QR-'))) {
          paymentMethods.qr++;
        }
      });
      
      // Convert to array format for chart
      const paymentMethodsData = Object.entries(paymentMethods)
        .map(([method, count]) => ({ method, count }))
        .filter(item => item.count > 0);
      
      // Count game popularity
      const gameCount: Record<string, number> = {};
      const gameRevenue: Record<string, number> = {};
      
      completedTransactions.forEach(tx => {
        if (!tx.gameName) return;
        
        if (!gameCount[tx.gameName]) {
          gameCount[tx.gameName] = 0;
          gameRevenue[tx.gameName] = 0;
        }
        
        gameCount[tx.gameName]++;
        
        const amount = typeof tx.amount === 'string' 
          ? parseFloat(tx.amount) 
          : Number(tx.amount);
          
        gameRevenue[tx.gameName] += amount;
      });
      
      // Convert to array and sort by count
      const popularGames = Object.entries(gameCount)
        .map(([name, sessions]) => ({ 
          name, 
          sessions, 
          revenue: gameRevenue[name] || 0 
        }))
        .sort((a, b) => b.sessions - a.sessions)
        .slice(0, 5);
      
      // Return the filtered dashboard data
      res.json({
        dateRange: {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0]
        },
        timeRange: {
          startHour: hourStart,
          endHour: hourEnd
        },
        overviewStats: {
          totalRevenue,
          totalTransactions: filteredTransactions.length,
          completedTransactions: completedTransactions.length,
          averageTransactionValue: completedTransactions.length > 0 
            ? totalRevenue / completedTransactions.length 
            : 0
        },
        revenueData,
        paymentMethods: paymentMethodsData,
        popularGames
      });
    } catch (error) {
      console.error("Error generating filtered report:", error);
      res.status(500).json({ 
        error: "Server error", 
        message: "Failed to generate filtered report"
      });
    }
  }));

  // Predictive Analytics endpoint
  app.get("/api/reports/predictive-analytics", asyncHandler(async (_req, res) => {
    try {
      const transactions = await storage.getTransactions();
      
      // Group transactions by day of week
      const dayOfWeekStats = Array(7).fill(0).map(() => ({ count: 0, revenue: 0 }));
      
      transactions.forEach(tx => {
        if (tx.createdAt) {
          const date = new Date(tx.createdAt);
          const dayOfWeek = date.getDay(); // 0-6, Sunday-Saturday
          
          dayOfWeekStats[dayOfWeek].count++;
          const amount = typeof tx.amount === 'string' ? parseFloat(tx.amount) : Number(tx.amount);
          dayOfWeekStats[dayOfWeek].revenue += amount;
        }
      });
      
      // Calculate average revenue per day of week
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayAverages = daysOfWeek.map((day, index) => ({
        day,
        averageRevenue: dayOfWeekStats[index].revenue / Math.max(1, dayOfWeekStats[index].count),
        totalRevenue: dayOfWeekStats[index].revenue,
        transactionCount: dayOfWeekStats[index].count
      }));
      
      // Generate next 7 days forecast
      const today = new Date();
      const forecast = Array(7).fill(0).map((_, index) => {
        const forecastDate = new Date(today);
        forecastDate.setDate(today.getDate() + index);
        
        const dayOfWeek = forecastDate.getDay();
        const dayAverage = dayAverages[dayOfWeek];
        
        return {
          date: forecastDate.toISOString().split('T')[0],
          day: daysOfWeek[dayOfWeek],
          predictedRevenue: dayAverage.averageRevenue * (dayAverage.transactionCount > 0 ? 1 : 0),
          confidence: Math.min(100, dayAverage.transactionCount * 5), // Simple confidence calculation
          basedOnTransactions: dayAverage.transactionCount
        };
      });
      
      // Return forecast
      res.json({
        dayAverages,
        forecast,
        nextWeekTotal: forecast.reduce((sum, day) => sum + day.predictedRevenue, 0)
      });
    } catch (error) {
      console.error("Error generating predictive analytics:", error);
      res.status(500).json({ error: "Error generating predictive analytics" });
    }
  }));

  app.get("/api/games", asyncHandler(async (_req, res) => {
    try {
      const gamesList = await db.select().from(games).orderBy(desc(games.name));
      res.json(gamesList);
    } catch (error) {
      console.error("Error fetching games:", error);
      throw error;
    }
  }));
  
  // Add route for creating a new game
  app.post("/api/games", asyncHandler(async (req, res) => {
    try {
      // Validate game data using zod schema
      const parseResult = insertGameSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid game data", 
          errors: parseResult.error.format() 
        });
      }
      
      const gameData = parseResult.data;
      const game = await storage.createGame(gameData);
      res.status(201).json(game);
    } catch (error) {
      console.error("Error creating game:", error);
      throw error;
    }
  }));

  // Add route for updating a game
  app.patch("/api/games/:id", asyncHandler(async (req, res) => {
    try {
      const gameId = Number(req.params.id);
      if (isNaN(gameId)) {
        return res.status(400).json({ message: "Invalid game ID" });
      }

      // Partial validation for update - we don't require all fields
      const gameData = req.body;
      
      // Check if any game category values are invalid
      if (gameData.category) {
        const validCategories = [
          'action', 'adventure', 'rpg', 'strategy', 'simulation', 
          'sports', 'racing', 'puzzle', 'fighting', 'shooter', 'mmo', 'other'
        ];
        
        if (!validCategories.includes(gameData.category)) {
          return res.status(400).json({ 
            message: "Invalid game category", 
            validCategories 
          });
        }
      }
      
      const game = await storage.updateGame(gameId, gameData);
      
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      res.json(game);
    } catch (error) {
      console.error("Error updating game:", error);
      throw error;
    }
  }));

  // Add route for deleting a game
  app.delete("/api/games/:id", asyncHandler(async (req, res) => {
    try {
      const gameId = Number(req.params.id);
      if (isNaN(gameId)) {
        return res.status(400).json({ message: "Invalid game ID" });
      }

      const success = await storage.deleteGame(gameId);
      
      if (!success) {
        return res.status(404).json({ message: "Game not found or could not be deleted" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting game:", error);
      throw error;
    }
  }));

  app.post("/api/transactions", asyncHandler(async (req, res) => {
    try {
      // Ensure amount is a string and payment status is set to "pending" by default
      const rawData = req.body;
      console.log("Received transaction data:", rawData);

      // Convert amount to string if it's a number
      if (typeof rawData.amount === 'number') {
        rawData.amount = String(rawData.amount);
      }

      // Get actual database columns to ensure we only use valid ones
      const actualColumns = Object.keys(transactions);
      console.log("Actual database columns:", actualColumns);

      // Create a clean transaction object with proper typing to match database schema
      const transactionData = {
        stationId: Number(rawData.stationId),
        customerName: String(rawData.customerName || "Walk-in Customer"), 
        sessionType: rawData.sessionType === "hourly" ? "hourly" : "per_game" as const,
        amount: String(rawData.amount || "0"),
        paymentStatus: "pending" as const,
        gameName: rawData.gameName || null,
        duration: (rawData.duration !== undefined && rawData.duration !== null) ? 
          Number(rawData.duration) : null
      };

      console.log("Final transaction data:", transactionData);

      try {
        // Execute insert - ensure we're wrapping the transaction data in an array
        const [result] = await db.insert(transactions).values([transactionData]).returning();
        
        if (!result) {
          console.error("Transaction creation failed: No result returned");
          return res.status(500).json({ 
            success: false, 
            error: "No transaction record created" 
          });
        }
        
        // Broadcast transaction updates via WebSocket
        await websocketService.sendTransactionUpdates();
        console.log(`New transaction created with ID ${result.id}. Broadcasting updates via WebSocket.`);
        
        // Return a standardized response with success flag and the transaction data
        return res.json({ 
          success: true, 
          transaction: result,
          transactionId: result.id
        });
      } catch (dbError) {
        console.error("Database error:", dbError);
        return res.status(500).json({ 
          success: false, 
          error: dbError.message || "Database error creating transaction" 
        });
      }
    } catch (error) {
      console.error("Transaction creation error:", error);
      return res.status(500).json({ 
        success: false, 
        error: error.message || "Failed to create transaction" 
      });
    }
  }));

  // Add a GET endpoint to retrieve all transactions
  app.get("/api/transactions", asyncHandler(async (_req, res) => {
    try {
      const allTransactions = await db.select().from(transactions).orderBy(desc(transactions.createdAt));
      res.json(allTransactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      throw error;
    }
  }));

  // Get a specific transaction by ID - used for receipt generation
  app.get("/api/transactions/:id", asyncHandler(async (req, res) => {
    try {
      const transactionId = Number(req.params.id);
      if (isNaN(transactionId)) {
        return res.status(400).json({ 
          success: false,
          error: "Invalid transaction ID" 
        });
      }

      const transaction = await db.select()
        .from(transactions)
        .where(eq(transactions.id, transactionId))
        .limit(1);

      if (!transaction || transaction.length === 0) {
        return res.status(404).json({ 
          success: false,
          error: "Transaction not found" 
        });
      }

      return res.json({ 
        success: true,
        transaction: transaction[0] 
      });
    } catch (error) {
      console.error("Error fetching transaction:", error);
      return res.status(500).json({ 
        success: false,
        error: "Failed to fetch transaction details" 
      });
    }
  }));

  // Get payment details for a specific transaction - used for receipt generation
  app.get("/api/payments/transaction/:transactionId", asyncHandler(async (req, res) => {
    try {
      const transactionId = Number(req.params.transactionId);
      if (isNaN(transactionId)) {
        return res.status(400).json({ 
          success: false,
          error: "Invalid transaction ID" 
        });
      }

      const payment = await db.select()
        .from(payments)
        .where(eq(payments.transactionId, transactionId))
        .limit(1);

      if (!payment || payment.length === 0) {
        return res.status(404).json({ 
          success: false,
          error: "Payment not found for this transaction" 
        });
      }

      return res.json({
        success: true,
        payment: payment[0]
      });
    } catch (error) {
      console.error("Error fetching payment details:", error);
      return res.status(500).json({ 
        success: false,
        error: "Failed to fetch payment details" 
      });
    }
  }));

  app.get("/api/transactions/station/:stationId", asyncHandler(async (req, res) => {
    try {
      const stationId = Number(req.params.stationId);
      if (isNaN(stationId)) {
        return res.status(400).json({ message: "Invalid station ID" });
      }

      const stationTransactions = await db.select()
        .from(transactions)
        .where(eq(transactions.stationId, stationId))
        .orderBy(desc(transactions.createdAt));

      res.json(stationTransactions);
    } catch (error) {
      console.error("Error fetching transactions by station:", error);
      throw error;
    }
  }));

  app.get("/api/transactions/user/current", asyncHandler(async (req, res) => {
    try {
      const userId = req.headers['user-id'];
      if (!userId) {
        return res.json([
          {
            id: 1,
            stationId: 1,
            customerName: "John Doe",
            gameName: "FIFA 24",
            sessionType: "per_game",
            amount: 500,
            paymentStatus: "completed",
            mpesaRef: "MP123456",
            duration: null,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // yesterday
          },
          {
            id: 2,
            stationId: 2,
            customerName: "John Doe",
            gameName: "Call of Duty",
            sessionType: "hourly",
            amount: 1000,
            paymentStatus: "completed",
            mpesaRef: "MP123457",
            duration: 60,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
          }
        ]);
      }

      // Since 'userId' field might not exist in the transactions table schema yet,
      // we'll use the example transactions for now
      // TODO: Update the schema and add userId field to transactions
      const userTransactions = await db.select().from(transactions);
      res.json(userTransactions);
    } catch (error) {
      throw error;
    }
  }));

  app.get("/api/leaderboard", asyncHandler(async (_req, res) => {
    // Implement database query for leaderboard data
    res.json([
      { rank: 1, name: "EliteGamer", points: 2500 },
      { rank: 2, name: "VictoryRoad", points: 2300 },
      { rank: 3, name: "GameMaster", points: 1200 },
      { rank: 4, name: "ProPlayer22", points: 750 }
    ]);
  }));

  app.get("/api/events", asyncHandler(async (_req, res) => {
    try {
      const eventsList = await db.select()
        .from(events)
        .orderBy(events.date);
      
      // If no events found, return empty array instead of mock data
      res.json(eventsList.length > 0 ? eventsList : []);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  }));

  app.get("/api/rewards", asyncHandler(async (_req, res) => {
    try {
      // Fetch available rewards from the database
      const rewardsList = await db.select()
        .from(rewards)
        .where(eq(rewards.available, true))
        .orderBy(rewards.points);

      res.json(rewardsList);
    } catch (error) {
      console.error("Error fetching rewards:", error);
      res.status(500).json({ error: "Failed to fetch rewards" });
    }
  }));

  // Add reward redemption endpoint
  app.post("/api/rewards/redeem", asyncHandler(async (req, res) => {
    try {
      const { userId, rewardId } = req.body;

      if (!userId || !rewardId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Get the reward
      const [reward] = await db.select()
        .from(rewards)
        .where(eq(rewards.id, rewardId));

      if (!reward) {
        return res.status(404).json({ error: "Reward not found" });
      }

      if (!reward.available) {
        return res.status(400).json({ error: "Reward is not available" });
      }

      // Check if user has enough points
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, userId));

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if ((user.points || 0) < reward.points) {
        return res.status(400).json({ 
          error: "Insufficient points", 
          required: reward.points,
          available: user.points || 0
        });
      }

      // Redeem points
      const newPointsBalance = await storage.redeemLoyaltyPoints(userId, reward.points);

      res.json({
        success: true,
        message: `Successfully redeemed ${reward.title}`,
        newPointsBalance,
        reward
      });
    } catch (error: any) {
      console.error("Error redeeming reward:", error);
      res.status(500).json({ 
        error: error.message || "Failed to redeem reward" 
      });
    }
  }));

  app.get("/api/users/friends", asyncHandler(async (req, res) => {
    try {
      const userId = req.headers['user-id'];
      
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      // Get accepted friend connections for this user
      const userFriends = await db.select({
        friendId: friends.friendId,
      })
      .from(friends)
      .where(eq(friends.userId, Number(userId)))
      .where(eq(friends.status, "accepted"));
      
      // Get friend details for each friend
      const friendIds = userFriends.map(f => f.friendId);
      
      if (friendIds.length === 0) {
        return res.json([]);
      }
      
      // Get friend details including points
      const friendsList = await db.select({
        id: users.id,
        name: users.displayName,
        points: users.points,
        // Default to offline for simplicity, in a real app would check last activity
        status: sql`CASE WHEN random() > 0.5 THEN 'online' ELSE 'offline' END`.as('status')
      })
      .from(users)
      .where(inArray(users.id, friendIds));
      
      res.json(friendsList);
    } catch (error) {
      console.error("Error fetching friends:", error);
      res.status(500).json({ error: "Failed to fetch friends" });
    }
  }));

  app.get("/api/users/current", asyncHandler(async (req, res) => {
    try {
      const userId = req.headers['user-id'];
      if (!userId) {
        // For demo purposes, return a default user instead of requiring authentication
        return res.json({
          id: 1,
          displayName: "John Doe",
          gamingName: "JDGamer",
          phoneNumber: "254700000000",
          role: "customer",
          points: 750,
          referralCode: "JDGAM123",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString() // 30 days ago
        });
      }

      const user = await db.select()
        .from(users)
        .where(eq(users.id, Number(userId)))
        .limit(1);
      
      if (!user || user.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(user[0]);
    } catch (error) {
      console.error("Error fetching current user:", error);
      throw error;
    }
  }));

  app.post("/api/users/register", asyncHandler(async (req, res) => {
    try {
      const userData = z.object({
        displayName: z.string(),
        gamingName: z.string(),
        phoneNumber: z.string(),
        referredBy: z.string().optional()
      }).parse(req.body);

      const existingUser = await db.select().from(users).where(users.phoneNumber.equals(userData.phoneNumber)).limit(1);
      if (existingUser) {
        return res.status(400).json({ error: "User with this phone number already exists" });
      }

      const user = await db.insert(users).values({
        displayName: userData.displayName,
        gamingName: userData.gamingName,
        phoneNumber: userData.phoneNumber,
        role: "customer"
      }).returning();

      if (userData.referredBy) {
        try {
          const referrer = await db.select().from(users).where(users.phoneNumber.equals(userData.referredBy)).limit(1);
          if (referrer) {
            await storage.awardLoyaltyPoints(referrer.id, 100); // Award 100 points for referral
          }
        } catch (error) {
          console.error("Error processing referral:", error);
        }
      }

      res.json(user);
    } catch (error) {
      throw error;
    }
  }));

  app.post("/api/users/points/award", asyncHandler(async (req, res) => {
    try {
      const data = z.object({
        userId: z.number(),
        points: z.number().positive()
      }).parse(req.body);

      const newPoints = await storage.awardLoyaltyPoints(data.userId, data.points);
      res.json({ success: true, newPoints });
    } catch (error) {
      throw error;
    }
  }));

  app.post("/api/users/points/redeem", asyncHandler(async (req, res) => {
    try {
      const data = z.object({
        userId: z.number(),
        points: z.number().positive()
      }).parse(req.body);

      const newPoints = await storage.redeemLoyaltyPoints(data.userId, data.points);
      res.json({ success: true, newPoints });
    } catch (error) {
      throw error;
    }
  }));

  app.post("/api/payments/mpesa", asyncHandler(async (req, res) => {
    try {
      const { PaymentDebugger } = await import('./paymentDebugger');

      PaymentDebugger.log('mpesa', 'request', req.body);
      const paymentData = mpesaPaymentSchema.parse(req.body);
      PaymentDebugger.log('mpesa', 'validated_data', paymentData);

      // Initiate STK Push
      const response = await mpesaService.initiateSTKPush({
        phoneNumber: paymentData.phoneNumber,
        amount: paymentData.amount,
        accountReference: `TXN-${paymentData.transactionId}`,
        transactionDesc: "Payment for gaming services"
      });

      PaymentDebugger.log('mpesa', 'stk_response', response);

      try {
        // Simple update with only the essential fields we know exist
        const updateData = {
          paymentStatus: "pending",
          mpesaRef: response.MerchantRequestID
        };

        PaymentDebugger.log('mpesa', 'update_data', updateData);
        await db.update(transactions)
          .set(updateData)
          .where(eq(transactions.id, paymentData.transactionId));

        PaymentDebugger.log('mpesa', 'transaction_updated', { transactionId: paymentData.transactionId });
      } catch (dbError) {
        PaymentDebugger.logError('mpesa', 'transaction_update', dbError);

        // If the update fails, try with just payment status as a fallback
        try {
          await db.update(transactions)
            .set({ 
              paymentStatus: "pending"
            })
            .where(eq(transactions.id, paymentData.transactionId));

          PaymentDebugger.log('mpesa', 'transaction_updated_fallback', { transactionId: paymentData.transactionId });
        } catch (fallbackError) {
          PaymentDebugger.logError('mpesa', 'transaction_update_fallback', fallbackError);
          // Continue anyway since we've already initiated the M-Pesa payment
        }
      }

      // Create a payment record in the payments table
      try {
        // Create a clean payment record with only the fields defined in the schema
        const paymentRecord: any = {
          transactionId: paymentData.transactionId,
          amount: String(paymentData.amount),
          paymentMethod: "mpesa",
          status: "pending",
          reference: response.MerchantRequestID,
          phoneNumber: paymentData.phoneNumber,
          createdAt: new Date()
        };

        PaymentDebugger.log('mpesa', 'payment_record', paymentRecord);
        const [payment] = await db.insert(payments).values([paymentRecord]).returning();
        PaymentDebugger.log('mpesa', 'payment_record_created', { 
          reference: response.MerchantRequestID,
          paymentId: payment?.id
        });
      } catch (paymentError) {
        PaymentDebugger.logError('mpesa', 'payment_record_creation', paymentError);
        // This is non-critical, so we won't throw the error
      }

      res.json({
        success: true,
        message: "M-Pesa payment initiated. Please check your phone to complete payment.",
        checkoutRequestId: response.CheckoutRequestID,
        merchantRequestId: response.MerchantRequestID
      });
    } catch (error: any) {
      const { PaymentDebugger } = await import('./paymentDebugger');
      PaymentDebugger.logError('mpesa', 'payment_initiation', error);

      res.status(500).json({
        success: false,
        error: error.message || "Failed to initiate M-Pesa payment"
      });
    }
  }));

  // Add M-Pesa verification endpoint
  // Add Airtel Money verification endpoint
app.get("/api/payments/airtel/status/:referenceId", asyncHandler(async (req, res) => {
  try {
    const { referenceId } = req.params;

    // Check transaction status
    const statusResponse = await airtelMoneyService.checkTransactionStatus(referenceId);

    // If successful, update transaction status
    if (statusResponse.status === "COMPLETED") {
      try {
        // Update transaction using payments table reference
        const payment = await db.select()
          .from(payments)
          .where(eq(payments.reference, referenceId))
          .limit(1);

        if (payment && payment[0]) {
          await db.update(transactions)
            .set({ paymentStatus: "completed" })
            .where(eq(transactions.id, payment[0].transactionId));

          // Also update payment status
          await db.update(payments)
            .set({ status: "completed" })
            .where(eq(payments.reference, referenceId));
        }
      } catch (dbError) {
        console.error("Error updating transaction status for Airtel payment:", dbError);
        // Continue anyway since we want to return the status to the client
      }

      return res.json({
        success: true,
        status: "COMPLETED",
        message: "Payment completed successfully"
      });
    }

    // Return appropriate status
    return res.json({
      success: true,
      status: statusResponse.status,
      message: statusResponse.message
    });
  } catch (error: any) {
    console.error("Airtel Money status check error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to check payment status"
    });
  }
}));

app.get("/api/payments/mpesa/status/:checkoutRequestId", asyncHandler(async (req, res) => {
    try {
      const { checkoutRequestId } = req.params;

      // Check transaction status
      const statusResponse = await mpesaService.checkTransactionStatus(checkoutRequestId);

      // If successful, update transaction status
      if (statusResponse.ResultCode === "0") {
        const transaction = await db.select()
          .from(transactions)
          .where(eq(transactions.mpesaRef, statusResponse.MerchantRequestID))
          .limit(1);

        if (transaction) {
          await db.update(transactions)
            .set({ paymentStatus: "completed" })
            .where(eq(transactions.mpesaRef, statusResponse.MerchantRequestID));
        }

        return res.json({
          success: true,
          status: "COMPLETED",
          message: "Payment completed successfully"
        });
      }

      // Return appropriate status
      return res.json({
        success: true,
        status: statusResponse.ResultCode === "0" ? "COMPLETED" : "PENDING",
        message: statusResponse.ResultDesc
      });
    } catch (error: any) {
      console.error("M-Pesa status check error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to check payment status"
      });
    }
  }));

  // Add M-Pesa callback endpoint
  app.post("/api/mpesa/callback", asyncHandler(async (req, res) => {
    try {
      const callbackData = req.body;
      console.log("M-Pesa callback received:", JSON.stringify(callbackData));

      // Extract the checkout request ID and Merchant Request ID
      const { CheckoutRequestID, ResultCode, MerchantRequestID } = callbackData.Body.stkCallback;

      // If payment was successful
      if (ResultCode === 0) {
        // Update transaction status using Merchant Request ID
        const [updatedTransaction] = await db.update(transactions)
          .set({ paymentStatus: "completed" })
          .where(eq(transactions.mpesaRef, MerchantRequestID))
          .returning();

        // If we have a transaction and the customer is a registered user, award loyalty points
        if (updatedTransaction) {
          try {
            // Find the payment with this transaction ID
            const payment = await db.select()
              .from(payments)
              .where(eq(payments.transactionId, updatedTransaction.id))
              .limit(1);

            if (payment[0]) {
              // Find the user by phone number 
              if (payment[0].phoneNumber) {
                const user = await db.select()
                  .from(users)
                  .where(eq(users.phoneNumber, payment[0].phoneNumber))
                  .limit(1);

                if (user[0]) {
                  // Award points based on payment amount (1 point for every 10 KES)
                  const amountNum = parseFloat(payment[0].amount);
                  const pointsToAward = Math.floor(amountNum / 10);

                  if (pointsToAward > 0) {
                    await storage.awardLoyaltyPoints(user[0].id, pointsToAward);
                    console.log(`Awarded ${pointsToAward} points to user ${user[0].id} for M-Pesa transaction`);
                  }
                }
              }
            }
          } catch (pointsError) {
            console.error("Error awarding points for M-Pesa payment:", pointsError);
            // Continue even if points award fails
          }
        }
      }

      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error("M-Pesa callback error:", error);
      res.status(200).json({ success: true }); // Always return 200 to M-Pesa
    }
  }));

  app.post("/api/transactions/payment", asyncHandler(async (req, res) => {
    try {
      const { transactionId, amount, paymentMethod, phoneNumber, reference } = req.body;

      console.log("Payment request received:", req.body);

      // Validate essential input
      if (!transactionId) {
        return res.status(400).json({
          success: false,
          error: "Missing transaction ID"
        });
      }

      // Default to cash payment if not specified
      const method = paymentMethod || "cash";

      // Find the transaction to get the amount if not provided
      let transactionAmount = amount;
      if (!transactionAmount) {
        try {
          const transaction = await db.select()
            .from(transactions)
            .where(eq(transactions.id, transactionId))
            .limit(1);

          if (transaction && transaction.length > 0) {
            transactionAmount = transaction[0].amount;
          } else {
            return res.status(404).json({
              success: false,
              error: "Transaction not found"
            });
          }
        } catch (err) {
          console.error("Error fetching transaction:", err);
          return res.status(500).json({
            success: false,
            error: "Error fetching transaction details"
          });
        }
      }

      // Create payment record
      const paymentData = {
        transactionId,
        amount: String(transactionAmount), // Always convert amount to string
        paymentMethod: method,
        status: method === "cash" ? "completed" : "pending",
        reference: reference || null,
        phoneNumber: phoneNumber || null,
        createdAt: new Date()
      };

      console.log("Creating payment record:", paymentData);
      const [payment] = await db.insert(payments).values([paymentData as any]).returning();

      if (!payment) {
        return res.status(400).json({
          success: false,
          error: "Failed to create payment record"
        });
      }

      // Always update the transaction status for cash payments
      if (method === "cash") {
        try {
          // Update transaction payment status to completed
          const result = await db.update(transactions)
            .set({ 
              paymentStatus: "completed" 
            })
            .where(eq(transactions.id, transactionId))
            .returning();

          console.log("Transaction updated:", result);
        } catch (err) {
          console.error("Error updating transaction:", err);
          // Continue anyway since we've created the payment record
        }
      }

      return res.json({
        success: true,
        payment,
        message: `${method.toUpperCase()} payment processed successfully`
      });
    } catch (error: any) {
      console.error("Payment error:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to process payment"
      });
    }
  }));

  // Cash payment route
  app.post("/api/payments/cash", asyncHandler(async (req, res) => {
    try {
      const { PaymentDebugger } = await import('./paymentDebugger');
      PaymentDebugger.log('cash', 'request', req.body);

      const paymentData = cashPaymentSchema.parse(req.body);
      PaymentDebugger.log('cash', 'validated_data', paymentData);

      // Check if this is a split payment
      const isSplitPayment = paymentData.splitPayment || false;
      
      // Create a clean payment record with only the fields defined in the schema
      const paymentRecord: any = {
        transactionId: paymentData.transactionId,
        amount: String(paymentData.amount),
        paymentMethod: "cash",
        status: "completed",
        createdAt: new Date(),
        // Use the provided reference or generate a new one
        reference: paymentData.reference || `CASH-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      };
      
      // Only add split payment fields if this is actually a split payment
      if (isSplitPayment) {
        // These fields are not in the schema, but we'll add them as custom properties
        // They'll be ignored by the database but used in our application logic
        paymentRecord.splitPayment = true;
        paymentRecord.splitIndex = paymentData.splitIndex;
        paymentRecord.splitTotal = paymentData.splitTotal;
      }

      PaymentDebugger.log('cash', 'payment_record', paymentRecord);
      
      try {
        // Insert payment record and return the result
        const [payment] = await db.insert(payments).values([paymentRecord]).returning();

        if (!payment) {
          PaymentDebugger.logError('cash', 'payment_record_creation', 'No payment record returned');
          return res.status(500).json({
            success: false,
            error: "Failed to create cash payment record"
          });
        }

        PaymentDebugger.log('cash', 'payment_record_created', payment);

        // For split payments, only mark the transaction as completed when all parts are paid
        if (!isSplitPayment) {
          // Regular payment - update transaction status to completed
          try {
            await db.update(transactions)
              .set({ 
                paymentStatus: "completed" 
              })
              .where(eq(transactions.id, paymentData.transactionId));

            PaymentDebugger.log('cash', 'transaction_updated', { transactionId: paymentData.transactionId });
          } catch (updateError) {
            PaymentDebugger.logError('cash', 'transaction_update', updateError);
            // Even if the update fails, we'll continue since we've created the payment record
          }
        } else {
          // For split payments, check if all splits have been paid
          try {
            // Count existing payments for this transaction
            const existingPayments = await db.select()
              .from(payments)
              .where(eq(payments.transactionId, paymentData.transactionId))
              .where(eq(payments.status, "completed"));

            // We can't check splitPayment directly since it's not in the schema
            // Instead, we'll check if we have enough payments matching our expected count
            if (existingPayments.length >= paymentData.splitTotal) {
              await db.update(transactions)
                .set({ 
                  paymentStatus: "completed" 
                })
                .where(eq(transactions.id, paymentData.transactionId));

              PaymentDebugger.log('cash', 'transaction_updated_after_all_splits', { 
                transactionId: paymentData.transactionId,
                totalSplits: paymentData.splitTotal
              });
            }
          } catch (checkError) {
            PaymentDebugger.logError('cash', 'split_payment_check', checkError);
          }
        }

        // Award loyalty points if userId is provided
        if (paymentData.userId) {
          try {
            // For split payments, award proportional points
            const pointsMultiplier = isSplitPayment ? (1 / paymentData.splitTotal) : 1;
            // Award points based on payment amount (1 point for every 10 KES)
            const pointsToAward = Math.floor((paymentData.amount * pointsMultiplier) / 10);

            if (pointsToAward > 0) {
              const newPoints = await storage.awardLoyaltyPoints(paymentData.userId, pointsToAward);

              PaymentDebugger.log('cash', 'loyalty_points_awarded', {
                userId: paymentData.userId,
                pointsAwarded: pointsToAward,
                newTotalPoints: newPoints,
                isSplitPayment
              });
            }
          } catch (pointsError) {
            PaymentDebugger.logError('cash', 'loyalty_points_award', pointsError);
            // Continue even if points award fails, as the payment was successful
          }
        }

        return res.json({
          success: true,
          message: isSplitPayment 
            ? `Split payment ${paymentData.splitIndex + 1} of ${paymentData.splitTotal} processed successfully` 
            : "Cash payment processed successfully",
          payment
        });
      } catch (dbError) {
        // Handle specific database errors
        PaymentDebugger.logError('cash', 'database_operation', dbError);
        return res.status(500).json({
          success: false,
          error: dbError.message || "Database error while processing payment"
        });
      }
    } catch (error: any) {
      const { PaymentDebugger } = await import('./paymentDebugger');
      PaymentDebugger.logError('cash', 'payment_processing', error);

      return res.status(500).json({
        success: false,
        error: error.message || "Failed to process cash payment"
      });
    }
  }));

  // Airtel Money payment route
  app.post("/api/payments/airtel", asyncHandler(async (req, res) => {
    try {
      const { PaymentDebugger } = await import('./paymentDebugger');
      PaymentDebugger.log('airtel', 'request', req.body);

      const paymentData = airtelPaymentSchema.parse(req.body);
      PaymentDebugger.log('airtel', 'validated_data', paymentData);

      // Check if this is a split payment
      const isSplitPayment = paymentData.splitPayment || false;

      // Initiate Airtel Money payment
      const response = await airtelMoneyService.initiatePayment({
        phoneNumber: paymentData.phoneNumber,
        amount: paymentData.amount,
        reference: paymentData.reference || `TXN-${paymentData.transactionId}${isSplitPayment ? `-${paymentData.splitIndex}` : ''}`,
        transactionDesc: paymentData.transactionDesc || 
          (isSplitPayment 
            ? `Split payment ${paymentData.splitIndex + 1}/${paymentData.splitTotal} for gaming services` 
            : "Payment for gaming services")
      });

      PaymentDebugger.log('airtel', 'service_response', response);

      // For regular payments, update the transaction status
      if (!isSplitPayment) {
        try {
          // Create update data object with only valid columns
          const updateData: Record<string, any> = {
            paymentStatus: "pending"
          };

          // Check if airtelRef column exists in the schema
          const transactionColumns = Object.keys(transactions);
          if (transactionColumns.includes('airtelRef')) {
            updateData.airtelRef = response.reference;
          }

          PaymentDebugger.log('airtel', 'update_data', updateData);
          await db.update(transactions)
            .set(updateData)
            .where(eq(transactions.id, paymentData.transactionId));

          PaymentDebugger.log('airtel', 'transaction_updated', { transactionId: paymentData.transactionId });
        } catch (dbError) {
          PaymentDebugger.logError('airtel', 'transaction_update', dbError);

          // If the update fails, try with just payment status as a fallback
          try {
            await db.update(transactions)
              .set({ 
                paymentStatus: "pending"
              })
              .where(eq(transactions.id, paymentData.transactionId));

            PaymentDebugger.log('airtel', 'transaction_updated_fallback', { transactionId: paymentData.transactionId });
          } catch (fallbackError) {
            PaymentDebugger.logError('airtel', 'transaction_update_fallback', fallbackError);
          }
        }
      }

      // Create payment record in payments table
      try {
        // Create a clean payment record with only the fields defined in the schema
        const paymentRecord: any = {
          transactionId: paymentData.transactionId,
          amount: String(paymentData.amount),
          paymentMethod: "airtel",
          status: "pending",
          reference: response.reference,
          phoneNumber: paymentData.phoneNumber,
          createdAt: new Date()
        };

        // Store split payment information in a separate way that won't affect DB schema
        if (isSplitPayment) {
          // We're adding these as any properties since they're not in the schema
          // They'll be ignored by the database but used in our application logic
          paymentRecord.splitPayment = true;
          paymentRecord.splitIndex = paymentData.splitIndex;
          paymentRecord.splitTotal = paymentData.splitTotal;
        }

        PaymentDebugger.log('airtel', 'payment_record', paymentRecord);
        const [payment] = await db.insert(payments).values([paymentRecord]).returning();
        PaymentDebugger.log('airtel', 'payment_record_created', payment);

        // If immediate success response, award loyalty points right away
        if (response.status === "SUCCESS" && paymentData.userId) {
          try {
            // For split payments, award proportional points
            const pointsMultiplier = isSplitPayment ? (1 / paymentData.splitTotal) : 1;
            // Award points based on payment amount (1 point for every 10 KES)
            const pointsToAward = Math.floor((paymentData.amount * pointsMultiplier) / 10);

            if (pointsToAward > 0) {
              const newPoints = await storage.awardLoyaltyPoints(paymentData.userId, pointsToAward);

              PaymentDebugger.log('airtel', 'loyalty_points_awarded', {
                userId: paymentData.userId,
                pointsAwarded: pointsToAward,
                newTotalPoints: newPoints,
                isSplitPayment
              });
            }
          } catch (pointsError) {
            PaymentDebugger.logError('airtel', 'loyalty_points_award', pointsError);
            // Continue even if points award fails, as the payment was successful
          }
        }

        res.json({
          success: true,
          message: isSplitPayment 
            ? `Split payment ${paymentData.splitIndex + 1} of ${paymentData.splitTotal} initiated. Please check your phone.` 
            : "Airtel Money payment initiated. Please check your phone to complete payment.",
          reference: response.reference,
          transactionId: response.transactionId,
          payment
        });
      } catch (paymentDbError) {
        PaymentDebugger.logError('airtel', 'payment_record_creation', paymentDbError);

        // Even if payment record creation fails, we still return success as the Airtel Money
        // payment was initiated successfully
        res.json({
          success: true,
          message: isSplitPayment 
            ? `Split payment ${paymentData.splitIndex + 1} of ${paymentData.splitTotal} initiated. Please check your phone.` 
            : "Airtel Money payment initiated. Please check your phone to complete payment.",
          reference: response.reference,
          transactionId: response.transactionId
        });
      }
    } catch (error: any) {
      const { PaymentDebugger } = await import('./paymentDebugger');
      PaymentDebugger.logError('airtel', 'payment_initiation', error);

      res.status(500).json({
        success: false,
        error: error.message || "Failed to initiate Airtel Money payment"
      });
    }
  }));

  // Add Airtel Money callback endpoint
  app.post("/api/airtel/callback", asyncHandler(async (req, res) => {
    try {
      const callbackData = req.body;
      console.log("Airtel Money callback received:", JSON.stringify(callbackData));

      // Extract the reference ID from the callback data
      const { reference, status } = callbackData;

      // If payment was successful
      if (status === "SUCCESS") {
        // Find the payment with this reference
        const payment = await db.select()
          .from(payments)
          .where(eq(payments.reference, reference))
          .limit(1);

        if (payment[0]) {
          // Update payment status
          await db.update(payments)
            .set({ status: "completed" })
            .where(eq(payments.reference, reference));

          // Update transaction status
          const [updatedTransaction] = await db.update(transactions)
            .set({ paymentStatus: "completed" })
            .where(eq(transactions.id, payment[0].transactionId))
            .returning();

          // Award loyalty points if the customer can be identified by phone number
          if (payment[0].phoneNumber) {
            try {
              // Find the user by phone number
              const user = await db.select()
                .from(users)
                .where(eq(users.phoneNumber, payment[0].phoneNumber))
                .limit(1);

              if (user[0]) {
                // Award points based on payment amount (1 point for every 10 KES)
                const amountNum = parseFloat(payment[0].amount);
                const pointsToAward = Math.floor(amountNum / 10);

                if (pointsToAward > 0) {
                  await storage.awardLoyaltyPoints(user[0].id, pointsToAward);
                  console.log(`Awarded ${pointsToAward} points to user ${user[0].id} for Airtel Money transaction`);
                }
              }
            } catch (pointsError) {
              console.error("Error awarding points for Airtel Money payment:", pointsError);
              // Continue even if points award fails
            }
          }
        }
      }

      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error("Airtel Money callback error:", error);
      res.status(200).json({ success: true }); // Always return 200 to payment provider
    }
  }));

  // Get payment details for a specific transaction
  app.get("/api/payments/transaction/:transactionId", asyncHandler(async (req, res) => {
    try {
      const transactionId = Number(req.params.transactionId);
      if (isNaN(transactionId)) {
        return res.status(400).json({ error: "Invalid transaction ID" });
      }
      
      // Retrieve the payment record for this transaction
      const payment = await db.select()
        .from(payments)
        .where(eq(payments.transactionId, transactionId))
        .limit(1);
        
      if (payment && payment.length > 0) {
        return res.json(payment[0]);
      }
      
      // No payment record found
      return res.status(404).json({ error: "Payment record not found" });
    } catch (error) {
      console.error("Error retrieving payment record:", error);
      return res.status(500).json({ error: "Failed to retrieve payment information" });
    }
  }));

  // Payment debug endpoint (only for development)
  app.get("/api/debug/payments", asyncHandler(async (_req, res) => {
    try {
      const { PaymentDebugger } = await import('./paymentDebugger');
      const debugInfo = PaymentDebugger.getDebugInfo();
      res.json(debugInfo);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || "Failed to retrieve payment debug information"
      });
    }
  }));

  // Register enhanced M-Pesa routes
  app.use('/api/mpesa', mpesaRoutes);
  
  // Register official M-Pesa API routes
  app.use('/api/mpesa-api', mpesaApiRoutes);

      // Error handling middleware
  app.use((err: any, _req: any, res: any, _next: any) => {
    log(`API Error: ${err.message}`);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ error: message });
  });

  // Create event endpoint
  app.post("/api/events", asyncHandler(async (req, res) => {
    try {
      const eventData = z.object({
        title: z.string(),
        description: z.string().optional(),
        date: z.string(),
        time: z.string(),
        prize: z.string().optional(),
        maxParticipants: z.number().optional()
      }).parse(req.body);
      
      const [event] = await db.insert(events)
        .values({
          title: eventData.title,
          description: eventData.description || null,
          date: eventData.date,
          time: eventData.time,
          prize: eventData.prize || null,
          maxParticipants: eventData.maxParticipants || null,
          createdAt: new Date()
        })
        .returning();
      
      res.json(event);
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(500).json({ error: "Failed to create event" });
    }
  }));
  
  // Book an event slot
  app.post("/api/events/:eventId/book", asyncHandler(async (req, res) => {
    try {
      const { eventId } = req.params;
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      // Check if event exists
      const event = await db.select()
        .from(events)
        .where(eq(events.id, Number(eventId)))
        .limit(1);
      
      if (!event || event.length === 0) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      // Check if user has already booked this event
      const existingBooking = await db.select()
        .from(bookings)
        .where(eq(bookings.userId, Number(userId)))
        .where(eq(bookings.eventId, Number(eventId)))
        .limit(1);
        
      if (existingBooking && existingBooking.length > 0) {
        return res.status(400).json({ 
          error: "You have already booked this event",
          booking: existingBooking[0]
        });
      }
      
      // Create a booking record
      const [booking] = await db.insert(bookings)
        .values({
          userId: Number(userId),
          eventId: Number(eventId),
          status: "confirmed",
          createdAt: new Date()
        })
        .returning();
      
      res.json({ 
        success: true,
        booking,
        message: "You have successfully booked a slot for this event!" 
      });
    } catch (error) {
      console.error("Error booking event:", error);
      res.status(500).json({ error: "Failed to book event" });
    }
  }));

  // Export reports in different formats
  app.get("/api/export/report/:type/:format", asyncHandler(async (req: Request, res: Response) => {
    try {
      const { type, format } = req.params;
      const { 
        startDate, 
        endDate, 
        stationId, 
        gameId, 
        userId,
        startHour,
        endHour,
        timePreset,
        comparePeriod,
        segmentType
      } = req.query;
      
      // Validate report type and format
      const validReportTypes = [
        'revenue', 'usage', 'games', 'customers', 'inventory', 'financial',
        'loyalty', 'hourly', 'comparative', 'predictive', 'heatmap', 'segmentation'
      ];
      
      if (!validReportTypes.includes(type)) {
        return res.status(400).json({ error: "Invalid report type", validTypes: validReportTypes });
      }
      
      const validFormats = ['csv', 'pdf', 'excel', 'json'];
      if (!validFormats.includes(format)) {
        return res.status(400).json({ error: "Invalid export format", validFormats });
      }
      
      // Parse dates if provided
      const reportOptions: ReportOptions = {
        type: type as any, // Using 'any' temporarily until ReportType is imported from reportGenerator 
        format: format as any, // Using 'any' temporarily until ReportFormat is imported from reportGenerator
      };
      
      if (startDate) {
        reportOptions.startDate = new Date(startDate as string);
      }
      
      if (endDate) {
        reportOptions.endDate = new Date(endDate as string);
      }
      
      if (stationId) {
        reportOptions.stationId = Number(stationId);
      }
      
      if (gameId) {
        reportOptions.gameId = Number(gameId);
      }
      
      if (userId) {
        reportOptions.userId = Number(userId);
      }
      
      // Handle time filtering parameters
      if (timePreset) {
        // Time preset takes precedence over explicit hours
        switch (timePreset) {
          case 'morning':
            reportOptions.startHour = 6;
            reportOptions.endHour = 11;
            break;
          case 'afternoon':
            reportOptions.startHour = 12;
            reportOptions.endHour = 17;
            break;
          case 'evening':
            reportOptions.startHour = 18;
            reportOptions.endHour = 23;
            break;
          case 'all':
          default:
            reportOptions.startHour = 0;
            reportOptions.endHour = 23;
        }
      } else if (startHour || endHour) {
        // Use explicit hour parameters if no preset and hours are provided
        if (startHour) {
          reportOptions.startHour = Number(startHour);
        }
        
        if (endHour) {
          reportOptions.endHour = Number(endHour);
        }
      }
      
      // Handle comparison period for comparative reports
      if (comparePeriod) {
        reportOptions.comparePeriod = comparePeriod as any; // Using 'any' temporarily until we update type imports
      }
      
      // Handle segmentation type for segmentation reports
      if (segmentType) {
        reportOptions.segmentType = segmentType as any; // Using 'any' temporarily until we update type imports
      }
      
      // Generate and send the report
      await generateReport(reportOptions, res);
    } catch (error) {
      console.error(`Error exporting ${req.params.type} report as ${req.params.format}:`, error);
      res.status(500).json({ error: "Failed to generate report" });
    }
  }));

  return server;
}

// Common payment schema
const basePaymentSchema = z.object({
  amount: z.number(),
  transactionId: z.number(),
  userId: z.number().optional(), // Optional user ID for loyalty points
  reference: z.string().optional() // Optional reference for tracking
});

// Mobile money payment schemas
const mpesaPaymentSchema = z.object({
  phoneNumber: z.string(),
  amount: z.number(),
  transactionId: z.number(),
  userId: z.number().optional() // Optional user ID for loyalty points
});

const airtelPaymentSchema = z.object({
  phoneNumber: z.string(),
  amount: z.number(),
  transactionId: z.number(),
  userId: z.number().optional(), // Optional user ID for loyalty points
  reference: z.string().optional(), // Make reference optional since it might be generated server-side
  transactionDesc: z.string().optional(),
  splitPayment: z.boolean().optional(),
  splitIndex: z.number().optional(),
  splitTotal: z.number().optional()
});

// Cash payment schema - no additional fields needed
const cashPaymentSchema = basePaymentSchema.extend({
  splitPayment: z.boolean().optional(),
  splitIndex: z.number().optional(),
  splitTotal: z.number().optional()
});

const updateStationSchema = z.object({
  currentCustomer: z.string().nullable(),
  currentGame: z.string().nullable(),
  sessionType: z.enum(["per_game", "hourly"]).nullable(),
  sessionStartTime: z.date().nullable()
});
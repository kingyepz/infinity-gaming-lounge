import { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTransactionSchema } from "@shared/schema";
import { z } from "zod";
import { log } from "./vite";

const mpesaPaymentSchema = z.object({
  phoneNumber: z.string(),
  amount: z.number(),
  transactionId: z.number()
});

const updateStationSchema = z.object({
  currentCustomer: z.string().nullable(),
  currentGame: z.string().nullable(),
  sessionType: z.enum(["per_game", "hourly"]).nullable(),
  sessionStartTime: z.string().nullable()
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Add global error logging
  app.use((err: Error, _req: any, _res: any, next: any) => {
    log(`API Error: ${err.message}`);
    next(err);
  });

  // Game Station Routes
  app.get("/api/stations", async (_req, res) => {
    try {
      log("Fetching stations");
      const stations = await storage.getGameStations();
      res.json(stations);
    } catch (error: any) {
      log(`Error fetching stations: ${error.message}`);
      res.status(500).json({ error: "Failed to fetch stations", details: error.message });
    }
  });

  app.patch("/api/stations/:id", async (req, res) => {
    try {
      log(`Updating station ${req.params.id}`);
      const stationData = updateStationSchema.parse(req.body);
      const station = await storage.updateGameStation(Number(req.params.id), {
        ...stationData,
        sessionStartTime: stationData.sessionStartTime ? new Date(stationData.sessionStartTime) : null
      });
      res.json(station);
    } catch (error: any) {
      log(`Error updating station: ${error.message}`);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid station data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update station", details: error.message });
      }
    }
  });

  // Report Generation Routes
  app.get("/api/reports/current", async (_req, res) => {
    try {
      log("Generating current report");
      const stations = await storage.getGameStations();
      const activeStations = stations.filter(station => station.currentCustomer);

      const report = activeStations.map(station => {
        const startTime = station.sessionStartTime ? new Date(station.sessionStartTime) : new Date();
        const duration = Math.ceil((Date.now() - startTime.getTime()) / (1000 * 60)); // minutes

        const cost = station.sessionType === "per_game"
          ? station.baseRate || 0
          : Math.ceil(duration / 60) * (station.hourlyRate || 0);

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
    } catch (error: any) {
      log(`Error generating report: ${error.message}`);
      res.status(500).json({ error: "Failed to generate report", details: error.message });
    }
  });

  app.get("/api/reports/hourly", async (_req, res) => {
    try {
      log("Generating hourly report");
      const stations = await storage.getGameStations();
      const transactions = await Promise.all(
        stations.map(station => storage.getTransactionsByStation(station.id))
      );

      const now = new Date();
      const hourAgo = new Date(now.getTime() - (60 * 60 * 1000));

      const hourlyTransactions = transactions.flat().filter(tx => 
        new Date(tx.createdAt) >= hourAgo
      );

      const report = {
        totalRevenue: hourlyTransactions.reduce((sum, tx) => sum + tx.amount, 0),
        activeSessions: stations.filter(s => s.currentCustomer).length,
        completedSessions: hourlyTransactions.length,
        sessions: hourlyTransactions.map(tx => ({
          stationName: stations.find(s => s.id === tx.stationId)?.name,
          customerName: tx.customerName,
          duration: tx.sessionType === "per_game" ? "1 game" : `${tx.duration} minutes`
        }))
      };

      res.json(report);
    } catch (error: any) {
      log(`Error generating hourly report: ${error.message}`);
      res.status(500).json({ error: "Failed to generate hourly report", details: error.message });
    }
  });

  app.get("/api/reports/daily", async (_req, res) => {
    try {
      log("Generating daily report");
      const stations = await storage.getGameStations();
      const transactions = await Promise.all(
        stations.map(station => storage.getTransactionsByStation(station.id))
      );

      const now = new Date();
      const dayStart = new Date(now.setHours(0,0,0,0));

      const dailyTransactions = transactions.flat().filter(tx => 
        new Date(tx.createdAt) >= dayStart
      );

      const report = {
        totalRevenue: dailyTransactions.reduce((sum, tx) => sum + tx.amount, 0),
        activeSessions: stations.filter(s => s.currentCustomer).length,
        completedSessions: dailyTransactions.length,
        sessions: dailyTransactions.map(tx => ({
          stationName: stations.find(s => s.id === tx.stationId)?.name,
          customerName: tx.customerName,
          duration: tx.sessionType === "per_game" ? "1 game" : `${tx.duration} minutes`
        }))
      };

      res.json(report);
    } catch (error: any) {
      log(`Error generating daily report: ${error.message}`);
      res.status(500).json({ error: "Failed to generate daily report", details: error.message });
    }
  });

  // Game Routes
  app.get("/api/games", async (_req, res) => {
    try {
      log("Fetching games");
      const games = await storage.getGames();
      res.json(games);
    } catch (error: any) {
      log(`Error fetching games: ${error.message}`);
      res.status(500).json({ error: "Failed to fetch games", details: error.message });
    }
  });

  // Transaction Routes
  app.post("/api/transactions", async (req, res) => {
    try {
      log("Creating transaction");
      const transactionData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(transactionData);
      res.json(transaction);
    } catch (error: any) {
      log(`Error creating transaction: ${error.message}`);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid transaction data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create transaction", details: error.message });
      }
    }
  });

  app.get("/api/transactions/station/:stationId", async (req, res) => {
    try {
      log(`Fetching transactions for station ${req.params.stationId}`);
      const transactions = await storage.getTransactionsByStation(Number(req.params.stationId));
      res.json(transactions);
    } catch (error: any) {
      log(`Error fetching transactions for station ${req.params.stationId}: ${error.message}`);
      res.status(500).json({ error: "Failed to fetch transactions", details: error.message });
    }
  });

  // New transaction API endpoints
  app.get("/api/transactions/all", async (_req, res) => {
    try {
      log("Fetching all transactions");
      const allTransactions = await storage.getAllTransactions();
      res.json(allTransactions);
    } catch (error: any) {
      log(`Error fetching all transactions: ${error.message}`);
      res.status(500).json({ error: "Failed to fetch all transactions", details: error.message });
    }
  });

  app.get("/api/transactions/pending", async (_req, res) => {
    try {
      log("Fetching pending transactions");
      const pendingTransactions = await storage.getTransactionsByStatus("pending");
      res.json(pendingTransactions);
    } catch (error: any) {
      log(`Error fetching pending transactions: ${error.message}`);
      res.status(500).json({ error: "Failed to fetch pending transactions", details: error.message });
    }
  });

  app.put("/api/transactions/:id/status", async (req, res) => {
    try {
      log(`Updating transaction status for transaction ${req.params.id}`);
      const { id } = req.params;
      const { status, reference } = req.body;
      const updatedTransaction = await storage.updateTransactionStatus(
        parseInt(id),
        status,
        reference
      );
      res.json(updatedTransaction);
    } catch (error: any) {
      log(`Error updating transaction status for transaction ${req.params.id}: ${error.message}`);
      res.status(500).json({ error: "Failed to update transaction status", details: error.message });
    }
  });

  app.get("/api/analytics", async (req, res) => {
    try {
      log("Fetching analytics");
      const { period } = req.query;
      const analyticsPeriod = period as string || 'daily';

      // Get all transactions
      const allTransactions = await storage.getAllTransactions();

      // Filter by period
      let startDate = new Date();
      switch(analyticsPeriod) {
        case 'weekly':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'monthly':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'yearly':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default: // daily
          startDate.setHours(0, 0, 0, 0);
      }

      const periodTransactions = allTransactions.filter(
        tx => tx.paymentStatus === 'completed' && new Date(tx.createdAt) >= startDate
      );

      // Calculate metrics
      const totalRevenue = periodTransactions.reduce((sum, tx) => sum + tx.amount, 0);

      res.json({
        period: analyticsPeriod,
        totalRevenue,
        transactionCount: periodTransactions.length,
        transactions: periodTransactions.slice(0, 10) // Return only 10 most recent
      });
    } catch (error: any) {
      log(`Error fetching analytics: ${error.message}`);
      res.status(500).json({ error: "Failed to fetch analytics", details: error.message });
    }
  });

  // User Transactions Route
  app.get("/api/transactions/user/current", async (req, res) => {
    try {
      log("Fetching current user transactions");
      // This would normally use authentication to get the current user
      // For now, we'll return some mock data
      res.json([
        {
          id: 1,
          stationId: 1,
          customerName: "John Doe",
          gameName: "FIFA 23",
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
    } catch (error: any) {
      log(`Error fetching current user transactions: ${error.message}`);
      res.status(500).json({ error: "Failed to fetch current user transactions", details: error.message });
    }
  });

  // Leaderboard Route
  app.get("/api/leaderboard", async (_req, res) => {
    try {
      log("Fetching leaderboard");
      // This would normally fetch from the database
      res.json([
        { rank: 1, name: "EliteGamer", points: 2500 },
        { rank: 2, name: "VictoryRoad", points: 2300 },
        { rank: 3, name: "GameMaster", points: 1200 },
        { rank: 4, name: "ProPlayer22", points: 750 }
      ]);
    } catch (error: any) {
      log(`Error fetching leaderboard: ${error.message}`);
      res.status(500).json({ error: "Failed to fetch leaderboard", details: error.message });
    }
  });

  // Events Route
  app.get("/api/events", async (_req, res) => {
    try {
      log("Fetching events");
      res.json([
        { id: 1, title: "FIFA Tournament", date: "2023-12-15", time: "14:00", prize: "5000 Points" },
        { id: 2, title: "Call of Duty Marathon", date: "2023-12-22", time: "18:00", prize: "Free Hours" },
        { id: 3, title: "Racing Championship", date: "2023-12-29", time: "16:00", prize: "Gaming Gear" }
      ]);
    } catch (error: any) {
      log(`Error fetching events: ${error.message}`);
      res.status(500).json({ error: "Failed to fetch events", details: error.message });
    }
  });

  // Rewards Route
  app.get("/api/rewards", async (_req, res) => {
    try {
      log("Fetching rewards");
      res.json([
        { id: 1, title: "1 Hour Free Gaming", points: 500 },
        { id: 2, title: "Gaming Headset", points: 2000 },
        { id: 3, title: "Premium Snack Pack", points: 300 },
        { id: 4, title: "Controller Skin", points: 800 }
      ]);
    } catch (error: any) {
      log(`Error fetching rewards: ${error.message}`);
      res.status(500).json({ error: "Failed to fetch rewards", details: error.message });
    }
  });

  // User Friends Route
  app.get("/api/users/friends", async (_req, res) => {
    try {
      log("Fetching user friends");
      res.json([
        { id: 1, name: "Alex Gaming", points: 980, status: "online" },
        { id: 2, name: "ProPlayer22", points: 750, status: "offline" },
        { id: 3, name: "GameMaster", points: 1200, status: "gaming" }
      ]);
    } catch (error: any) {
      log(`Error fetching user friends: ${error.message}`);
      res.status(500).json({ error: "Failed to fetch user friends", details: error.message });
    }
  });

  // Current User Route
  app.get("/api/users/current", async (_req, res) => {
    try {
      log("Fetching current user");
      // This would normally use authentication
      res.json({
        id: 1,
        displayName: "John Doe",
        gamingName: "JDGamer",
        phoneNumber: "254700000000",
        role: "customer",
        points: 750,
        referralCode: "JDGAM123",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString() // 30 days ago
      });
    } catch (error: any) {
      log(`Error fetching current user: ${error.message}`);
      res.status(500).json({ error: "Failed to fetch current user", details: error.message });
    }
  });

  // M-Pesa Payment Routes
  app.post("/api/payments/mpesa", async (req, res) => {
    try {
      log("Processing M-Pesa payment");
      const paymentData = mpesaPaymentSchema.parse(req.body);

      // Since we don't have a Paybill, we'll simulate M-Pesa payment
      console.log("Simulating M-Pesa payment:", paymentData);

      // Generate a mock M-Pesa reference
      const mpesaRef = `MP${Date.now().toString().slice(-8)}`;

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update transaction status
      await storage.updateTransactionStatus(
        paymentData.transactionId,
        "completed",
        mpesaRef
      );

      res.json({
        success: true,
        message: "M-Pesa payment simulated successfully. In production, this would send an STK push to the customer's phone.",
        mpesaRef
      });
    } catch (error: any) {
      log(`Error processing M-Pesa payment: ${error.message}`);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid M-Pesa payment data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to process M-Pesa payment", details: error.message });
      }
    }
  });

  // Add an endpoint to get M-Pesa token for frontend testing
  app.get("/api/payments/mpesa/token", async (_req, res) => {
    try {
      log("Fetching M-Pesa token");
      // In a real implementation, this would call the M-Pesa API
      // Since we're only testing, we'll return a mock token
      res.json({
        accessToken: "SIMULATED_MPESA_TOKEN_" + Date.now(),
        expiresIn: 3600
      });
    } catch (error: any) {
      log(`Error fetching M-Pesa token: ${error.message}`);
      res.status(500).json({ error: "Failed to fetch M-Pesa token", details: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
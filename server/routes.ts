import { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTransactionSchema } from "@shared/schema";
import { z } from "zod";

const mpesaPaymentSchema = z.object({
  phoneNumber: z.string(),
  amount: z.number(),
  transactionId: z.number()
});

const updateStationSchema = z.object({
  currentCustomer: z.string().nullable(),
  currentGame: z.string().nullable(),
  sessionType: z.enum(["per_game", "hourly"]).nullable(),
  sessionStartTime: z.date().nullable()
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Game Station Routes
  app.get("/api/stations", async (_req, res) => {
    const stations = await storage.getGameStations();
    res.json(stations);
  });

  app.patch("/api/stations/:id", async (req, res) => {
    try {
      const stationData = updateStationSchema.parse(req.body);
      const station = await storage.updateGameStation(Number(req.params.id), stationData);
      res.json(station);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Report Generation Routes
  app.get("/api/reports/current", async (_req, res) => {
    try {
      const stations = await storage.getGameStations();
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
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/reports/hourly", async (_req, res) => {
    try {
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
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/reports/daily", async (_req, res) => {
    try {
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
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Game Routes
  app.get("/api/games", async (_req, res) => {
    const games = await storage.getGames();
    res.json(games);
  });

  // Transaction Routes
  app.post("/api/transactions", async (req, res) => {
    try {
      const transactionData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(transactionData);
      res.json(transaction);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/transactions/station/:stationId", async (req, res) => {
    const transactions = await storage.getTransactionsByStation(Number(req.params.stationId));
    res.json(transactions);
  });
  
  // New transaction API endpoints
  app.get("/api/transactions/all", async (_req, res) => {
    try {
      const allTransactions = await storage.getAllTransactions();
      res.json(allTransactions);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get("/api/transactions/pending", async (_req, res) => {
    try {
      const pendingTransactions = await storage.getTransactionsByStatus("pending");
      res.json(pendingTransactions);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.put("/api/transactions/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status, reference } = req.body;
      const updatedTransaction = await storage.updateTransactionStatus(
        parseInt(id),
        status,
        reference
      );
      res.json(updatedTransaction);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get("/api/analytics", async (req, res) => {
    try {
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
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // User Transactions Route
  app.get("/api/transactions/user/current", async (req, res) => {
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
  });
  
  // Leaderboard Route
  app.get("/api/leaderboard", async (_req, res) => {
    // This would normally fetch from the database
    res.json([
      { rank: 1, name: "EliteGamer", points: 2500 },
      { rank: 2, name: "VictoryRoad", points: 2300 },
      { rank: 3, name: "GameMaster", points: 1200 },
      { rank: 4, name: "ProPlayer22", points: 750 }
    ]);
  });
  
  // Events Route
  app.get("/api/events", async (_req, res) => {
    res.json([
      { id: 1, title: "FIFA Tournament", date: "2023-12-15", time: "14:00", prize: "5000 Points" },
      { id: 2, title: "Call of Duty Marathon", date: "2023-12-22", time: "18:00", prize: "Free Hours" },
      { id: 3, title: "Racing Championship", date: "2023-12-29", time: "16:00", prize: "Gaming Gear" }
    ]);
  });
  
  // Rewards Route
  app.get("/api/rewards", async (_req, res) => {
    res.json([
      { id: 1, title: "1 Hour Free Gaming", points: 500 },
      { id: 2, title: "Gaming Headset", points: 2000 },
      { id: 3, title: "Premium Snack Pack", points: 300 },
      { id: 4, title: "Controller Skin", points: 800 }
    ]);
  });
  
  // User Friends Route
  app.get("/api/users/friends", async (_req, res) => {
    res.json([
      { id: 1, name: "Alex Gaming", points: 980, status: "online" },
      { id: 2, name: "ProPlayer22", points: 750, status: "offline" },
      { id: 3, name: "GameMaster", points: 1200, status: "gaming" }
    ]);
  });
  
  // Current User Route
  app.get("/api/users/current", async (_req, res) => {
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
  });

  // M-Pesa Payment Routes
  app.post("/api/payments/mpesa", async (req, res) => {
    try {
      const paymentData = mpesaPaymentSchema.parse(req.body);

      // TODO: Integrate with actual M-Pesa API
      // For now, simulate payment success
      const mpesaRef = `MP${Date.now()}`;

      await storage.updateTransactionStatus(
        paymentData.transactionId,
        "completed",
        mpesaRef
      );

      res.json({
        success: true,
        message: "Payment initiated",
        mpesaRef
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
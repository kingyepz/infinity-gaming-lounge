import { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTransactionSchema } from "@shared/schema";
import { z } from "zod";
import { log } from "./vite";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const server = createServer(app);

  // Wrap route handlers with error catching
  const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };

  // Basic API routes
  app.get("/api/stations", asyncHandler(async (_req, res) => {
    const stations = await storage.getGameStations();
    res.json(stations);
  }));

  app.patch("/api/stations/:id", asyncHandler(async (req, res) => {
    try {
      const stationData = updateStationSchema.parse(req.body);
      const station = await storage.updateGameStation(Number(req.params.id), stationData);
      res.json(station);
    } catch (error) {
      //This will be caught by the global error handler
      throw error;
    }
  }));

  app.get("/api/reports/current", asyncHandler(async (_req, res) => {
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
      throw error;
    }
  }));

  app.get("/api/reports/hourly", asyncHandler(async (_req, res) => {
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
      throw error;
    }
  }));

  app.get("/api/reports/daily", asyncHandler(async (_req, res) => {
    try {
      const stations = await storage.getGameStations();
      const transactions = await Promise.all(
        stations.map(station => storage.getTransactionsByStation(station.id))
      );

      const now = new Date();
      const dayStart = new Date(now.setHours(0, 0, 0, 0));

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
      throw error;
    }
  }));

  app.get("/api/reports/revenue/:timeFrame", asyncHandler(async (req, res) => {
    try {
      const timeFrame = req.params.timeFrame as 'daily' | 'weekly' | 'monthly';
      if (!['daily', 'weekly', 'monthly'].includes(timeFrame)) {
        return res.status(400).json({ error: "Invalid time frame. Use daily, weekly, or monthly." });
      }

      const revenueData = await storage.getRevenueByTimeFrame(timeFrame);
      res.json(revenueData);
    } catch (error) {
      throw error;
    }
  }));

  app.get("/api/reports/popular-games", asyncHandler(async (_req, res) => {
    try {
      const popularGames = await storage.getPopularGames();
      res.json(popularGames);
    } catch (error) {
      throw error;
    }
  }));

  app.get("/api/reports/station-utilization", asyncHandler(async (_req, res) => {
    try {
      const stationUtilization = await storage.getStationUtilization();
      res.json(stationUtilization);
    } catch (error) {
      throw error;
    }
  }));

  app.get("/api/reports/customer-activity", asyncHandler(async (_req, res) => {
    try {
      const customerActivity = await storage.getCustomerActivity();
      res.json(customerActivity);
    } catch (error) {
      throw error;
    }
  }));

  app.get("/api/reports/payment-methods", asyncHandler(async (_req, res) => {
    try {
      // This is mock data - in a real implementation, you would query from your database
      res.json({
        methods: [
          { name: "Cash", percentage: 35, amount: 20500 },
          { name: "M-Pesa", percentage: 55, amount: 32450 },
          { name: "Airtel Money", percentage: 10, amount: 5500 }
        ],
        total: 58450
      });
    } catch (error) {
      throw error;
    }
  }));

  app.get("/api/reports/hourly-distribution", asyncHandler(async (_req, res) => {
    try {
      // This is mock data - in a real implementation, you would aggregate from your database
      const hours = Array.from({ length: 12 }, (_, i) => i + 9); // 9am to 8pm
      const data = hours.map(hour => ({
        hour: `${hour}:00`,
        sessions: Math.floor(Math.random() * 20) + 5,
        revenue: (Math.floor(Math.random() * 20) + 5) * 500
      }));

      res.json(data);
    } catch (error) {
      throw error;
    }
  }));

  app.get("/api/games", asyncHandler(async (_req, res) => {
    const games = await storage.getGames();
    res.json(games);
  }));

  app.post("/api/transactions", asyncHandler(async (req, res) => {
    try {
      const transactionData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(transactionData);
      res.json(transaction);
    } catch (error) {
      throw error;
    }
  }));

  app.get("/api/transactions/station/:stationId", asyncHandler(async (req, res) => {
    const transactions = await storage.getTransactionsByStation(Number(req.params.stationId));
    res.json(transactions);
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

      const transactions = await storage.getTransactionsByUser(Number(userId));
      res.json(transactions);
    } catch (error) {
      throw error;
    }
  }));

  app.get("/api/leaderboard", asyncHandler(async (_req, res) => {
    res.json([
      { rank: 1, name: "EliteGamer", points: 2500 },
      { rank: 2, name: "VictoryRoad", points: 2300 },
      { rank: 3, name: "GameMaster", points: 1200 },
      { rank: 4, name: "ProPlayer22", points: 750 }
    ]);
  }));

  app.get("/api/events", asyncHandler(async (_req, res) => {
    res.json([
      { id: 1, title: "FIFA Tournament", date: "2023-12-15", time: "14:00", prize: "5000 Points" },
      { id: 2, title: "Call of Duty Marathon", date: "2023-12-22", time: "18:00", prize: "Free Hours" },
      { id: 3, title: "Racing Championship", date: "2023-12-29", time: "16:00", prize: "Gaming Gear" }
    ]);
  }));

  app.get("/api/rewards", asyncHandler(async (_req, res) => {
    res.json([
      { id: 1, title: "1 Hour Free Gaming", points: 500 },
      { id: 2, title: "Gaming Headset", points: 2000 },
      { id: 3, title: "Premium Snack Pack", points: 300 },
      { id: 4, title: "Controller Skin", points: 800 }
    ]);
  }));

  app.get("/api/users/friends", asyncHandler(async (_req, res) => {
    res.json([
      { id: 1, name: "Alex Gaming", points: 980, status: "online" },
      { id: 2, name: "ProPlayer22", points: 750, status: "offline" },
      { id: 3, name: "GameMaster", points: 1200, status: "gaming" }
    ]);
  }));

  app.get("/api/users/current", asyncHandler(async (req, res) => {
    try {
      const userId = req.headers['user-id'];
      if (!userId) {
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

      const user = await storage.getUserById(Number(userId));
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(user);
    } catch (error) {
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

      const existingUser = await storage.getUserByPhone(userData.phoneNumber);
      if (existingUser) {
        return res.status(400).json({ error: "User with this phone number already exists" });
      }

      const user = await storage.createUser({
        displayName: userData.displayName,
        gamingName: userData.gamingName,
        phoneNumber: userData.phoneNumber,
        role: "customer"
      });

      if (userData.referredBy) {
        try {
          const referrer = await storage.getUserByPhone(userData.referredBy);
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
      const paymentData = mpesaPaymentSchema.parse(req.body);

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
      throw error;
    }
  }));

  // Error handling middleware
  app.use((err: any, _req: any, res: any, _next: any) => {
    log(`API Error: ${err.message}`);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ error: message });
  });

  return server;
}

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
import { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTransactionSchema } from "@shared/schema";
import { z } from "zod";
import { log } from "./vite";
import { db } from "./db";
import { users, transactions, games, gameStations } from "@shared/schema";
import { desc, sql } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const server = createServer(app);

  // Wrap route handlers with error catching
  const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };

  // Basic API routes
  app.get("/api/stations", asyncHandler(async (_req, res) => {
    const stations = await db.select().from(gameStations);
    res.json(stations);
  }));

  app.patch("/api/stations/:id", asyncHandler(async (req, res) => {
    try {
      const stationData = updateStationSchema.parse(req.body);
      const station = await db.update(gameStations).set(stationData).where(gameStations.id.equals(Number(req.params.id)));
      res.json(station);
    } catch (error) {
      //This will be caught by the global error handler
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
      const transactions = await db.select().from(transactions);


      const now = new Date();
      const hourAgo = new Date(now.getTime() - (60 * 60 * 1000));

      const hourlyTransactions = transactions.filter(tx =>
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
      const stations = await db.select().from(gameStations);
      const transactions = await db.select().from(transactions);

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

      // Implement database query for revenue data based on timeframe
      const revenueData = await storage.getRevenueByTimeFrame(timeFrame);
      res.json(revenueData);
    } catch (error) {
      throw error;
    }
  }));

  app.get("/api/reports/popular-games", asyncHandler(async (_req, res) => {
    try {
      const popularGames = await db.select().from(games).orderBy(games.popularity, desc());
      res.json(popularGames);
    } catch (error) {
      throw error;
    }
  }));

  app.get("/api/reports/station-utilization", asyncHandler(async (_req, res) => {
    try {
      // Implement database query for station utilization data
      const stationUtilization = await storage.getStationUtilization();
      res.json(stationUtilization);
    } catch (error) {
      throw error;
    }
  }));

  app.get("/api/reports/customer-activity", asyncHandler(async (_req, res) => {
    try {
      // Implement database query for customer activity data
      const customerActivity = await storage.getCustomerActivity();
      res.json(customerActivity);
    } catch (error) {
      throw error;
    }
  }));

  app.get("/api/reports/payment-methods", asyncHandler(async (_req, res) => {
    try {
      // Implement database query for payment methods data
      const paymentMethods = await storage.getPaymentMethods();
      res.json(paymentMethods);
    } catch (error) {
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

  app.get("/api/games", asyncHandler(async (_req, res) => {
    const games = await db.select().from(games);
    res.json(games);
  }));

  app.post("/api/transactions", asyncHandler(async (req, res) => {
    try {
      const transactionData = insertTransactionSchema.parse(req.body);
      const transaction = await db.insert(transactions).values(transactionData).returning();
      res.json(transaction);
    } catch (error) {
      throw error;
    }
  }));

  app.get("/api/transactions/station/:stationId", asyncHandler(async (req, res) => {
    const transactions = await db.select().from(transactions).where(transactions.stationId.equals(Number(req.params.stationId)));
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

      const transactions = await db.select().from(transactions).where(transactions.userId.equals(Number(userId)));
      res.json(transactions);
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
    // Implement database query for events data
    res.json([
      { id: 1, title: "FIFA Tournament", date: "2023-12-15", time: "14:00", prize: "5000 Points" },
      { id: 2, title: "Call of Duty Marathon", date: "2023-12-22", time: "18:00", prize: "Free Hours" },
      { id: 3, title: "Racing Championship", date: "2023-12-29", time: "16:00", prize: "Gaming Gear" }
    ]);
  }));

  app.get("/api/rewards", asyncHandler(async (_req, res) => {
    // Implement database query for rewards data
    res.json([
      { id: 1, title: "1 Hour Free Gaming", points: 500 },
      { id: 2, title: "Gaming Headset", points: 2000 },
      { id: 3, title: "Premium Snack Pack", points: 300 },
      { id: 4, title: "Controller Skin", points: 800 }
    ]);
  }));

  app.get("/api/users/friends", asyncHandler(async (_req, res) => {
    // Implement database query for friends data
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

      const user = await db.select().from(users).where(users.id.equals(Number(userId))).limit(1);
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

  // Add this endpoint after the existing user-related endpoints
  app.get("/api/users/customers", asyncHandler(async (_req, res) => {
    try {
      const customers = await db.select().from(users).where(users.role.equals("customer"));
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
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
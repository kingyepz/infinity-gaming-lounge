import { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTransactionSchema } from "@shared/schema";
import { z } from "zod";
import { log } from "./vite";
import { db } from "./db";
import { games, transactions, gameStations, users, payments } from "../shared/schema"; // Added 'payments' import
import { desc, eq } from "drizzle-orm";
import { mpesaService } from "./mpesa";
import { airtelMoneyService } from "./airtel";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const server = createServer(app);

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
      const { stationId, customerId, gameId, sessionType } = req.body;

      const station = await storage.updateGameStation(stationId, {
        currentCustomer: customerId,
        currentGame: gameId,
        sessionType,
        sessionStartTime: new Date()
      });

      if (!station) {
        throw new Error("Failed to start session");
      }

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
          stationName: stations.find(s => s.id === tx.stationId)?.name || "Unknown",
          customerName: tx.customerName || "Unknown",
          duration: tx.sessionType === "per_game" ? "1 game" : `${tx.duration || 0} minutes`
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
    try {
      const gamesList = await db.select().from(games).orderBy(desc(games.name));
      res.json(gamesList);
    } catch (error) {
      console.error("Error fetching games:", error);
      throw error;
    }
  }));

  app.post("/api/transactions", asyncHandler(async (req, res) => {
    try {
      // Ensure amount is a string and payment status is set to "pending" by default
      const rawData = req.body;

      // Convert amount to string if it's a number
      if (typeof rawData.amount === 'number') {
        rawData.amount = String(rawData.amount);
      }

      const transactionData = {
        ...insertTransactionSchema.parse(rawData),
        paymentStatus: "pending" 
      };

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

      // Initiate STK Push
      const response = await mpesaService.initiateSTKPush({
        phoneNumber: paymentData.phoneNumber,
        amount: paymentData.amount,
        accountReference: `TXN-${paymentData.transactionId}`,
        transactionDesc: "Payment for gaming services"
      });

      // Store the checkout request ID for later verification
      await db.update(transactions)
        .set({ 
          mpesaRef: response.MerchantRequestID,
          paymentStatus: "pending"
        })
        .where(eq(transactions.id, paymentData.transactionId));

      res.json({
        success: true,
        message: "M-Pesa payment initiated. Please check your phone to complete payment.",
        checkoutRequestId: response.CheckoutRequestID,
        merchantRequestId: response.MerchantRequestID
      });
    } catch (error: any) {
      console.error("M-Pesa payment error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to initiate M-Pesa payment"
      });
    }
  }));

  // Add M-Pesa verification endpoint
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
        await db.update(transactions)
          .set({ paymentStatus: "completed" })
          .where(eq(transactions.mpesaRef, MerchantRequestID));
      }

      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error("M-Pesa callback error:", error);
      res.status(200).json({ success: true }); // Always return 200 to M-Pesa
    }
  }));

  app.post("/api/transactions/payment", asyncHandler(async (req, res) => {
    try {
      const { stationId, amount, paymentMethod, phoneNumber, reference } = req.body;

      // Validate input
      if (!stationId || !amount || !paymentMethod) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields"
        });
      }

      // Create payment record
      const [payment] = await db.insert(payments).values({
        transactionId: stationId,
        amount: String(amount), // Always convert amount to string
        paymentMethod,
        status: paymentMethod === "cash" ? "completed" : "pending",
        reference: reference || null,
        phoneNumber: phoneNumber || null,
        createdAt: new Date()
      }).returning();

      if (!payment) {
        return res.status(400).json({
          success: false,
          error: "Failed to create payment record"
        });
      }

      // Find all transactions for this station and update their status if it's a cash payment
      if (paymentMethod === "cash") {
        try {
          // Update transaction payment status to completed
          // Only update these fields to avoid error with non-existent columns
          await db.update(transactions)
            .set({ 
              paymentStatus: "completed" 
            })
            .where(eq(transactions.stationId, stationId))
            .returning();
        } catch (err) {
          console.error("Error updating transaction:", err);
          // Try with transaction ID instead of station ID
          try {
            await db.update(transactions)
              .set({ 
                paymentStatus: "completed" 
              })
              .where(eq(transactions.id, stationId))
              .returning();
          } catch (innerErr) {
            console.error("Error updating transaction by ID:", innerErr);
          }
        }
      }

      return res.json({
        success: true,
        payment,
        message: `${paymentMethod.toUpperCase()} payment processed successfully`
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
      const paymentData = cashPaymentSchema.parse(req.body);

      // Create payment record with status=completed
      const [payment] = await db.insert(payments).values({
        transactionId: paymentData.transactionId,
        amount: String(paymentData.amount),
        paymentMethod: "cash",
        status: "completed",
        createdAt: new Date()
      }).returning();

      if (!payment) {
        return res.status(500).json({
          success: false,
          error: "Failed to create cash payment record"
        });
      }

      // Update transaction status to completed
      await db.update(transactions)
        .set({ 
          paymentStatus: "completed" 
        })
        .where(eq(transactions.id, paymentData.transactionId));

      return res.json({
        success: true,
        message: "Cash payment processed successfully",
        payment
      });
    } catch (error: any) {
      console.error("Cash payment error:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to process cash payment"
      });
    }
  }));

  // Airtel Money payment route
  app.post("/api/payments/airtel", asyncHandler(async (req, res) => {
    try {
      const paymentData = airtelPaymentSchema.parse(req.body);

      // Initiate Airtel Money payment
      const response = await airtelMoneyService.initiatePayment({
        phoneNumber: paymentData.phoneNumber,
        amount: paymentData.amount,
        reference: `TXN-${paymentData.transactionId}`,
        transactionDesc: "Payment for gaming services"
      });

      // Store the transaction reference for later verification
      await db.update(transactions)
        .set({ 
          paymentStatus: "pending"
        })
        .where(eq(transactions.id, paymentData.transactionId));

      // Create payment record
      const [payment] = await db.insert(payments).values({
        transactionId: paymentData.transactionId,
        amount: String(paymentData.amount),
        paymentMethod: "airtel",
        status: "pending",
        reference: response.reference,
        phoneNumber: paymentData.phoneNumber,
        createdAt: new Date()
      }).returning();

      res.json({
        success: true,
        message: "Airtel Money payment initiated. Please check your phone to complete payment.",
        reference: response.reference,
        transactionId: response.transactionId,
        payment
      });
    } catch (error: any) {
      console.error("Airtel Money payment error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to initiate Airtel Money payment"
      });
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

// Common payment schema
const basePaymentSchema = z.object({
  amount: z.number(),
  transactionId: z.number()
});

// Mobile money payment schemas
const mpesaPaymentSchema = z.object({
  phoneNumber: z.string(),
  amount: z.number(),
  transactionId: z.number()
});

const airtelPaymentSchema = z.object({
  phoneNumber: z.string(),
  amount: z.number(),
  transactionId: z.number(),
  reference: z.string(),
  transactionDesc: z.string().optional()
});

// Cash payment schema - no additional fields needed
const cashPaymentSchema = basePaymentSchema;

const updateStationSchema = z.object({
  currentCustomer: z.string().nullable(),
  currentGame: z.string().nullable(),
  sessionType: z.enum(["per_game", "hourly"]).nullable(),
  sessionStartTime: z.date().nullable()
});